#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EmailMax - Microserviço de Validação IMAP/SMTP

Este microserviço fornece APIs para testar conexões IMAP e SMTP,
contornando as limitações das Edge Functions do Supabase.
"""

import os
import ssl
import json
import socket
import logging
import imaplib
import smtplib
import dns.resolver
from email.mime.text import MIMEText
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from typing import Dict, Any, List, Optional, Tuple, Union
import time
from logging.handlers import RotatingFileHandler

# Configuração do logging
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
LOG_FILE = os.environ.get('LOG_FILE', None)
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'

# Configurar o logger principal
logger = logging.getLogger('emailmax-validator')
logger.setLevel(getattr(logging, LOG_LEVEL))

# Configurar formatador
formatter = logging.Formatter(LOG_FORMAT)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Adicionar file handler se LOG_FILE estiver definido
if LOG_FILE:
    file_handler = RotatingFileHandler(
        LOG_FILE, 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

logger.info("Inicializando o microserviço de validação IMAP/SMTP")

# Inicialização da aplicação Flask
app = Flask(__name__)
CORS(app)

# Configurações
API_KEY = os.environ.get('API_KEY', 'dev_key_change_me_in_production')
DEFAULT_TIMEOUT = int(os.environ.get('DEFAULT_TIMEOUT', '10'))  # segundos

logger.info(f"Usando timeout padrão de {DEFAULT_TIMEOUT} segundos")
if API_KEY == 'dev_key_change_me_in_production':
    logger.warning("Usando API_KEY padrão! Altere para um valor seguro em produção.")

# Configurações de provedores conhecidos
KNOWN_PROVIDERS = {
    'gmail': {
        'imap': {'host': 'imap.gmail.com', 'port': 993, 'secure': True},
        'smtp': {'host': 'smtp.gmail.com', 'port': 587, 'secure': False, 'starttls': True},
        'password_pattern': r'^[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}$',
        'password_instructions': 'Para contas Gmail, use uma Senha de Aplicativo no formato: xxxx xxxx xxxx xxxx'
    },
    'outlook': {
        'imap': {'host': 'outlook.office365.com', 'port': 993, 'secure': True},
        'smtp': {'host': 'smtp.office365.com', 'port': 587, 'secure': False, 'starttls': True},
    },
    'yahoo': {
        'imap': {'host': 'imap.mail.yahoo.com', 'port': 993, 'secure': True},
        'smtp': {'host': 'smtp.mail.yahoo.com', 'port': 587, 'secure': False, 'starttls': True},
        'password_instructions': 'Para contas Yahoo, habilite o acesso a apps e use uma senha de aplicativo'
    },
    'hotmail': {
        'imap': {'host': 'outlook.office365.com', 'port': 993, 'secure': True},
        'smtp': {'host': 'smtp.office365.com', 'port': 587, 'secure': False, 'starttls': True},
    }
}

# Decorator para verificar API key
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('Authorization')
        if api_key and api_key.startswith('Bearer '):
            api_key = api_key[7:]  # Remover 'Bearer ' do início
        
        if not api_key or api_key != API_KEY:
            return jsonify({'success': False, 'message': 'API key inválida ou não fornecida'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Função para detectar configuração automática com base no email
def detect_provider_config(email: str) -> Dict[str, Any]:
    """
    Detecta automaticamente as configurações com base no domínio do email
    """
    domain = email.split('@')[-1].lower()
    
    # Detecção básica de provedores conhecidos
    if 'gmail' in domain:
        return KNOWN_PROVIDERS['gmail']
    elif 'outlook' in domain or 'hotmail' in domain or 'live' in domain:
        return KNOWN_PROVIDERS['outlook']
    elif 'yahoo' in domain:
        return KNOWN_PROVIDERS['yahoo']
    
    # Tentar descobrir servidores via DNS MX
    try:
        result = dns.resolver.resolve(domain, 'MX')
        if result:
            mx_record = str(result[0].exchange)
            logger.info(f"MX record para {domain}: {mx_record}")
            
            # Tentar inferir configurações com base no MX
            if 'google' in mx_record or 'gmail' in mx_record:
                return KNOWN_PROVIDERS['gmail']
            elif 'outlook' in mx_record or 'microsoft' in mx_record:
                return KNOWN_PROVIDERS['outlook']
            elif 'yahoo' in mx_record:
                return KNOWN_PROVIDERS['yahoo']
    except Exception as e:
        logger.warning(f"Erro ao resolver DNS MX para {domain}: {e}")
    
    # Configuração padrão se não conseguir detectar
    return {
        'imap': {'host': f'imap.{domain}', 'port': 993, 'secure': True},
        'smtp': {'host': f'smtp.{domain}', 'port': 587, 'secure': False, 'starttls': True},
        'detected': 'auto'
    }

# Função para verificar DNS
def check_dns(host: str) -> Dict[str, Any]:
    """
    Verifica se o servidor existe através de resolução DNS
    """
    try:
        addresses = dns.resolver.resolve(host, 'A')
        if addresses:
            return {
                'success': True,
                'message': f'Servidor {host} encontrado via DNS',
                'addresses': [str(addr) for addr in addresses]
            }
        return {
            'success': False,
            'message': f'Não foi possível resolver o servidor {host} via DNS'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'Erro ao resolver DNS para {host}: {str(e)}'
        }

# Função para testar conexão de rede básica
def test_network_connection(host: str, port: int, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Testa se é possível estabelecer uma conexão TCP com o servidor e porta
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            return {
                'success': True,
                'message': f'Conexão com {host}:{port} estabelecida com sucesso'
            }
        else:
            # Converter código de erro para mensagem mais amigável
            error_message = f'Não foi possível conectar a {host}:{port} - Erro: {result}'
            if result == 111:
                error_message = f'Conexão recusada por {host}:{port} - verifique se o servidor está online'
            elif result == 110 or result == 10060:
                error_message = f'Tempo limite excedido ao conectar a {host}:{port}'
                
            return {
                'success': False,
                'message': error_message
            }
    except Exception as e:
        return {
            'success': False,
            'message': f'Erro ao conectar com {host}:{port}: {str(e)}'
        }

# Função para testar conexão IMAP
def test_imap_connection(email: str, password: str, host: str, port: int, 
                         secure: bool = True, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Testa uma conexão IMAP completa, incluindo autenticação
    """
    logger.info(f"Testando conexão IMAP para {email} em {host}:{port}")
    
    # Primeiro verificar DNS
    dns_check = check_dns(host)
    if not dns_check['success']:
        return {
            'success': False,
            'message': f'Falha na resolução DNS: {dns_check["message"]}',
            'stage': 'dns',
            'details': dns_check
        }
        
    # Depois verificar conexão de rede
    net_check = test_network_connection(host, port, timeout)
    if not net_check['success']:
        return {
            'success': False,
            'message': f'Falha na conexão de rede: {net_check["message"]}',
            'stage': 'network',
            'details': net_check
        }
    
    # Agora tentar autenticação IMAP
    try:
        # Criar cliente IMAP com SSL se necessário
        if secure:
            imap = imaplib.IMAP4_SSL(host, port=port, timeout=timeout)
        else:
            imap = imaplib.IMAP4(host, port=port, timeout=timeout)
        
        # Tentar login
        imap.login(email, password)
        
        # Listar caixas de correio
        mailboxes = []
        status, mailbox_list = imap.list()
        
        if status == 'OK':
            for mailbox in mailbox_list:
                if isinstance(mailbox, bytes):
                    try:
                        decoded = mailbox.decode('utf-8')
                        parts = decoded.split(' "." ')
                        if len(parts) > 1:
                            mailbox_name = parts[1].strip('"')
                            mailboxes.append(mailbox_name)
                    except:
                        # Ignorar caixas que não puderem ser decodificadas
                        pass
        
        # Selecionar INBOX para verificar se funciona
        imap.select('INBOX')
        
        # Desconectar
        try:
            imap.logout()
        except:
            pass
        
        return {
            'success': True,
            'message': f'Conexão IMAP com {host}:{port} estabelecida com sucesso',
            'mailboxes': mailboxes,
            'stage': 'authenticated'
        }
        
    except imaplib.IMAP4.error as e:
        error_msg = str(e)
        if 'Invalid credentials' in error_msg or 'Authentication failed' in error_msg:
            return {
                'success': False,
                'message': 'Falha na autenticação IMAP: credenciais inválidas',
                'stage': 'authentication',
                'error_type': 'credentials'
            }
        else:
            return {
                'success': False,
                'message': f'Erro IMAP: {error_msg}',
                'stage': 'protocol',
                'error_type': 'protocol_error'
            }
    except ssl.SSLError as e:
        return {
            'success': False,
            'message': f'Erro SSL na conexão IMAP: {str(e)}',
            'stage': 'ssl',
            'error_type': 'ssl_error'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'Erro ao conectar via IMAP: {str(e)}',
            'stage': 'connection',
            'error_type': 'unknown'
        }

# Função para testar conexão SMTP
def test_smtp_connection(email: str, password: str, host: str, port: int,
                         secure: bool = False, starttls: bool = True,
                         timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Testa uma conexão SMTP completa, incluindo autenticação
    """
    logger.info(f"Testando conexão SMTP para {email} em {host}:{port}")
    
    # Primeiro verificar DNS
    dns_check = check_dns(host)
    if not dns_check['success']:
        return {
            'success': False,
            'message': f'Falha na resolução DNS: {dns_check["message"]}',
            'stage': 'dns',
            'details': dns_check
        }
        
    # Depois verificar conexão de rede
    net_check = test_network_connection(host, port, timeout)
    if not net_check['success']:
        return {
            'success': False,
            'message': f'Falha na conexão de rede: {net_check["message"]}',
            'stage': 'network',
            'details': net_check
        }
    
    # Agora tentar autenticação SMTP
    try:
        # Criar cliente SMTP com SSL se necessário
        if secure:
            smtp = smtplib.SMTP_SSL(host, port=port, timeout=timeout)
        else:
            smtp = smtplib.SMTP(host, port=port, timeout=timeout)
            
        # Iniciar conexão
        smtp.ehlo()
        
        # Ativar STARTTLS se necessário
        if starttls and not secure:
            smtp.starttls()
            smtp.ehlo()  # Precisa fazer ehlo novamente após STARTTLS
        
        # Tentar login
        smtp.login(email, password)
        
        # Verificar suporte a extensões
        supported_extensions = []
        if hasattr(smtp, 'esmtp_features'):
            supported_extensions = list(smtp.esmtp_features.keys())
        
        # Desconectar
        smtp.quit()
        
        return {
            'success': True,
            'message': f'Conexão SMTP com {host}:{port} estabelecida com sucesso',
            'extensions': supported_extensions,
            'stage': 'authenticated'
        }
        
    except smtplib.SMTPAuthenticationError as e:
        return {
            'success': False,
            'message': f'Falha na autenticação SMTP: {str(e)}',
            'stage': 'authentication',
            'error_type': 'credentials',
            'error_code': e.smtp_code
        }
    except smtplib.SMTPException as e:
        return {
            'success': False,
            'message': f'Erro SMTP: {str(e)}',
            'stage': 'protocol',
            'error_type': 'protocol_error'
        }
    except ssl.SSLError as e:
        return {
            'success': False,
            'message': f'Erro SSL na conexão SMTP: {str(e)}',
            'stage': 'ssl',
            'error_type': 'ssl_error'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'Erro ao conectar via SMTP: {str(e)}',
            'stage': 'connection',
            'error_type': 'unknown'
        }

# Rota para validar a chave API
@app.route('/api/status', methods=['GET'])
@require_api_key
def status():
    return jsonify({
        'status': 'online',
        'service': 'EmailMax Validation Service',
        'version': '1.0.0'
    })

# Rota principal para testar conexões de email
@app.route('/api/test-connection', methods=['POST'])
@require_api_key
def test_connection():
    try:
        data = request.json
        
        # Verificar se os campos obrigatórios estão presentes
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Parâmetros incompletos. É necessário fornecer email e password.'
            }), 400
            
        email = data['email']
        password = data['password']
        
        # Verificar se os detalhes de servidor foram fornecidos ou se devemos detectar
        detect_settings = data.get('autodetect', True)
        
        # Se não foram fornecidos todos os detalhes de servidor, tentar detectar
        if (not all(k in data for k in ['imapHost', 'imapPort', 'smtpHost', 'smtpPort']) 
                or detect_settings):
            provider_settings = detect_provider_config(email)
            
            # Usar configurações detectadas ou fornecidas
            imap_host = data.get('imapHost', provider_settings['imap']['host'])
            imap_port = int(data.get('imapPort', provider_settings['imap']['port']))
            imap_secure = data.get('imapSecure', provider_settings['imap']['secure'])
            
            smtp_host = data.get('smtpHost', provider_settings['smtp']['host'])
            smtp_port = int(data.get('smtpPort', provider_settings['smtp']['port']))
            smtp_secure = data.get('smtpSecure', provider_settings['smtp'].get('secure', False))
            smtp_starttls = data.get('smtpStartTLS', provider_settings['smtp'].get('starttls', True))
        else:
            # Usar configurações fornecidas pelo cliente
            imap_host = data['imapHost']
            imap_port = int(data['imapPort'])
            imap_secure = data.get('imapSecure', imap_port == 993)
            
            smtp_host = data['smtpHost']
            smtp_port = int(data['smtpPort'])
            smtp_secure = data.get('smtpSecure', smtp_port == 465)
            smtp_starttls = data.get('smtpStartTLS', smtp_port == 587)
            
        # Determinar quais testes realizar
        test_imap = data.get('testImap', True)
        test_smtp = data.get('testSmtp', True)
        
        timeout = int(data.get('timeout', DEFAULT_TIMEOUT))
        
        # Inicializar resultados
        results = {
            'success': False,
            'message': '',
            'details': {
                'imap': None,
                'smtp': None,
                'detected_settings': {
                    'imap': {
                        'host': imap_host,
                        'port': imap_port,
                        'secure': imap_secure
                    },
                    'smtp': {
                        'host': smtp_host,
                        'port': smtp_port,
                        'secure': smtp_secure,
                        'starttls': smtp_starttls
                    }
                }
            }
        }
        
        # Executar testes
        if test_imap:
            imap_result = test_imap_connection(
                email, password, imap_host, imap_port, 
                secure=imap_secure, timeout=timeout
            )
            results['details']['imap'] = imap_result
            
        if test_smtp:
            smtp_result = test_smtp_connection(
                email, password, smtp_host, smtp_port,
                secure=smtp_secure, starttls=smtp_starttls, timeout=timeout
            )
            results['details']['smtp'] = smtp_result
            
        # Determinar resultado geral
        if test_imap and test_smtp:
            results['success'] = (
                results['details']['imap']['success'] and 
                results['details']['smtp']['success']
            )
            
            if results['success']:
                results['message'] = 'Servidores IMAP e SMTP acessíveis e autenticação bem-sucedida'
            elif not results['details']['imap']['success'] and not results['details']['smtp']['success']:
                results['message'] = 'Falha no acesso aos servidores IMAP e SMTP'
            elif not results['details']['imap']['success']:
                results['message'] = 'Falha no acesso ao servidor IMAP, SMTP acessível'
            else:
                results['message'] = 'Falha no acesso ao servidor SMTP, IMAP acessível'
                
        elif test_imap:
            results['success'] = results['details']['imap']['success']
            results['message'] = results['details']['imap']['message']
            
        elif test_smtp:
            results['success'] = results['details']['smtp']['success']
            results['message'] = results['details']['smtp']['message']
            
        else:
            results['message'] = 'Nenhum teste solicitado'
            
        # Indicar que este é um teste real, não uma simulação
        results['details']['connectionType'] = 'real'
            
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Erro ao processar requisição: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}',
            'details': {}
        }), 500

# Endpoint para verificação rápida de existência de servidor (apenas DNS)
@app.route('/api/check-server', methods=['POST'])
@require_api_key
def check_server():
    try:
        data = request.json
        
        if not data or 'host' not in data:
            return jsonify({
                'success': False,
                'message': 'Parâmetro host é obrigatório'
            }), 400
            
        host = data['host']
        port = int(data.get('port', 0))
        
        # Verificar DNS primeiro
        dns_result = check_dns(host)
        result = {
            'success': dns_result['success'],
            'message': dns_result['message'],
            'dns': dns_result
        }
        
        # Se foi fornecida uma porta, verificar também a conexão de rede
        if port > 0 and dns_result['success']:
            net_result = test_network_connection(host, port)
            result['network'] = net_result
            
            # Atualizar resultado com base no teste de rede
            result['success'] = result['success'] and net_result['success']
            if not net_result['success']:
                result['message'] = net_result['message']
                
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro ao verificar servidor: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# Endpoint para verificar domínio de email
@app.route('/api/verify-email-domain', methods=['POST'])
@require_api_key
def verify_email_domain():
    try:
        start_time = time.time()
        data = request.json
        
        if not data or 'email' not in data:
            return jsonify({
                'success': False,
                'message': 'Parâmetro email é obrigatório'
            }), 400
            
        email = data['email']
        
        # Extrair domínio do email
        try:
            domain = email.split('@')[-1].lower()
        except Exception:
            return jsonify({
                'success': False,
                'message': 'Formato de email inválido'
            }), 400
            
        logger.info(f"Verificando domínio de email: {domain}")
        
        # Verificar registros MX
        mx_records = []
        has_mx = False
        try:
            mx_result = dns.resolver.resolve(domain, 'MX')
            has_mx = len(mx_result) > 0
            mx_records = [{
                'preference': rec.preference,
                'exchange': str(rec.exchange)
            } for rec in mx_result]
            logger.info(f"Encontrados {len(mx_records)} registros MX para {domain}")
        except Exception as e:
            logger.warning(f"Erro ao resolver registros MX para {domain}: {e}")
            
        # Detectar configurações
        provider_settings = detect_provider_config(email)
        provider_name = "Desconhecido"
        
        # Identificar o provedor
        if 'gmail' in domain:
            provider_name = "Gmail"
        elif 'outlook' in domain or 'hotmail' in domain or 'live' in domain:
            provider_name = "Outlook/Microsoft"
        elif 'yahoo' in domain:
            provider_name = "Yahoo"
        elif mx_records:
            # Tentar identificar com base no MX
            mx_domain = str(mx_records[0]['exchange']).lower()
            if 'google' in mx_domain or 'gmail' in mx_domain:
                provider_name = "Gmail (G Suite)"
            elif 'outlook' in mx_domain or 'microsoft' in mx_domain:
                provider_name = "Microsoft 365"
            elif 'yahoo' in mx_domain:
                provider_name = "Yahoo"
            elif 'zoho' in mx_domain:
                provider_name = "Zoho"
            elif 'protonmail' in mx_domain:
                provider_name = "ProtonMail"
            
        # Preparar resposta
        result = {
            'success': True,
            'domain': domain,
            'hasMxRecords': has_mx,
            'mxRecords': mx_records,
            'detectedSettings': {
                'provider': provider_name,
                'imap': provider_settings['imap'],
                'smtp': provider_settings['smtp']
            },
            'elapsedTime': round(time.time() - start_time, 2)
        }
        
        # Adicionar instruções específicas para o provedor, se disponíveis
        if provider_name == "Gmail":
            result['detectedSettings']['needsAppPassword'] = True
            result['detectedSettings']['instructions'] = "Para o Gmail, você precisa ativar a verificação em duas etapas e usar uma senha de aplicativo."
            
        logger.info(f"Verificação de domínio concluída para {domain}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro ao verificar domínio de email: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# Página inicial simples
@app.route('/', methods=['GET'])
def home():
    return """
    <html>
        <head>
            <title>EmailMax - Serviço de Validação IMAP/SMTP</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>EmailMax - Serviço de Validação IMAP/SMTP</h1>
            <p>Este é um microserviço para validação de conexões de email IMAP/SMTP.</p>
            <p>Para utilizar, faça uma requisição POST para <code>/api/test-connection</code> com as credenciais.</p>
            <p>É necessário fornecer a chave API no cabeçalho <code>Authorization: Bearer SUA_CHAVE_API</code>.</p>
        </body>
    </html>
    """

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Iniciando servidor na porta {port}, debug={debug}")
    app.run(host='0.0.0.0', port=port, debug=debug) 
# EmailMax - Microserviço de Validação IMAP/SMTP

Este microserviço oferece uma API RESTful para validação de conexões IMAP e SMTP, substituindo completamente as Edge Functions do Supabase que sofrem com as limitações de bloqueio de conexões às portas de email (25, 465, 587 para SMTP e 143, 993 para IMAP).

## Funcionalidades

- ✅ Testa conexões IMAP/SMTP reais com servidores de email
- 🔄 Suporta proxies rotativos para evitar bloqueios de IP
- 🔍 Detecta automaticamente configurações de provedores de email
- 📊 Fornece feedback detalhado e específico sobre erros
- 🔒 Segue padrões REST com autenticação via API key
- 🐳 Preparado para implantação via Docker

## Requisitos

- Python 3.8+
- Flask e demais dependências (veja `requirements.txt`)
- Docker (opcional, mas recomendado para produção)

## Estrutura do Projeto

```
EmailMax-Validator/
├── app.py             # Aplicação principal Flask
├── requirements.txt   # Dependências Python
├── Dockerfile         # Configuração para build da imagem Docker
├── docker-compose.yml # Configuração para orquestração com Docker Compose
└── README.md          # Documentação
```

## Instalação

### Usando Docker (recomendado para produção)

1. Baixe ou copie os arquivos do projeto para seu servidor:
   ```bash
   mkdir emailmax-validator
   cd emailmax-validator
   # Copie os arquivos do projeto para esta pasta
   ```

2. Configure sua chave API (altere para uma chave segura) no arquivo `.env` ou diretamente no `docker-compose.yml`:
   ```
   API_KEY=sua_chave_api_secreta_muito_forte
   ```

3. Inicie o contêiner:
   ```bash
   docker-compose up -d
   ```

O serviço estará disponível em `http://localhost:5000`.

### Instalação Manual (para desenvolvimento)

1. Clone ou copie o repositório:
   ```bash
   mkdir emailmax-validator
   cd emailmax-validator
   # Copie os arquivos do projeto para esta pasta
   ```

2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate     # Windows
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure sua chave API:
   ```bash
   export API_KEY=sua_chave_api_secreta
   ```

5. Execute o aplicativo em modo de desenvolvimento:
   ```bash
   python app.py
   ```

## Configuração no Projeto EmailMax

Para configurar o EmailMax para usar este microserviço:

1. Defina as variáveis de ambiente no seu projeto Next.js:

```
# URL do microserviço de validação IMAP/SMTP
NEXT_PUBLIC_EMAIL_VALIDATION_SERVICE_URL=http://localhost:5000

# Chave de API para autenticação com o microserviço
EMAIL_VALIDATION_API_KEY=sua_chave_api_secreta
```

2. O código do EmailMax já está configurado para utilizar este microserviço para todas as operações de validação IMAP/SMTP.

## Uso em Produção

Para produção, é fortemente recomendado:

1. Usar o Docker para implantação
2. Configurar HTTPS via proxy reverso (Nginx/Caddy)
3. Usar uma chave API forte e exclusiva
4. Monitorar logs e configurar alertas

Executando com Gunicorn para maior performance:
```bash
gunicorn --bind 0.0.0.0:5000 app:app --workers 4
```

## Endpoints da API

### Status do Serviço

**URL**: `/api/status`  
**Método**: `GET`  
**Autenticação**: Opcional  

**Resposta**:
```json
{
  "status": "online",
  "service": "EmailMax Validation Service",
  "version": "1.0.0"
}
```

### Verificação de Domínio

**URL**: `/api/verify-email-domain`  
**Método**: `POST`  
**Autenticação**: `Bearer Token`  

**Corpo da Requisição**:
```json
{
  "email": "usuario@gmail.com"
}
```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "domain": "gmail.com",
  "hasMxRecords": true,
  "detectedSettings": {
    "provider": "Gmail",
    "imap": {
      "host": "imap.gmail.com",
      "port": 993
    },
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587
    },
    "needsAppPassword": true
  }
}
```

### Teste de Conexão

**URL**: `/api/test-connection`  
**Método**: `POST`  
**Autenticação**: `Bearer Token`  

**Corpo da Requisição**:
```json
{
  "email": "seu_email@gmail.com",
  "password": "sua_senha_de_app",
  "imapHost": "imap.gmail.com",  // Opcional se autodetect=true
  "imapPort": 993,               // Opcional se autodetect=true
  "smtpHost": "smtp.gmail.com",  // Opcional se autodetect=true
  "smtpPort": 587,               // Opcional se autodetect=true
  "autodetect": true,            // Detectar configurações automaticamente
  "testImap": true,              // Testar conexão IMAP
  "testSmtp": true,              // Testar conexão SMTP
  "proxy": {                     // Opcional
    "host": "proxy.example.com",
    "port": 1080,
    "type": "socks5",
    "username": "proxyuser",     // Opcional
    "password": "proxypass"      // Opcional
  }
}
```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "message": "Servidores IMAP e SMTP acessíveis e autenticação bem-sucedida",
  "details": {
    "imap": {
      "success": true,
      "message": "Conexão IMAP com imap.gmail.com:993 estabelecida com sucesso",
      "mailboxes": ["INBOX", "[Gmail]/Sent Mail"],
      "stage": "authenticated",
      "elapsedTime": 1.24
    },
    "smtp": {
      "success": true,
      "message": "Conexão SMTP com smtp.gmail.com:587 estabelecida com sucesso",
      "stage": "authenticated",
      "elapsedTime": 0.87
    }
  }
}
```

### Verificação de Servidor

**URL**: `/api/check-server`  
**Método**: `POST`  
**Autenticação**: `Bearer Token`  

**Corpo da Requisição**:
```json
{
  "host": "imap.gmail.com",
  "port": 993
}
```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "message": "Servidor acessível",
  "dns": {
    "success": true,
    "addresses": ["142.250.115.108", "142.250.115.109"]
  },
  "network": {
    "success": true,
    "message": "Conexão estabelecida com sucesso"
  }
}
```

## Solução de Problemas

### Microcerviço não está acessível

Se o microserviço não estiver acessível, o EmailMax cairá em um modo de simulação que não realiza testes reais. Para resolver:

1. Verifique se o microserviço está rodando
2. Confirme que a URL do microserviço está configurada corretamente nas variáveis de ambiente
3. Verifique se a rede permite a comunicação entre o frontend e o microserviço

### Erro de autenticação

Se você estiver recebendo erros de API key inválida:

1. Verifique se a API key está configurada corretamente no microserviço
2. Confirme que a mesma API key está configurada nas variáveis de ambiente do EmailMax

## Licença

Este projeto é open-source sob a licença MIT.
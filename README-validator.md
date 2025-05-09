# Validação IMAP/SMTP para EmailMax

Este documento descreve como configurar e utilizar o microserviço de validação IMAP/SMTP para o sistema EmailMax.

## Visão Geral

O microserviço de validação IMAP/SMTP é um componente independente que fornece validação de conexões de email, permitindo:

- Testar conexões IMAP (para recebimento de emails)
- Testar conexões SMTP (para envio de emails)
- Validar credenciais de email
- Detectar configurações automáticas para provedores comuns
- Fornecer feedback detalhado sobre problemas de conexão

## Por que não Edge Functions do Supabase?

O projeto inicialmente considerou usar Edge Functions do Supabase para validação de email, mas essa abordagem tem limitações importantes:

1. Edge Functions não podem se conectar a portas arbitrárias (incluindo as usadas para IMAP/SMTP)
2. O tempo de execução é limitado
3. Não é possível instalar bibliotecas como `imaplib` e `smtplib` no ambiente serverless

Portanto, desenvolvemos um microserviço Python independente que fornece essa funcionalidade crucial.

## Requisitos

Para executar o microserviço, você pode escolher entre duas opções:

### Opção 1: Docker (Recomendado)

- Docker Desktop instalado
- Docker Compose disponível

### Opção 2: Python

- Python 3.8+ instalado
- Pip instalado
- Pacotes listados em `requirements.txt`

## Inicialização Rápida

### Usando Docker (Recomendado)

```bash
# Iniciando o microserviço usando Docker
npm run validator:start

# Iniciando o app Next.js junto com o microserviço
npm run dev:with-validator
```

### Usando Python Diretamente

```bash
# Iniciando o microserviço diretamente com Python
npm run validator:start-python

# Ou, em outro terminal, inicie a aplicação Next.js
npm run dev
```

## Configuração

O microserviço usa as seguintes configurações que podem ser definidas em `.env.local`:

```env
# URL do microserviço (usado pelo frontend)
NEXT_PUBLIC_EMAIL_VALIDATION_SERVICE_URL=http://localhost:5000

# Chave de API para o microserviço
EMAIL_VALIDATION_API_KEY=dev_key_change_me_in_production

# Desabilitar uso de Edge Functions
USE_EDGE_FUNCTIONS=false
```

## Endpoints da API

O microserviço expõe os seguintes endpoints:

- `GET /api/status` - Verifica se o serviço está online
- `POST /api/test-connection` - Testa conexão IMAP/SMTP
- `POST /api/check-server` - Verificação básica de servidor
- `POST /api/verify-email-domain` - Verifica domínio de email

### Testando uma Conexão

Exemplo de requisição para `/api/test-connection`:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha_ou_senha_app",
  "imapHost": "imap.exemplo.com",
  "imapPort": 993,
  "smtpHost": "smtp.exemplo.com",
  "smtpPort": 587,
  "testImap": true,
  "testSmtp": true,
  "autodetect": true
}
```

Headers necessários:

```
Content-Type: application/json
Authorization: Bearer dev_key_change_me_in_production
```

## Solução de Problemas

### O Microserviço não Inicia

1. Verifique se o Docker está instalado e em execução
2. Verifique se a porta 5000 não está sendo usada por outro aplicativo
3. Verifique os logs com `cd imap-smtp-validator && docker compose logs`

### Problemas com Conexão IMAP/SMTP

1. Verifique se as credenciais estão corretas
2. Para Gmail, use uma "Senha de Aplicativo", não sua senha normal
3. Verifique se o provedor permite acesso IMAP/SMTP (alguns exigem ativação)
4. Verifique firewall ou bloqueios de rede

### Erro ao Testar Conexão

Se a aplicação mostrar "Serviço de validação indisponível", verifique:

1. Se o microserviço está rodando (deve responder em `http://localhost:5000/api/status`)
2. Se as configurações em `.env.local` estão corretas
3. Se a rede permite comunicação entre a aplicação e o microserviço

## Execução Manual

Se precisar executar o microserviço manualmente:

### Com Docker

```bash
cd imap-smtp-validator
docker compose up -d
```

### Com Python Diretamente

```bash
cd imap-smtp-validator
pip install -r requirements.txt
python app.py
```

## Usando com Provedores Comuns

### Gmail

1. Habilite "Acesso a app menos seguro" ou use a autenticação de dois fatores
2. Gere uma "Senha de aplicativo" em https://myaccount.google.com/apppasswords
3. Use o formato específico: `xxxx xxxx xxxx xxxx` (16 caracteres em 4 grupos)

### Outlook/Office 365

1. Use seu email completo como nome de usuário
2. Use sua senha normal ou uma senha de app se tiver autenticação de dois fatores

### Yahoo

1. Habilite "Permitir apps que usam login menos seguro"
2. Gere uma senha de aplicativo nas configurações de segurança da conta

## Desenvolvimento

Para modificar o microserviço:

1. Edite os arquivos em `imap-smtp-validator/`
2. Reinicie o microserviço para aplicar as alterações

---

Para mais informações, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento. 
# Exemplos de Testes para Edge Function email-processor

Este documento contém exemplos de como testar a Edge Function email-processor usando `curl` e utilitários de linha de comando.

## Pré-requisitos

- Token JWT válido (obtido do Supabase Auth)
- ID da conta de email cadastrada no banco de dados
- Supabase CLI instalado e configurado

## Iniciar o servidor para testes locais

```bash
supabase functions serve email-processor --no-verify-jwt
```

Use a flag `--no-verify-jwt` durante o desenvolvimento para evitar problemas com autenticação.

## Exemplos de Testes

### 1. Enviar Email

```bash
curl -X POST http://localhost:54321/functions/v1/email-processor \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_email",
    "accountId": "ID_DA_CONTA_DE_EMAIL",
    "to": "destinatario@exemplo.com",
    "subject": "Teste via curl",
    "text": "Este é um email de teste enviado via curl.",
    "html": "<p>Este é um <strong>email de teste</strong> enviado via curl.</p>"
  }'
```

### 2. Ler Emails

```bash
curl -X POST http://localhost:54321/functions/v1/email-processor \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "read_emails",
    "accountId": "ID_DA_CONTA_DE_EMAIL",
    "folder": "INBOX",
    "maxMessages": 5,
    "onlyUnread": true
  }'
```

### 3. Marcar Emails como Lidos

```bash
curl -X POST http://localhost:54321/functions/v1/email-processor \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mark_as_read",
    "accountId": "ID_DA_CONTA_DE_EMAIL",
    "messageIds": ["ID_MSG_1", "ID_MSG_2"],
    "folder": "INBOX"
  }'
```

### 4. Processar Emails Agendados

```bash
curl -X POST http://localhost:54321/functions/v1/email-processor \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "process_scheduled_emails"
  }'
```

### 5. Verificar Atualizações da Caixa de Entrada

```bash
curl -X POST http://localhost:54321/functions/v1/email-processor \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check_inbox_updates",
    "accountId": "ID_DA_CONTA_DE_EMAIL",
    "folder": "INBOX"
  }'
```

## Testes de Produção

Para testar em produção (após o deploy), substitua a URL local pelo endpoint real da sua função:

```bash
curl -X POST https://xxxxxxxxxxxx.supabase.co/functions/v1/email-processor \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Criando Dados de Teste

Para preparar o ambiente para testes, você pode inserir dados de teste no banco de dados. Aqui estão alguns exemplos de inserções SQL:

### Inserir uma conta de email para testes

```sql
INSERT INTO public.email_accounts (
  user_id, 
  email, 
  smtp_host, 
  smtp_port, 
  smtp_username, 
  smtp_password, 
  smtp_secure, 
  imap_host, 
  imap_port, 
  status
) VALUES (
  'ID_DO_USUARIO', -- Substitua pelo ID do usuário autenticado
  'seu.email@gmail.com',
  'smtp.gmail.com',
  587,
  'seu.email@gmail.com',
  'sua_senha_de_app', -- Use uma senha de aplicativo para Gmail
  false,
  'imap.gmail.com',
  993,
  'connected'
);
```

### Agendar um email para teste

```sql
INSERT INTO public.scheduled_emails (
  account_id, 
  recipient, 
  subject, 
  text_content, 
  html_content, 
  status, 
  scheduled_time
) VALUES (
  'ID_DA_CONTA_DE_EMAIL', -- Substitua pelo ID da conta inserida
  'destinatario@exemplo.com',
  'Email Agendado de Teste',
  'Este é um email agendado para teste.',
  '<p>Este é um <strong>email agendado</strong> para teste.</p>',
  'pending',
  NOW() -- Agendar para agora
);
```

## Depuração

Para visualizar os logs da função Edge, você pode usar:

```bash
supabase functions logs email-processor
```

Para verificar o status do deploy:

```bash
supabase functions list
``` 
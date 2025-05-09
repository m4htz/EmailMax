# Email Processor - Edge Function

Esta função Edge do Supabase permite o processamento de emails via SMTP e IMAP dentro do ambiente edge do Deno.

## Funcionalidades

- Envio de emails (SMTP)
- Leitura de emails (IMAP)
- Marcação de emails como lidos
- Processamento em lote de emails agendados
- Monitoramento de caixa de entrada

## Requisitos de Tabelas

A função espera as seguintes tabelas no seu banco de dados Supabase:

- `email_accounts` - Armazena configurações de contas de email
- `email_logs` - Registra logs de emails enviados
- `scheduled_emails` - Armazena emails agendados para envio futuro
- `received_emails` - Armazena emails recebidos

## Endpoints

A função suporta as seguintes ações:

### 1. Enviar Email

```json
{
  "action": "send_email",
  "accountId": "uuid-da-conta",
  "to": "destinatario@exemplo.com",
  "subject": "Assunto do Email",
  "text": "Conteúdo em texto simples",
  "html": "<p>Conteúdo em HTML (opcional)</p>",
  "cc": ["copia@exemplo.com"],
  "bcc": ["copiaoculta@exemplo.com"],
  "replyTo": "responder@exemplo.com"
}
```

### 2. Ler Emails

```json
{
  "action": "read_emails",
  "accountId": "uuid-da-conta",
  "folder": "INBOX",
  "maxMessages": 20,
  "onlyUnread": true
}
```

### 3. Marcar Emails como Lidos

```json
{
  "action": "mark_as_read",
  "accountId": "uuid-da-conta",
  "messageIds": ["id-mensagem-1", "id-mensagem-2"],
  "folder": "INBOX"
}
```

### 4. Processar Emails Agendados

```json
{
  "action": "process_scheduled_emails"
}
```

### 5. Verificar Atualizações da Caixa de Entrada

```json
{
  "action": "check_inbox_updates",
  "accountId": "uuid-da-conta",
  "folder": "INBOX"
}
```

## Implantação

Para implantar a função:

```bash
supabase functions deploy email-processor
```

Para testar localmente:

```bash
supabase functions serve email-processor --no-verify-jwt
```

## Notas de Implementação

- As credenciais SMTP e IMAP são obtidas da tabela `email_accounts`
- A função implementa um simulador IMAP para desenvolvimento/testes
- Em produção, deve-se usar bibliotecas completas como ImapFlow

## Exemplo de Uso

Usando fetch para chamar a função:

```javascript
const { data, error } = await supabase.functions.invoke('email-processor', {
  body: {
    action: 'send_email',
    accountId: '123e4567-e89b-12d3-a456-426614174000',
    to: 'destinatario@exemplo.com',
    subject: 'Teste de Email',
    text: 'Este é um email de teste enviado via Edge Function'
  }
})
```

## Segurança

- A função requer autenticação JWT validada
- As senhas de email nunca devem ser expostas ao cliente
- Todas as conexões SMTP/IMAP usam TLS para segurança 
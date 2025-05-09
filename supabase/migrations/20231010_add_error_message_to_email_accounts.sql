-- Adicionar coluna error_message à tabela email_accounts para armazenar detalhes de erros de conexão
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Criar um índice na coluna status para acelerar consultas por status
CREATE INDEX IF NOT EXISTS email_accounts_status_idx ON email_accounts(status);

-- Atualizar função de atualização de timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Garantir que o trigger de atualização está presente
DROP TRIGGER IF EXISTS update_email_account_updated_at ON email_accounts;
CREATE TRIGGER update_email_account_updated_at
BEFORE UPDATE ON email_accounts
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Comentário para documentação da migração
COMMENT ON COLUMN email_accounts.error_message IS 'Mensagem de erro detalhada caso a conexão IMAP falhe'; 
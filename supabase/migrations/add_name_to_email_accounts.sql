-- Adiciona a coluna 'name' à tabela 'email_accounts'
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS name TEXT;

-- Adiciona um comentário para documentação
COMMENT ON COLUMN email_accounts.name IS 'Nome amigável para a conta de email'; 
-- Adicionar colunas para suporte a OAuth na tabela email_accounts
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'password' CHECK (auth_type IN ('password', 'oauth')),
ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
ADD COLUMN IF NOT EXISTS oauth_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_token_refresh TIMESTAMP WITH TIME ZONE;

-- Adicionar índice para melhorar consultas de expiração de tokens
CREATE INDEX IF NOT EXISTS idx_email_accounts_oauth_expires 
ON email_accounts(oauth_expires_at) 
WHERE auth_type = 'oauth';

-- Adicionar comentários para documentação
COMMENT ON COLUMN email_accounts.auth_type IS 'Tipo de autenticação: password (senha de aplicativo) ou oauth';
COMMENT ON COLUMN email_accounts.oauth_provider IS 'Provedor OAuth (gmail, outlook, etc.)';
COMMENT ON COLUMN email_accounts.oauth_expires_at IS 'Data/hora de expiração do token de acesso OAuth';
COMMENT ON COLUMN email_accounts.last_token_refresh IS 'Última vez que o token foi renovado';

-- Criar função para atualizar o timestamp de última renovação de token
CREATE OR REPLACE FUNCTION update_last_token_refresh()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_token_refresh = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamp em cada renovação de token
CREATE TRIGGER update_token_refresh_timestamp
BEFORE UPDATE OF oauth_expires_at
ON email_accounts
FOR EACH ROW
WHEN (OLD.oauth_expires_at IS DISTINCT FROM NEW.oauth_expires_at)
EXECUTE FUNCTION update_last_token_refresh(); 
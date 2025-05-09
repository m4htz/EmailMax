-- Verificar se a extensão vault já está instalada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault'
    ) THEN
        -- Criar a extensão vault se não existir
        CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
    END IF;
END
$$;

-- Tabela para armazenar referências às credenciais
-- As senhas reais serão armazenadas no vault
CREATE TABLE IF NOT EXISTS secure_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  credential_key TEXT NOT NULL,
  vault_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (account_id, credential_type)
);

-- Função para criar uma credencial segura
CREATE OR REPLACE FUNCTION create_secure_credential(
  p_user_id UUID,
  p_account_id UUID,
  p_credential_type TEXT,
  p_credential_key TEXT,
  p_credential_value TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vault_id UUID;
  v_credential_id UUID;
BEGIN
  -- Verificar se o usuário tem acesso à conta
  IF NOT EXISTS (
    SELECT 1 FROM email_accounts 
    WHERE id = p_account_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Acesso negado à conta de email';
  END IF;

  -- Armazenar o valor no vault
  SELECT vault.create_secret(
    p_credential_value, 
    CONCAT(p_account_id, ':', p_credential_type, ':', p_credential_key),
    CONCAT('Credencial para conta de email ', p_account_id)
  ) INTO v_vault_id;

  -- Armazenar a referência à credencial
  INSERT INTO secure_credentials(
    user_id, account_id, credential_type, credential_key, vault_id
  )
  VALUES (
    p_user_id, p_account_id, p_credential_type, p_credential_key, v_vault_id
  )
  RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$;

-- Função para obter uma credencial segura
CREATE OR REPLACE FUNCTION get_secure_credential(
  p_user_id UUID,
  p_account_id UUID,
  p_credential_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vault_id UUID;
  v_credential_value TEXT;
BEGIN
  -- Verificar se o usuário tem acesso à credencial
  SELECT vault_id INTO v_vault_id
  FROM secure_credentials
  WHERE 
    account_id = p_account_id AND 
    credential_type = p_credential_type AND
    user_id = p_user_id;

  IF v_vault_id IS NULL THEN
    RAISE EXCEPTION 'Credencial não encontrada ou acesso negado';
  END IF;

  -- Obter o valor decriptado do vault
  SELECT decrypted_secret INTO v_credential_value
  FROM vault.decrypted_secrets
  WHERE id = v_vault_id;

  RETURN v_credential_value;
END;
$$;

-- Função para atualizar uma credencial segura
CREATE OR REPLACE FUNCTION update_secure_credential(
  p_user_id UUID,
  p_account_id UUID,
  p_credential_type TEXT,
  p_new_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vault_id UUID;
  v_success BOOLEAN;
BEGIN
  -- Verificar se o usuário tem acesso à credencial
  SELECT vault_id INTO v_vault_id
  FROM secure_credentials
  WHERE 
    account_id = p_account_id AND 
    credential_type = p_credential_type AND
    user_id = p_user_id;

  IF v_vault_id IS NULL THEN
    RAISE EXCEPTION 'Credencial não encontrada ou acesso negado';
  END IF;

  -- Atualizar o valor no vault
  SELECT (vault.update_secret(
    v_vault_id, 
    p_new_value
  ) IS NOT NULL) INTO v_success;

  -- Atualizar timestamp
  IF v_success THEN
    UPDATE secure_credentials
    SET updated_at = NOW()
    WHERE vault_id = v_vault_id;
  END IF;

  RETURN v_success;
END;
$$;

-- Função para excluir uma credencial segura
CREATE OR REPLACE FUNCTION delete_secure_credential(
  p_user_id UUID,
  p_account_id UUID,
  p_credential_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vault_id UUID;
BEGIN
  -- Verificar se o usuário tem acesso à credencial
  SELECT vault_id INTO v_vault_id
  FROM secure_credentials
  WHERE 
    account_id = p_account_id AND 
    credential_type = p_credential_type AND
    user_id = p_user_id;

  IF v_vault_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Excluir a referência à credencial
  DELETE FROM secure_credentials
  WHERE vault_id = v_vault_id;

  -- O Supabase Vault não tem função para excluir segredos diretamente
  -- Os segredos obsoletos serão gerenciados pelo sistema

  RETURN TRUE;
END;
$$;

-- Habilitar RLS na tabela de credenciais
ALTER TABLE secure_credentials ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias credenciais
CREATE POLICY "Usuários podem ver apenas suas próprias credenciais"
  ON secure_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem apenas suas próprias credenciais
CREATE POLICY "Usuários podem criar apenas suas próprias credenciais"
  ON secure_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas suas próprias credenciais
CREATE POLICY "Usuários podem atualizar apenas suas próprias credenciais"
  ON secure_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam apenas suas próprias credenciais
CREATE POLICY "Usuários podem excluir apenas suas próprias credenciais"
  ON secure_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Instruções para alteração na tabela de contas de email
-- Modificar a forma como o password é armazenado
COMMENT ON COLUMN email_accounts.password IS 'Depreciado: Use secure_credentials para senhas';

-- Adicionando uma trigger para remover credenciais quando uma conta for excluída
CREATE OR REPLACE FUNCTION cleanup_credentials_on_account_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Remover todas as credenciais associadas à conta
  DELETE FROM secure_credentials WHERE account_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_account_delete_trigger
BEFORE DELETE ON email_accounts
FOR EACH ROW
EXECUTE FUNCTION cleanup_credentials_on_account_delete(); 
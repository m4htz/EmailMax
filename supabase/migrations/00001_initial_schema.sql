-- Habilita a extensão UUID para geração de IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para armazenar as contas de email
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('connected', 'warming_up', 'error')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_checked TIMESTAMP WITH TIME ZONE
);

-- Tabela para armazenar os planos de aquecimento
CREATE TABLE IF NOT EXISTS warmup_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  daily_volume INTEGER NOT NULL CHECK (daily_volume > 0),
  reply_percentage INTEGER NOT NULL CHECK (reply_percentage BETWEEN 0 AND 100),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela para armazenar as métricas de aquecimento
CREATE TABLE IF NOT EXISTS warmup_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plan_id UUID NOT NULL REFERENCES warmup_plans(id) ON DELETE CASCADE,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_delivered INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_replied INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Funções de gatilho para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilhos para atualizar o campo updated_at quando uma linha for atualizada
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warmup_plans_updated_at
  BEFORE UPDATE ON warmup_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para proteger os dados
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso somente aos próprios dados do usuário
CREATE POLICY "User can CRUD their own email accounts" 
  ON email_accounts FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "User can CRUD their own warmup plans" 
  ON warmup_plans FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "User can CRUD their own warmup metrics" 
  ON warmup_metrics FOR ALL 
  USING (auth.uid() = user_id); 
-- Criação das tabelas necessárias para processamento de email

-- Tabela de Contas de Email
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_username VARCHAR(255),
  smtp_password VARCHAR(255) NOT NULL,
  smtp_secure BOOLEAN DEFAULT FALSE,
  imap_host VARCHAR(255) NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'warming_up', 'error')),
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona comentários para documentação
COMMENT ON TABLE public.email_accounts IS 'Armazena configurações de contas de email dos usuários';
COMMENT ON COLUMN public.email_accounts.smtp_password IS 'Senha/token da conta SMTP (deveria ser criptografada)';

-- Tabela de Logs de Email
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'error', 'delayed')),
  message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Emails Agendados
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  text_content TEXT,
  html_content TEXT,
  cc VARCHAR(255)[],
  bcc VARCHAR(255)[],
  reply_to VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error', 'cancelled')),
  scheduled_time TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  message_id VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Emails Recebidos
CREATE TABLE IF NOT EXISTS public.received_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  message_id VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(255),
  sender VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  folder VARCHAR(100) DEFAULT 'INBOX',
  uid VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON public.email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_account_id ON public.email_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_account_id ON public.scheduled_emails(account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status_time ON public.scheduled_emails(status, scheduled_time) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_received_emails_account_id ON public.received_emails(account_id);
CREATE INDEX IF NOT EXISTS idx_received_emails_status ON public.received_emails(status) WHERE status = 'new';

-- Triggers para atualizar campos de timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_accounts_updated_at
BEFORE UPDATE ON public.email_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_emails_updated_at
BEFORE UPDATE ON public.scheduled_emails
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_received_emails_updated_at
BEFORE UPDATE ON public.received_emails
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS para segurança
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- Políticas para contas de email
CREATE POLICY "Usuários podem ver apenas suas próprias contas de email"
  ON public.email_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias contas de email"
  ON public.email_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias contas de email"
  ON public.email_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias contas de email"
  ON public.email_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para logs de email
CREATE POLICY "Usuários podem ver apenas logs de suas próprias contas"
  ON public.email_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = email_logs.account_id 
    AND email_accounts.user_id = auth.uid()
  ));

-- Apenas service role pode inserir logs (via Edge Functions)
CREATE POLICY "Service role pode inserir logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

-- Políticas para emails agendados
CREATE POLICY "Usuários podem ver apenas seus próprios emails agendados"
  ON public.scheduled_emails FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = scheduled_emails.account_id 
    AND email_accounts.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem inserir emails agendados para suas próprias contas"
  ON public.scheduled_emails FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = scheduled_emails.account_id 
    AND email_accounts.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem atualizar seus próprios emails agendados"
  ON public.scheduled_emails FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = scheduled_emails.account_id 
    AND email_accounts.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem excluir seus próprios emails agendados"
  ON public.scheduled_emails FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = scheduled_emails.account_id 
    AND email_accounts.user_id = auth.uid()
  ));

-- Políticas para emails recebidos
CREATE POLICY "Usuários podem ver apenas seus próprios emails recebidos"
  ON public.received_emails FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = received_emails.account_id 
    AND email_accounts.user_id = auth.uid()
  ));

-- Service role pode inserir emails recebidos (via Edge Functions)
CREATE POLICY "Service role pode inserir emails recebidos"
  ON public.received_emails FOR INSERT
  WITH CHECK (true);

-- Usuários podem atualizar o status de seus próprios emails recebidos
CREATE POLICY "Usuários podem atualizar o status de seus próprios emails recebidos"
  ON public.received_emails FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE email_accounts.id = received_emails.account_id 
    AND email_accounts.user_id = auth.uid()
  ))
  WITH CHECK (
    -- Apenas permite atualizar certos campos
    (OLD.status IS DISTINCT FROM NEW.status) OR
    (OLD.processed_at IS DISTINCT FROM NEW.processed_at)
  ); 
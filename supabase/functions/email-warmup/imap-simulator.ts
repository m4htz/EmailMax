// Simulador de IMAP para testes de desenvolvimento
// Numa implementação real, usaríamos uma biblioteca IMAP real

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  folder?: string;
  limit?: number;
  unseen?: boolean;
}

interface EmailMessage {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  date: Date;
  read: boolean;
}

interface ConnectionResult {
  success: boolean;
  message: string;
}

interface ReplyCheckResult {
  found: boolean;
  details?: {
    subject: string;
    from: string;
    date: Date;
  };
}

// Testa conexão com servidor IMAP
export async function testConnection(config: ImapConfig): Promise<ConnectionResult> {
  // Numa implementação real, tentaríamos estabelecer uma conexão IMAP

  // Simulando sucesso na maioria das vezes, falha ocasional
  const success = Math.random() > 0.1; // 90% de chance de sucesso
  
  return {
    success,
    message: success 
      ? `Conexão IMAP estabelecida com ${config.host}:${config.port}` 
      : `Falha ao conectar com servidor IMAP: credenciais inválidas`
  };
}

// Busca emails da caixa de entrada
export async function fetchEmails(config: ImapConfig): Promise<EmailMessage[]> {
  // Numa implementação real, conectaríamos ao servidor IMAP e buscaríamos emails
  
  // Simulando um número aleatório de emails não lidos
  const emailCount = Math.floor(Math.random() * 5); // 0-4 emails
  const result: EmailMessage[] = [];
  
  for (let i = 0; i < emailCount; i++) {
    result.push(generateRandomEmail());
  }
  
  return result;
}

// Verifica se um email específico recebeu resposta
export async function checkReplies(config: ImapConfig & { messageId: string, subject: string }): Promise<ReplyCheckResult> {
  // Em uma implementação real, buscaríamos no servidor IMAP por emails
  // que são respostas ao messageId e subject fornecidos
  
  // Simulando uma chance aleatória de resposta
  const hasReply = Math.random() > 0.7; // 30% de chance de ter resposta
  
  if (hasReply) {
    return {
      found: true,
      details: {
        subject: `Re: ${config.subject}`,
        from: `usuario.seed@exemplo.com`,
        date: new Date()
      }
    };
  }
  
  return { found: false };
}

// Marca um email como lido
export async function markAsRead(config: ImapConfig, messageId: string): Promise<boolean> {
  // Numa implementação real, conectaríamos ao servidor IMAP e marcaríamos o email como lido
  
  // Simulando sucesso
  return true;
}

// Gera um email aleatório para simulação
function generateRandomEmail(): EmailMessage {
  const subjects = [
    "Proposta comercial interessante",
    "Vamos agendar uma reunião?",
    "Resposta ao seu contato",
    "Informações solicitadas",
    "Confirmação de recebimento"
  ];
  
  const senders = [
    "contato@empresa.com.br",
    "marketing@negocio.com",
    "suporte@servico.com.br",
    "vendas@loja.com",
    "noreply@plataforma.com"
  ];
  
  // Gerando ID único
  const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    messageId: `<${randomId}@mail.exemplo.com>`,
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    from: senders[Math.floor(Math.random() * senders.length)],
    to: "usuario@dominio.com",
    body: `Olá,\n\nEste é um email de teste gerado pelo simulador IMAP.\n\nAtenciosamente,\nEquipe de Testes`,
    date: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // Até 24h atrás
    read: false
  };
} 
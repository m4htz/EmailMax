// Simulador de SMTP para testes de desenvolvimento
// Numa implementação real, usaríamos uma biblioteca SMTP real como Nodemailer

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
}

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  message: string;
  sentAt?: Date;
}

interface ConnectionResult {
  success: boolean;
  message: string;
}

// Testa conexão com servidor SMTP
export async function testConnection(config: SmtpConfig): Promise<ConnectionResult> {
  // Numa implementação real, tentaríamos estabelecer uma conexão SMTP
  // e verificar autenticação

  // Simulando sucesso na maioria das vezes, falha ocasional
  const success = Math.random() > 0.05; // 95% de chance de sucesso
  
  return {
    success,
    message: success 
      ? `Conexão SMTP estabelecida com ${config.host}:${config.port}` 
      : `Falha ao conectar com servidor SMTP: porta incorreta ou bloqueada`
  };
}

// Envia um email
export async function sendEmail(
  config: SmtpConfig & EmailData
): Promise<SendResult> {
  // Numa implementação real, conectaríamos ao servidor SMTP e enviaríamos o email

  // Gera ID de mensagem único se não fornecido
  const messageId = config.messageId || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  // Simula taxa de sucesso com falhas ocasionais
  const success = Math.random() > 0.03; // 97% de chance de sucesso
  
  // Simula um atraso de rede (100-500ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  
  if (success) {
    return {
      success: true,
      messageId: `<${messageId}@${config.host}>`,
      message: `Email enviado com sucesso para ${config.to}`,
      sentAt: new Date()
    };
  } else {
    return {
      success: false,
      message: getRandomErrorMessage(),
    };
  }
}

// Envia email em massa (para múltiplos destinatários)
export async function sendBulkEmails(
  config: SmtpConfig,
  emailDataList: EmailData[]
): Promise<SendResult[]> {
  // Array para armazenar os resultados
  const results: SendResult[] = [];
  
  // Processa cada email individualmente
  for (const emailData of emailDataList) {
    const result = await sendEmail({
      ...config,
      ...emailData
    });
    
    results.push(result);
    
    // Adiciona um atraso entre envios para simular comportamento humano
    // e evitar aparência de spam
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800));
  }
  
  return results;
}

// Verifica status da fila de emails
export async function checkQueue(config: SmtpConfig): Promise<number> {
  // Numa implementação real, verificaríamos o status da fila de emails
  // no servidor SMTP
  
  // Simula um número aleatório de emails na fila
  return Math.floor(Math.random() * 3);
}

// Gera mensagens de erro aleatórias para simulação
function getRandomErrorMessage(): string {
  const errors = [
    "Tempo limite de conexão excedido",
    "Falha na autenticação SMTP",
    "Destinatário rejeitado pelo servidor",
    "Quota de envio excedida",
    "Endereço de email inválido"
  ];
  
  return errors[Math.floor(Math.random() * errors.length)];
} 
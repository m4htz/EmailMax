import nodemailer from 'nodemailer';
import { SmtpConnection } from './smtp-connection';
import { EmailCredentials } from './email-connection';

// Estender a interface SendMailOptions para incluir nossas propriedades personalizadas
export interface ExtendedSendMailOptions extends nodemailer.SendMailOptions {
  _credentials?: EmailCredentials;
  auth?: {
    user: string;
    pass: string;
  };
}

// Interfaces para a fila SMTP
export interface QueuedEmail {
  id: string;
  options: ExtendedSendMailOptions;
  priority: number;
  addedAt: Date;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  error?: string;
}

export interface SmtpQueueOptions {
  maxConcurrent?: number;
  rateLimit?: {
    maxEmails: number;
    perInterval: number; // em milissegundos
  };
  retryOptions?: {
    maxAttempts: number;
    retryDelays: number[]; // em milissegundos, cada posição representa o atraso após 1ª, 2ª, ... falhas
  };
  debug?: boolean;
}

export interface QueueStats {
  waiting: number;
  sending: number;
  total: number;
  successful: number;
  failed: number;
  rateLimit: {
    emailsSent: number;
    maxEmails: number;
    interval: number;
    resetAt: Date;
  };
}

/**
 * Sistema de fila para envio de emails com controle de taxa
 */
export class SmtpQueue {
  private static instance: SmtpQueue;
  private waitingQueue: QueuedEmail[] = [];
  private sendingEmails: Map<string, QueuedEmail> = new Map();
  private connections: Map<string, SmtpConnection> = new Map();
  private processingQueue: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private successful: number = 0;
  private failed: number = 0;
  
  // Configuração de controle de taxa
  private maxConcurrent: number;
  private rateLimit: {
    maxEmails: number;
    perInterval: number;
    sent: number;
    lastReset: Date;
  };
  
  // Configuração de tentativas
  private retryOptions: {
    maxAttempts: number;
    retryDelays: number[];
  };
  
  private debug: boolean;

  /**
   * Cria uma instância da fila de envio SMTP
   */
  private constructor(options: SmtpQueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 5;
    this.rateLimit = {
      maxEmails: options.rateLimit?.maxEmails || 100,
      perInterval: options.rateLimit?.perInterval || 60000, // 1 minuto padrão
      sent: 0,
      lastReset: new Date()
    };
    this.retryOptions = {
      maxAttempts: options.retryOptions?.maxAttempts || 3,
      retryDelays: options.retryOptions?.retryDelays || [30000, 60000, 120000] // 30s, 1min, 2min
    };
    this.debug = options.debug || false;
    
    // Iniciar o processamento da fila
    this.startQueueProcessor();
  }

  /**
   * Obtém uma instância única da fila (Singleton)
   */
  public static getInstance(options?: SmtpQueueOptions): SmtpQueue {
    if (!SmtpQueue.instance) {
      SmtpQueue.instance = new SmtpQueue(options);
    }
    return SmtpQueue.instance;
  }

  /**
   * Gera uma chave única para identificar uma conexão
   */
  private getConnectionKey(credentials: EmailCredentials): string {
    return `${credentials.email}@${credentials.smtpHost}:${credentials.smtpPort}`;
  }

  /**
   * Obtém ou cria uma conexão SMTP
   */
  private getConnection(credentials: EmailCredentials): SmtpConnection {
    const key = this.getConnectionKey(credentials);
    
    if (!this.connections.has(key)) {
      const connection = new SmtpConnection(credentials, this.debug);
      this.connections.set(key, connection);
      return connection;
    }
    
    return this.connections.get(key)!;
  }

  /**
   * Inicia o processador de fila
   */
  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // Verificar a fila a cada segundo
  }

  /**
   * Processa a fila de emails
   */
  private async processQueue(): Promise<void> {
    // Verifica se já está processando
    if (this.processingQueue) {
      return;
    }
    
    // Verifica se a fila está vazia
    if (this.waitingQueue.length === 0) {
      return;
    }
    
    // Verifica se já atingiu o limite de emails sendo enviados simultaneamente
    if (this.sendingEmails.size >= this.maxConcurrent) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      // Resetar contador de limite de taxa se necessário
      this.checkRateLimit();
      
      // Enviar emails até atingir o limite
      while (
        this.waitingQueue.length > 0 && 
        this.sendingEmails.size < this.maxConcurrent &&
        this.rateLimit.sent < this.rateLimit.maxEmails
      ) {
        // Ordenar a fila por prioridade e depois por tempo de adição
        this.waitingQueue.sort((a, b) => {
          // Prioridade mais alta primeiro (número menor = maior prioridade)
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Mais antigo primeiro
          return a.addedAt.getTime() - b.addedAt.getTime();
        });
        
        // Pegar o próximo email
        const email = this.waitingQueue.shift();
        if (!email) continue;
        
        // Marcar como em processamento
        this.sendingEmails.set(email.id, email);
        
        // Processar o envio de forma assíncrona
        this.sendEmail(email)
          .then((result) => {
            if (result.success) {
              this.successful++;
              this.rateLimit.sent++;
              if (this.debug) {
                console.log(`[SMTP Queue] Email enviado: ${email.id} para ${email.options.to}`);
              }
            } else if (email.attempts < email.maxAttempts) {
              // Adicionar de volta à fila para uma nova tentativa
              const delay = this.retryOptions.retryDelays[email.attempts - 1] || 60000;
              setTimeout(() => {
                email.attempts++;
                email.lastAttempt = new Date();
                email.error = result.message;
                this.waitingQueue.push(email);
                if (this.debug) {
                  console.log(`[SMTP Queue] Email agendado para nova tentativa: ${email.id}`);
                }
              }, delay);
            } else {
              this.failed++;
              if (this.debug) {
                console.log(`[SMTP Queue] Falha permanente: ${email.id} - ${result.message}`);
              }
            }
          })
          .finally(() => {
            // Remover da lista de emails sendo enviados
            this.sendingEmails.delete(email.id);
          });
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Verifica e atualiza o limite de taxa
   */
  private checkRateLimit(): void {
    const now = new Date();
    const elapsed = now.getTime() - this.rateLimit.lastReset.getTime();
    
    // Resetar contador se o intervalo passou
    if (elapsed >= this.rateLimit.perInterval) {
      if (this.debug && this.rateLimit.sent > 0) {
        console.log(`[SMTP Queue] Resetando contador de taxa: ${this.rateLimit.sent} emails enviados no último intervalo`);
      }
      
      this.rateLimit.sent = 0;
      this.rateLimit.lastReset = now;
    }
  }

  /**
   * Envia um email
   */
  private async sendEmail(email: QueuedEmail): Promise<{
    success: boolean;
    message?: string;
  }> {
    // Verificar se temos as informações de credenciais nos metadados
    if (!email.options.auth && !email.options._credentials) {
      return {
        success: false,
        message: 'Credenciais não especificadas para o envio'
      };
    }
    
    try {
      // Extrair credenciais dos metadados
      const credentials = email.options._credentials as EmailCredentials;
      const options = { ...email.options };
      
      // Remover propriedade personalizada antes de enviar
      delete options._credentials;
      
      // Obter conexão
      const connection = this.getConnection(credentials);
      
      // Enviar email
      const result = await connection.sendMail(options);
      
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`
      };
    }
  }

  /**
   * Adiciona um email à fila
   */
  public async addToQueue(
    options: ExtendedSendMailOptions,
    priority: number = 5, // 1 (mais alta) a 10 (mais baixa), padrão 5
    maxAttempts: number = this.retryOptions.maxAttempts
  ): Promise<{
    success: boolean;
    id?: string;
    message: string;
  }> {
    try {
      // Verificar credenciais
      if (!options.auth && !options._credentials) {
        return {
          success: false,
          message: 'Credenciais não especificadas para o envio'
        };
      }
      
      // Gerar ID único para o email
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Criar o objeto de email enfileirado
      const queuedEmail: QueuedEmail = {
        id,
        options,
        priority: Math.max(1, Math.min(10, priority)), // Limitar entre 1 e 10
        addedAt: new Date(),
        attempts: 0,
        maxAttempts
      };
      
      // Adicionar à fila
      this.waitingQueue.push(queuedEmail);
      
      if (this.debug) {
        console.log(`[SMTP Queue] Email adicionado à fila: ${id}`);
      }
      
      // Processar a fila imediatamente
      this.processQueue();
      
      return {
        success: true,
        id,
        message: 'Email adicionado à fila com sucesso'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao adicionar email à fila: ${error.message}`
      };
    }
  }

  /**
   * Retorna estatísticas da fila
   */
  public getStats(): QueueStats {
    return {
      waiting: this.waitingQueue.length,
      sending: this.sendingEmails.size,
      total: this.waitingQueue.length + this.sendingEmails.size,
      successful: this.successful,
      failed: this.failed,
      rateLimit: {
        emailsSent: this.rateLimit.sent,
        maxEmails: this.rateLimit.maxEmails,
        interval: this.rateLimit.perInterval,
        resetAt: new Date(this.rateLimit.lastReset.getTime() + this.rateLimit.perInterval)
      }
    };
  }

  /**
   * Limpa a fila
   */
  public clearQueue(): void {
    this.waitingQueue = [];
    
    if (this.debug) {
      console.log(`[SMTP Queue] Fila limpa`);
    }
  }

  /**
   * Para o processamento da fila
   */
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.debug) {
      console.log(`[SMTP Queue] Processamento parado`);
    }
  }

  /**
   * Libera recursos
   */
  public dispose(): void {
    this.stopProcessing();
    
    // Fechar todas as conexões
    this.connections.forEach((connection) => {
      connection.close();
    });
    this.connections.clear();
    
    if (this.debug) {
      console.log(`[SMTP Queue] Recurso liberado`);
    }
  }
} 
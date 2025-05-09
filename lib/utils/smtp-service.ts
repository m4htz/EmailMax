import nodemailer from 'nodemailer';
import { SmtpConnection } from './smtp-connection';
import { SmtpQueue, SmtpQueueOptions } from './smtp-queue';
import { EmailCredentials, TestConnectionResult } from './email-connection';
import { getSecureCredential, CredentialType } from './secure-storage';
import { createClient } from '@/lib/supabase/client';

// Interface estendida para incluir propriedades personalizadas
interface ExtendedSendMailOptions extends nodemailer.SendMailOptions {
  _credentials?: EmailCredentials;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    cid?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  message: string;
  queueId?: string;
}

/**
 * Serviço de envio de emails SMTP
 * 
 * Oferece uma API simplificada para envio de emails com suporte a:
 * - Envio direto ou enfileirado
 * - Controle de taxa de envio
 * - Recuperação automática de credenciais armazenadas
 * - Controle de prioridade
 */
export class SmtpService {
  private static instance: SmtpService;
  private queue: SmtpQueue;
  private debug: boolean;

  /**
   * Cria uma instância do serviço SMTP
   */
  private constructor(queueOptions?: SmtpQueueOptions, debug: boolean = false) {
    this.queue = SmtpQueue.getInstance(queueOptions);
    this.debug = debug;
  }

  /**
   * Obtém uma instância única do serviço (Singleton)
   */
  public static getInstance(queueOptions?: SmtpQueueOptions, debug: boolean = false): SmtpService {
    if (!SmtpService.instance) {
      SmtpService.instance = new SmtpService(queueOptions, debug);
    }
    return SmtpService.instance;
  }

  /**
   * Converte prioridade textual para numérica
   */
  private convertPriority(priority?: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high': return 1;
      case 'low': return 9;
      case 'normal':
      default: return 5;
    }
  }

  /**
   * Envia um email diretamente (sem enfileirar)
   */
  public async sendDirect(
    credentials: EmailCredentials,
    options: EmailOptions
  ): Promise<SendEmailResult> {
    try {
      // Criar conexão SMTP
      const connection = new SmtpConnection(credentials, this.debug);
      
      // Verificar conexão
      const connectionResult = await connection.connect();
      if (!connectionResult.success) {
        return {
          success: false,
          message: connectionResult.message || 'Falha ao conectar ao servidor SMTP'
        };
      }
      
      // Converter opções para formato Nodemailer
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.headers?.['from'] || credentials.email,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(',') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        headers: options.headers,
        priority: options.priority
      };
      
      // Enviar email
      const result = await connection.sendMail(mailOptions);
      
      // Fechar conexão após uso
      connection.close();
      
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`
      };
    }
  }

  /**
   * Envia um email através da fila (com controle de taxa)
   */
  public async sendQueued(
    credentials: EmailCredentials,
    options: EmailOptions
  ): Promise<SendEmailResult> {
    try {
      // Converter opções para formato Nodemailer estendido
      const mailOptions: ExtendedSendMailOptions = {
        from: options.headers?.['from'] || credentials.email,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(',') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        headers: options.headers,
        priority: options.priority,
        // Adicionar credenciais como metadados
        _credentials: credentials
      };
      
      // Adicionar à fila com prioridade adequada
      const queueResult = await this.queue.addToQueue(
        mailOptions,
        this.convertPriority(options.priority)
      );
      
      if (!queueResult.success) {
        return {
          success: false,
          message: queueResult.message
        };
      }
      
      return {
        success: true,
        queueId: queueResult.id,
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
   * Envia um email usando credenciais armazenadas no Vault
   */
  public async sendWithStoredCredentials(
    userId: string,
    accountId: string,
    options: EmailOptions,
    useQueue: boolean = true
  ): Promise<SendEmailResult> {
    try {
      const supabase = createClient();
      
      // 1. Obter os dados da conta
      const { data: account, error: accountError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();
      
      if (accountError || !account) {
        return {
          success: false,
          message: 'Conta de email não encontrada ou acesso negado'
        };
      }
      
      // 2. Obter as credenciais armazenadas no vault
      const password = await getSecureCredential(
        userId,
        accountId,
        CredentialType.EMAIL_PASSWORD
      );
      
      if (!password) {
        return {
          success: false,
          message: 'Credenciais não encontradas'
        };
      }
      
      // 3. Criar objeto de credenciais
      const credentials: EmailCredentials = {
        email: account.email,
        password,
        imapHost: account.imap_host,
        imapPort: account.imap_port,
        smtpHost: account.smtp_host,
        smtpPort: account.smtp_port
      };
      
      // 4. Enviar email
      if (useQueue) {
        return await this.sendQueued(credentials, options);
      } else {
        return await this.sendDirect(credentials, options);
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`
      };
    }
  }

  /**
   * Testa a conexão SMTP com as credenciais fornecidas
   */
  public async testConnection(credentials: EmailCredentials): Promise<TestConnectionResult> {
    try {
      // Criar conexão SMTP
      const connection = new SmtpConnection(credentials);
      
      // Testar conexão
      const result = await connection.connect();
      
      // Fechar conexão
      connection.close();
      
      return {
        success: result.success,
        message: result.message,
        details: {
          smtp: {
            success: result.success,
            message: result.message
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao testar conexão SMTP: ${error.message}`,
        details: {
          smtp: {
            success: false,
            message: error.message
          }
        }
      };
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  public getQueueStats() {
    return this.queue.getStats();
  }

  /**
   * Limpa a fila
   */
  public clearQueue() {
    this.queue.clearQueue();
  }
} 
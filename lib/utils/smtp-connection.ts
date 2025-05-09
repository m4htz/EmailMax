import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/client';
import { getSecureCredential, CredentialType } from '@/lib/utils/secure-storage';
import { EmailCredentials } from '@/lib/utils/email-connection';

// Tipagem para o cliente Nodemailer
type NodemailerTransporter = nodemailer.Transporter;

export interface SmtpConnectionOptions {
  auth?: {
    user: string;
    pass: string;
  };
  host: string;
  port: number;
  secure?: boolean;
  tls?: {
    rejectUnauthorized: boolean;
  };
  debug?: boolean;
}

export interface SmtpConnectionResult {
  success: boolean;
  message?: string;
}

/**
 * Gerenciador de conexão SMTP
 * Implementa conexões seguras utilizando nodemailer com suporte a TLS/SSL
 */
export class SmtpConnection {
  private transporter: NodemailerTransporter | null = null;
  private options: SmtpConnectionOptions;
  private connected: boolean = false;
  private connectionPromise: Promise<SmtpConnectionResult> | null = null;

  /**
   * Cria uma nova instância de conexão SMTP
   */
  constructor(credentials: EmailCredentials, debug: boolean = false) {
    this.options = {
      host: credentials.smtpHost,
      port: credentials.smtpPort,
      secure: credentials.smtpPort === 465, // true para porta 465, false para outras
      auth: {
        user: credentials.email,
        pass: credentials.password
      },
      tls: {
        rejectUnauthorized: false // Em produção, considerar mudar para true
      }
    };

    if (debug) {
      this.options.debug = true;
    }
  }

  /**
   * Conecta ao servidor SMTP
   */
  async connect(): Promise<SmtpConnectionResult> {
    // Se já temos uma conexão em andamento, retornar a promessa existente
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Se já conectado, retornar sucesso
    if (this.connected && this.transporter) {
      return { success: true, message: 'Já conectado ao servidor SMTP' };
    }

    // Criar nova promessa de conexão
    this.connectionPromise = new Promise<SmtpConnectionResult>(async (resolve) => {
      try {
        // Criar transportador nodemailer
        this.transporter = nodemailer.createTransport(this.options);

        // Verificar conexão
        await this.transporter.verify();
        this.connected = true;

        resolve({ 
          success: true, 
          message: `Conexão SMTP estabelecida com ${this.options.host}:${this.options.port}` 
        });
      } catch (error: any) {
        this.connected = false;
        this.transporter = null;

        resolve({ 
          success: false, 
          message: `Erro ao conectar ao servidor SMTP: ${error.message}` 
        });
      } finally {
        // Limpar promessa
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connected && this.transporter !== null;
  }

  /**
   * Fecha a conexão
   */
  close(): void {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.connected = false;
    }
  }

  /**
   * Envia um email
   */
  async sendMail(mailOptions: nodemailer.SendMailOptions): Promise<{
    success: boolean;
    messageId?: string;
    message: string;
  }> {
    try {
      // Verifica se está conectado
      if (!this.isConnected()) {
        const connectionResult = await this.connect();
        if (!connectionResult.success) {
          return {
            success: false,
            message: connectionResult.message || 'Falha ao conectar ao servidor SMTP'
          };
        }
      }

      if (!this.transporter) {
        throw new Error('Transportador SMTP não inicializado');
      }

      // Envia email
      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        message: `Email enviado com sucesso para ${mailOptions.to}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`
      };
    }
  }
} 
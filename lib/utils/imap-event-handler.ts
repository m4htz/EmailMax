import { ImapConnection } from './imap-connection';
import { EmailCredentials } from './email-connection';
import { ImapConnectionPool } from './imap-connection-pool';
import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/client';
import { getSecureCredential, CredentialType } from '@/lib/utils/secure-storage';

// Tipos de eventos suportados
export enum ImapEventType {
  NEW_MESSAGE = 'newMessage',
  MESSAGE_DELETED = 'messageDeleted',
  MESSAGE_FLAGGED = 'messageFlagged',
  CONNECTION_ERROR = 'connectionError',
  CONNECTION_CLOSED = 'connectionClosed'
}

// Estrutura de eventos de mensagem
export interface ImapMessageEvent {
  mailbox: string;
  uid?: number;
  messageId?: string;
  flags?: string[];
  subject?: string;
  from?: string;
  to?: string[];
  date?: Date;
}

// Interface para ouvintes de eventos
interface ImapEventListenerOptions {
  mailbox?: string;
  idleTimeout?: number;
  reconnectInterval?: number;
  debug?: boolean;
}

/**
 * Gerenciador de eventos IMAP
 * 
 * Implementa mecanismos para escutar eventos importantes, como:
 * - Chegada de novas mensagens
 * - Deleção de mensagens
 * - Alterações em flags de mensagens
 * - Erros de conexão
 */
export class ImapEventHandler extends EventEmitter {
  private pool: ImapConnectionPool;
  private credentials: EmailCredentials;
  private connection: ImapConnection | null = null;
  private isConnected: boolean = false;
  private isListening: boolean = false;
  private currentMailbox: string = 'INBOX';
  private idleTimeout: number;
  private reconnectInterval: number;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private debug: boolean;

  /**
   * Cria uma nova instância do gerenciador de eventos IMAP
   */
  constructor(credentials: EmailCredentials, options: ImapEventListenerOptions = {}) {
    super();
    this.credentials = credentials;
    this.pool = ImapConnectionPool.getInstance();
    this.currentMailbox = options.mailbox || 'INBOX';
    this.idleTimeout = options.idleTimeout || 10 * 60 * 1000; // 10 minutos
    this.reconnectInterval = options.reconnectInterval || 30000; // 30 segundos
    this.debug = options.debug || false;
  }

  /**
   * Inicia o monitoramento de eventos IMAP
   */
  async startListening(): Promise<{ success: boolean; error?: string }> {
    if (this.isListening) {
      return { success: true };
    }

    try {
      // Obter uma conexão dedicada para eventos
      // Não usamos o pool aqui para manter uma conexão persistente
      const connection = new ImapConnection(this.credentials, this.debug);
      const connectionResult = await connection.connect();
      
      if (!connectionResult.success) {
        return { success: false, error: connectionResult.message || 'Falha ao conectar ao servidor IMAP' };
      }
      
      this.connection = connection;
      this.isConnected = true;
      this.isListening = true;
      
      // Configurar monitoramento inicial
      await this.setupMailboxMonitoring();
      
      if (this.debug) {
        console.log(`[IMAP EVENT] Iniciado monitoramento de eventos para ${this.credentials.email} em ${this.currentMailbox}`);
      }
      
      return { success: true };
    } catch (error: any) {
      this.isListening = false;
      this.isConnected = false;
      
      if (this.debug) {
        console.error('[IMAP EVENT] Erro ao iniciar monitoramento:', error);
      }
      
      return { success: false, error: `Erro ao iniciar monitoramento: ${error.message}` };
    }
  }

  /**
   * Para o monitoramento de eventos IMAP
   */
  stopListening(): void {
    this.isListening = false;
    
    // Limpar timers
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Fechar conexão
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    
    this.isConnected = false;
    
    if (this.debug) {
      console.log(`[IMAP EVENT] Monitoramento parado para ${this.credentials.email}`);
    }
    
    // Emitir evento de conexão fechada
    this.emit(ImapEventType.CONNECTION_CLOSED, {
      email: this.credentials.email,
      timestamp: new Date()
    });
  }

  /**
   * Configurar monitoramento de caixa de email
   */
  private async setupMailboxMonitoring(): Promise<void> {
    if (!this.connection || !this.isConnected || !this.isListening) {
      return;
    }
    
    try {
      // Abrir caixa de email para monitoramento
      const mailboxResult = await this.connection.openMailbox(this.currentMailbox, true);
      
      if (!mailboxResult.success) {
        throw new Error(mailboxResult.message || `Erro ao abrir caixa ${this.currentMailbox}`);
      }
      
      // Buscar UIDs de mensagens atuais para comparação
      const searchResult = await this.connection.searchMessages(['ALL']);
      
      if (!searchResult.success) {
        throw new Error(searchResult.message || 'Erro ao buscar mensagens existentes');
      }
      
      // Iniciar ciclo de polling para verificar mudanças
      this.startIdleCycle();
      
    } catch (error: any) {
      if (this.debug) {
        console.error('[IMAP EVENT] Erro ao configurar monitoramento:', error);
      }
      
      // Emitir evento de erro
      this.emit(ImapEventType.CONNECTION_ERROR, {
        error: error.message,
        email: this.credentials.email,
        timestamp: new Date()
      });
      
      // Agendar reconexão
      this.scheduleReconnect();
    }
  }

  /**
   * Inicia um ciclo de polling para detectar mudanças na caixa de email
   */
  private startIdleCycle(): void {
    if (!this.isListening) {
      return;
    }
    
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    
    // Timeout para revalidar conexão periodicamente
    this.idleTimer = setTimeout(async () => {
      try {
        if (!this.connection || !this.isConnected || !this.isListening) {
          return;
        }
        
        // Verificar novas mensagens
        await this.checkForNewMessages();
        
        // Reiniciar ciclo
        this.startIdleCycle();
        
      } catch (error: any) {
        if (this.debug) {
          console.error('[IMAP EVENT] Erro durante ciclo IDLE:', error);
        }
        
        // Emitir evento de erro
        this.emit(ImapEventType.CONNECTION_ERROR, {
          error: error.message,
          email: this.credentials.email,
          timestamp: new Date()
        });
        
        // Agendar reconexão
        this.scheduleReconnect();
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  /**
   * Verifica se há novas mensagens ou alterações na caixa de email
   */
  private async checkForNewMessages(): Promise<void> {
    if (!this.connection || !this.isConnected || !this.isListening) {
      return;
    }
    
    try {
      // Verificar novas mensagens (não lidas)
      const searchResult = await this.connection.searchMessages(['UNSEEN']);
      
      if (!searchResult.success || !searchResult.messages) {
        return;
      }
      
      // Processar mensagens não lidas
      for (const message of searchResult.messages) {
        // Verificar se a mensagem possui cabeçalhos básicos
        if (message.headers && message.uid) {
          const event: ImapMessageEvent = {
            mailbox: this.currentMailbox,
            uid: message.uid,
            messageId: message.headers['message-id'] ? message.headers['message-id'][0] : undefined,
            subject: message.headers.subject ? message.headers.subject[0] : undefined,
            from: message.headers.from ? message.headers.from[0] : undefined,
            to: message.headers.to,
            date: message.headers.date ? new Date(message.headers.date[0]) : new Date(),
            flags: message.flags
          };
          
          // Emitir evento de nova mensagem
          this.emit(ImapEventType.NEW_MESSAGE, event);
          
          if (this.debug) {
            console.log(`[IMAP EVENT] Nova mensagem detectada: ${event.subject}`);
          }
        }
      }
      
      // Verificar alterações em flags
      await this.checkFlagChanges();
      
      // Verificar mensagens excluídas
      await this.checkDeletedMessages();
      
    } catch (error: any) {
      if (this.debug) {
        console.error('[IMAP EVENT] Erro ao verificar novas mensagens:', error);
      }
      
      throw error;
    }
  }
  
  /**
   * Verifica alterações em flags de mensagens (lidas, sinalizadas, etc.)
   */
  private async checkFlagChanges(): Promise<void> {
    if (!this.connection || !this.isConnected || !this.isListening) {
      return;
    }
    
    try {
      // Buscar mensagens com flags específicas para monitoramento (ex: recentemente sinalizadas)
      const flaggedResult = await this.connection.searchMessages(['FLAGGED']);
      
      if (!flaggedResult.success || !flaggedResult.messages) {
        return;
      }
      
      // Identificar mensagens que foram recentemente sinalizadas
      // e emitir eventos correspondentes
      for (const message of flaggedResult.messages) {
        // Verificar se a mensagem possui UID e flags
        if (message.uid && message.flags) {
          const event: ImapMessageEvent = {
            mailbox: this.currentMailbox,
            uid: message.uid,
            messageId: message.headers?.['message-id'] ? message.headers['message-id'][0] : undefined,
            subject: message.headers?.subject ? message.headers.subject[0] : undefined,
            flags: message.flags
          };
          
          // Emitir evento de mensagem sinalizada
          this.emit(ImapEventType.MESSAGE_FLAGGED, event);
          
          if (this.debug) {
            console.log(`[IMAP EVENT] Alteração de flags detectada: UID ${message.uid}, Flags: ${message.flags.join(',')}`);
          }
        }
      }
    } catch (error: any) {
      if (this.debug) {
        console.error('[IMAP EVENT] Erro ao verificar alterações de flags:', error);
      }
      
      // Não lançar erro para não interromper o ciclo de verificação
    }
  }
  
  /**
   * Verifica mensagens excluídas da caixa de email
   */
  private async checkDeletedMessages(): Promise<void> {
    if (!this.connection || !this.isConnected || !this.isListening) {
      return;
    }
    
    try {
      // Verificar mensagens marcadas para exclusão (flag \Deleted)
      const deletedResult = await this.connection.searchMessages([['DELETED']]);
      
      if (!deletedResult.success || !deletedResult.messages) {
        return;
      }
      
      for (const message of deletedResult.messages) {
        if (message.uid) {
          const event: ImapMessageEvent = {
            mailbox: this.currentMailbox,
            uid: message.uid,
            messageId: message.headers?.['message-id'] ? message.headers['message-id'][0] : undefined,
            subject: message.headers?.subject ? message.headers.subject[0] : undefined
          };
          
          // Emitir evento de mensagem excluída
          this.emit(ImapEventType.MESSAGE_DELETED, event);
          
          if (this.debug) {
            console.log(`[IMAP EVENT] Mensagem marcada para exclusão: UID ${message.uid}`);
          }
        }
      }
    } catch (error: any) {
      if (this.debug) {
        console.error('[IMAP EVENT] Erro ao verificar mensagens excluídas:', error);
      }
      
      // Não lançar erro para não interromper o ciclo de verificação
    }
  }

  /**
   * Agenda reconexão em caso de falha na conexão
   */
  private scheduleReconnect(): void {
    if (!this.isListening) {
      return;
    }
    
    // Limpar timers existentes
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    
    // Fechar conexão atual se existir
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    
    this.isConnected = false;
    
    // Apenas agendar reconexão se ainda estivermos no modo de escuta
    if (this.isListening) {
      this.reconnectTimer = setTimeout(async () => {
        if (this.debug) {
          console.log(`[IMAP EVENT] Tentando reconectar para ${this.credentials.email}`);
        }
        
        try {
          // Criar nova conexão
          const connection = new ImapConnection(this.credentials, this.debug);
          const connectionResult = await connection.connect();
          
          if (!connectionResult.success) {
            throw new Error(connectionResult.message || 'Falha ao reconectar');
          }
          
          this.connection = connection;
          this.isConnected = true;
          
          // Reconfigura monitoramento
          await this.setupMailboxMonitoring();
          
          if (this.debug) {
            console.log(`[IMAP EVENT] Reconectado com sucesso para ${this.credentials.email}`);
          }
        } catch (error: any) {
          if (this.debug) {
            console.error('[IMAP EVENT] Falha ao reconectar:', error);
          }
          
          // Emitir evento de erro de conexão
          this.emit(ImapEventType.CONNECTION_ERROR, {
            error: error.message,
            email: this.credentials.email,
            timestamp: new Date()
          });
          
          // Tentar novamente
          this.scheduleReconnect();
        }
      }, this.reconnectInterval);
    }
  }

  /**
   * Troca a caixa de email monitorada
   */
  async changeMailbox(mailbox: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isListening) {
      return { success: false, error: 'Monitoramento não está ativo' };
    }
    
    // Parar ciclo atual
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    
    // Guardar caixa atual
    const previousMailbox = this.currentMailbox;
    this.currentMailbox = mailbox;
    
    if (!this.isConnected || !this.connection) {
      return { success: false, error: 'Não conectado ao servidor IMAP' };
    }
    
    try {
      // Abrir nova caixa
      const mailboxResult = await this.connection.openMailbox(mailbox, true);
      
      if (!mailboxResult.success) {
        // Reverter para caixa anterior em caso de falha
        this.currentMailbox = previousMailbox;
        return { success: false, error: mailboxResult.message || `Erro ao abrir caixa ${mailbox}` };
      }
      
      // Reiniciar ciclo de monitoramento
      this.startIdleCycle();
      
      if (this.debug) {
        console.log(`[IMAP EVENT] Caixa monitorada alterada para ${mailbox}`);
      }
      
      return { success: true };
    } catch (error: any) {
      // Reverter para caixa anterior em caso de erro
      this.currentMailbox = previousMailbox;
      
      if (this.debug) {
        console.error(`[IMAP EVENT] Erro ao trocar para caixa ${mailbox}:`, error);
      }
      
      return { success: false, error: `Erro ao trocar caixa: ${error.message}` };
    }
  }

  /**
   * Cria um manipulador de eventos a partir de credenciais armazenadas
   */
  static async createFromStoredCredentials(
    userId: string, 
    accountId: string, 
    options: ImapEventListenerOptions = {}
  ): Promise<{ handler?: ImapEventHandler; error?: string }> {
    try {
      const supabase = createClient();
      
      // Obter dados da conta
      const { data: account, error: accountError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();
      
      if (accountError || !account) {
        return { error: 'Conta de email não encontrada ou acesso negado' };
      }
      
      // Obter senha do vault
      const password = await getSecureCredential(
        userId,
        accountId,
        CredentialType.EMAIL_PASSWORD
      );
      
      if (!password) {
        return { error: 'Credenciais não encontradas' };
      }
      
      // Criar manipulador de eventos
      const handler = new ImapEventHandler({
        email: account.email,
        password,
        imapHost: account.imap_host,
        imapPort: account.imap_port,
        smtpHost: account.smtp_host,
        smtpPort: account.smtp_port
      }, options);
      
      return { handler };
    } catch (error: any) {
      return { error: `Erro ao criar manipulador de eventos IMAP: ${error.message}` };
    }
  }
  
  /**
   * Registra um ouvinte para novos emails
   */
  onNewMessage(callback: (event: ImapMessageEvent) => void): this {
    return this.on(ImapEventType.NEW_MESSAGE, callback);
  }
  
  /**
   * Registra um ouvinte para emails excluídos
   */
  onMessageDeleted(callback: (event: ImapMessageEvent) => void): this {
    return this.on(ImapEventType.MESSAGE_DELETED, callback);
  }
  
  /**
   * Registra um ouvinte para alterações de flags em emails
   */
  onMessageFlagged(callback: (event: ImapMessageEvent) => void): this {
    return this.on(ImapEventType.MESSAGE_FLAGGED, callback);
  }
  
  /**
   * Registra um ouvinte para erros de conexão
   */
  onConnectionError(callback: (event: { error: string; email: string; timestamp: Date }) => void): this {
    return this.on(ImapEventType.CONNECTION_ERROR, callback);
  }
  
  /**
   * Registra um ouvinte para eventos de fechamento de conexão
   */
  onConnectionClosed(callback: (event: { email: string; timestamp: Date }) => void): this {
    return this.on(ImapEventType.CONNECTION_CLOSED, callback);
  }
} 
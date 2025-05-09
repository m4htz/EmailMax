import * as IMAP from 'node-imap';
import { createClient } from '@/lib/supabase/client';
import { getSecureCredential, CredentialType } from '@/lib/utils/secure-storage';
import { EmailCredentials } from '@/lib/utils/email-connection';

// Tipagem correta para o IMAP constructor
type ImapClient = typeof IMAP.prototype;

interface ImapConnectionOptions {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
  debug?: (info: string) => void;
}

interface ImapMailboxInfo {
  name: string;
  messages: {
    total: number;
    new: number;
    unseen: number;
  };
  flags: string[];
}

interface ImapConnectionResult {
  success: boolean;
  message?: string;
  client?: ImapClient;
}

/**
 * Gerenciador de conexões IMAP
 * Implementa conexões seguras utilizando node-imap com suporte a TLS/SSL
 */
export class ImapConnection {
  private client: ImapClient | null = null;
  private options: ImapConnectionOptions;
  private connected: boolean = false;
  private connectionPromise: Promise<ImapConnectionResult> | null = null;

  /**
   * Cria uma nova instância de conexão IMAP
   */
  constructor(credentials: EmailCredentials, debug: boolean = false) {
    this.options = {
      user: credentials.email,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: true, // Sempre usar TLS por segurança
      tlsOptions: {
        rejectUnauthorized: false // Em produção, considerar mudar para true
      }
    };

    if (debug) {
      this.options.debug = (info) => console.log('[IMAP DEBUG]', info);
    }
  }

  /**
   * Estabelece conexão com o servidor IMAP
   */
  connect(): Promise<ImapConnectionResult> {
    // Se já existe uma conexão em andamento, retorna a promise existente
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Se já está conectado, retorna sucesso imediatamente
    if (this.connected && this.client) {
      return Promise.resolve({
        success: true,
        message: 'Já conectado ao servidor IMAP',
        client: this.client
      });
    }

    // Cria uma nova conexão
    this.connectionPromise = new Promise((resolve) => {
      try {
        // Limpar qualquer conexão anterior
        if (this.client) {
          try {
            this.client.end();
          } catch (e) {
            // Ignorar erros ao encerrar conexão anterior
          }
          this.client = null;
        }

        // Configurar opções adicionais para melhorar a estabilidade
        const enhancedOptions = {
          ...this.options,
          connTimeout: 30000, // 30 segundos de timeout de conexão
          authTimeout: 30000, // 30 segundos de timeout de autenticação
          socketTimeout: 60000, // timeout para operações de socket
          keepalive: true, // Manter conexão ativa
          debug: this.options.debug || undefined
        };

        // Usar o construtor do IMAP corretamente
        this.client = new (IMAP as any)(enhancedOptions);

        // Eventos de conexão
        this.client.once('ready', () => {
          this.connected = true;
          this.connectionPromise = null;
          resolve({
            success: true,
            message: 'Conexão IMAP estabelecida com sucesso',
            client: this.client as ImapClient
          });
        });

        this.client.once('error', (err) => {
          console.error('Erro na conexão IMAP:', err);
          
          // Verificar erros específicos
          let errorMessage = err.message || 'Erro desconhecido na conexão IMAP';
          
          // Formatando mensagens de erro específicas em português
          if (err.source === 'authentication') {
            errorMessage = 'Falha na autenticação. Verifique email e senha.';
            
            // Tratar casos específicos de erro de autenticação do Gmail
            if (this.options.host.includes('gmail') && errorMessage.includes('Invalid credentials')) {
              errorMessage = 'Falha de autenticação no Gmail. Verifique se você está usando uma senha de aplicativo (necessária quando a verificação em duas etapas está ativada).';
            }
          } else if (errorMessage.includes('connection closed') || errorMessage.includes('socket hang up')) {
            errorMessage = 'Conexão fechada pelo servidor. Verifique sua conexão de internet.';
          } else if (errorMessage.includes('connect ETIMEDOUT') || errorMessage.includes('timeout')) {
            errorMessage = 'Timeout na conexão. Verifique sua conexão de internet e as configurações do servidor.';
          }
          
          this.connected = false;
          this.connectionPromise = null;
          
          resolve({
            success: false,
            message: errorMessage
          });
        });

        this.client.once('end', () => {
          console.log('Conexão IMAP encerrada');
          this.connected = false;
        });

        // Adicionar tratamento para eventos de alerta
        this.client.on('alert', (message) => {
          console.warn('Alerta IMAP:', message);
        });

        // Adicionar manipulador de timeout
        const connectionTimeout = setTimeout(() => {
          if (this.connectionPromise) {
            console.error('Timeout na conexão IMAP após 30 segundos');
            try {
              if (this.client) this.client.end();
            } catch (e) {
              // Ignorar erros ao encerrar
            }
            
            this.connected = false;
            this.connectionPromise = null;
            
            resolve({
              success: false,
              message: 'Timeout durante a conexão IMAP. Verifique as configurações do servidor e sua conexão.'
            });
          }
        }, 30000); // 30 segundos de timeout

        // Inicia a conexão
        this.client.connect();

        // Limpar o timeout quando a conexão for estabelecida ou ocorrer erro
        this.client.once('ready', () => clearTimeout(connectionTimeout));
        this.client.once('error', () => clearTimeout(connectionTimeout));
      } catch (error: any) {
        console.error('Exceção ao iniciar conexão IMAP:', error);
        this.connectionPromise = null;
        resolve({
          success: false,
          message: `Erro ao iniciar conexão IMAP: ${error.message}`
        });
      }
    });

    return this.connectionPromise;
  }

  /**
   * Obtém a lista de caixas de email (mailboxes)
   */
  async getMailboxes(): Promise<{ success: boolean; mailboxes?: Record<string, any>; message?: string }> {
    try {
      const connection = await this.connect();
      
      if (!connection.success || !connection.client) {
        return { success: false, message: connection.message || 'Falha na conexão IMAP' };
      }

      return new Promise((resolve) => {
        connection.client.getBoxes((err, mailboxes) => {
          if (err) {
            resolve({ success: false, message: `Erro ao obter caixas de email: ${err.message}` });
          } else {
            resolve({ success: true, mailboxes });
          }
        });
      });
    } catch (error: any) {
      return { success: false, message: `Erro ao listar caixas de email: ${error.message}` };
    }
  }

  /**
   * Abre uma caixa de email específica
   */
  async openMailbox(mailbox: string = 'INBOX', readOnly: boolean = true): Promise<{ success: boolean; info?: ImapMailboxInfo; message?: string }> {
    try {
      const connection = await this.connect();
      
      if (!connection.success || !connection.client) {
        return { success: false, message: connection.message || 'Falha na conexão IMAP' };
      }

      return new Promise((resolve) => {
        connection.client.openBox(mailbox, readOnly, (err, box) => {
          if (err) {
            resolve({ success: false, message: `Erro ao abrir caixa de email ${mailbox}: ${err.message}` });
          } else {
            const mailboxInfo: ImapMailboxInfo = {
              name: mailbox,
              messages: {
                total: box.messages.total,
                new: box.messages.new,
                unseen: 0  // Será preenchido posteriormente com uma busca específica
              },
              flags: box.flags
            };
            
            // Buscar contagem de mensagens não lidas
            connection.client.search(['UNSEEN'], (searchErr, results) => {
              if (!searchErr) {
                mailboxInfo.messages.unseen = results.length;
              }
              resolve({ success: true, info: mailboxInfo });
            });
          }
        });
      });
    } catch (error: any) {
      return { success: false, message: `Erro ao abrir caixa de email: ${error.message}` };
    }
  }

  /**
   * Busca mensagens na caixa de email atual
   */
  async searchMessages(criteria: any[] = ['UNSEEN'], options: { limit?: number; since?: Date } = {}): 
    Promise<{ success: boolean; messages?: any[]; message?: string }> {
    try {
      const connection = await this.connect();
      
      if (!connection.success || !connection.client) {
        return { success: false, message: connection.message || 'Falha na conexão IMAP' };
      }

      // Adicionar critério de data, se fornecido
      if (options.since) {
        criteria.push(['SINCE', options.since]);
      }

      return new Promise((resolve) => {
        connection.client.search(criteria, (err, results) => {
          if (err) {
            resolve({ success: false, message: `Erro na busca de mensagens: ${err.message}` });
            return;
          }
          
          // Limitar número de resultados, se necessário
          const messageIds = options.limit ? results.slice(0, options.limit) : results;
          
          if (messageIds.length === 0) {
            resolve({ success: true, messages: [] });
            return;
          }
          
          const messages: any[] = [];
          
          const fetch = connection.client.fetch(messageIds, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true,
            markSeen: false
          });
          
          fetch.on('message', (msg, seqno) => {
            const message: any = {
              id: seqno,
              headers: {},
              bodyText: ''
            };
            
            msg.on('body', (stream, info) => {
              let buffer = '';
              
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              
              stream.once('end', () => {
                if (info.which.includes('HEADER')) {
                  // Usar o método parseHeader do módulo IMAP
                  message.headers = (IMAP as any).parseHeader(buffer);
                } else {
                  message.bodyText = buffer;
                }
              });
            });
            
            msg.once('attributes', (attrs) => {
              message.uid = attrs.uid;
              message.flags = attrs.flags;
              message.date = attrs.date;
              message.structure = attrs.struct;
            });
            
            msg.once('end', () => {
              messages.push(message);
            });
          });
          
          fetch.once('error', (fetchErr) => {
            resolve({ success: false, message: `Erro ao buscar mensagens: ${fetchErr.message}` });
          });
          
          fetch.once('end', () => {
            resolve({ success: true, messages });
          });
        });
      });
    } catch (error: any) {
      return { success: false, message: `Erro na busca de mensagens: ${error.message}` };
    }
  }

  /**
   * Fecha a conexão IMAP corretamente
   */
  close(): void {
    try {
      if (this.client) {
        // Remover todos os listeners para evitar vazamentos de memória
        this.client.removeAllListeners();
        
        // Tentar fechar a conexão graciosamente
        this.client.end();
        console.log('Conexão IMAP encerrada corretamente');
      }
    } catch (error) {
      console.error('Erro ao fechar conexão IMAP:', error);
    } finally {
      // Independente de sucesso ou erro, resetar o estado
      this.client = null;
      this.connected = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Cria uma conexão IMAP a partir das credenciais armazenadas
   */
  static async createFromStoredCredentials(userId: string, accountId: string, debug: boolean = false): 
    Promise<{ connection?: ImapConnection; error?: string }> {
    try {
      console.log(`Criando conexão IMAP para conta ${accountId}`);
      
      // Obter os dados da conta de email
      const supabase = createClient();
      const { data: account, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (error || !account) {
        console.error('Erro ao obter dados da conta:', error);
        return { 
          error: error ? error.message : 'Conta de email não encontrada' 
        };
      }
      
      // Verificar se as configurações IMAP estão completas
      if (!account.imap_host || !account.imap_port) {
        console.error('Configurações IMAP incompletas para a conta', accountId);
        return { 
          error: 'Configurações IMAP incompletas. Verifique o host e porta.' 
        };
      }
      
      // Obter a senha armazenada com segurança
      try {
        const password = await getSecureCredential(
          userId, 
          accountId, 
          CredentialType.EMAIL_PASSWORD
        );
        
        if (!password) {
          console.error('Senha não encontrada no vault para a conta', accountId);
          return { 
            error: 'Credenciais não encontradas. Reconecte sua conta de email.' 
          };
        }
        
        // Criar as credenciais de email
        const credentials: EmailCredentials = {
          email: account.email,
          password,
          imapHost: account.imap_host,
          imapPort: account.imap_port,
          smtpHost: account.smtp_host || '',
          smtpPort: account.smtp_port || 0
        };
        
        // Tratar caso especial do Gmail - verificar formato da senha
        if (account.imap_host.includes('gmail') && credentials.password.length < 16) {
          console.warn('Possível problema com senha do Gmail:', 
            'A senha tem menos de 16 caracteres, mas é uma conta Gmail');
        }
        
        // Criar a conexão IMAP
        const connection = new ImapConnection(credentials, debug);
        return { connection };
      } catch (credError: any) {
        console.error('Erro ao obter credencial segura:', credError);
        return { 
          error: `Erro ao obter credenciais: ${credError.message}` 
        };
      }
    } catch (error: any) {
      console.error('Erro ao criar conexão IMAP a partir de credenciais armazenadas:', error);
      return { 
        error: `Erro ao criar conexão IMAP: ${error.message}` 
      };
    }
  }
} 
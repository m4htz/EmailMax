import { ImapConnectionPool } from './imap-connection-pool';
import { EmailCredentials } from './email-connection';
import { createClient } from '@/lib/supabase/client';
import { getSecureCredential, CredentialType } from '@/lib/utils/secure-storage';
import * as IMAP from 'node-imap';
import { Readable } from 'stream';

interface EmailSearchOptions {
  mailbox?: string;
  limit?: number;
  offset?: number;
  criteria?: string[];
  bodyParts?: string[];
  fetchAll?: boolean;
  markSeen?: boolean;
  since?: Date;
  before?: Date;
  searchInBody?: boolean;
  searchText?: string;
  fetchAttachments?: boolean;
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  encoding: string;
  size: number;
  contentId?: string;
  content?: Buffer;
  isInline: boolean;
  partId?: string;
}

export interface EmailMessage {
  id: string;
  uid: number;
  sequence: number;
  subject: string;
  from: {
    name?: string;
    address: string;
  }[];
  to: {
    name?: string;
    address: string;
  }[];
  cc?: {
    name?: string;
    address: string;
  }[];
  bcc?: {
    name?: string;
    address: string;
  }[];
  date: Date;
  receivedDate?: Date;
  flags: string[];
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  bodyText?: string;
  bodyHtml?: string;
  isRead: boolean;
  isStarred: boolean;
  isAnswered: boolean;
  headers: Record<string, string[]>;
  size: number;
  preview?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

/**
 * Converte uma stream para buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Serviço para busca e leitura de emails utilizando IMAP
 */
export class ImapReader {
  private pool: ImapConnectionPool;
  private credentials: EmailCredentials;
  
  /**
   * Cria uma nova instância do leitor IMAP
   */
  constructor(credentials: EmailCredentials) {
    this.credentials = credentials;
    this.pool = ImapConnectionPool.getInstance();
  }

  /**
   * Busca emails com base em critérios específicos
   */
  async searchEmails(options: EmailSearchOptions = {}): Promise<{ 
    success: boolean; 
    messages?: EmailMessage[]; 
    total?: number;
    error?: string;
  }> {
    try {
      // Obter uma conexão do pool
      const { connection, error } = await this.pool.getConnection(this.credentials);
      
      if (error || !connection) {
        return { success: false, error: error || 'Não foi possível obter uma conexão IMAP' };
      }
      
      try {
        // Abrir a caixa de email
        const mailbox = options.mailbox || 'INBOX';
        const mailboxResult = await connection.openMailbox(mailbox, !options.markSeen);
        
        if (!mailboxResult.success) {
          return { success: false, error: mailboxResult.message };
        }
        
        // Construir critérios de busca
        const searchCriteria: any[] = options.criteria ? [...options.criteria] : [];
        
        // Adicionar critérios de data se fornecidos
        if (options.since) {
          searchCriteria.push(['SINCE', options.since]);
        }
        
        if (options.before) {
          searchCriteria.push(['BEFORE', options.before]);
        }
        
        // Adicionar critério de texto de busca
        if (options.searchText) {
          if (options.searchInBody) {
            searchCriteria.push(['BODY', options.searchText]);
          } else {
            searchCriteria.push(['TEXT', options.searchText]);
          }
        }
        
        // Se não houver critérios, buscar todas as mensagens
        if (searchCriteria.length === 0) {
          searchCriteria.push('ALL');
        }
        
        // Buscar mensagens
        const searchResult = await connection.searchMessages(searchCriteria, {
          limit: options.limit,
          since: options.since
        });
        
        if (!searchResult.success || !searchResult.messages) {
          return { success: false, error: searchResult.message || 'Falha na busca de mensagens' };
        }
        
        const messages = searchResult.messages;
        const total = messages.length;
        
        // Aplicar offset e limit se necessário
        const startIndex = options.offset || 0;
        const endIndex = options.limit ? startIndex + options.limit : messages.length;
        const limitedMessages = messages.slice(startIndex, endIndex);
        
        // Processar mensagens para o formato padronizado
        const processedMessages: EmailMessage[] = limitedMessages.map(message => this.processMessageData(message));
        
        // Carregar anexos se necessário
        if (options.fetchAttachments) {
          for (const message of processedMessages) {
            if (message.hasAttachments) {
              await this.fetchAttachments(connection, mailbox, message);
            }
          }
        }
        
        // Liberar a conexão de volta para o pool
        this.pool.releaseConnection(this.credentials);
        
        return {
          success: true,
          messages: processedMessages,
          total
        };
      } catch (error: any) {
        // Liberar a conexão em caso de erro
        this.pool.releaseConnection(this.credentials);
        throw error;
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar emails: ${error.message}`
      };
    }
  }

  /**
   * Busca um email específico pelo UID
   */
  async getEmailByUid(uid: number, options: Omit<EmailSearchOptions, 'limit' | 'offset'> = {}): Promise<{
    success: boolean;
    message?: EmailMessage;
    error?: string;
  }> {
    try {
      // Obter uma conexão do pool
      const { connection, error } = await this.pool.getConnection(this.credentials);
      
      if (error || !connection) {
        return { success: false, error: error || 'Não foi possível obter uma conexão IMAP' };
      }
      
      try {
        // Abrir a caixa de email
        const mailbox = options.mailbox || 'INBOX';
        const mailboxResult = await connection.openMailbox(mailbox, !options.markSeen);
        
        if (!mailboxResult.success) {
          return { success: false, error: mailboxResult.message };
        }
        
        // Buscar mensagem específica por UID
        const searchResult = await connection.searchMessages([['UID', uid.toString()]]);
        
        if (!searchResult.success || !searchResult.messages || searchResult.messages.length === 0) {
          return { success: false, error: searchResult.message || 'Mensagem não encontrada' };
        }
        
        // Processar a mensagem
        const message = this.processMessageData(searchResult.messages[0]);
        
        // Carregar anexos se solicitado
        if (options.fetchAttachments && message.hasAttachments) {
          await this.fetchAttachments(connection, mailbox, message);
        }
        
        // Liberar a conexão de volta para o pool
        this.pool.releaseConnection(this.credentials);
        
        return {
          success: true,
          message
        };
      } catch (error: any) {
        // Liberar a conexão em caso de erro
        this.pool.releaseConnection(this.credentials);
        throw error;
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar email: ${error.message}`
      };
    }
  }

  /**
   * Busca emails por pasta (mailbox)
   */
  async getMailboxes(): Promise<{
    success: boolean;
    mailboxes?: Record<string, any>;
    error?: string;
  }> {
    try {
      // Obter uma conexão do pool
      const { connection, error } = await this.pool.getConnection(this.credentials);
      
      if (error || !connection) {
        return { success: false, error: error || 'Não foi possível obter uma conexão IMAP' };
      }
      
      try {
        // Buscar mailboxes
        const result = await connection.getMailboxes();
        
        // Liberar a conexão de volta para o pool
        this.pool.releaseConnection(this.credentials);
        
        return result;
      } catch (error: any) {
        // Liberar a conexão em caso de erro
        this.pool.releaseConnection(this.credentials);
        throw error;
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar pastas de email: ${error.message}`
      };
    }
  }

  /**
   * Busca estatísticas de uma pasta de email
   */
  async getMailboxStats(mailbox: string = 'INBOX'): Promise<{
    success: boolean;
    stats?: {
      total: number;
      unseen: number;
      recent: number;
    };
    error?: string;
  }> {
    try {
      // Obter uma conexão do pool
      const { connection, error } = await this.pool.getConnection(this.credentials);
      
      if (error || !connection) {
        return { success: false, error: error || 'Não foi possível obter uma conexão IMAP' };
      }
      
      try {
        // Abrir a caixa de email
        const mailboxResult = await connection.openMailbox(mailbox, true);
        
        if (!mailboxResult.success || !mailboxResult.info) {
          return { success: false, error: mailboxResult.message || `Erro ao abrir caixa ${mailbox}` };
        }
        
        const stats = {
          total: mailboxResult.info.messages.total,
          unseen: mailboxResult.info.messages.unseen,
          recent: mailboxResult.info.messages.new
        };
        
        // Liberar a conexão de volta para o pool
        this.pool.releaseConnection(this.credentials);
        
        return {
          success: true,
          stats
        };
      } catch (error: any) {
        // Liberar a conexão em caso de erro
        this.pool.releaseConnection(this.credentials);
        throw error;
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar estatísticas da pasta: ${error.message}`
      };
    }
  }

  /**
   * Processa os dados brutos da mensagem para um formato padronizado
   */
  private processMessageData(message: any): EmailMessage {
    // Extrair cabeçalhos
    const headers = message.headers || {};
    
    // Processar remetente (From)
    const fromAddresses = this.parseAddresses(headers.from);
    
    // Processar destinatários (To)
    const toAddresses = this.parseAddresses(headers.to);
    
    // Processar CC e BCC se disponíveis
    const ccAddresses = headers.cc ? this.parseAddresses(headers.cc) : undefined;
    const bccAddresses = headers.bcc ? this.parseAddresses(headers.bcc) : undefined;
    
    // Processar data
    const dateStr = headers.date && headers.date[0];
    const date = dateStr ? new Date(dateStr) : new Date();
    
    // Processar flags
    const flags = message.flags || [];
    const isRead = flags.includes('\\Seen');
    const isStarred = flags.includes('\\Flagged');
    const isAnswered = flags.includes('\\Answered');
    
    // Extrair informações básicas
    const subject = headers.subject ? headers.subject[0] || '(Sem assunto)' : '(Sem assunto)';
    const messageId = headers['message-id'] ? headers['message-id'][0] : undefined;
    const inReplyTo = headers['in-reply-to'] ? headers['in-reply-to'][0] : undefined;
    const references = headers.references ? 
      headers.references[0].split(/\s+/).filter(Boolean) : 
      [];
    
    // Processar partes do corpo e anexos
    const bodyText = message.bodyText || '';
    let bodyHtml = '';
    let attachments: EmailAttachment[] = [];
    let hasAttachments = false;
    
    // Verificar estrutura para identificar anexos e partes HTML
    if (message.structure) {
      const result = this.processStructure(message.structure);
      hasAttachments = result.hasAttachments;
      
      // Atualizar lista preliminar de anexos (os conteúdos são carregados separadamente)
      if (result.attachments.length > 0) {
        attachments = result.attachments;
      }
      
      // Se encontramos HTML, marcamos para carregamento posterior
      if (result.hasHtml) {
        bodyHtml = ''; // Será carregado separadamente
      }
    }
    
    // Preview do texto
    const preview = bodyText.substring(0, 100).replace(/\s+/g, ' ');
    
    return {
      id: messageId || `${message.uid}`,
      uid: message.uid,
      sequence: message.id || 0,
      subject,
      from: fromAddresses,
      to: toAddresses,
      cc: ccAddresses,
      bcc: bccAddresses,
      date,
      flags,
      hasAttachments,
      attachments,
      bodyText,
      bodyHtml,
      isRead,
      isStarred,
      isAnswered,
      headers,
      size: message.size || 0,
      preview,
      messageId,
      inReplyTo,
      references
    };
  }

  /**
   * Processa a estrutura MIME do email para identificar partes e anexos
   */
  private processStructure(structure: any[]): {
    hasAttachments: boolean;
    attachments: EmailAttachment[];
    hasHtml: boolean;
  } {
    const attachments: EmailAttachment[] = [];
    let hasHtml = false;
    
    const processStructurePart = (part: any, partPath: string = '') => {
      // Verificar se é um array de partes aninhadas
      if (Array.isArray(part)) {
        // Para arrays com objetos, processar cada objeto como parte
        part.forEach((subPart, idx) => {
          const newPath = partPath ? `${partPath}.${idx + 1}` : `${idx + 1}`;
          processStructurePart(subPart, newPath);
        });
        return;
      }
      
      // Ignorar partes que não são objetos
      if (!part || typeof part !== 'object') return;
      
      // Para partes contendo arrays aninhados (estrutura MIME complexa)
      if (part[0] && typeof part[0] === 'object') {
        const parentPart = part[0];
        
        // Processar parte principal
        if (parentPart.type) {
          processStructurePart(parentPart, partPath);
        }
        
        // Processar subpartes
        for (let i = 1; i < part.length; i++) {
          const newPath = partPath ? `${partPath}.${i}` : `${i}`;
          processStructurePart(part[i], newPath);
        }
        return;
      }
      
      // Verificar se é HTML
      if (part.type === 'text' && part.subtype === 'html') {
        hasHtml = true;
      }
      
      // Verificar se é um anexo
      const isAttachment = 
        (part.disposition && part.disposition.type === 'attachment') ||
        (part.params && part.params.name) ||
        (part.disposition && part.disposition.params && part.disposition.params.filename);
      
      if (isAttachment) {
        const filename = 
          (part.disposition && part.disposition.params && part.disposition.params.filename) || 
          (part.params && part.params.name) || 
          'unnamed-attachment';
          
        const contentType = `${part.type}/${part.subtype}`;
        const isInline = part.disposition && part.disposition.type === 'inline';
        const contentId = part.id ? part.id.replace(/[<>]/g, '') : undefined;
        
        attachments.push({
          filename,
          contentType,
          encoding: part.encoding || '7BIT',
          size: part.size || 0,
          contentId,
          isInline,
          partId: part.partID || partPath
        });
      }
    };
    
    // Processar a estrutura recursivamente
    processStructurePart(structure);
    
    return {
      hasAttachments: attachments.length > 0,
      attachments,
      hasHtml
    };
  }

  /**
   * Busca os anexos de uma mensagem
   */
  private async fetchAttachments(connection: any, mailbox: string, message: EmailMessage): Promise<void> {
    try {
      if (!message.hasAttachments || message.attachments.length === 0) {
        return;
      }
      
      // Abrir mailbox se ainda não estiver aberta
      const mailboxResult = await connection.openMailbox(mailbox, true);
      if (!mailboxResult.success) {
        console.error(`Erro ao abrir mailbox para buscar anexos: ${mailboxResult.message}`);
        return;
      }
      
      // Buscar cada anexo individualmente
      await Promise.all(message.attachments.map(async (attachment, index) => {
        try {
          if (!attachment.partId) return;
          
          return new Promise<void>((resolve, reject) => {
            const client = (connection as any).client;
            if (!client) {
              resolve();
              return;
            }
            
            const fetch = client.fetch(message.uid, {
              bodies: [`${attachment.partId}`],
              struct: false
            });
            
            fetch.on('message', (msg: any) => {
              msg.on('body', async (stream: Readable, info: any) => {
                try {
                  // Ler conteúdo do anexo
                  const buffer = await streamToBuffer(stream);
                  
                  // Atualizar anexo com o conteúdo
                  message.attachments[index].content = buffer;
                  resolve();
                } catch (error) {
                  reject(error);
                }
              });
            });
            
            fetch.once('error', (err: Error) => {
              reject(err);
            });
            
            fetch.once('end', () => {
              // Garante que o promise seja resolvido caso não tenha recebido a mensagem
              resolve();
            });
          });
        } catch (error) {
          console.error(`Erro ao buscar anexo ${attachment.filename}: ${error}`);
        }
      }));
    } catch (error) {
      console.error(`Erro ao buscar anexos: ${error}`);
    }
  }

  /**
   * Marca um email como lido ou não lido
   */
  async markEmailAsRead(uid: number, isRead: boolean, mailbox: string = 'INBOX'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Obter uma conexão do pool
      const { connection, error } = await this.pool.getConnection(this.credentials);
      
      if (error || !connection) {
        return { success: false, error: error || 'Não foi possível obter uma conexão IMAP' };
      }
      
      try {
        // Abrir a caixa de email no modo não-somente-leitura
        const mailboxResult = await connection.openMailbox(mailbox, false);
        
        if (!mailboxResult.success) {
          return { success: false, error: mailboxResult.message };
        }
        
        // Obter cliente IMAP
        const client = (connection as any).client;
        if (!client) {
          return { success: false, error: 'Cliente IMAP não disponível' };
        }
        
        return new Promise((resolve) => {
          const flags = isRead ? ['+FLAGS', '\\Seen'] : ['-FLAGS', '\\Seen'];
          
          client.setFlags(uid, flags, (err: Error | null) => {
            // Liberar a conexão de volta para o pool
            this.pool.releaseConnection(this.credentials);
            
            if (err) {
              resolve({ 
                success: false, 
                error: `Erro ao marcar email: ${err.message}` 
              });
            } else {
              resolve({ 
                success: true
              });
            }
          });
        });
      } catch (error: any) {
        // Liberar a conexão em caso de erro
        this.pool.releaseConnection(this.credentials);
        throw error;
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao marcar email como ${isRead ? 'lido' : 'não lido'}: ${error.message}`
      };
    }
  }

  /**
   * Parse endereços de email no formato "Nome <email@exemplo.com>"
   */
  private parseAddresses(addressHeaders?: string[]): { name?: string; address: string }[] {
    if (!addressHeaders || addressHeaders.length === 0) {
      return [{ address: '' }];
    }
    
    const addresses: { name?: string; address: string }[] = [];
    
    // Combinar todos os cabeçalhos em uma string e fazer o parse
    const addressStr = addressHeaders.join(', ');
    
    // Expressão regular para capturar nome e endereço
    // Formato esperado: "Nome <email@exemplo.com>" ou apenas "email@exemplo.com"
    const regex = /"?([^"<]+)"?\s*<?([^>]+)>?/g;
    let match;
    
    while ((match = regex.exec(addressStr)) !== null) {
      const [, name, email] = match;
      
      if (email && email.includes('@')) {
        // É um email válido
        addresses.push({
          name: name && name.trim() !== email.trim() ? name.trim() : undefined,
          address: email.trim()
        });
      } else if (name && name.includes('@')) {
        // Apenas o endereço foi fornecido sem nome
        addresses.push({
          address: name.trim()
        });
      }
    }
    
    // Se nenhum endereço foi encontrado com a regex, tente um fallback simples
    if (addresses.length === 0 && addressStr.includes('@')) {
      addresses.push({
        address: addressStr.trim()
      });
    }
    
    return addresses;
  }

  /**
   * Busca emails de uma pasta específica com filtros
   */
  async searchByMailbox(
    mailbox: string, 
    filters: {
      onlyUnread?: boolean;
      onlyWithAttachments?: boolean;
      fromAddress?: string;
      toAddress?: string;
      subject?: string;
      since?: Date;
      before?: Date;
      flagged?: boolean;
    } = {},
    options: Omit<EmailSearchOptions, 'mailbox'> = {}
  ): Promise<{ 
    success: boolean; 
    messages?: EmailMessage[]; 
    total?: number;
    error?: string;
  }> {
    try {
      // Construir critérios de busca
      const criteria: any[] = [];
      
      // Aplicar filtros
      if (filters.onlyUnread) {
        criteria.push('UNSEEN');
      }
      
      if (filters.flagged) {
        criteria.push('FLAGGED');
      }
      
      if (filters.since) {
        criteria.push(['SINCE', filters.since]);
      }
      
      if (filters.before) {
        criteria.push(['BEFORE', filters.before]);
      }
      
      if (filters.fromAddress) {
        criteria.push(['FROM', filters.fromAddress]);
      }
      
      if (filters.toAddress) {
        criteria.push(['TO', filters.toAddress]);
      }
      
      if (filters.subject) {
        criteria.push(['SUBJECT', filters.subject]);
      }
      
      // A busca por anexos geralmente requer uma verificação posterior
      // pois alguns servidores IMAP não suportam critérios para anexos
      
      // Buscar emails usando os critérios construídos
      return await this.searchEmails({
        ...options,
        mailbox,
        criteria: criteria.length > 0 ? criteria : undefined
      });
    } catch (error: any) {
      return {
        success: false,
        error: `Erro na busca avançada: ${error.message}`
      };
    }
  }

  /**
   * Cria um leitor IMAP a partir das credenciais armazenadas
   */
  static async createFromStoredCredentials(userId: string, accountId: string): 
    Promise<{ reader?: ImapReader; error?: string }> {
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
      
      // Criar leitor
      const reader = new ImapReader({
        email: account.email,
        password,
        imapHost: account.imap_host,
        imapPort: account.imap_port,
        smtpHost: account.smtp_host,
        smtpPort: account.smtp_port
      });
      
      return { reader };
    } catch (error: any) {
      return { error: `Erro ao criar leitor IMAP: ${error.message}` };
    }
  }
} 
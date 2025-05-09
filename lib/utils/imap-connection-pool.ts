import { ImapConnection } from './imap-connection';
import { EmailCredentials } from './email-connection';

interface PooledConnection {
  id: string;
  connection: ImapConnection;
  lastUsed: number;
  inUse: boolean;
}

interface ConnectionPoolOptions {
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  debug?: boolean;
}

/**
 * Gerenciador de pool de conexões IMAP
 * Mantém um pool de conexões reutilizáveis para melhorar performance e evitar
 * uso excessivo de recursos ao criar múltiplas conexões para a mesma conta
 */
export class ImapConnectionPool {
  private static instance: ImapConnectionPool;
  private connections: Map<string, PooledConnection>;
  private maxConnections: number;
  private connectionTimeout: number;
  private idleTimeout: number;
  private debug: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Cria uma instância do pool de conexões
   */
  private constructor(options: ConnectionPoolOptions = {}) {
    this.connections = new Map();
    this.maxConnections = options.maxConnections || 10;
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 segundos
    this.idleTimeout = options.idleTimeout || 5 * 60 * 1000; // 5 minutos
    this.debug = options.debug || false;
    
    // Inicia o processo de limpeza de conexões ociosas
    this.startCleanupScheduler();
  }

  /**
   * Obtém uma instância única do pool (Singleton)
   */
  public static getInstance(options?: ConnectionPoolOptions): ImapConnectionPool {
    if (!ImapConnectionPool.instance) {
      ImapConnectionPool.instance = new ImapConnectionPool(options);
    }
    return ImapConnectionPool.instance;
  }

  /**
   * Gera uma chave única para identificar uma conexão
   */
  private getConnectionKey(credentials: EmailCredentials): string {
    return `${credentials.email}@${credentials.imapHost}:${credentials.imapPort}`;
  }

  /**
   * Obtém uma conexão do pool ou cria uma nova se necessário
   */
  public async getConnection(credentials: EmailCredentials): Promise<{ connection?: ImapConnection; error?: string }> {
    const key = this.getConnectionKey(credentials);
    
    // Verificar se já existe uma conexão disponível
    if (this.connections.has(key)) {
      const pooledConn = this.connections.get(key)!;
      
      // Se a conexão estiver em uso, criar uma nova se estiver dentro dos limites
      if (pooledConn.inUse) {
        if (this.connections.size >= this.maxConnections) {
          return { error: 'Limite máximo de conexões atingido. Tente novamente mais tarde.' };
        }
        
        // Criar um novo ID para uma conexão adicional
        const newId = `${key}_${Date.now()}`;
        return this.createNewConnection(newId, credentials);
      }
      
      // Marcar conexão como em uso
      pooledConn.inUse = true;
      pooledConn.lastUsed = Date.now();
      
      if (this.debug) {
        console.log(`[IMAP POOL] Reutilizando conexão existente: ${key}`);
      }
      
      return { connection: pooledConn.connection };
    }
    
    // Verificar limite de conexões
    if (this.connections.size >= this.maxConnections) {
      return { error: 'Limite máximo de conexões atingido. Tente novamente mais tarde.' };
    }
    
    // Criar nova conexão
    return this.createNewConnection(key, credentials);
  }

  /**
   * Cria uma nova conexão e adiciona ao pool
   */
  private async createNewConnection(id: string, credentials: EmailCredentials): Promise<{ connection?: ImapConnection; error?: string }> {
    if (this.debug) {
      console.log(`[IMAP POOL] Criando nova conexão: ${id}`);
    }
    
    const connection = new ImapConnection(credentials, this.debug);
    
    // Testar a conexão antes de adicioná-la ao pool
    const connectionResult = await connection.connect();
    
    if (!connectionResult.success) {
      return { error: connectionResult.message || 'Falha ao estabelecer conexão IMAP' };
    }
    
    // Adicionar ao pool
    this.connections.set(id, {
      id,
      connection,
      lastUsed: Date.now(),
      inUse: true
    });
    
    return { connection };
  }

  /**
   * Libera uma conexão de volta para o pool
   */
  public releaseConnection(credentials: EmailCredentials): boolean {
    const key = this.getConnectionKey(credentials);
    
    if (this.connections.has(key)) {
      const connection = this.connections.get(key)!;
      connection.inUse = false;
      connection.lastUsed = Date.now();
      
      if (this.debug) {
        console.log(`[IMAP POOL] Conexão liberada: ${key}`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Remove uma conexão do pool
   */
  public removeConnection(credentials: EmailCredentials): boolean {
    const key = this.getConnectionKey(credentials);
    
    if (this.connections.has(key)) {
      const connection = this.connections.get(key)!;
      
      // Fechar a conexão
      connection.connection.close();
      
      // Remover do pool
      this.connections.delete(key);
      
      if (this.debug) {
        console.log(`[IMAP POOL] Conexão removida: ${key}`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Inicia o processo de limpeza de conexões ociosas
   */
  private startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Verifica conexões ociosas a cada minuto
  }

  /**
   * Remove conexões que estão ociosas por muito tempo
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    
    // Usar Array.from para evitar problemas de iteração com o Map
    Array.from(this.connections.entries()).forEach(([id, conn]) => {
      // Se a conexão não estiver em uso e estiver ociosa por mais tempo que o limite
      if (!conn.inUse && (now - conn.lastUsed) > this.idleTimeout) {
        if (this.debug) {
          console.log(`[IMAP POOL] Removendo conexão ociosa: ${id}`);
        }
        
        // Fechar conexão
        conn.connection.close();
        
        // Remover do pool
        this.connections.delete(id);
      }
    });
  }

  /**
   * Fecha todas as conexões e limpa o pool
   */
  public closeAll(): void {
    if (this.debug) {
      console.log(`[IMAP POOL] Fechando todas as conexões (total: ${this.connections.size})`);
    }
    
    // Parar o processo de limpeza
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Fechar todas as conexões - usando Array.from para evitar problemas de iteração
    Array.from(this.connections.entries()).forEach(([id, conn]) => {
      conn.connection.close();
      this.connections.delete(id);
    });
  }

  /**
   * Retorna estatísticas do pool
   */
  public getStats(): {
    total: number;
    active: number;
    idle: number;
  } {
    let active = 0;
    let idle = 0;
    
    // Usar Array.from para evitar problemas de iteração
    Array.from(this.connections.values()).forEach(conn => {
      if (conn.inUse) {
        active++;
      } else {
        idle++;
      }
    });
    
    return {
      total: this.connections.size,
      active,
      idle
    };
  }
} 
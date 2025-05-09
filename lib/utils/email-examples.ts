/**
 * Exemplos de uso das funções de busca e leitura de emails
 * 
 * Este arquivo contém exemplos práticos de como utilizar o ImapReader
 * para diferentes casos de uso comuns na aplicação.
 */

import { ImapReader, EmailMessage } from '@/lib/utils/imap-reader';
import { EmailCredentials } from '@/lib/utils/email-connection';

/**
 * Função que demonstra como buscar emails não lidos na caixa de entrada
 */
export async function buscarEmailsNaoLidos(credenciais: EmailCredentials, limite: number = 10) {
  try {
    // Criar instância do leitor
    const reader = new ImapReader(credenciais);
    
    // Buscar emails não lidos
    const resultado = await reader.searchEmails({
      mailbox: 'INBOX',
      criteria: ['UNSEEN'],
      limit: limite,
      offset: 0
    });
    
    if (!resultado.success) {
      console.error('Erro ao buscar emails:', resultado.error);
      return [];
    }
    
    return resultado.messages || [];
  } catch (error: any) {
    console.error('Falha na busca de emails não lidos:', error.message);
    return [];
  }
}

/**
 * Função que demonstra como buscar emails por assunto
 */
export async function buscarEmailsPorAssunto(credenciais: EmailCredentials, assunto: string) {
  try {
    const reader = new ImapReader(credenciais);
    
    // Usar searchByMailbox com filtro por assunto
    const resultado = await reader.searchByMailbox(
      'INBOX',
      { subject: assunto },
      { limit: 20 }
    );
    
    if (!resultado.success) {
      console.error('Erro ao buscar emails por assunto:', resultado.error);
      return [];
    }
    
    return resultado.messages || [];
  } catch (error: any) {
    console.error('Falha na busca por assunto:', error.message);
    return [];
  }
}

/**
 * Função que demonstra como buscar emails com anexos
 */
export async function buscarEmailsComAnexos(credenciais: EmailCredentials) {
  try {
    const reader = new ImapReader(credenciais);
    
    // Buscar emails e depois filtrar os que têm anexos
    const resultado = await reader.searchEmails({
      mailbox: 'INBOX',
      limit: 50, // Buscar uma quantidade maior para ter mais chances de encontrar anexos
      fetchAttachments: true // Isso também carregará o conteúdo dos anexos
    });
    
    if (!resultado.success || !resultado.messages) {
      console.error('Erro ao buscar emails:', resultado.error);
      return [];
    }
    
    // Filtrar apenas mensagens com anexos
    return resultado.messages.filter(message => message.hasAttachments);
  } catch (error: any) {
    console.error('Falha na busca de emails com anexos:', error.message);
    return [];
  }
}

/**
 * Função que demonstra como ler um email específico pelo UID
 */
export async function lerEmailEspecifico(credenciais: EmailCredentials, uid: number) {
  try {
    const reader = new ImapReader(credenciais);
    
    // Buscar email específico por UID
    const resultado = await reader.getEmailByUid(uid, {
      fetchAttachments: true // Carregar também os anexos
    });
    
    if (!resultado.success || !resultado.message) {
      console.error('Erro ao buscar email específico:', resultado.error);
      return null;
    }
    
    return resultado.message;
  } catch (error: any) {
    console.error('Falha ao ler email específico:', error.message);
    return null;
  }
}

/**
 * Função que demonstra como marcar emails como lidos
 */
export async function marcarEmailsComoLidos(credenciais: EmailCredentials, uids: number[]) {
  try {
    const reader = new ImapReader(credenciais);
    const resultados: {uid: number; success: boolean}[] = [];
    
    // Marcar cada email como lido
    for (const uid of uids) {
      const resultado = await reader.markEmailAsRead(uid, true);
      resultados.push({
        uid,
        success: resultado.success
      });
      
      if (!resultado.success) {
        console.warn(`Erro ao marcar email ${uid} como lido:`, resultado.error);
      }
    }
    
    return resultados;
  } catch (error: any) {
    console.error('Falha ao marcar emails como lidos:', error.message);
    return [];
  }
}

/**
 * Função que demonstra como obter estatísticas das pastas de email
 */
export async function obterEstatisticasDePastas(credenciais: EmailCredentials) {
  try {
    const reader = new ImapReader(credenciais);
    
    // Passo 1: Obter a lista de pastas (mailboxes)
    const pastasResultado = await reader.getMailboxes();
    
    if (!pastasResultado.success || !pastasResultado.mailboxes) {
      console.error('Erro ao obter lista de pastas:', pastasResultado.error);
      return {};
    }
    
    // Passo 2: Para cada pasta importante, obter estatísticas
    const estatisticas: Record<string, any> = {};
    const pastasPrincipais = ['INBOX', 'Sent', 'Drafts', 'Spam', 'Trash'];
    
    for (const pasta of pastasPrincipais) {
      if (pastasResultado.mailboxes[pasta] || 
          (pastasResultado.mailboxes['[Gmail]'] && 
           pastasResultado.mailboxes['[Gmail]'].children && 
           pastasResultado.mailboxes['[Gmail]'].children[pasta])) {
        
        // Caminho da pasta - para Gmail pode ser diferente
        const caminhoPasta = pastasResultado.mailboxes[pasta] ? 
                            pasta : 
                            `[Gmail]/${pasta}`;
        
        const statsResultado = await reader.getMailboxStats(caminhoPasta);
        
        if (statsResultado.success && statsResultado.stats) {
          estatisticas[pasta] = statsResultado.stats;
        }
      }
    }
    
    return estatisticas;
  } catch (error: any) {
    console.error('Falha ao obter estatísticas de pastas:', error.message);
    return {};
  }
}

/**
 * Função que demonstra como buscar emails recentes
 */
export async function buscarEmailsRecentes(credenciais: EmailCredentials, dias: number = 7) {
  try {
    const reader = new ImapReader(credenciais);
    
    // Calcular data para o critério "desde"
    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - dias);
    
    // Usar searchByMailbox com filtro por data
    const resultado = await reader.searchByMailbox(
      'INBOX',
      { since: dataInicial },
      { limit: 50 }
    );
    
    if (!resultado.success) {
      console.error('Erro ao buscar emails recentes:', resultado.error);
      return [];
    }
    
    return resultado.messages || [];
  } catch (error: any) {
    console.error('Falha na busca de emails recentes:', error.message);
    return [];
  }
}

/**
 * Função utilitária para exibir informações básicas de um email
 */
export function formatarDetalhesEmail(email: EmailMessage): string {
  const from = email.from.map(f => f.name ? `${f.name} <${f.address}>` : f.address).join(', ');
  const to = email.to.map(t => t.name ? `${t.name} <${t.address}>` : t.address).join(', ');
  const anexos = email.hasAttachments ? `(${email.attachments.length} anexos)` : '';
  
  return `
    ID: ${email.id}
    UID: ${email.uid}
    Assunto: ${email.subject}
    De: ${from}
    Para: ${to}
    Data: ${email.date.toLocaleString()}
    Lido: ${email.isRead ? 'Sim' : 'Não'}
    Anexos: ${anexos}
    Preview: ${email.preview || ''}
  `;
} 
/**
 * Exemplos de uso dos manipuladores de eventos IMAP
 * 
 * Este arquivo contém exemplos práticos de como utilizar o ImapEventHandler
 * para monitorar eventos em tempo real nas caixas de email.
 */

import { ImapEventHandler, ImapEventType, ImapMessageEvent } from '@/lib/utils/imap-event-handler';
import { EmailCredentials } from '@/lib/utils/email-connection';

/**
 * Exemplo de monitoramento de caixa de entrada para novas mensagens
 */
export async function monitorarNovasMessagens(
  credenciais: EmailCredentials,
  callbackNovasMensagens: (mensagem: ImapMessageEvent) => void
) {
  try {
    // Criar manipulador de eventos
    const handler = new ImapEventHandler(credenciais, {
      mailbox: 'INBOX',
      debug: true,
      idleTimeout: 5 * 60 * 1000 // 5 minutos
    });
    
    // Registrar ouvinte para novos emails
    handler.onNewMessage((evento) => {
      console.log(`Nova mensagem recebida: ${evento.subject}`);
      callbackNovasMensagens(evento);
    });
    
    // Registrar ouvinte para erros de conexão
    handler.onConnectionError((evento) => {
      console.error(`Erro de conexão IMAP: ${evento.error}`);
    });
    
    // Iniciar monitoramento
    const resultado = await handler.startListening();
    
    if (!resultado.success) {
      console.error(`Erro ao iniciar monitoramento: ${resultado.error}`);
      return null;
    }
    
    console.log('Monitoramento de caixa de entrada iniciado com sucesso');
    
    // Retornar instância para que o chamador possa parar o monitoramento quando necessário
    return handler;
  } catch (error: any) {
    console.error(`Erro ao configurar monitoramento: ${error.message}`);
    return null;
  }
}

/**
 * Exemplo de monitoramento de eventos de marcação (flags) em emails
 */
export async function monitorarMarcacaoEmails(
  credenciais: EmailCredentials,
  callbackMarcacao: (evento: ImapMessageEvent) => void
) {
  try {
    // Criar manipulador de eventos
    const handler = new ImapEventHandler(credenciais, {
      mailbox: 'INBOX',
      debug: true
    });
    
    // Registrar ouvinte para alterações de flags
    handler.onMessageFlagged((evento) => {
      console.log(`Email marcado: UID ${evento.uid}, Flags: ${evento.flags?.join(',')}`);
      callbackMarcacao(evento);
    });
    
    // Iniciar monitoramento
    const resultado = await handler.startListening();
    
    if (!resultado.success) {
      console.error(`Erro ao iniciar monitoramento de flags: ${resultado.error}`);
      return null;
    }
    
    console.log('Monitoramento de marcações iniciado com sucesso');
    
    return handler;
  } catch (error: any) {
    console.error(`Erro ao configurar monitoramento de flags: ${error.message}`);
    return null;
  }
}

/**
 * Exemplo de monitoramento de exclusão de emails
 */
export async function monitorarExclusaoEmails(
  credenciais: EmailCredentials,
  callbackExclusao: (evento: ImapMessageEvent) => void
) {
  try {
    // Criar manipulador de eventos
    const handler = new ImapEventHandler(credenciais, {
      mailbox: 'INBOX',
      debug: true
    });
    
    // Registrar ouvinte para exclusão de mensagens
    handler.onMessageDeleted((evento) => {
      console.log(`Email excluído: UID ${evento.uid}, Assunto: ${evento.subject}`);
      callbackExclusao(evento);
    });
    
    // Iniciar monitoramento
    const resultado = await handler.startListening();
    
    if (!resultado.success) {
      console.error(`Erro ao iniciar monitoramento de exclusões: ${resultado.error}`);
      return null;
    }
    
    console.log('Monitoramento de exclusões iniciado com sucesso');
    
    return handler;
  } catch (error: any) {
    console.error(`Erro ao configurar monitoramento de exclusões: ${error.message}`);
    return null;
  }
}

/**
 * Exemplo de monitoramento de múltiplas pastas
 */
export async function monitorarMultiplasPastas(
  credenciais: EmailCredentials,
  pastas: string[],
  intervaloAlternancia: number = 60000 // 1 minuto
) {
  try {
    // Criar manipulador de eventos com a primeira pasta
    const handler = new ImapEventHandler(credenciais, {
      mailbox: pastas[0] || 'INBOX',
      debug: true
    });
    
    // Configurar ouvintes para eventos importantes
    handler.onNewMessage((evento) => {
      console.log(`Nova mensagem em ${evento.mailbox}: ${evento.subject}`);
    });
    
    handler.onMessageDeleted((evento) => {
      console.log(`Mensagem excluída em ${evento.mailbox}: ${evento.subject}`);
    });
    
    handler.onConnectionError((evento) => {
      console.error(`Erro de conexão IMAP: ${evento.error}`);
    });
    
    // Iniciar monitoramento
    const resultado = await handler.startListening();
    
    if (!resultado.success) {
      console.error(`Erro ao iniciar monitoramento múltiplo: ${resultado.error}`);
      return null;
    }
    
    // Configurar alternância entre pastas
    let pastaAtual = 0;
    
    const intervalo = setInterval(async () => {
      // Avançar para próxima pasta
      pastaAtual = (pastaAtual + 1) % pastas.length;
      const proximaPasta = pastas[pastaAtual];
      
      // Trocar pasta monitorada
      const resultadoTroca = await handler.changeMailbox(proximaPasta);
      
      if (!resultadoTroca.success) {
        console.error(`Erro ao alternar para pasta ${proximaPasta}: ${resultadoTroca.error}`);
      } else {
        console.log(`Alternando monitoramento para pasta: ${proximaPasta}`);
      }
    }, intervaloAlternancia);
    
    // Retornar objetos que permitem controlar o monitoramento
    return {
      handler,
      pararAlternancia: () => clearInterval(intervalo),
      pararMonitoramento: () => {
        clearInterval(intervalo);
        handler.stopListening();
      }
    };
  } catch (error: any) {
    console.error(`Erro ao configurar monitoramento múltiplo: ${error.message}`);
    return null;
  }
}

/**
 * Exemplo de uso com credenciais armazenadas
 */
export async function iniciarMonitoramentoContaArmazenada(
  userId: string,
  accountId: string
) {
  try {
    // Criar handler a partir de credenciais armazenadas
    const { handler, error } = await ImapEventHandler.createFromStoredCredentials(
      userId,
      accountId,
      { debug: true }
    );
    
    if (error || !handler) {
      console.error(`Erro ao criar handler: ${error}`);
      return null;
    }
    
    // Configurar todos os ouvintes relevantes
    handler.onNewMessage((evento) => {
      console.log(`Nova mensagem: ${evento.subject}`);
    });
    
    handler.onMessageFlagged((evento) => {
      console.log(`Mensagem marcada: ${evento.subject}`);
    });
    
    handler.onMessageDeleted((evento) => {
      console.log(`Mensagem excluída: ${evento.subject}`);
    });
    
    handler.onConnectionError((evento) => {
      console.error(`Erro de conexão: ${evento.error}`);
    });
    
    handler.onConnectionClosed((evento) => {
      console.log(`Conexão fechada para ${evento.email} em ${evento.timestamp}`);
    });
    
    // Iniciar monitoramento
    const resultado = await handler.startListening();
    
    if (!resultado.success) {
      console.error(`Erro ao iniciar monitoramento: ${resultado.error}`);
      return null;
    }
    
    console.log(`Monitoramento iniciado para conta ${accountId}`);
    
    return handler;
  } catch (error: any) {
    console.error(`Erro geral no monitoramento: ${error.message}`);
    return null;
  }
} 
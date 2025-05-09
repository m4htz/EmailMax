// Script de testes para a Edge Function email-processor - Versão Deno
// Execute com: deno run --allow-net test.ts

// Configurações
const BASE_URL = 'http://localhost:54321/functions/v1/email-processor';
// Substitua por um token JWT válido obtido do Supabase Auth
const AUTH_TOKEN = 'SEU_TOKEN_JWT';
const EMAIL_ACCOUNT_ID = 'ID_DA_CONTA_DE_EMAIL'; // UUID da conta de email

// Função para executar testes
async function runTests() {
  console.log('📧 Iniciando testes da Edge Function email-processor');
  console.log('==================================================');

  try {
    // Teste 1: Envio de email
    await testSendEmail();
    
    // Teste 2: Leitura de emails
    await testReadEmails();
    
    // Teste 3: Marcar email como lido
    await testMarkAsRead();
    
    // Teste 4: Processar emails agendados
    await testProcessScheduledEmails();
    
    // Teste 5: Verificar atualizações da caixa de entrada
    await testCheckInboxUpdates();
    
    console.log('==================================================');
    console.log('✅ Todos os testes concluídos!');
  } catch (error) {
    console.error('❌ Erro durante a execução dos testes:', error);
  }
}

// Função auxiliar para fazer requisições
async function callFunction(action: string, params: Record<string, any> = {}): Promise<any> {
  const body = {
    action,
    ...params
  };
  
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${data.error || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Erro ao chamar a função ${action}:`, error);
    throw error;
  }
}

// Teste: Envio de email
async function testSendEmail() {
  console.log('\n🧪 Teste: Envio de email');
  
  try {
    const result = await callFunction('send_email', {
      accountId: EMAIL_ACCOUNT_ID,
      to: 'destinatario@exemplo.com',
      subject: 'Teste Automatizado - Email Processor',
      text: 'Este é um email de teste enviado pelo script de testes.',
      html: '<p>Este é um <strong>email de teste</strong> enviado pelo script de testes.</p>'
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Mensagem: ${result.message}`);
  } catch (error) {
    console.error('❌ Falha no teste de envio de email:', (error as Error).message);
  }
}

// Teste: Leitura de emails
async function testReadEmails() {
  console.log('\n🧪 Teste: Leitura de emails');
  
  try {
    const result = await callFunction('read_emails', {
      accountId: EMAIL_ACCOUNT_ID,
      folder: 'INBOX',
      maxMessages: 5,
      onlyUnread: true
    });
    
    console.log('✅ Emails lidos com sucesso!');
    console.log(`   Total de mensagens na caixa: ${result.totalMessages}`);
    console.log(`   Mensagens recuperadas: ${result.messages.length}`);
    
    // Exibe detalhes das mensagens
    if (result.messages.length > 0) {
      console.log('   Primeira mensagem:');
      console.log(`     Assunto: ${result.messages[0].subject}`);
      console.log(`     De: ${result.messages[0].from}`);
      console.log(`     Data: ${result.messages[0].date}`);
    }
  } catch (error) {
    console.error('❌ Falha no teste de leitura de emails:', (error as Error).message);
  }
}

// Teste: Marcar email como lido
async function testMarkAsRead() {
  console.log('\n🧪 Teste: Marcar emails como lidos');
  
  try {
    // Primeiro obtém alguns IDs de mensagens
    const readResult = await callFunction('read_emails', {
      accountId: EMAIL_ACCOUNT_ID,
      maxMessages: 2,
      onlyUnread: true
    });
    
    if (readResult.messages.length === 0) {
      console.log('ℹ️ Nenhuma mensagem não lida disponível para teste');
      return;
    }
    
    // Extrai os UIDs das mensagens
    const messageIds = readResult.messages.map((msg: any) => msg.uid);
    
    // Marca as mensagens como lidas
    const markResult = await callFunction('mark_as_read', {
      accountId: EMAIL_ACCOUNT_ID,
      messageIds: messageIds,
      folder: 'INBOX'
    });
    
    console.log('✅ Emails marcados como lidos com sucesso!');
    console.log(`   Mensagem: ${markResult.message}`);
  } catch (error) {
    console.error('❌ Falha no teste de marcar emails como lidos:', (error as Error).message);
  }
}

// Teste: Processar emails agendados
async function testProcessScheduledEmails() {
  console.log('\n🧪 Teste: Processar emails agendados');
  
  try {
    const result = await callFunction('process_scheduled_emails');
    
    console.log('✅ Processamento de emails agendados concluído!');
    console.log(`   Emails processados: ${result.processed}`);
    
    // Exibe detalhes dos resultados
    if (result.results && result.results.length > 0) {
      console.log('   Resultados:');
      result.results.forEach((r: any, i: number) => {
        console.log(`     ${i+1}. ID: ${r.id}, Sucesso: ${r.success}`);
      });
    } else {
      console.log('   Nenhum email agendado para processamento');
    }
  } catch (error) {
    console.error('❌ Falha no teste de processamento de emails agendados:', (error as Error).message);
  }
}

// Teste: Verificar atualizações da caixa de entrada
async function testCheckInboxUpdates() {
  console.log('\n🧪 Teste: Verificar atualizações da caixa de entrada');
  
  try {
    const result = await callFunction('check_inbox_updates', {
      accountId: EMAIL_ACCOUNT_ID,
      folder: 'INBOX'
    });
    
    console.log('✅ Verificação de caixa de entrada concluída!');
    console.log(`   Novas mensagens: ${result.newMessages}`);
    console.log('   Status da caixa:');
    console.log(`     Total: ${result.mailboxStatus.total}`);
    console.log(`     Recentes: ${result.mailboxStatus.recent}`);
    console.log(`     Não lidas: ${result.mailboxStatus.unseen}`);
  } catch (error) {
    console.error('❌ Falha no teste de verificação da caixa de entrada:', (error as Error).message);
  }
}

// Executa os testes
runTests(); 
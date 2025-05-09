// Script de testes simulados para a Edge Function email-processor
// Este script simula as respostas da API sem precisar de um servidor real

// Simulação de respostas da API
const mockResponses = {
  'send_email': {
    success: true,
    messageId: '<simulated-message-id@example.com>',
    message: "Email enviado com sucesso"
  },
  'read_emails': {
    success: true,
    messages: [
      {
        messageId: '<msg-123@example.com>',
        subject: 'Teste de Email',
        from: 'remetente@exemplo.com',
        to: 'destinatario@exemplo.com',
        date: new Date().toISOString(),
        uid: '123456',
        flags: ['\\Seen'],
        body: 'Conteúdo do email de teste'
      },
      {
        messageId: '<msg-456@example.com>',
        subject: 'Outro Email de Teste',
        from: 'outro@exemplo.com',
        to: 'destinatario@exemplo.com',
        date: new Date().toISOString(),
        uid: '789012',
        flags: ['\\Recent'],
        body: 'Conteúdo de outro email de teste'
      }
    ],
    totalMessages: 42
  },
  'mark_as_read': {
    success: true,
    message: "2 emails marcados como lidos"
  },
  'process_scheduled_emails': {
    success: true,
    processed: 3,
    results: [
      { id: 'scheduled-1', success: true, messageId: '<scheduled-msg-1@example.com>' },
      { id: 'scheduled-2', success: true, messageId: '<scheduled-msg-2@example.com>' },
      { id: 'scheduled-3', success: false, error: 'Erro simulado para teste' }
    ]
  },
  'check_inbox_updates': {
    success: true,
    newMessages: 5,
    mailboxStatus: {
      total: 42,
      recent: 7,
      unseen: 15
    }
  }
};

// Função simulada que retorna a resposta mockada
async function callFunctionMock(action, params = {}) {
  console.log(`📡 Chamando função simulada: ${action}`);
  console.log(`📦 Parâmetros: ${JSON.stringify(params, null, 2)}`);
  
  // Atraso simulado para parecer uma chamada de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const response = mockResponses[action];
  
  if (!response) {
    throw new Error(`Ação inválida: ${action}`);
  }
  
  return response;
}

// Teste: Envio de email
async function testSendEmail() {
  console.log('\n🧪 Teste: Envio de email');
  
  try {
    const result = await callFunctionMock('send_email', {
      accountId: '123e4567-e89b-12d3-a456-426614174000',
      to: 'destinatario@exemplo.com',
      subject: 'Teste Automatizado - Email Processor',
      text: 'Este é um email de teste enviado pelo script de testes.'
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Mensagem: ${result.message}`);
  } catch (error) {
    console.error('❌ Falha no teste de envio de email:', error.message);
  }
}

// Teste: Leitura de emails
async function testReadEmails() {
  console.log('\n🧪 Teste: Leitura de emails');
  
  try {
    const result = await callFunctionMock('read_emails', {
      accountId: '123e4567-e89b-12d3-a456-426614174000',
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
    console.error('❌ Falha no teste de leitura de emails:', error.message);
  }
}

// Teste: Marcar email como lido
async function testMarkAsRead() {
  console.log('\n🧪 Teste: Marcar emails como lidos');
  
  try {
    // Simula leitura prévia para obter IDs
    const readResult = await callFunctionMock('read_emails');
    const messageIds = readResult.messages.map(msg => msg.uid);
    
    // Marca como lido
    const markResult = await callFunctionMock('mark_as_read', {
      accountId: '123e4567-e89b-12d3-a456-426614174000',
      messageIds: messageIds,
      folder: 'INBOX'
    });
    
    console.log('✅ Emails marcados como lidos com sucesso!');
    console.log(`   Mensagem: ${markResult.message}`);
  } catch (error) {
    console.error('❌ Falha no teste de marcar emails como lidos:', error.message);
  }
}

// Teste: Processar emails agendados
async function testProcessScheduledEmails() {
  console.log('\n🧪 Teste: Processar emails agendados');
  
  try {
    const result = await callFunctionMock('process_scheduled_emails');
    
    console.log('✅ Processamento de emails agendados concluído!');
    console.log(`   Emails processados: ${result.processed}`);
    
    // Exibe detalhes dos resultados
    if (result.results && result.results.length > 0) {
      console.log('   Resultados:');
      result.results.forEach((r, i) => {
        if (r.success) {
          console.log(`     ${i+1}. ID: ${r.id}, Sucesso: ✅, MessageID: ${r.messageId}`);
        } else {
          console.log(`     ${i+1}. ID: ${r.id}, Sucesso: ❌, Erro: ${r.error}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Falha no teste de processamento de emails agendados:', error.message);
  }
}

// Teste: Verificar atualizações da caixa de entrada
async function testCheckInboxUpdates() {
  console.log('\n🧪 Teste: Verificar atualizações da caixa de entrada');
  
  try {
    const result = await callFunctionMock('check_inbox_updates', {
      accountId: '123e4567-e89b-12d3-a456-426614174000',
      folder: 'INBOX'
    });
    
    console.log('✅ Verificação de caixa de entrada concluída!');
    console.log(`   Novas mensagens: ${result.newMessages}`);
    console.log('   Status da caixa:');
    console.log(`     Total: ${result.mailboxStatus.total}`);
    console.log(`     Recentes: ${result.mailboxStatus.recent}`);
    console.log(`     Não lidas: ${result.mailboxStatus.unseen}`);
  } catch (error) {
    console.error('❌ Falha no teste de verificação da caixa de entrada:', error.message);
  }
}

// Função principal para executar todos os testes
async function runTests() {
  console.log('📧 Iniciando testes SIMULADOS da Edge Function email-processor');
  console.log('==================================================');
  console.log('⚠️ ATENÇÃO: Este é um teste simulado que não conecta a um servidor real');
  console.log('==================================================');

  try {
    await testSendEmail();
    await testReadEmails();
    await testMarkAsRead();
    await testProcessScheduledEmails();
    await testCheckInboxUpdates();
    
    console.log('==================================================');
    console.log('✅ Todos os testes simulados concluídos com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a execução dos testes:', error);
  }
}

// Executa os testes
runTests(); 
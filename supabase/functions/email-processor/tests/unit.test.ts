// Testes unitários para a Edge Function email-processor
// Execute com: deno test --allow-env --allow-net unit.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// Mock para o cliente Supabase (simulações de resposta)
const mockSupabaseClient = {
  from: (tableName: string) => {
    return {
      select: () => {
        return {
          eq: () => {
            return {
              single: async () => {
                if (tableName === "email_accounts") {
                  return {
                    data: {
                      id: "mock-account-id",
                      email: "teste@exemplo.com",
                      smtp_host: "smtp.exemplo.com",
                      smtp_port: 587,
                      smtp_username: "teste@exemplo.com",
                      smtp_password: "senha123",
                      imap_host: "imap.exemplo.com",
                      imap_port: 993,
                      status: "connected"
                    },
                    error: null
                  };
                }
                
                if (tableName === "scheduled_emails") {
                  return { 
                    data: [], 
                    error: null 
                  };
                }
                
                return { data: null, error: null };
              }
            };
          },
          lte: () => {
            return {
              limit: () => {
                return {
                  data: [],
                  error: null
                };
              }
            };
          }
        };
      },
      insert: () => {
        return { 
          data: { id: "mock-log-id" }, 
          error: null 
        };
      },
      update: () => {
        return {
          eq: () => {
            return { 
              data: { updated: true }, 
              error: null 
            };
          }
        };
      },
      upsert: () => {
        return { 
          data: { id: "mock-received-id" }, 
          error: null 
        };
      }
    };
  }
};

// Testes para a função getEmailConfig
Deno.test("getEmailConfig - deve retornar configurações de email válidas", async () => {
  // Importa a função a ser testada
  // Nota: Em um ambiente real, seria melhor refatorar o código para permitir importações diretas das funções
  const { getEmailConfig } = await import("../index.ts");
  
  // Executa a função
  const config = await getEmailConfig(mockSupabaseClient, "mock-account-id");
  
  // Verifica os resultados
  assertExists(config);
  assertEquals(config.host, "smtp.exemplo.com");
  assertEquals(config.port, 587);
  assertEquals(config.user, "teste@exemplo.com");
  assertEquals(config.password, "senha123");
});

// Teste para envio de email
Deno.test("sendEmail - deve enviar email corretamente", async () => {
  // Importa a função
  const { sendEmail } = await import("../index.ts");
  
  // Parâmetros de teste
  const params = {
    accountId: "mock-account-id",
    to: "destinatario@exemplo.com",
    subject: "Teste Unitário",
    text: "Conteúdo de teste"
  };
  
  // Executa a função
  const response = await sendEmail(mockSupabaseClient, params);
  
  // Verifica a resposta
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertExists(responseData.messageId);
});

// Teste para leitura de emails
Deno.test("readEmails - deve ler emails corretamente", async () => {
  // Importa a função
  const { readEmails } = await import("../index.ts");
  
  // Parâmetros de teste
  const params = {
    accountId: "mock-account-id",
    folder: "INBOX",
    maxMessages: 5,
    onlyUnread: true
  };
  
  // Executa a função
  const response = await readEmails(mockSupabaseClient, params);
  
  // Verifica a resposta
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertExists(responseData.messages);
  assertExists(responseData.totalMessages);
});

// Teste para marcação de emails como lidos
Deno.test("markAsRead - deve marcar emails como lidos corretamente", async () => {
  // Importa a função
  const { markAsRead } = await import("../index.ts");
  
  // Parâmetros de teste
  const params = {
    accountId: "mock-account-id",
    messageIds: ["msg1", "msg2"],
    folder: "INBOX"
  };
  
  // Executa a função
  const response = await markAsRead(mockSupabaseClient, params);
  
  // Verifica a resposta
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.message, "2 emails marcados como lidos");
});

// Teste para processamento de emails agendados
Deno.test("processScheduledEmails - deve processar emails agendados corretamente", async () => {
  // Importa a função
  const { processScheduledEmails } = await import("../index.ts");
  
  // Executa a função
  const response = await processScheduledEmails(mockSupabaseClient);
  
  // Verifica a resposta
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.processed, 0); // Simulação retorna lista vazia
});

// Teste para verificação de atualizações da caixa de entrada
Deno.test("checkInboxUpdates - deve verificar caixa de entrada corretamente", async () => {
  // Importa a função
  const { checkInboxUpdates } = await import("../index.ts");
  
  // Parâmetros de teste
  const params = {
    accountId: "mock-account-id",
    folder: "INBOX"
  };
  
  // Executa a função
  const response = await checkInboxUpdates(mockSupabaseClient, params);
  
  // Verifica a resposta
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertExists(responseData.newMessages);
  assertExists(responseData.mailboxStatus);
  assertExists(responseData.mailboxStatus.total);
}); 
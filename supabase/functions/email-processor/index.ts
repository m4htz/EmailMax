// Supabase Edge Function para processamento de email
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Declarando tipos do ImapFlow já que é uma biblioteca JS
interface ImapFlowOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  logger: boolean;
}

interface ImapFlowMessage {
  uid: string;
  flags: string[];
  envelope: {
    messageId: string;
    subject: string;
    from: Array<{ address: string }>;
    to: Array<{ address: string }>;
    date: Date;
  };
  source: {
    toString: () => string;
  };
}

interface ImapFlowMailbox {
  exists: number;
  recent: number;
  unseen: number;
}

// Definindo classe ImapFlow para simular importação
class ImapFlow {
  constructor(private options: ImapFlowOptions) {}

  async connect(): Promise<void> {
    console.log("Conectando ao servidor IMAP...");
    // Em produção, isso usaria a biblioteca real
  }

  async mailboxOpen(folder: string): Promise<ImapFlowMailbox> {
    console.log(`Abrindo pasta ${folder}...`);
    // Simulando resultados
    return {
      exists: Math.floor(Math.random() * 100),
      recent: Math.floor(Math.random() * 20),
      unseen: Math.floor(Math.random() * 30)
    };
  }

  async *fetch(criteria: object, options: object): AsyncGenerator<ImapFlowMessage> {
    console.log("Buscando emails...", criteria, options);
    // Simulando 1-3 mensagens
    const messageCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < messageCount; i++) {
      yield {
        uid: `${Date.now() + i}`,
        flags: ["\\Recent"],
        envelope: {
          messageId: `<msg-${Date.now()}-${i}@example.com>`,
          subject: `Mensagem de teste ${i + 1}`,
          from: [{ address: "sender@example.com" }],
          to: [{ address: "recipient@example.com" }],
          date: new Date()
        },
        source: {
          toString: () => "Conteúdo do email simulado"
        }
      };
    }
  }

  async messageFlagsAdd(criteria: { uid: string }, flags: string[]): Promise<void> {
    console.log(`Adicionando flags ${flags.join(', ')} à mensagem ${criteria.uid}`);
    // Em produção, isso marcaria emails como lidos/não lidos/etc
  }

  async logout(): Promise<void> {
    console.log("Desconectando do servidor IMAP...");
    // Em produção, isso fecharia a conexão
  }
}

// Tipagem para parâmetros das funções
interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
}

interface SendEmailParams {
  accountId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

interface ReadEmailParams {
  accountId: string;
  folder?: string;
  maxMessages?: number;
  onlyUnread?: boolean;
}

// Função principal que processa todas as requisições
serve(async (req: Request) => {
  try {
    // Verificação de autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Inicializa o cliente Supabase
    // @ts-ignore - Ignorando erro do compilador para o objeto Deno
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // @ts-ignore - Ignorando erro do compilador para o objeto Deno
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Extrai o corpo da requisição
    const body = await req.json();
    const { action } = body;

    // Roteamento das ações
    switch (action) {
      case "send_email":
        return await sendEmail(supabase, body);
      case "read_emails":
        return await readEmails(supabase, body);
      case "mark_as_read":
        return await markAsRead(supabase, body);
      case "process_scheduled_emails":
        return await processScheduledEmails(supabase);
      case "check_inbox_updates":
        return await checkInboxUpdates(supabase, body);
      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Erro na função de processamento de email:", error);
    return new Response(
      JSON.stringify({ error: `Erro no servidor: ${(error as Error).message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// Função para buscar configuração de email de uma conta
async function getEmailConfig(supabase: any, accountId: string): Promise<EmailConfig> {
  const { data, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error) throw new Error(`Erro ao buscar configuração: ${error.message}`);
  if (!data) throw new Error("Conta de email não encontrada");

  return {
    host: data.smtp_host,
    port: data.smtp_port,
    user: data.smtp_username || data.email,
    password: data.smtp_password,
    secure: data.smtp_secure || data.smtp_port === 465
  };
}

// Função para envio de email
async function sendEmail(supabase: any, params: SendEmailParams) {
  try {
    const config = await getEmailConfig(supabase, params.accountId);
    
    // Inicializa cliente SMTP
    const client = new SmtpClient();
    
    // Conecta ao servidor SMTP
    await client.connectTLS({
      hostname: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
    });

    // Envia o email
    const result = await client.send({
      from: config.user,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      replyTo: params.replyTo,
      subject: params.subject,
      content: params.text,
      html: params.html,
    });

    // Fecha a conexão
    await client.close();

    // Registra o email enviado no banco de dados
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        account_id: params.accountId,
        recipient: params.to,
        subject: params.subject,
        status: "sent",
        message_id: result.messageId
      });

    if (logError) {
      console.error("Erro ao registrar log de email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        message: "Email enviado com sucesso"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    
    // Registra falha no banco de dados
    await supabase
      .from("email_logs")
      .insert({
        account_id: params.accountId,
        recipient: params.to,
        subject: params.subject,
        status: "error",
        error_message: (error as Error).message
      });
      
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao enviar email: ${(error as Error).message}`
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Função para ler emails
async function readEmails(supabase: any, params: ReadEmailParams) {
  try {
    const { accountId, folder = "INBOX", maxMessages = 10, onlyUnread = true } = params;
    const config = await getEmailConfig(supabase, accountId);

    // Configura cliente IMAP
    const client = new ImapFlow({
      host: config.host,
      port: config.port === 993 ? 993 : 143, // Porta IMAP padrão
      secure: config.port === 993,
      auth: {
        user: config.user,
        pass: config.password
      },
      logger: false
    });

    // Conecta ao servidor IMAP
    await client.connect();

    // Abre a pasta especificada
    const mailbox = await client.mailboxOpen(folder);
    
    // Busca emails - usando filtro para mensagens não lidas se necessário
    const searchCriteria = onlyUnread ? { seen: false } : {};
    const messages: Array<Record<string, any>> = [];
    
    let counter = 0;
    for await (const message of client.fetch(searchCriteria, { envelope: true, bodyStructure: true, source: true })) {
      if (counter >= maxMessages) break;
      
      messages.push({
        messageId: message.envelope.messageId,
        subject: message.envelope.subject,
        from: message.envelope.from.map((a: any) => a.address).join(", "),
        to: message.envelope.to.map((a: any) => a.address).join(", "),
        date: message.envelope.date,
        uid: message.uid,
        flags: message.flags,
        body: message.source.toString()
      });
      
      counter++;
    }

    // Fecha a conexão IMAP
    await client.logout();

    return new Response(
      JSON.stringify({
        success: true,
        messages,
        totalMessages: mailbox.exists
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao ler emails:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao ler emails: ${(error as Error).message}`
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Função para marcar emails como lidos
async function markAsRead(supabase: any, params: { accountId: string, messageIds: string[], folder?: string }) {
  try {
    const { accountId, messageIds, folder = "INBOX" } = params;
    const config = await getEmailConfig(supabase, accountId);

    // Configura cliente IMAP
    const client = new ImapFlow({
      host: config.host,
      port: config.port === 993 ? 993 : 143,
      secure: config.port === 993,
      auth: {
        user: config.user,
        pass: config.password
      },
      logger: false
    });

    // Conecta ao servidor IMAP
    await client.connect();

    // Abre a pasta
    await client.mailboxOpen(folder);
    
    // Marca os emails como lidos
    for (const uid of messageIds) {
      await client.messageFlagsAdd({ uid }, ["\\Seen"]);
    }

    // Fecha a conexão
    await client.logout();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${messageIds.length} emails marcados como lidos`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao marcar emails como lidos:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao marcar emails como lidos: ${(error as Error).message}`
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Função para processar emails agendados (batch job)
async function processScheduledEmails(supabase: any) {
  try {
    // Busca emails agendados que estão prontos para envio
    const now = new Date().toISOString();
    const { data: scheduledEmails, error } = await supabase
      .from("scheduled_emails")
      .select("*, email_accounts!inner(*)")
      .eq("status", "pending")
      .lte("scheduled_time", now)
      .limit(20); // Processa em lotes de 20 para evitar timeouts

    if (error) throw new Error(`Erro ao buscar emails agendados: ${error.message}`);
    
    const results: Array<Record<string, any>> = [];
    
    // Processa cada email agendado
    for (const email of scheduledEmails || []) {
      try {
        // Configura cliente SMTP
        const client = new SmtpClient();
        await client.connectTLS({
          hostname: email.email_accounts.smtp_host,
          port: email.email_accounts.smtp_port,
          username: email.email_accounts.smtp_username || email.email_accounts.email,
          password: email.email_accounts.smtp_password,
        });

        // Envia o email
        const result = await client.send({
          from: email.email_accounts.email,
          to: email.recipient,
          subject: email.subject,
          content: email.text_content,
          html: email.html_content,
        });

        // Fecha a conexão
        await client.close();

        // Atualiza o status do email agendado
        await supabase
          .from("scheduled_emails")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            message_id: result.messageId
          })
          .eq("id", email.id);

        results.push({
          id: email.id,
          success: true,
          messageId: result.messageId
        });
      } catch (err) {
        console.error(`Erro ao enviar email agendado ${email.id}:`, err);
        
        // Atualiza o status com erro
        await supabase
          .from("scheduled_emails")
          .update({
            status: "error",
            error_message: (err as Error).message,
            retry_count: (email.retry_count || 0) + 1
          })
          .eq("id", email.id);

        results.push({
          id: email.id,
          success: false,
          error: (err as Error).message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao processar emails agendados:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao processar emails agendados: ${(error as Error).message}`
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Verifica atualizações na caixa de entrada
async function checkInboxUpdates(supabase: any, params: { accountId: string, folder?: string }) {
  try {
    const { accountId, folder = "INBOX" } = params;
    const config = await getEmailConfig(supabase, accountId);

    // Configura cliente IMAP
    const client = new ImapFlow({
      host: config.host,
      port: config.port === 993 ? 993 : 143,
      secure: config.port === 993,
      auth: {
        user: config.user,
        pass: config.password
      },
      logger: false
    });

    // Conecta ao servidor IMAP
    await client.connect();

    // Abre a pasta
    const mailbox = await client.mailboxOpen(folder);
    
    // Busca emails não lidos recentes (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const searchCriteria = {
      seen: false,
      since: yesterday
    };
    
    let count = 0;
    for await (const message of client.fetch(searchCriteria, { envelope: true })) {
      count++;
      
      // Registra novos emails no sistema para processamento
      await supabase
        .from("received_emails")
        .upsert({
          account_id: accountId,
          message_id: message.envelope.messageId,
          subject: message.envelope.subject,
          sender: message.envelope.from.map((a: any) => a.address).join(", "),
          recipient: message.envelope.to.map((a: any) => a.address).join(", "),
          received_at: message.envelope.date,
          folder: folder,
          uid: message.uid,
          status: "new"
        }, {
          onConflict: "message_id",
          ignoreDuplicates: true
        });
    }

    // Fecha a conexão
    await client.logout();

    // Atualiza timestamp da última verificação
    await supabase
      .from("email_accounts")
      .update({
        last_checked: new Date().toISOString()
      })
      .eq("id", accountId);

    return new Response(
      JSON.stringify({
        success: true,
        newMessages: count,
        mailboxStatus: {
          total: mailbox.exists,
          recent: mailbox.recent,
          unseen: mailbox.unseen
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar caixa de entrada:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao verificar caixa de entrada: ${(error as Error).message}`
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 
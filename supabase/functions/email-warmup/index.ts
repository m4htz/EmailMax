// Deno Edge Function para gerenciamento de aquecimento de email
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Biblioteca simulada para IMAP
import * as ImapSimulator from "./imap-simulator.ts";
// Biblioteca simulada para SMTP
import * as SmtpSimulator from "./smtp-simulator.ts";

// Tipos para as tabelas
interface EmailAccount {
  id: string;
  email: string;
  password: string;
  smtp_host: string;
  smtp_port: number;
  imap_host: string;
  imap_port: number;
  status: "connected" | "warming_up" | "error";
  user_id: string;
  last_checked: string | null;
}

interface WarmupPlan {
  id: string;
  account_id: string;
  daily_volume: number;
  reply_percentage: number;
  active: boolean;
  start_date: string;
  end_date: string | null;
  status: "active" | "paused" | "completed";
  user_id: string;
}

interface WarmupMetric {
  id?: string;
  plan_id: string;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_replied: number;
  date?: string;
  user_id: string;
}

interface EmailInteraction {
  subject: string;
  from: string;
  to: string;
  body: string;
  messageId?: string;
  date?: Date;
  read?: boolean;
  replied?: boolean;
}

serve(async (req: Request) => {
  try {
    // Cria um cliente Supabase autenticado usando o token JWT do request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Inicializa o cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Extrai parâmetros da requisição
    const { action, accountId, planId } = await req.json();

    // Executa a ação solicitada
    switch (action) {
      case "test_connection":
        return await testConnection(supabase, accountId);
      case "start_warmup":
        return await startWarmup(supabase, planId);
      case "pause_warmup":
        return await pauseWarmup(supabase, planId);
      case "resume_warmup":
        return await resumeWarmup(supabase, planId);
      case "process_daily_warmup":
        return await processDailyWarmup(supabase);
      case "check_inbox":
        return await checkInbox(supabase, accountId);
      case "monitor_interactions":
        return await monitorInteractions(supabase, accountId);
      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erro no servidor: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// Testa a conexão com a conta de email
async function testConnection(supabase: any, accountId: string) {
  try {
    // Recupera os dados da conta
    const { data: account, error } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error) throw new Error(error.message);
    if (!account) throw new Error("Conta não encontrada");

    // Em uma implementação real, faríamos a conexão IMAP/SMTP aqui
    // Simulando teste de conexão com IMAP e SMTP
    const imapResult = await ImapSimulator.testConnection({
      host: account.imap_host,
      port: account.imap_port,
      user: account.smtp_username,
      password: account.smtp_password,
    });
    
    const smtpResult = await SmtpSimulator.testConnection({
      host: account.smtp_host,
      port: account.smtp_port,
      user: account.smtp_username,
      password: account.smtp_password,
    });

    const testResult = {
      success: imapResult.success && smtpResult.success,
      smtp: smtpResult.success,
      imap: imapResult.success,
      message: imapResult.success && smtpResult.success 
        ? "Conexão realizada com sucesso" 
        : "Falha na conexão",
      details: {
        imap: imapResult.message,
        smtp: smtpResult.message
      }
    };

    // Atualiza o status da conta
    await supabase
      .from("email_accounts")
      .update({
        status: testResult.success ? "connected" : "error",
        last_checked: new Date().toISOString(),
      })
      .eq("id", accountId);

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Em caso de erro, atualiza o status da conta
    await supabase
      .from("email_accounts")
      .update({
        status: "error",
        last_checked: new Date().toISOString(),
      })
      .eq("id", accountId);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao conectar: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Inicia o plano de aquecimento
async function startWarmup(supabase: any, planId: string) {
  try {
    // Atualiza o status do plano
    const { data, error } = await supabase
      .from("warmup_plans")
      .update({
        status: "active",
        start_date: new Date().toISOString(),
      })
      .eq("id", planId)
      .select();

    if (error) throw new Error(error.message);

    // Atualiza o status da conta associada
    await supabase
      .from("email_accounts")
      .update({
        status: "warming_up",
      })
      .eq("id", data[0].account_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Plano de aquecimento iniciado com sucesso",
        data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao iniciar plano de aquecimento: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Pausa o plano de aquecimento
async function pauseWarmup(supabase: any, planId: string) {
  try {
    // Atualiza o status do plano
    const { data, error } = await supabase
      .from("warmup_plans")
      .update({
        status: "paused",
      })
      .eq("id", planId)
      .select();

    if (error) throw new Error(error.message);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Plano de aquecimento pausado com sucesso",
        data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao pausar plano de aquecimento: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Retoma o plano de aquecimento
async function resumeWarmup(supabase: any, planId: string) {
  try {
    // Atualiza o status do plano
    const { data, error } = await supabase
      .from("warmup_plans")
      .update({
        status: "active",
      })
      .eq("id", planId)
      .select();

    if (error) throw new Error(error.message);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Plano de aquecimento retomado com sucesso",
        data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao retomar plano de aquecimento: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// NOVA FUNÇÃO: Verifica a caixa de entrada de uma conta específica
async function checkInbox(supabase: any, accountId: string) {
  try {
    // Recupera os dados da conta
    const { data: account, error } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error) throw new Error(error.message);
    if (!account) throw new Error("Conta não encontrada");

    // Em uma implementação real, conectaríamos ao servidor IMAP
    // Simulando busca de emails na caixa de entrada
    const emails = await ImapSimulator.fetchEmails({
      host: account.imap_host,
      port: account.imap_port,
      user: account.smtp_username,
      password: account.smtp_password,
      folder: "INBOX",
      limit: 10,
      unseen: true // apenas emails não lidos
    });

    // Registrar os emails encontrados no banco
    for (const email of emails) {
      // Verificar se a interação já existe pelo ID da mensagem
      const { data: existing, error: checkError } = await supabase
        .from("warmup_interactions")
        .select("id")
        .eq("message_id", email.messageId)
        .maybeSingle();

      if (checkError) throw new Error(checkError.message);

      // Se não existe, registrar a nova interação
      if (!existing) {
        const { error: insertError } = await supabase
          .from("warmup_interactions")
          .insert({
            warmup_plan_id: account.warmup_plan_id, // assumindo que existe um relacionamento
            message_id: email.messageId,
            subject: email.subject,
            sent_to: email.to,
            sent_from: email.from,
            body_text: email.body,
            status: "recebido",
            interaction_type: "inbound",
            received_at: new Date().toISOString()
          });

        if (insertError) throw new Error(insertError.message);
      }
    }

    // Atualiza o timestamp de verificação da conta
    await supabase
      .from("email_accounts")
      .update({
        last_checked: new Date().toISOString(),
      })
      .eq("id", accountId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Caixa de entrada verificada. Encontrados ${emails.length} emails.`,
        data: emails,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao verificar caixa de entrada: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// NOVA FUNÇÃO: Monitora interações de emails enviados anteriormente
async function monitorInteractions(supabase: any, accountId: string) {
  try {
    // Recupera os dados da conta
    const { data: account, error } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error) throw new Error(error.message);
    if (!account) throw new Error("Conta não encontrada");

    // Busca interações enviadas recentemente que podem ter recebido resposta
    const { data: interactions, error: interactionsError } = await supabase
      .from("warmup_interactions")
      .select("*")
      .eq("status", "enviado")
      .eq("interaction_type", "outbound")
      .is("replied_at", null);

    if (interactionsError) throw new Error(interactionsError.message);

    // Simulando verificação de respostas para emails enviados
    const results = [];
    for (const interaction of interactions) {
      // Em implementação real, verificaríamos respostas via IMAP
      const hasResponse = await ImapSimulator.checkReplies({
        host: account.imap_host,
        port: account.imap_port,
        user: account.smtp_username,
        password: account.smtp_password,
        messageId: interaction.message_id,
        subject: interaction.subject
      });

      if (hasResponse.found) {
        // Atualiza o status da interação
        const { error: updateError } = await supabase
          .from("warmup_interactions")
          .update({
            status: "respondido",
            replied_at: new Date().toISOString(),
          })
          .eq("id", interaction.id);

        if (updateError) throw new Error(updateError.message);

        // Adiciona ao log de resultados
        results.push({
          interaction_id: interaction.id,
          message_id: interaction.message_id,
          subject: interaction.subject,
          replied: true,
          reply_details: hasResponse.details
        });
      }
    }

    // Atualiza o timestamp de verificação da conta
    await supabase
      .from("email_accounts")
      .update({
        last_checked: new Date().toISOString(),
      })
      .eq("id", accountId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monitoramento concluído. ${results.length} respostas encontradas.`,
        data: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao monitorar interações: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Processa o aquecimento diário para todas as contas ativas
async function processDailyWarmup(supabase: any) {
  try {
    // Busca todos os planos ativos
    const { data: plans, error: plansError } = await supabase
      .from("warmup_plans")
      .select("*, email_accounts(*)")
      .eq("status", "active")
      .eq("active", true);

    if (plansError) throw new Error(plansError.message);

    // Se não há planos ativos, retorna
    if (!plans || plans.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum plano de aquecimento ativo encontrado",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Dados de processamento para cada plano
    const processResults = [];

    // Busca contas seed para interação
    const { data: seedAccounts, error: seedError } = await supabase
      .from("seed_accounts")
      .select("*")
      .eq("is_active", true)
      .limit(10);

    if (seedError) throw new Error(seedError.message);
    
    if (!seedAccounts || seedAccounts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Nenhuma conta seed ativa encontrada para interações",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Busca templates de email disponíveis
    const { data: templates, error: templatesError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("is_active", true);

    if (templatesError) throw new Error(templatesError.message);

    // Processa cada plano
    for (const plan of plans) {
      // Calcula o número de emails a enviar hoje
      const emailsToSend = calculateDailyEmails(plan);
      const emailsReplied = Math.floor(emailsToSend * (plan.reply_percentage / 100));
      
      // Lista para armazenar detalhes das interações
      const interactions = [];

      // Enviando emails para contas seed (simulado)
      for (let i = 0; i < emailsToSend; i++) {
        // Escolhe uma conta seed aleatória
        const randomSeedIndex = Math.floor(Math.random() * seedAccounts.length);
        const seedAccount = seedAccounts[randomSeedIndex];
        
        // Escolhe um template aleatório
        const randomTemplateIndex = Math.floor(Math.random() * templates.length);
        const template = templates[randomTemplateIndex];
        
        // Gera um ID de mensagem único
        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Simula o envio do email
        const sentResult = await SmtpSimulator.sendEmail({
          from: plan.email_accounts.email,
          to: seedAccount.email_address,
          subject: template.subject,
          body: template.body,
          host: plan.email_accounts.smtp_host,
          port: plan.email_accounts.smtp_port,
          user: plan.email_accounts.smtp_username,
          password: plan.email_accounts.smtp_password,
          messageId
        });
        
        if (sentResult.success) {
          // Registra a interação no banco
          const { data: interaction, error: interactionError } = await supabase
            .from("warmup_interactions")
            .insert({
              warmup_plan_id: plan.id,
              seed_account_id: seedAccount.id,
              message_id: messageId,
              subject: template.subject,
              sent_to: seedAccount.email_address,
              sent_from: plan.email_accounts.email,
              body_text: template.body,
              status: "enviado",
              sent_at: new Date().toISOString(),
              interaction_type: "outbound"
            })
            .select()
            .single();
            
          if (interactionError) throw new Error(interactionError.message);
          
          interactions.push(interaction);
        }
        
        // Adiciona um atraso aleatório para simular comportamento humano
        // Em produção, isso seria gerenciado por uma fila assíncrona
        const randomDelay = Math.floor(Math.random() * 3000) + 1000; // 1-4 segundos
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }

      // Registra as métricas diárias
      const { data: metrics, error: metricsError } = await supabase
        .from("warmup_metrics")
        .insert({
          warmup_plan_id: plan.id,
          day_number: calculateDayNumber(plan.start_date),
          date: new Date().toISOString().split('T')[0],
          emails_sent: interactions.length,
          emails_opened: Math.floor(interactions.length * 0.9), // simulação: 90% abertos
          emails_replied: emailsReplied,
          user_id: plan.user_id,
        })
        .select();

      if (metricsError) throw new Error(metricsError.message);

      // Atualiza o volume atual do plano
      await supabase
        .from("warmup_plans")
        .update({
          current_volume: interactions.length,
          current_day: calculateDayNumber(plan.start_date)
        })
        .eq("id", plan.id);

      processResults.push({
        plan_id: plan.id,
        account_email: plan.email_accounts.email,
        emails_sent: interactions.length,
        interactions: interactions,
        metrics: metrics[0],
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processado aquecimento para ${plans.length} planos`,
        data: processResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao processar aquecimento diário: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Calcula o número de emails a enviar com base no plano e no progresso atual
function calculateDailyEmails(plan: WarmupPlan & { email_accounts: EmailAccount }) {
  // Implementação expandida: considera crescimento progressivo
  // Determina em qual dia do plano estamos
  const dayNumber = calculateDayNumber(plan.start_date);
  
  // Volume inicial configurado
  const startingVolume = plan.starting_volume || 5;
  
  // Volume máximo configurado
  const maxVolume = plan.daily_volume;
  
  // Se o dia for maior que o número total de dias do plano, usa o volume máximo
  if (dayNumber >= 30) {
    return maxVolume;
  }
  
  // Calcula o crescimento diário com base na porcentagem de rampa
  const dailyIncrease = (maxVolume - startingVolume) / 30;
  
  // Calcula o volume para o dia atual
  const calculatedVolume = Math.round(startingVolume + (dailyIncrease * dayNumber));
  
  // Adiciona variação de ±10% para simular comportamento humano
  const variation = Math.random() * 0.2 - 0.1; // -10% a +10%
  const adjustedVolume = Math.round(calculatedVolume * (1 + variation));
  
  // Garante que o volume está dentro dos limites
  return Math.max(1, Math.min(adjustedVolume, maxVolume));
}

// Calcula o número do dia atual do plano
function calculateDayNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  
  // Diferença em milissegundos
  const diffTime = Math.abs(today.getTime() - start.getTime());
  
  // Converte para dias
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Retorna o dia (mínimo 1)
  return Math.max(1, diffDays);
} 
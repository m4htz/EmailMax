import { createClient } from '@/lib/supabase/client';
import { getSecureCredential, CredentialType } from '@/lib/utils/secure-storage';

// Configuração do microserviço Python de validação IMAP/SMTP
const VALIDATION_SERVICE_URL = process.env.NEXT_PUBLIC_EMAIL_VALIDATION_SERVICE_URL || 'http://localhost:5000';
const API_KEY = process.env.EMAIL_VALIDATION_API_KEY || 'dev_key_change_me_in_production';

export interface EmailCredentials {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  details?: {
    imap?: {
      success: boolean;
      message?: string;
    },
    smtp?: {
      success: boolean;
      message?: string;
    },
    // Campos adicionais para detalhamento de erros e sinalizações
    error?: string;
    provider?: string;
    description?: string;
    connectionType?: string;
    serviceError?: boolean;
    netError?: boolean;
    microserviceUrl?: string;
    rawResponse?: string;
    [key: string]: any; // Para permitir propriedades adicionais flexíveis
  };
}

/**
 * Testa a conexão com uma conta de email usando o microserviço Python de validação IMAP/SMTP.
 * Não utiliza mais Edge Functions do Supabase que têm limitações de conexão com portas de email.
 */
export async function testEmailConnection(credentials: EmailCredentials): Promise<TestConnectionResult> {
  if (!credentials) {
    return {
      success: false,
      message: 'Credenciais não fornecidas',
      details: { error: 'missing_credentials' }
    };
  }

  try {
    console.log("Iniciando teste de conexão com credenciais:", {
      email: credentials.email,
      imapHost: credentials.imapHost,
      imapPort: credentials.imapPort,
      smtpHost: credentials.smtpHost,
      smtpPort: credentials.smtpPort
    });
    
    // Se for Gmail, verificar formato da senha no cliente antes de enviar ao servidor
    if (credentials.imapHost === 'imap.gmail.com') {
      const cleanPassword = credentials.password.trim().replace(/\s+/g, ' ');
      const gmailPattern = /^[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}$/i;
      
      if (!gmailPattern.test(cleanPassword)) {
        console.warn("Formato de senha do Gmail incorreto:", cleanPassword);
        return {
          success: false,
          message: 'Formato de senha de aplicativo do Gmail inválido. O formato correto é: xxxx xxxx xxxx xxxx',
          details: {
            error: 'Formato de senha inválido',
            provider: 'gmail'
          }
        };
      }
    }
    
    try {
      console.log("Chamando microserviço de validação IMAP/SMTP:", VALIDATION_SERVICE_URL);
      
      // Verificar se o microserviço está configurado corretamente
      if (!VALIDATION_SERVICE_URL) {
        throw new Error('URL do microserviço de validação não configurada');
      }
      
      // Verificar se o microserviço está disponível com um timeout
      let fetchController = new AbortController();
      const timeoutId = setTimeout(() => fetchController.abort(), 8000); // Aumentado o timeout para 8 segundos
      
      try {
        const response = await fetch(`${VALIDATION_SERVICE_URL}/api/test-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            imapHost: credentials.imapHost,
            imapPort: credentials.imapPort,
            smtpHost: credentials.smtpHost,
            smtpPort: credentials.smtpPort,
            testImap: true,
            testSmtp: true,
            autodetect: true
          }),
          signal: fetchController.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na chamada do microserviço (${response.status}):`, errorText);
          
          return {
            success: false,
            message: `Falha na conexão com o serviço de validação: ${errorText || 'Erro desconhecido'}`,
            details: {
              error: errorText,
              connectionType: 'error'
            }
          };
        }
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Erro ao processar resposta JSON:", jsonError);
          return {
            success: false,
            message: 'Resposta inválida do serviço de validação',
            details: {
              error: 'invalid_json_response',
              connectionType: 'error',
              rawResponse: await response.text()
            }
          };
        }
        
        // Formatar a resposta para o cliente
        const result: TestConnectionResult = {
          success: data.success,
          message: data.message,
          details: {
            ...data.details,
            connectionType: 'real'  // Indicar que este é um teste real
          }
        };
        
        console.log("Resultado do teste de conexão via microserviço:", result);
        
        // Registrar o resultado no banco de dados Supabase (para histórico)
        try {
          const supabase = createClient();
          await supabase.from('validation_logs').insert({
            account_id: null, // Será preenchido posteriormente se a conta for salva
            success: result.success,
            message: result.message,
            service: 'microservice'
          });
        } catch (logError) {
          console.error("Erro ao registrar log de validação:", logError);
          // Não impede o fluxo principal se o log falhar
        }
        
        return result;
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout ao tentar conectar ao serviço de validação');
        }
        throw fetchError;
      }
      
    } catch (serviceError: any) {
      console.error("Erro ao chamar microserviço de validação:", serviceError);
      
      // Tratar erros de rede específicos
      let errorMessage = 'Não foi possível conectar ao serviço de validação de email.';
      let errorDetails: TestConnectionResult['details'] = {
        error: serviceError.message || 'Erro na conexão com o serviço de validação',
        connectionType: 'error',
        serviceError: true,
        microserviceUrl: VALIDATION_SERVICE_URL
      };
      
      // Detectar erros de conexão recusada ou host não encontrado
      if (serviceError.message && (
        serviceError.message.includes('Failed to fetch') || 
        serviceError.message.includes('NetworkError') ||
        serviceError.message.includes('Network request failed')
      )) {
        errorMessage = 'O microserviço de validação IMAP/SMTP não está acessível. Verifique se está em execução.';
        errorDetails.netError = true;
      }
      
      // Fornecimento de mensagem de erro mais detalhada para o usuário
      return {
        success: false,
        message: errorMessage,
        details: errorDetails
      };
    }
  } catch (error: any) {
    console.error("Erro geral no teste de conexão:", error);
    return {
      success: false,
      message: `Erro ao testar conexão: ${error.message || 'Erro desconhecido'}`,
      details: { error: error.message || 'Erro desconhecido' }
    };
  }
}

/**
 * Testa a conexão com uma conta de email usando credenciais armazenadas no Vault
 */
export async function testEmailConnectionWithStoredCredentials(
  userId: string,
  accountId: string
): Promise<TestConnectionResult> {
  if (!userId || !accountId) {
    return {
      success: false,
      message: 'Parâmetros de usuário ou conta ausentes',
      details: { error: 'missing_parameters' }
    };
  }
  
  try {
    const supabase = createClient();
    
    // 1. Obter os dados da conta
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();
    
    if (accountError || !account) {
      throw new Error('Conta de email não encontrada ou acesso negado');
    }
    
    // 2. Obter as credenciais armazenadas no vault
    const password = await getSecureCredential(
      userId,
      accountId,
      CredentialType.EMAIL_PASSWORD
    );
    
    if (!password) {
      throw new Error('Credenciais não encontradas');
    }
    
    // 3. Testar a conexão usando as credenciais recuperadas
    const result = await testEmailConnection({
      email: account.email_address,
      password,
      imapHost: account.imap_host,
      imapPort: account.imap_port,
      smtpHost: account.smtp_host,
      smtpPort: account.smtp_port
    });
    
    // 4. Registrar o resultado no banco de dados
    try {
      await supabase.from('validation_logs').insert({
        account_id: accountId,
        success: result.success,
        message: result.message,
        service: 'microservice'
      });
    } catch (logError) {
      console.error("Erro ao registrar log de validação:", logError);
      // Não impede o fluxo principal se o log falhar
    }
    
    return result;
  } catch (error: any) {
    console.error('Erro ao testar conexão com credenciais armazenadas:', error);
    return { 
      success: false, 
      message: error.message || 'Erro ao acessar credenciais armazenadas'
    };
  }
} 
import { createClient } from '@/lib/supabase/client';

// Definições de tipo para este exemplo
interface EmailCredentials {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

interface TestConnectionResult {
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
    connectionType?: string;
    [key: string]: any;
  };
}

/**
 * URL do microserviço de validação IMAP/SMTP
 * 
 * Substitua pelo URL real onde o microserviço está hospedado.
 * Em produção, deve ser uma URL HTTPS.
 */
const VALIDATION_SERVICE_URL = process.env.NEXT_PUBLIC_EMAIL_VALIDATION_SERVICE_URL || 'http://localhost:5000';

/**
 * Chave de API para autenticação com o microserviço
 * 
 * IMPORTANTE: Nunca exponha esta chave no cliente. 
 * Em uma implementação real, seria melhor passar por um endpoint do backend.
 */
const API_KEY = process.env.EMAIL_VALIDATION_API_KEY || 'dev_key_change_me_in_production';

/**
 * Testa a conexão com uma conta de email usando credenciais fornecidas diretamente
 */
export async function testEmailConnection(credentials: EmailCredentials): Promise<TestConnectionResult> {
  try {
    console.log("Iniciando teste de conexão com credenciais:", {
      email: credentials.email,
      imapHost: credentials.imapHost,
      imapPort: credentials.imapPort,
      smtpHost: credentials.smtpHost,
      smtpPort: credentials.smtpPort
    });
    
    // Verificações do cliente (opcional, mantida do código original)
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
      // Chamar o microserviço de validação IMAP/SMTP
      console.log("Chamando microserviço de validação:", VALIDATION_SERVICE_URL);
      
      if (!VALIDATION_SERVICE_URL || VALIDATION_SERVICE_URL === 'http://localhost:5000') {
        console.warn("URL do microserviço não configurada ou usando valor padrão:", VALIDATION_SERVICE_URL);
      }
      
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
          // Permitir detecção automática se o provedor for conhecido
          autodetect: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na chamada do microserviço (${response.status}):`, errorText);
        
        // Se o erro for 404 ou 500, pode indicar problema com o microserviço
        if (response.status === 404 || response.status >= 500) {
          throw new Error(`Serviço de validação não disponível (${response.status}): ${errorText}`);
        }
        
        // Para outros erros, retornar a mensagem específica
        return {
          success: false,
          message: `Falha na conexão: ${errorText || 'Erro desconhecido'}`,
          details: {
            error: errorText,
            connectionType: 'error'
          }
        };
      }
      
      const data = await response.json();
      
      // Garantir que a resposta seja compatível com o formato esperado pelo EmailMax
      const result: TestConnectionResult = {
        success: data.success,
        message: data.message,
        details: {
          ...data.details,
          // Indicar que este é um teste real, não uma simulação
          connectionType: 'real'
        }
      };
      
      console.log("Resultado do teste de conexão:", result);
      return result;
      
    } catch (apiError: any) {
      console.error("Erro ao chamar microserviço de validação:", apiError);
      
      // Fornecer um feedback mais claro sobre o problema com o microserviço
      return {
        success: false,
        message: 'Não foi possível conectar ao serviço de validação de email. Verifique se o microserviço está em execução.',
        details: {
          error: apiError.message || 'Erro na conexão com o serviço de validação',
          connectionType: 'error',
          serviceError: true
        }
      };
    }
  } catch (error: any) {
    console.error("Erro ao testar conexão:", error);
    return {
      success: false,
      message: error.message || "Erro desconhecido ao testar conexão"
    };
  }
}

// Restante do código original (testEmailConnectionWithStoredCredentials, etc.) 
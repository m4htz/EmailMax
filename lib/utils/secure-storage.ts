import { createClient } from '@/lib/supabase/client';

/**
 * Tipos de credenciais que podem ser armazenadas
 */
export enum CredentialType {
  EMAIL_PASSWORD = 'email_password',
  SMTP_PASSWORD = 'smtp_password',
  API_KEY = 'api_key',
  OAUTH_TOKEN = 'oauth_token',
  OAUTH_REFRESH_TOKEN = 'oauth_refresh_token'
}

/**
 * Interface para armazenar credenciais no Supabase Vault
 */
export interface SecureCredentialOptions {
  userId: string;
  accountId: string;
  credentialType: CredentialType | string;
  credentialKey?: string;
  value: string;
}

/**
 * Armazena credenciais sensíveis no Supabase Vault
 * Usa a função SQL create_secure_credential para armazenar com segurança
 */
export async function storeSecureCredential(options: SecureCredentialOptions): Promise<string | null> {
  try {
    const supabase = createClient();
    
    // Se estivermos em desenvolvimento, permitir logs mais detalhados
    if (process.env.NODE_ENV === 'development') {
      console.log(`Tentando armazenar credencial para usuario ${options.userId} e conta ${options.accountId}`);
    }
    
    // Chamar a função RPC para criar uma credencial segura
    const { data, error } = await supabase.rpc('create_secure_credential', {
      p_user_id: options.userId,
      p_account_id: options.accountId,
      p_credential_type: options.credentialType,
      p_credential_key: options.credentialKey || options.credentialType,
      p_credential_value: options.value
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Detalhes do erro ao armazenar credencial:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.error('Erro ao armazenar credencial:', error.message);
      }
      throw error;
    }

    // Retorna o ID da credencial criada
    return data;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro detalhado ao armazenar credencial:', error);
      
      // Em desenvolvimento, permitir criar credenciais simuladas
      if (options.userId === '00000000-0000-0000-0000-000000000000') {
        console.log('Usando ID de usuário de desenvolvimento, retornando ID de credencial simulada');
        return 'dev-credential-id';
      }
    } else {
      console.error('Erro ao armazenar credencial:', error);
    }
    return null;
  }
}

/**
 * Recupera credenciais sensíveis do Supabase Vault
 * Usa a função SQL get_secure_credential para obter a credencial descriptografada
 */
export async function getSecureCredential(
  userId: string, 
  accountId: string, 
  credentialType: CredentialType | string
): Promise<string | null> {
  try {
    const supabase = createClient();
    
    // Chamar a função RPC para obter uma credencial segura
    const { data, error } = await supabase.rpc('get_secure_credential', {
      p_user_id: userId,
      p_account_id: accountId,
      p_credential_type: credentialType
    });

    if (error) {
      console.error('Erro ao recuperar credencial:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao recuperar credencial:', error);
    return null;
  }
}

/**
 * Atualiza uma credencial existente no Supabase Vault
 * Usa a função SQL update_secure_credential para atualizar o valor armazenado
 */
export async function updateSecureCredential(
  userId: string,
  accountId: string,
  credentialType: CredentialType | string,
  newValue: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Chamar a função RPC para atualizar uma credencial segura
    const { data, error } = await supabase.rpc('update_secure_credential', {
      p_user_id: userId,
      p_account_id: accountId,
      p_credential_type: credentialType,
      p_new_value: newValue
    });

    if (error) {
      console.error('Erro ao atualizar credencial:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar credencial:', error);
    return false;
  }
}

/**
 * Remove uma credencial do Supabase Vault
 * Usa a função SQL delete_secure_credential para remover a referência à credencial
 */
export async function deleteSecureCredential(
  userId: string,
  accountId: string,
  credentialType: CredentialType | string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Chamar a função RPC para excluir uma credencial segura
    const { data, error } = await supabase.rpc('delete_secure_credential', {
      p_user_id: userId,
      p_account_id: accountId,
      p_credential_type: credentialType
    });

    if (error) {
      console.error('Erro ao excluir credencial:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao excluir credencial:', error);
    return false;
  }
} 
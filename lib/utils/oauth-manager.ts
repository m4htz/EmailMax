import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// Interface para as informações de token OAuth
interface OAuthToken {
  provider: string;
  provider_token: string;
  provider_refresh_token?: string;
  expires_at?: number;
  user_id: string;
  updated_at: string;
}

// Hook para gerenciar a atualização de tokens OAuth
export function useOAuthTokenRefresh(userId?: string, interval = 5 * 60 * 1000) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Função para atualizar tokens expirados ou próximos de expirar
  const refreshTokens = useCallback(async () => {
    if (!userId) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      const supabase = createClient();
      
      // Buscar tokens OAuth do usuário que estão próximos de expirar
      const { data: tokens, error: fetchError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .lt('expires_at', Math.floor(Date.now() / 1000) + 24 * 60 * 60); // Tokens que expiram em menos de 24h
      
      if (fetchError) throw new Error(`Erro ao buscar tokens: ${fetchError.message}`);
      
      if (tokens && tokens.length > 0) {
        console.log(`Encontrados ${tokens.length} tokens próximos da expiração`);
        
        // Chamar a função serverless para atualizar os tokens
        // Isso será implementado posteriormente quando necessário
        // Por enquanto, apenas logar a necessidade de atualização
        
        for (const token of tokens) {
          console.log(`Token para ${token.provider} do usuário ${token.user_id} precisa ser atualizado`);
          // Implementação futura da chamada para atualização
        }
      }
      
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Erro ao atualizar tokens OAuth:', err);
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);
  
  // Executar a verificação em intervalos regulares
  useEffect(() => {
    if (!userId) return;
    
    // Verificar imediatamente ao iniciar
    refreshTokens();
    
    // Configurar intervalo para verificação periódica
    const intervalId = setInterval(refreshTokens, interval);
    
    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, [userId, interval, refreshTokens]);
  
  return { refreshing, lastRefresh, error, refreshTokens };
}

// Função para iniciar o processo de autenticação OAuth
export async function initiateOAuthFlow(provider: string) {
  try {
    const supabase = createClient();
    
    // Configura a URL de retorno para a callback de autenticação
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    // Inicia o fluxo de autenticação OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile',
      }
    });
    
    if (error) throw error;
    
    // Se tudo estiver ok, retorna a URL para redirecionamento
    return { success: true, url: data.url };
  } catch (error: any) {
    console.error('Erro ao iniciar autenticação OAuth:', error);
    return { success: false, error: error.message };
  }
}

// Função para salvar tokens OAuth recebidos
export async function saveOAuthTokens(
  userId: string,
  provider: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
) {
  try {
    const supabase = createClient();
    
    // Calcular timestamp de expiração se fornecido
    const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined;
    
    // Salvar tokens no banco de dados
    const { error } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider,
        provider_token: accessToken,
        provider_refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao salvar tokens OAuth:', error);
    return { success: false, error: error.message };
  }
} 
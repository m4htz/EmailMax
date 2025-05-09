'use client';

import { useEffect } from 'react';
import { useOAuthTokenRefresh } from '@/lib/utils/oauth-manager';
import { createClient } from '@/lib/supabase/client';

interface OAuthRefreshProviderProps {
  children: React.ReactNode;
}

/**
 * Componente que gerencia a renovação automática de tokens OAuth
 * Deve ser incluído no layout principal da aplicação
 */
export function OAuthRefreshProvider({ children }: OAuthRefreshProviderProps) {
  const supabase = createClient();

  useEffect(() => {
    // Obter o ID do usuário atual
    let cleanupFunction = () => {};

    const setupTokenRefresh = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Iniciar o monitoramento de tokens
          cleanupFunction = useOAuthTokenRefresh(user.id);
        }
      } catch (error) {
        console.error('Erro ao configurar renovação de tokens:', error);
      }
    };

    setupTokenRefresh();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Limpar qualquer monitoramento anterior
        cleanupFunction();
        // Configurar novo monitoramento para o usuário que acabou de entrar
        cleanupFunction = useOAuthTokenRefresh(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Limpar monitoramento quando o usuário sair
        cleanupFunction();
      }
    });

    // Limpar ao desmontar
    return () => {
      cleanupFunction();
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Renderizar apenas os filhos - este componente não tem UI
  return <>{children}</>;
} 
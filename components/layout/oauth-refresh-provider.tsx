'use client';

import { useEffect, useState } from 'react';
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
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // Usar o hook de atualização de tokens OAuth
  const { refreshing, lastRefresh, error } = useOAuthTokenRefresh(userId);

  // Efeito para obter o usuário atual e configurar o ID do usuário
  useEffect(() => {
    const setupUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
      }
    };

    setupUser();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Atualizar o ID do usuário quando ele fizer login
        setUserId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Limpar o ID do usuário quando ele sair
        setUserId(undefined);
      }
    });

    // Limpar ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Registrar mensagens de debug (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (userId) {
        console.log(`OAuthRefreshProvider: Monitorando tokens para usuário ${userId}`);
        if (refreshing) {
          console.log('OAuthRefreshProvider: Atualizando tokens...');
        }
        if (lastRefresh) {
          console.log(`OAuthRefreshProvider: Última atualização em ${lastRefresh.toLocaleString()}`);
        }
        if (error) {
          console.error('OAuthRefreshProvider: Erro na atualização:', error);
        }
      } else {
        console.log('OAuthRefreshProvider: Nenhum usuário autenticado');
      }
    }
  }, [userId, refreshing, lastRefresh, error]);

  // Renderizar apenas os filhos - este componente não tem UI
  return <>{children}</>;
} 
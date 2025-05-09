'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from './authStore';
import supabase from '@/utils/supabase/client';

/**
 * Hook personalizado para usar o store de autenticação com hidratação segura
 * e integração com Supabase
 */
export function useAuth() {
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Obtém os valores e métodos do store
  const store = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    accessToken: state.accessToken,
    setAuth: state.setAuth,
    clearAuth: state.clearAuth
  }));

  // Efeito para hidratar o store e verificar autenticação com Supabase
  useEffect(() => {
    const initAuth = async () => {
      // Hidratar o store manualmente
      useAuthStore.persist.rehydrate();
      
      try {
        // Verificar se há sessão ativa no Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se temos uma sessão Supabase mas o estado do Zustand não está sincronizado
        if (session?.user && !store.isAuthenticated) {
          // Atualizar o estado local com os dados do usuário Supabase
          store.setAuth(
            {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 'Usuário',
            },
            session.access_token
          );
          console.log('Sessão Supabase restaurada no estado local');
        }
        
        // Se não temos uma sessão Supabase mas o estado do Zustand acha que estamos autenticados
        if (!session && store.isAuthenticated) {
          console.log('Estado local de autenticação sem sessão correspondente, limpando...');
          store.clearAuth();
        }
      } catch (err) {
        console.error('Erro ao verificar sessão do Supabase:', err);
      }
      
      setIsHydrated(true);
    };
    
    initAuth();
  }, []);

  // Retorne um objeto vazio durante a hidratação para evitar problemas de SSR
  if (!isHydrated) {
    return {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      setAuth: () => {},
      clearAuth: () => {}
    };
  }

  return store;
} 
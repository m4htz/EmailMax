import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  
  // Ações
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// Função para verificar se estamos no navegador
const isServer = typeof window === 'undefined';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      
      setAuth: (user, token) => set({
        isAuthenticated: true,
        user,
        accessToken: token,
      }),
      
      clearAuth: () => set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
      }),
    }),
    {
      name: 'auth-storage',
      // Só use localStorage no lado do cliente
      storage: isServer 
        ? createJSONStorage(() => ({
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }))
        : createJSONStorage(() => localStorage),
      // Desabilitar hidratação automática para evitar erros
      skipHydration: true,
    }
  )
); 
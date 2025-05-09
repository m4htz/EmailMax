'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store/useAuth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // MODO DE DESENVOLVIMENTO - Bypass de autenticação
  // Desativa a verificação de autenticação e renderiza diretamente os componentes filhos
  return <>{children}</>;

  // Código original comentado (desativado temporariamente)
  /*
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pequeno timeout para garantir que o estado foi carregado
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isAuthenticated) {
        router.push('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  // Mostrar indicador de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Verificando autenticação...</h2>
          <p className="text-slate-500">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada até o redirecionamento
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Redirecionando...</h2>
          <p className="text-slate-500">Você será redirecionado para a página de login</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
  */
} 
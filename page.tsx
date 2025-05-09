'use client';

import { useAuth } from '@/lib/store/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleNavigation = () => {
    if (isAuthenticated) {
      router.push('/overview');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mt-20">
          Bem-vindo ao <span className="text-blue-600">EmailMax</span>
        </h1>
        
        <p className="mt-3 text-xl">
          Gerencie e aqueça suas contas de email com facilidade
        </p>

        <div className="mt-6">
          <button
            onClick={handleNavigation}
            className="px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {isClient && isAuthenticated ? 'Acessar Dashboard' : 'Entrar na Plataforma'}
          </button>
        </div>
      </main>
    </div>
  );
}

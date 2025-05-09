'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const supabase = createClient();
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Atualizar o estado de autenticação no store
        setAuth(
          {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || 'Usuário',
          },
          data.session?.access_token || ''
        );
        
        // Navegar para o dashboard
        router.push('/overview');
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login');
      console.error('Erro de login:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDirectAccess = () => {
    // Para desenvolvimento apenas - simula um login
    const mockUser = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      name: 'Usuário Dev'
    };
    
    setAuth(mockUser, 'fake-token-for-development');
    router.push('/overview');
    router.refresh();
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1rem',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '24rem', 
        borderRadius: '0.5rem', 
        border: '1px solid #e5e7eb', 
        backgroundColor: 'white', 
        padding: '2rem', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          marginBottom: '1.5rem', 
          textAlign: 'center', 
          fontSize: '1.5rem', 
          fontWeight: 'bold' 
        }}>
          EmailMax
        </h1>
        
        <button 
          onClick={handleDirectAccess}
          style={{
            display: 'block',
            marginBottom: '1.5rem',
            width: '100%',
            borderRadius: '0.375rem',
            backgroundColor: '#22c55e',
            padding: '0.5rem 0',
            color: 'white',
            cursor: 'pointer',
            border: 'none',
            textAlign: 'center',
            textDecoration: 'none'
          }}
        >
          Acesso Direto (Modo Desenvolvimento)
        </button>
        
        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.5rem',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignIn} style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '0.375rem', 
                border: '1px solid #d1d5db'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '0.375rem', 
                border: '1px solid #d1d5db'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              borderRadius: '0.375rem',
              backgroundColor: loading ? '#93c5fd' : '#2563eb',
              padding: '0.5rem 0',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              textAlign: 'center'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.875rem', 
          color: '#4b5563' 
        }}>
          <Link 
            href="/auth/signup" 
            style={{
              fontWeight: '500',
              color: '#2563eb',
              textDecoration: 'none'
            }}
          >
            Não tem uma conta? Registre-se
          </Link>
        </div>
      </div>
    </div>
  );
} 
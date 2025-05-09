'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/store/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setAuth } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('Tentando login com:', email);
    
    try {
      // Tenta o login através do Supabase
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Verifica se houve erro no Supabase
      if (supabaseError) {
        console.error('Erro Supabase:', supabaseError.message);
        
        // Fallback para login de demonstração (credenciais hardcoded)
        if (email === 'teste@exemplo.com' && password === 'senha123') {
          console.log('Credenciais de teste válidas, autenticando...');
          // Simular delay da API
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Criar usuário de teste
          setAuth(
            {
              id: 'user-teste-123',
              email: email,
              name: 'Usuário de Teste',
            },
            'fake-jwt-token-123'
          );
          
          console.log('Autenticação bem-sucedida, redirecionando...');
          // Redirecionar para dashboard
          router.push('/overview');
          return;
        }
        
        setError('Credenciais inválidas. Use teste@exemplo.com / senha123');
        return;
      }
      
      // Se o login do Supabase foi bem-sucedido
      if (data.user) {
        console.log('Autenticação Supabase bem-sucedida');
        
        // Atualizar o estado local com os dados do usuário Supabase
        setAuth(
          {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || 'Usuário',
          },
          data.session?.access_token || ''
        );
        
        // Redirecionar para dashboard
        router.push('/overview');
      }
    } catch (err: any) {
      console.error('Erro durante login:', err);
      setError('Ocorreu um erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
      
      <p className="text-sm text-center text-gray-500 mt-4">
        Credenciais de teste: teste@exemplo.com / senha123
      </p>
    </form>
  );
}; 
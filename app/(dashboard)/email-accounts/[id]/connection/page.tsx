'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImapConnectionManager } from '@/components/email-accounts/imap-connection-manager';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmailConnectionPageProps {
  params: {
    id: string;
  };
}

export default function EmailConnectionPage({ params }: EmailConnectionPageProps) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        // Buscar a conta de email
        const { data, error } = await supabase
          .from('email_accounts')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          notFound();
        }

        setAccount(data);
      } catch (err: any) {
        console.error('Erro ao carregar conta:', err);
        setError(err.message || 'Erro ao carregar a conta de email');
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-medium text-destructive">Erro</h2>
        <p className="mt-2 text-slate-600">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/email-accounts">Voltar para contas</Link>
        </Button>
      </div>
    );
  }

  if (!account) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/email-accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Conexão IMAP</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Detalhes da Conta</h2>
            <div className="rounded-md border p-4">
              <dl className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm font-medium text-slate-500">Email:</dt>
                  <dd className="text-sm">{account.email}</dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm font-medium text-slate-500">Servidor IMAP:</dt>
                  <dd className="text-sm">{account.imap_host}:{account.imap_port}</dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm font-medium text-slate-500">Status:</dt>
                  <dd className="text-sm capitalize">{account.status}</dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm font-medium text-slate-500">Última verificação:</dt>
                  <dd className="text-sm">
                    {account.last_checked 
                      ? new Date(account.last_checked).toLocaleString('pt-BR') 
                      : 'Nunca'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        <div>
          <ImapConnectionManager 
            accountId={account.id} 
            email={account.email}
          />
        </div>
      </div>
    </div>
  );
} 
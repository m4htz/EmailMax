'use client';

import { Plus, Mail } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmailAccountCard } from '@/components/email-accounts/email-account-card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('email_accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAccounts(data || []);
      } catch (err: any) {
        console.error('Erro ao buscar contas de email:', err);
        setError(err.message || 'Erro ao carregar contas de email');
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, []);

  // Mapear status interno para o formato do componente
  const mapStatus = (status: string): 'active' | 'inactive' | 'error' => {
    if (status === 'connected') return 'active';
    if (status === 'error') return 'error';
    return 'inactive';
  };

  // Mapear provedor a partir do host
  const getProvider = (host: string): 'gmail' | 'outlook' | 'yahoo' | 'outros' => {
    if (host.includes('gmail')) return 'gmail';
    if (host.includes('outlook') || host.includes('office365')) return 'outlook';
    if (host.includes('yahoo')) return 'yahoo';
    return 'outros';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas de Email</h1>
          <p className="text-slate-500 mt-1">
            Gerencie suas contas de email conectadas ao sistema.
          </p>
        </div>
        
        <Button asChild>
          <Link href="/email-accounts/add" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Adicionar Conta</span>
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <EmailAccountCard
            key={account.id}
            id={account.id}
            email={account.email}
            description={account.name || ''}
            status={mapStatus(account.status)}
            provider={getProvider(account.imap_host)}
            lastSync={account.last_checked 
              ? new Date(account.last_checked).toLocaleString('pt-BR')
              : undefined}
          />
        ))}
      </div>
      
      {!loading && accounts.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhuma conta adicionada</h3>
          <p className="text-slate-500 mb-4">
            Adicione sua primeira conta de email para começar a usar o sistema.
          </p>
          <Button asChild>
            <Link href="/email-accounts/add" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Adicionar Conta</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
} 
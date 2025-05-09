'use client';

import { useEffect } from 'react';
import { useEmailAccountsStore, EmailAccount } from '../../lib/store';
import { Button } from '../ui/button';

export const EmailAccountList = () => {
  const { accounts, isLoading, error, setAccounts, removeAccount } = useEmailAccountsStore();

  // Exemplo de como carregar dados - em um app real, isso viria de uma API/Supabase
  useEffect(() => {
    const loadExampleAccounts = async () => {
      // Simular carregamento
      const mockAccounts: EmailAccount[] = [
        {
          id: '1',
          email: 'exemplo1@gmail.com',
          name: 'Conta Principal',
          provider: 'Gmail',
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          username: 'exemplo1@gmail.com',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'exemplo2@outlook.com',
          provider: 'Outlook',
          imapHost: 'outlook.office365.com',
          imapPort: 993,
          smtpHost: 'smtp.office365.com',
          smtpPort: 587,
          username: 'exemplo2@outlook.com',
          isActive: false,
          createdAt: new Date().toISOString(),
          lastChecked: new Date().toISOString()
        }
      ];

      // Delay simulado para demonstrar carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAccounts(mockAccounts);
    };

    loadExampleAccounts();
  }, [setAccounts]);

  if (isLoading) {
    return <div className="p-4">Carregando contas de email...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Erro: {error}</div>;
  }

  if (accounts.length === 0) {
    return <div className="p-4">Nenhuma conta de email cadastrada</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Contas de Email</h2>
      <div className="grid gap-4">
        {accounts.map((account) => (
          <div 
            key={account.id} 
            className={`p-4 border rounded-lg ${account.isActive ? 'border-green-500' : 'border-gray-300'}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{account.name || account.email}</h3>
                <p className="text-sm text-gray-500">{account.email}</p>
                <p className="text-xs text-gray-400">Provedor: {account.provider}</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Em um app real, esto abriria um formulário de edição
                    alert(`Editar: ${account.email}`);
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeAccount(account.id)}
                >
                  Remover
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <span 
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {account.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 
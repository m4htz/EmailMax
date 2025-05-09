'use client';

import { useState, useEffect } from 'react';
import { useEmailAccountsStore } from '@/lib/store/emailAccountsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Email {
  id: string;
  account_id: string;
  subject: string;
  sender: string;
  recipient: string;
  folder: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  received_at: string;
}

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { accounts } = useEmailAccountsStore();
  
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);
  
  useEffect(() => {
    async function fetchEmails() {
      if (!selectedAccount) return;
      
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        const query = supabase
          .from('received_emails')
          .select('*')
          .eq('account_id', selectedAccount)
          .order('received_at', { ascending: false });
          
        // Filtragem baseada na pasta/aba atual
        if (activeTab === 'inbox') {
          query.eq('folder', 'INBOX').not('status', 'eq', 'archived');
        } else if (activeTab === 'archived') {
          query.eq('status', 'archived');
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Erro ao buscar emails:', error);
          return;
        }
        
        setEmails(data || []);
      } catch (error) {
        console.error('Erro ao buscar emails:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEmails();
  }, [selectedAccount, activeTab]);
  
  const markAsRead = async (emailId: string) => {
    try {
      const supabase = createClient();
      
      await supabase
        .from('received_emails')
        .update({ status: 'read', processed_at: new Date().toISOString() })
        .eq('id', emailId);
        
      // Atualiza o estado local
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, status: 'read' } : email
      ));
    } catch (error) {
      console.error('Erro ao marcar email como lido:', error);
    }
  };
  
  const archiveEmail = async (emailId: string) => {
    try {
      const supabase = createClient();
      
      await supabase
        .from('received_emails')
        .update({ status: 'archived', processed_at: new Date().toISOString() })
        .eq('id', emailId);
        
      // Remove o email da lista atual se estiver na caixa de entrada
      if (activeTab === 'inbox') {
        setEmails(emails.filter(email => email.id !== emailId));
      } else {
        // Atualiza o status se estiver visualizando arquivados
        setEmails(emails.map(email => 
          email.id === emailId ? { ...email, status: 'archived' } : email
        ));
      }
    } catch (error) {
      console.error('Erro ao arquivar email:', error);
    }
  };
  
  // Filtragem por termo de busca
  const filteredEmails = emails.filter(email => 
    email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    email.sender?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Emails</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/3">
          <Select 
            value={selectedAccount || ''} 
            onValueChange={(value) => setSelectedAccount(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-1/3">
          <Input 
            placeholder="Buscar emails..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="inbox">Caixa de Entrada</TabsTrigger>
          <TabsTrigger value="archived">Arquivados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8">Carregando emails...</p>
          ) : filteredEmails.length === 0 ? (
            <p className="text-center py-8">Nenhum email encontrado.</p>
          ) : (
            filteredEmails.map((email) => (
              <EmailCard 
                key={email.id} 
                email={email} 
                onRead={() => markAsRead(email.id)} 
                onArchive={() => archiveEmail(email.id)} 
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="archived" className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8">Carregando emails arquivados...</p>
          ) : filteredEmails.length === 0 ? (
            <p className="text-center py-8">Nenhum email arquivado encontrado.</p>
          ) : (
            filteredEmails.map((email) => (
              <EmailCard 
                key={email.id} 
                email={email} 
                onRead={() => markAsRead(email.id)} 
                isArchived={true}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmailCard({ 
  email, 
  onRead, 
  onArchive,
  isArchived = false 
}: { 
  email: Email; 
  onRead: () => void; 
  onArchive?: () => void;
  isArchived?: boolean;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={email.status === 'new' ? 'border-blue-500' : ''}>
      <Link href={`/emails/${email.id}`} className="block">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{email.subject || '(Sem assunto)'}</CardTitle>
              <CardDescription>De: {email.sender}</CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(email.received_at)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Para: {email.recipient}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between">
        <div>
          {email.status === 'new' && (
            <Button variant="outline" size="sm" onClick={onRead}>
              Marcar como lido
            </Button>
          )}
        </div>
        <div>
          {!isArchived && onArchive && (
            <Button variant="ghost" size="sm" onClick={onArchive}>
              Arquivar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';

interface Email {
  id: string;
  account_id: string;
  message_id: string;
  subject: string;
  sender: string;
  recipient: string;
  folder: string;
  content?: string;
  html_content?: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  received_at: string;
}

export default function EmailDetailPage({ params }: { params: { id: string } }) {
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchEmailDetails() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        // Busca dados básicos do email
        const { data, error } = await supabase
          .from('received_emails')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) {
          setError('Erro ao carregar email: ' + error.message);
          return;
        }
        
        if (!data) {
          setError('Email não encontrado');
          return;
        }
        
        // Marca como lido se ainda não estiver
        if (data.status === 'new') {
          await supabase
            .from('received_emails')
            .update({ 
              status: 'read',
              processed_at: new Date().toISOString()
            })
            .eq('id', params.id);
            
          data.status = 'read';
        }
        
        // TODO: Em uma implementação real, buscaríamos o conteúdo do email
        // usando a Edge Function com IMAP. Aqui estamos apenas simulando.
        setEmail({
          ...data,
          content: 'Este é o conteúdo do email. Em uma implementação completa, ' +
                  'buscaríamos o corpo do email via IMAP usando uma Edge Function.',
          html_content: '<p>Este é o conteúdo HTML do email. Em uma implementação completa, ' +
                      'buscaríamos o corpo do email via IMAP usando uma Edge Function.</p>'
        });
      } catch (error) {
        console.error('Erro ao buscar detalhes do email:', error);
        setError('Erro ao carregar email');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEmailDetails();
  }, [params.id]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleArchive = async () => {
    if (!email) return;
    
    try {
      const supabase = createClient();
      
      await supabase
        .from('received_emails')
        .update({ 
          status: 'archived',
          processed_at: new Date().toISOString()
        })
        .eq('id', email.id);
        
      setEmail({
        ...email,
        status: 'archived'
      });
    } catch (error) {
      console.error('Erro ao arquivar email:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-center">Carregando detalhes do email...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="container mx-auto py-10">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error || 'Email não encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para a caixa de entrada
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">{email.subject || '(Sem assunto)'}</CardTitle>
              <span className="text-sm text-gray-500">
                {formatDate(email.received_at)}
              </span>
            </div>
            <CardDescription className="text-sm">
              <div><strong>De:</strong> {email.sender}</div>
              <div><strong>Para:</strong> {email.recipient}</div>
              {email.message_id && (
                <div className="text-xs text-gray-400 mt-1">
                  ID: {email.message_id}
                </div>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="border-t pt-4">
            {email.html_content ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: email.html_content }} 
              />
            ) : (
              <div className="whitespace-pre-wrap">{email.content}</div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          </div>
          <div>
            {email.status !== 'archived' && (
              <Button variant="ghost" onClick={handleArchive}>
                Arquivar
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 
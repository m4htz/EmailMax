'use client';

import { useState, useEffect } from 'react';
import { useImapConnection } from '@/lib/utils/use-imap-connection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Inbox, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface ImapConnectionManagerProps {
  accountId: string;
  email: string;
}

export function ImapConnectionManager({ accountId, email }: ImapConnectionManagerProps) {
  const { connect, disconnect, state } = useImapConnection({ accountId });
  const { toast } = useToast();
  const [showMailboxes, setShowMailboxes] = useState(false);

  const handleConnect = async () => {
    const success = await connect();
    
    if (success) {
      toast({
        title: "Conexão IMAP estabelecida",
        description: `Conectado com sucesso à conta ${email}`,
      });
    } else {
      toast({
        title: "Falha na conexão IMAP",
        description: state.error || "Não foi possível conectar ao servidor IMAP",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    const success = await disconnect();
    
    if (success) {
      toast({
        title: "Desconectado",
        description: "A conexão IMAP foi encerrada",
      });
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Inbox className="h-5 w-5" />
          <span>Conexão IMAP</span>
          {state.isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 ml-2">
              Conectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Gerencie a conexão IMAP para a conta {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erro de conexão</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Status</p>
            <p className="flex items-center mt-1">
              {state.isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-slate-400 mr-2" />
                  <span>Desconectado</span>
                </>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Última verificação</p>
            <p className="mt-1">{formatDateTime(state.lastChecked)}</p>
          </div>
        </div>

        {state.isConnected && state.mailboxes.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Caixas de correio disponíveis
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMailboxes(!showMailboxes)}
              >
                {showMailboxes ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            
            {showMailboxes && (
              <div className="mt-2 p-2 bg-slate-50 rounded-md">
                <ul className="space-y-1">
                  {state.mailboxes.map((mailbox, index) => (
                    <li key={index} className="text-sm flex items-center">
                      <Inbox className="h-3 w-3 mr-2 text-slate-400" />
                      {mailbox}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!state.isConnected ? (
          <Button 
            onClick={handleConnect}
            disabled={state.isConnecting}
            className="w-full"
          >
            {state.isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>Conectar ao servidor IMAP</>
            )}
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleConnect}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconectar
            </Button>
            <Button 
              onClick={handleDisconnect}
              variant="secondary"
              className="flex-1"
            >
              Desconectar
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 
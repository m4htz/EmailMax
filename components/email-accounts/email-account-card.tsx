import { Mail, MailCheck, MailX, ExternalLink, Edit, Trash, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EmailAccountCardProps {
  id: string;
  email: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  provider: 'gmail' | 'outlook' | 'yahoo' | 'outros';
  lastSync?: string;
  className?: string;
}

export function EmailAccountCard({
  id,
  email,
  description,
  status,
  provider,
  lastSync,
  className
}: EmailAccountCardProps) {
  const statusConfig = {
    active: {
      label: 'Ativo',
      color: 'bg-green-50 text-green-600',
      icon: MailCheck
    },
    inactive: {
      label: 'Inativo',
      color: 'bg-slate-50 text-slate-600',
      icon: Mail
    },
    error: {
      label: 'Erro',
      color: 'bg-red-50 text-red-600',
      icon: MailX
    }
  };

  const { label, color, icon: Icon } = statusConfig[status];

  const providerLogos = {
    gmail: 'G',
    outlook: 'O', 
    yahoo: 'Y',
    outros: '@'
  };

  const providerColors = {
    gmail: 'bg-red-100 text-red-700',
    outlook: 'bg-blue-100 text-blue-700',
    yahoo: 'bg-purple-100 text-purple-700',
    outros: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden",
      className
    )}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={cn(
              "flex items-center justify-center h-10 w-10 rounded-full font-bold mr-3",
              providerColors[provider]
            )}>
              {providerLogos[provider]}
            </div>
            
            <div>
              <h3 className="font-medium text-lg">{email}</h3>
              {description && (
                <p className="text-sm text-slate-500">{description}</p>
              )}
            </div>
          </div>
          
          <div className={cn(
            "flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            color
          )}>
            <Icon className="mr-1 h-3 w-3" />
            <span>{label}</span>
          </div>
        </div>
        
        {lastSync && (
          <div className="mt-2 text-xs text-slate-500">
            Última sincronização: {lastSync}
          </div>
        )}
      </div>
      
      <div className="border-t border-slate-100 p-3 bg-slate-50 flex justify-between">
        <Link href={`/email-accounts/${id}/connection`} className="text-sm text-slate-600 hover:text-slate-900 flex items-center">
          <Wifi className="h-4 w-4 mr-1" />
          <span>Conexão</span>
        </Link>
        <Link href={`/email-accounts/${id}`} className="text-sm text-slate-600 hover:text-slate-900 flex items-center">
          <Edit className="h-4 w-4 mr-1" />
          <span>Editar</span>
        </Link>
        <button className="text-sm text-red-500 hover:text-red-700 flex items-center">
          <Trash className="h-4 w-4 mr-1" />
          <span>Excluir</span>
        </button>
      </div>
    </div>
  );
} 
import { Clock, Mail, Flame, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarmupPlanCardProps {
  id: string;
  email: string;
  status: 'active' | 'paused' | 'completed';
  currentDay: number;
  totalDays: number;
  dailyEmails: number;
  progress: number;
  lastActivity?: string;
  className?: string;
}

export function WarmupPlanCard({
  id,
  email,
  status,
  currentDay,
  totalDays,
  dailyEmails,
  progress,
  lastActivity,
  className
}: WarmupPlanCardProps) {
  const statusColors = {
    active: 'bg-green-50 text-green-600',
    paused: 'bg-amber-50 text-amber-600',
    completed: 'bg-blue-50 text-blue-600'
  };

  const statusLabels = {
    active: 'Ativo',
    paused: 'Pausado',
    completed: 'Concluído'
  };

  const statusIcons = {
    active: Check,
    paused: Clock,
    completed: Flame
  };

  const StatusIcon = statusIcons[status];

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden",
      className
    )}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg mb-1 truncate">{email}</h3>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center">
                <Mail className="mr-1 h-4 w-4" />
                <span>{dailyEmails}/dia</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>Dia {currentDay} de {totalDays}</span>
              </div>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            statusColors[status]
          )}>
            <StatusIcon className="mr-1 h-3 w-3" />
            <span>{statusLabels[status]}</span>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {lastActivity && (
          <div className="mt-3 text-xs text-slate-500">
            Última atividade: {lastActivity}
          </div>
        )}
      </div>
      
      <div className="border-t border-slate-100 p-3 bg-slate-50 flex justify-between">
        <button className="text-sm text-slate-600 hover:text-slate-900">Editar</button>
        <button className="text-sm text-slate-600 hover:text-slate-900">
          {status === 'active' ? 'Pausar' : 'Retomar'}
        </button>
        <button className="text-sm text-red-500 hover:text-red-700">Excluir</button>
      </div>
    </div>
  );
} 
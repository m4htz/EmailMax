'use client';

import { useEffect } from 'react';
import { useWarmupStore, WarmupPlan } from '../../lib/store';
import { Button } from '../ui/button';

export const WarmupPlanList = () => {
  const { plans, isLoading, error, setPlans, updatePlan, removePlan } = useWarmupStore();

  // Exemplo de como carregar dados - em um app real, isso viria de uma API/Supabase
  useEffect(() => {
    const loadExamplePlans = async () => {
      // Simular carregamento
      const today = new Date();
      const mockPlans: WarmupPlan[] = [
        {
          id: '1',
          name: 'Plano gradual Gmail',
          emailAccountId: '1',  // Referência à conta do Gmail
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
          dailyIncrement: 3,
          maxDailyEmails: 50,
          currentDailyEmails: 15,
          status: 'active',
          createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: today.toISOString()
        },
        {
          id: '2',
          name: 'Plano rápido Outlook',
          emailAccountId: '2',  // Referência à conta do Outlook
          startDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
          dailyIncrement: 5,
          maxDailyEmails: 100,
          currentDailyEmails: 10,
          status: 'paused',
          createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: today.toISOString()
        }
      ];

      // Delay simulado para demonstrar carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPlans(mockPlans);
    };

    loadExamplePlans();
  }, [setPlans]);

  const togglePlanStatus = (id: string, currentStatus: 'active' | 'paused' | 'completed') => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updatePlan(id, { status: newStatus });
  };

  if (isLoading) {
    return <div className="p-4">Carregando planos de aquecimento...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Erro: {error}</div>;
  }

  if (plans.length === 0) {
    return <div className="p-4">Nenhum plano de aquecimento cadastrado</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Planos de Aquecimento</h2>
      <div className="grid gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`p-4 border rounded-lg ${
              plan.status === 'active' 
                ? 'border-blue-500' 
                : plan.status === 'paused' 
                  ? 'border-amber-500' 
                  : 'border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{plan.name}</h3>
                <p className="text-sm text-gray-500">
                  Incremento diário: {plan.dailyIncrement} emails
                </p>
                <p className="text-sm text-gray-500">
                  Progresso: {plan.currentDailyEmails} / {plan.maxDailyEmails} emails
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={plan.status === 'active' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => togglePlanStatus(plan.id, plan.status)}
                >
                  {plan.status === 'active' ? 'Pausar' : 'Ativar'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removePlan(plan.id)}
                >
                  Remover
                </Button>
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(plan.currentDailyEmails / plan.maxDailyEmails) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {Math.round((plan.currentDailyEmails / plan.maxDailyEmails) * 100)}%
              </span>
            </div>
            <div className="mt-2">
              <span 
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  plan.status === 'active' 
                    ? 'bg-blue-100 text-blue-800' 
                    : plan.status === 'paused' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {plan.status === 'active' 
                  ? 'Ativo' 
                  : plan.status === 'paused' 
                    ? 'Pausado' 
                    : 'Concluído'
                }
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 
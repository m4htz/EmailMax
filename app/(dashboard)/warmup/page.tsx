import { Plus, Filter, Flame } from 'lucide-react';
import { WarmupPlanCard } from '@/components/warmup/warmup-plan-card';

export default function WarmupPage() {
  // Dados de exemplo para demonstração
  const warmupPlans = [
    {
      id: '1',
      email: 'usuario@gmail.com',
      status: 'active' as const,
      currentDay: 8,
      totalDays: 30,
      dailyEmails: 25,
      progress: 27,
      lastActivity: 'Hoje, 14:30'
    },
    {
      id: '2',
      email: 'trabalho@outlook.com',
      status: 'paused' as const,
      currentDay: 12,
      totalDays: 30,
      dailyEmails: 15,
      progress: 40,
      lastActivity: 'Ontem, 18:15'
    },
    {
      id: '3',
      email: 'marketing@yahoo.com',
      status: 'completed' as const,
      currentDay: 30,
      totalDays: 30,
      dailyEmails: 50,
      progress: 100,
      lastActivity: '15/02/2023, 10:22'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aquecimento de Email</h1>
          <p className="text-slate-500 mt-1">
            Gerencie seus planos de aquecimento para melhorar a entregabilidade.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-md flex items-center transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            <span>Filtrar</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            <span>Novo Plano</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warmupPlans.map((plan) => (
          <WarmupPlanCard
            key={plan.id}
            id={plan.id}
            email={plan.email}
            status={plan.status}
            currentDay={plan.currentDay}
            totalDays={plan.totalDays}
            dailyEmails={plan.dailyEmails}
            progress={plan.progress}
            lastActivity={plan.lastActivity}
          />
        ))}
      </div>
      
      {warmupPlans.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Flame className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhum plano de aquecimento</h3>
          <p className="text-slate-500 mb-4">
            Adicione seu primeiro plano de aquecimento para melhorar a entregabilidade de suas contas.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            <span>Novo Plano</span>
          </button>
        </div>
      )}
    </div>
  );
} 
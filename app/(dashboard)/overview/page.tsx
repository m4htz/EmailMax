"use client"

import { useState } from 'react';
import {
  BarChart3,
  Mail,
  Flame,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  RefreshCw,
  Users,
  Inbox,
  Send,
  Info,
  Plus
} from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import Link from 'next/link';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('semana');
  
  // Dados de exemplo para demonstração
  const metrics = [
    {
      title: 'Total de Contas',
      value: '4',
      icon: Mail,
      trend: { value: 25, positive: true }
    },
    {
      title: 'Planos de Aquecimento',
      value: '2',
      icon: Flame,
      trend: { value: 10, positive: true }
    },
    {
      title: 'Taxa de Entrega',
      value: '98.3%',
      icon: CheckCircle2,
      trend: { value: 2.5, positive: true }
    },
    {
      title: 'Taxa de Abertura',
      value: '46.2%',
      icon: BarChart3,
      trend: { value: 3.7, positive: true }
    }
  ];

  const recentWarmupActivity = [
    { 
      account: 'conta1@gmail.com',
      action: 'Email enviado',
      status: 'success',
      time: '10 minutos atrás'
    },
    { 
      account: 'conta2@outlook.com',
      action: 'Email enviado',
      status: 'success',
      time: '25 minutos atrás'
    },
    { 
      account: 'conta1@gmail.com',
      action: 'Email aberto',
      status: 'success',
      time: '32 minutos atrás'
    },
    { 
      account: 'conta3@yahoo.com',
      action: 'Falha no envio',
      status: 'error',
      time: '1 hora atrás'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-slate-500">
            Visão geral do seu sistema de email e estatísticas principais.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === 'hoje' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setTimeRange('hoje')}
          >
            Hoje
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === 'semana' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setTimeRange('semana')}
          >
            Semana
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === 'mes' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setTimeRange('mes')}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard 
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-medium">Atividade de Aquecimento</h2>
            <Link href="/warmup" className="text-blue-600 text-sm flex items-center hover:underline">
              <span>Ver Todos</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentWarmupActivity.map((activity, i) => (
              <div key={i} className="flex items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className={`${activity.status === 'success' ? 'bg-blue-50' : 'bg-red-50'} p-2 rounded-md mr-3`}>
                  {activity.action.includes('enviado') ? (
                    <Send className={`h-5 w-5 ${activity.status === 'success' ? 'text-blue-600' : 'text-red-600'}`} />
                  ) : activity.action.includes('aberto') ? (
                    <Inbox className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Info className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action} para <span className="text-slate-700">{activity.account}</span></p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-500">{activity.time}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activity.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {activity.status === 'success' ? 'Sucesso' : 'Falha'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
          <h2 className="text-lg font-medium mb-4">Progresso de Aquecimento</h2>
          <div className="space-y-5">
            {[
              { email: 'conta1@gmail.com', progress: 75, status: 'Ativo', total: 35, remaining: 15 },
              { email: 'conta2@outlook.com', progress: 45, status: 'Ativo', total: 25, remaining: 30 }
            ].map((account, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm mb-0.5">{account.email}</div>
                    <div className="flex items-center text-xs text-slate-500">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <span>{account.total - account.remaining}/{account.total} dias</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${account.status === 'Ativo' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {account.status}
                  </span>
                </div>
                <div className="relative w-full">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                      style={{ width: `${account.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/warmup/create" className="flex items-center justify-center w-full py-2 px-4 bg-slate-50 text-slate-700 rounded-md text-sm hover:bg-slate-100 transition-colors">
              <Flame className="h-4 w-4 mr-2 text-blue-500" />
              <span>Criar Novo Plano</span>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Próximos Eventos</h2>
            <button className="text-blue-600 text-sm">Ver Todos</button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Envio automático de emails', time: 'Hoje, 15:30', type: 'warm' },
              { title: 'Verificação de entregabilidade', time: 'Amanhã, 09:00', type: 'check' },
              { title: 'Atualização de reputação', time: 'Seg, 10:00', type: 'reputation' }
            ].map((event, i) => (
              <div key={i} className="flex items-center p-3 rounded-md hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  event.type === 'warm' ? 'bg-blue-100 text-blue-600' : 
                  event.type === 'check' ? 'bg-green-100 text-green-600' : 
                  'bg-purple-100 text-purple-600'
                }`}>
                  {event.type === 'warm' ? (
                    <Send className="h-5 w-5" />
                  ) : event.type === 'check' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <div className="flex items-center text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium mb-1">Adicione mais contas de email</h2>
              <p className="text-blue-100 text-sm mb-6">Aumente seu alcance e entregabilidade</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-md">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-xs text-blue-100 mb-1">
              <span>4 de 10 contas</span>
              <span>40%</span>
            </div>
            <div className="w-full bg-blue-700 bg-opacity-40 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full" 
                style={{ width: '40%' }}
              />
            </div>
          </div>
          
          <Link href="/email-accounts/add" className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            <span>Adicionar Conta</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 
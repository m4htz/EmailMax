import { useWarmupStore, WarmupPlan, WarmupMetric } from '../../../lib/store/warmupStore';

// Resetar o estado do store antes de cada teste
beforeEach(() => {
  useWarmupStore.setState({
    plans: [],
    metrics: [],
    isLoading: false,
    error: null,
  });
});

describe('warmupStore', () => {
  test('deve iniciar com o estado inicial correto', () => {
    const state = useWarmupStore.getState();
    expect(state.plans).toEqual([]);
    expect(state.metrics).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('deve adicionar um plano de warmup corretamente', () => {
    const mockPlan: WarmupPlan = {
      id: '123',
      name: 'Plano de Warmup Teste',
      emailAccountId: 'acc-123',
      startDate: '2023-01-01',
      dailyIncrement: 5,
      maxDailyEmails: 50,
      currentDailyEmails: 10,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useWarmupStore.getState().addPlan(mockPlan);
    
    const state = useWarmupStore.getState();
    expect(state.plans.length).toBe(1);
    expect(state.plans[0]).toEqual(mockPlan);
  });

  test('deve atualizar um plano de warmup corretamente', () => {
    // Primeiro adicionar um plano
    const mockPlan: WarmupPlan = {
      id: '123',
      name: 'Plano de Warmup Teste',
      emailAccountId: 'acc-123',
      startDate: '2023-01-01',
      dailyIncrement: 5,
      maxDailyEmails: 50,
      currentDailyEmails: 10,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    useWarmupStore.getState().addPlan(mockPlan);
    
    // Atualizar o plano
    useWarmupStore.getState().updatePlan('123', {
      status: 'paused',
      currentDailyEmails: 15,
      name: 'Plano Atualizado',
    });
    
    const state = useWarmupStore.getState();
    expect(state.plans[0].status).toBe('paused');
    expect(state.plans[0].currentDailyEmails).toBe(15);
    expect(state.plans[0].name).toBe('Plano Atualizado');
  });

  test('deve remover um plano de warmup corretamente', () => {
    // Adicionar dois planos
    const plan1: WarmupPlan = {
      id: '123',
      name: 'Plano 1',
      emailAccountId: 'acc-123',
      startDate: '2023-01-01',
      dailyIncrement: 5,
      maxDailyEmails: 50,
      currentDailyEmails: 10,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const plan2: WarmupPlan = {
      id: '456',
      name: 'Plano 2',
      emailAccountId: 'acc-456',
      startDate: '2023-01-15',
      dailyIncrement: 3,
      maxDailyEmails: 30,
      currentDailyEmails: 6,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    useWarmupStore.getState().setPlans([plan1, plan2]);
    
    // Remover um plano
    useWarmupStore.getState().removePlan('123');
    
    const state = useWarmupStore.getState();
    expect(state.plans.length).toBe(1);
    expect(state.plans[0].id).toBe('456');
  });

  test('deve adicionar e gerenciar métricas corretamente', () => {
    const mockMetric: WarmupMetric = {
      id: 'metric-123',
      warmupPlanId: '123',
      date: '2023-01-05',
      emailsSent: 10,
      emailsOpened: 8,
      emailsReplied: 3,
      deliveryRate: 0.95,
    };
    
    useWarmupStore.getState().addMetric(mockMetric);
    
    let state = useWarmupStore.getState();
    expect(state.metrics.length).toBe(1);
    expect(state.metrics[0]).toEqual(mockMetric);
    
    // Adicionar outra métrica
    const mockMetric2: WarmupMetric = {
      id: 'metric-456',
      warmupPlanId: '123',
      date: '2023-01-06',
      emailsSent: 15,
      emailsOpened: 12,
      emailsReplied: 5,
      deliveryRate: 0.97,
    };
    
    useWarmupStore.getState().addMetric(mockMetric2);
    
    state = useWarmupStore.getState();
    expect(state.metrics.length).toBe(2);
    
    // Substituir todas as métricas
    const mockMetric3: WarmupMetric = {
      id: 'metric-789',
      warmupPlanId: '456',
      date: '2023-01-10',
      emailsSent: 20,
      emailsOpened: 15,
      emailsReplied: 7,
      deliveryRate: 0.98,
    };
    
    useWarmupStore.getState().setMetrics([mockMetric3]);
    
    state = useWarmupStore.getState();
    expect(state.metrics.length).toBe(1);
    expect(state.metrics[0].id).toBe('metric-789');
  });

  test('deve manipular estados de carregamento corretamente', () => {
    useWarmupStore.getState().setLoading(true);
    expect(useWarmupStore.getState().isLoading).toBe(true);
    
    useWarmupStore.getState().setLoading(false);
    expect(useWarmupStore.getState().isLoading).toBe(false);
  });

  test('deve manipular erros corretamente', () => {
    useWarmupStore.getState().setError('Erro na sincronização de planos');
    expect(useWarmupStore.getState().error).toBe('Erro na sincronização de planos');
    
    useWarmupStore.getState().setError(null);
    expect(useWarmupStore.getState().error).toBeNull();
  });
}); 
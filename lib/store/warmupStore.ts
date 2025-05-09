import { create } from 'zustand';

export interface WarmupPlan {
  id: string;
  name: string;
  emailAccountId: string;
  startDate: string;
  endDate?: string;
  dailyIncrement: number;
  maxDailyEmails: number;
  currentDailyEmails: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface WarmupMetric {
  id: string;
  warmupPlanId: string;
  date: string;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  deliveryRate: number;
}

interface WarmupState {
  plans: WarmupPlan[];
  metrics: WarmupMetric[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  setPlans: (plans: WarmupPlan[]) => void;
  addPlan: (plan: WarmupPlan) => void;
  updatePlan: (id: string, updates: Partial<WarmupPlan>) => void;
  removePlan: (id: string) => void;
  
  setMetrics: (metrics: WarmupMetric[]) => void;
  addMetric: (metric: WarmupMetric) => void;
  
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWarmupStore = create<WarmupState>((set) => ({
  plans: [],
  metrics: [],
  isLoading: false,
  error: null,
  
  setPlans: (plans) => set({ plans }),
  
  addPlan: (plan) => set((state) => ({
    plans: [...state.plans, plan],
  })),
  
  updatePlan: (id, updates) => set((state) => ({
    plans: state.plans.map((plan) => 
      plan.id === id ? { ...plan, ...updates } : plan
    ),
  })),
  
  removePlan: (id) => set((state) => ({
    plans: state.plans.filter((plan) => plan.id !== id),
  })),
  
  setMetrics: (metrics) => set({ metrics }),
  
  addMetric: (metric) => set((state) => ({
    metrics: [...state.metrics, metric],
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
})); 
import { create } from 'zustand';

export interface EmailAccount {
  id: string;
  email: string;
  name?: string;
  provider: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  isActive: boolean;
  createdAt: string;
  lastChecked?: string;
}

interface EmailAccountsState {
  accounts: EmailAccount[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  setAccounts: (accounts: EmailAccount[]) => void;
  addAccount: (account: EmailAccount) => void;
  updateAccount: (id: string, updates: Partial<EmailAccount>) => void;
  removeAccount: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEmailAccountsStore = create<EmailAccountsState>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  
  setAccounts: (accounts) => set({ accounts }),
  
  addAccount: (account) => set((state) => ({
    accounts: [...state.accounts, account],
  })),
  
  updateAccount: (id, updates) => set((state) => ({
    accounts: state.accounts.map((account) => 
      account.id === id ? { ...account, ...updates } : account
    ),
  })),
  
  removeAccount: (id) => set((state) => ({
    accounts: state.accounts.filter((account) => account.id !== id),
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
})); 
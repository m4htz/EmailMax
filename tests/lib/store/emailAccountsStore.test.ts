import { useEmailAccountsStore, EmailAccount } from '../../../lib/store/emailAccountsStore';

// Resetar o estado do store antes de cada teste
beforeEach(() => {
  useEmailAccountsStore.setState({
    accounts: [],
    isLoading: false,
    error: null,
  });
});

describe('emailAccountsStore', () => {
  test('deve iniciar com o estado inicial correto', () => {
    const state = useEmailAccountsStore.getState();
    expect(state.accounts).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('deve adicionar uma conta de email corretamente', () => {
    const mockAccount: EmailAccount = {
      id: '123',
      email: 'teste@exemplo.com',
      provider: 'Gmail',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      username: 'teste@exemplo.com',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    useEmailAccountsStore.getState().addAccount(mockAccount);
    
    const state = useEmailAccountsStore.getState();
    expect(state.accounts.length).toBe(1);
    expect(state.accounts[0]).toEqual(mockAccount);
  });

  test('deve atualizar uma conta de email corretamente', () => {
    // Primeiro adicionar uma conta
    const mockAccount: EmailAccount = {
      id: '123',
      email: 'teste@exemplo.com',
      provider: 'Gmail',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      username: 'teste@exemplo.com',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    useEmailAccountsStore.getState().addAccount(mockAccount);
    
    // Atualizar a conta
    useEmailAccountsStore.getState().updateAccount('123', {
      isActive: false,
      name: 'Conta de Teste',
    });
    
    const state = useEmailAccountsStore.getState();
    expect(state.accounts[0].isActive).toBe(false);
    expect(state.accounts[0].name).toBe('Conta de Teste');
  });

  test('deve remover uma conta de email corretamente', () => {
    // Adicionar duas contas
    const account1: EmailAccount = {
      id: '123',
      email: 'teste1@exemplo.com',
      provider: 'Gmail',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      username: 'teste1@exemplo.com',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    const account2: EmailAccount = {
      id: '456',
      email: 'teste2@exemplo.com',
      provider: 'Outlook',
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      username: 'teste2@exemplo.com',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    useEmailAccountsStore.getState().setAccounts([account1, account2]);
    
    // Remover uma conta
    useEmailAccountsStore.getState().removeAccount('123');
    
    const state = useEmailAccountsStore.getState();
    expect(state.accounts.length).toBe(1);
    expect(state.accounts[0].id).toBe('456');
  });

  test('deve manipular estados de carregamento corretamente', () => {
    useEmailAccountsStore.getState().setLoading(true);
    expect(useEmailAccountsStore.getState().isLoading).toBe(true);
    
    useEmailAccountsStore.getState().setLoading(false);
    expect(useEmailAccountsStore.getState().isLoading).toBe(false);
  });

  test('deve manipular erros corretamente', () => {
    useEmailAccountsStore.getState().setError('Erro de conexão');
    expect(useEmailAccountsStore.getState().error).toBe('Erro de conexão');
    
    useEmailAccountsStore.getState().setError(null);
    expect(useEmailAccountsStore.getState().error).toBeNull();
  });
}); 
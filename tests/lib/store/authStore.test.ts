import { useAuthStore } from '../../../lib/store/authStore';

// Resetar o estado do store antes de cada teste
beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    accessToken: null,
  });
});

describe('authStore', () => {
  test('deve iniciar com o estado inicial correto', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  test('deve autenticar o usuário corretamente', () => {
    const mockUser = {
      id: '123',
      email: 'teste@exemplo.com',
      name: 'Usuário Teste',
    };
    const mockToken = 'token-jwt-teste';

    useAuthStore.getState().setAuth(mockUser, mockToken);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockToken);
  });

  test('deve limpar a autenticação corretamente', () => {
    // Primeiro autenticar o usuário
    const mockUser = {
      id: '123',
      email: 'teste@exemplo.com',
    };
    useAuthStore.getState().setAuth(mockUser, 'token-teste');
    
    // Depois limpar a autenticação
    useAuthStore.getState().clearAuth();
    
    // Verificar o estado final
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
}); 
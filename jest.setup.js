// Adicionar bibliotecas de testes e mocks globais para o Jest
require('@testing-library/jest-dom');

// Mock para process.env caso seja necessário
// Isso permite simular variáveis de ambiente em testes
process.env = {
  ...process.env,
  // Adicione variáveis de ambiente padrão para testes aqui se necessário
}; 
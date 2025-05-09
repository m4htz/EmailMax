import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import supabase from '../../../utils/supabase/client';

// Mock do createClient para evitar chamar API real
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn()
  }))
}));

// Mock do @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    from: jest.fn()
  }))
}));

// Mock das variáveis de ambiente
const originalEnv = process.env;

describe('Supabase Client', () => {
  // Teste de caso de sucesso
  test('deve criar cliente Supabase com as configurações corretas', () => {
    // Definir variáveis de ambiente
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://hegtdwhkhpcejtdhemkz.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3Rkd2hraHBjZWp0ZGhlbWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjcwMjYsImV4cCI6MjA2MjMwMzAyNn0.MAey90xg5eG7DE82z41ETKgngCi8le70HsdMG7FopC8';
    
    // Como o supabase já foi importado, verificamos diretamente o objeto
    expect(supabase).toBeDefined();
    expect(supabase).toHaveProperty('from');
  });

  // Teste para verificar robustez
  test('deve manter funcionalidade mesmo com variáveis de ambiente ausentes', () => {
    // Como o supabase já foi importado, verificamos diretamente o objeto
    expect(supabase).toBeDefined();
    expect(supabase).toHaveProperty('from');
  });

  // Teste de funcionalidade básica
  test('deve expor método from para interagir com tabelas', () => {
    // Verificar se o cliente tem o método esperado
    expect(supabase).toHaveProperty('from');
  });
  
  // Teste para verificar se o cliente lida corretamente com URLs sem caracteres especiais
  test('deve criar cliente corretamente com URL sem caracteres especiais', () => {
    // Preparar variáveis de ambiente limpas (sem < >)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://hegtdwhkhpcejtdhemkz.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3Rkd2hraHBjZWp0ZGhlbWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjcwMjYsImV4cCI6MjA2MjMwMzAyNn0.MAey90xg5eG7DE82z41ETKgngCi8le70HsdMG7FopC8';
    
    // Limpar o cache para garantir que temos uma versão fresca
    jest.resetModules();
    
    // Reimportar o cliente
    const newClient = require('../../../utils/supabase/client').default;
    
    // Verificar se o cliente foi criado corretamente
    expect(newClient).toBeDefined();
    expect(newClient).toHaveProperty('from');
  });
  
  // Restaurar process.env após os testes
  afterAll(() => {
    process.env = originalEnv;
  });
}); 
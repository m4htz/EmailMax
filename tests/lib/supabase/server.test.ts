import { jest } from '@jest/globals'

// Mock para o módulo next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn()
  }))
}))

// Mock para o módulo @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

// Importação da função a ser testada
import { createClient } from '@/utils/supabase/server'

describe('Supabase Server Client', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks()
  })

  it('deve carregar as variáveis de ambiente corretamente', async () => {
    // Armazenar os valores originais
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Verificar se as variáveis de ambiente estão definidas
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()

    // Restaurar os valores originais se necessário
    if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  })
}) 
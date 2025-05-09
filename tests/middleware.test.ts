import { jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

// Mock do módulo @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: null
        }
      } as any)
    }
  }))
}))

// Mock do NextResponse
jest.mock('next/server', () => {
  // Define o tipo explicitamente para evitar erros "unknown"
  const originalModule = jest.requireActual('next/server') as any
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      next: jest.fn().mockImplementation(({ request }: { request: any }) => ({
        cookies: {
          set: jest.fn(),
          getAll: jest.fn().mockReturnValue([])
        },
        request
      })),
      redirect: jest.fn().mockImplementation((url: URL | string) => ({
        url: typeof url === 'string' ? new URL(url, 'http://localhost') : url,
        cookies: {
          set: jest.fn(),
          getAll: jest.fn()
        }
      }))
    }
  }
})

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve redirecionar para login quando não houver usuário autenticado', async () => {
    // Verificar se as variáveis de ambiente estão definidas
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()

    // Criar uma requisição mock para uma rota protegida
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'), {
      headers: {
        cookie: ''
      }
    })

    // Executar o middleware
    const response = await middleware(request) as any

    // Verificar se houve um redirecionamento para a página de login
    expect(NextResponse.redirect).toHaveBeenCalled()
    expect(response.url.pathname).toBe('/login')
  })

  it('deve permitir acesso à página inicial sem autenticação', async () => {
    // Criar uma requisição mock para a página inicial
    const request = new NextRequest(new URL('http://localhost:3000/'), {
      headers: {
        cookie: ''
      }
    })

    // Executar o middleware
    await middleware(request)

    // Verificar que não houve redirecionamento (NextResponse.next foi chamado, não redirect)
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
  })
}) 
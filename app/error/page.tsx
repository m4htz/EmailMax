import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-red-600">Erro de Autenticação</h1>
        
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          <p>
            Ocorreu um erro durante o processo de autenticação. Isso pode acontecer devido a um
            link expirado ou inválido.
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
} 
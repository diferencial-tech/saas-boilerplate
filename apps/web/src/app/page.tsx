import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">
          SaaS Boilerplate
        </h1>
        <p className="mb-8 text-gray-500">
          Template de produção para SaaS multi-tenant
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  )
}
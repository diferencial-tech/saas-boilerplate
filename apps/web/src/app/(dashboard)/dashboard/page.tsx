'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMe } from '@/services/auth'

interface User {
  id: string
  name: string
  email: string
  role: string
  tenantId: string | null
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      router.push('/login')
      return
    }

    getMe(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/login')
      })
      .finally(() => setLoading(false))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            SaaS Boilerplate
          </h1>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Bem-vindo, {user?.name}!
          </h2>

          <div className="grid gap-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-gray-500">E-mail:</span>
              <span className="text-gray-900">{user?.email}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-500">Role:</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {user?.role}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-500">Tenant:</span>
              <span className="text-gray-900">
                {user?.tenantId ?? 'Nenhum (Admin da plataforma)'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
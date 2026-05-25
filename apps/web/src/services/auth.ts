import { apiClient } from '@/lib/api-client'
import type { LoginInput, RegisterInput } from '@saas/validators'

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    tenantId: string | null
  }
}

interface UserResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    tenantId: string | null
    createdAt: string
  }
}

export async function register(data: RegisterInput) {
  return apiClient.post<{ user: UserResponse['user'] }>(
    '/api/auth/register',
    data,
  )
}

export async function login(data: LoginInput) {
  return apiClient.post<AuthResponse>('/api/auth/login', data)
}

export async function refreshToken(token: string) {
  return apiClient.post<{ accessToken: string; refreshToken: string }>(
    '/api/auth/refresh',
    { refreshToken: token },
  )
}

export async function logout(token: string, refreshToken: string) {
  return apiClient.post<void>(
    '/api/auth/logout',
    { refreshToken },
    { token },
  )
}

export async function getMe(token: string) {
  return apiClient.get<UserResponse>('/api/auth/me', { token })
}
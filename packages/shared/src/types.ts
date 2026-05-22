import type { Role } from './roles.js'

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  tenantId: string | null
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
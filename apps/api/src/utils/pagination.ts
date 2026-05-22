import type { PaginatedResponse, PaginationParams } from '@saas/shared'
import { PAGINATION } from '@saas/shared'

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  const page = params.page ?? PAGINATION.DEFAULT_PAGE
  const limit = params.limit ?? PAGINATION.DEFAULT_LIMIT
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export function buildPaginationQuery(params: PaginationParams): {
  skip: number
  take: number
} {
  const page = params.page ?? PAGINATION.DEFAULT_PAGE
  const limit = params.limit ?? PAGINATION.DEFAULT_LIMIT

  return {
    skip: (page - 1) * limit,
    take: limit,
  }
}
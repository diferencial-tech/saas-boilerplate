import { z } from 'zod'
import { PAGINATION } from '@saas/shared'

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
})

export type PaginationInput = z.infer<typeof paginationSchema>
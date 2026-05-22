import type { FastifyInstance } from 'fastify'
import { requireRoles } from '../middlewares/index.js'
import { prisma } from '../../database/prisma.js'
import { buildPaginatedResponse, buildPaginationQuery } from '../../utils/index.js'
import { paginationSchema } from '@saas/validators'

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    '/admin/users',
    {
      preHandler: [app.authenticate, requireRoles('ADMIN')],
    },
    async (request, reply) => {
      const parsed = paginationSchema.safeParse(request.query)
      const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          ...buildPaginationQuery(params),
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            tenantId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ])

      return reply.send(buildPaginatedResponse(users, total, params))
    },
  )

  app.get(
    '/admin/tenants',
    {
      preHandler: [app.authenticate, requireRoles('ADMIN')],
    },
    async (request, reply) => {
      const parsed = paginationSchema.safeParse(request.query)
      const params = parsed.success ? parsed.data : { page: 1, limit: 20 }

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          ...buildPaginationQuery(params),
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            isActive: true,
            createdAt: true,
            _count: { select: { users: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.tenant.count(),
      ])

      return reply.send(buildPaginatedResponse(tenants, total, params))
    },
  )
}
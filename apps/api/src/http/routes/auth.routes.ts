import type { FastifyInstance } from 'fastify'
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
} from '@saas/validators'
import {
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
} from '../../services/auth.service.js'
import {
  sendConflict,
  sendError,
  sendUnauthorized,
  sendValidationError,
} from '../../utils/index.js'
import { prisma } from '../../database/prisma.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body)

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten().fieldErrors)
    }

    const meta = {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const user = await registerService(parsed.data, meta)
      return reply.status(201).send({ user })
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
        return sendConflict(reply, 'E-mail já cadastrado')
      }
      throw err
    }
  })

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten().fieldErrors)
    }

    const meta = {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const result = await loginService(parsed.data, app, meta)
      return reply.status(200).send(result)
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return sendUnauthorized(reply)
      }
      throw err
    }
  })

  app.post('/auth/refresh', async (request, reply) => {
    const parsed = refreshTokenSchema.safeParse(request.body)

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten().fieldErrors)
    }

    try {
      const result = await refreshTokenService(parsed.data.refreshToken, app)
      return reply.status(200).send(result)
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message === 'INVALID_REFRESH_TOKEN' ||
          err.message === 'REFRESH_TOKEN_EXPIRED' ||
          err.message === 'REFRESH_TOKEN_REUSE_DETECTED'
        ) {
          return sendUnauthorized(reply)
        }
      }
      throw err
    }
  })

  app.post(
    '/auth/logout',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = refreshTokenSchema.safeParse(request.body)

      if (!parsed.success) {
        return sendValidationError(reply, parsed.error.flatten().fieldErrors)
      }

      const meta = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      await logoutService(
        parsed.data.refreshToken,
        meta,
        request.user.sub,
      )

      return reply.status(204).send()
    },
  )

  app.get(
    '/auth/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      })

      if (!user) {
        return sendError(reply, 404, 'NOT_FOUND', 'Usuário não encontrado')
      }

      return reply.send({ user })
    },
  )
}
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify'
import * as Sentry from '@sentry/node'
import { logger } from '@saas/logger'

export function errorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      logger.error(
        {
          err: {
            message: error.message,
            stack: error.stack,
            code: error.code,
          },
          method: request.method,
          url: request.url,
          userId: request.user?.sub ?? null,
        },
        'Erro não tratado',
      )

      const isServerError = !error.statusCode || error.statusCode >= 500

      if (isServerError) {
        Sentry.captureException(error, {
          user: request.user
            ? { id: request.user.sub, email: request.user.email }
            : undefined,
          extra: {
            method: request.method,
            url: request.url,
            body: request.body,
          },
        })
      }

      if (error.statusCode === 429) {
        return reply.status(429).send({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas requisições. Tente novamente em alguns instantes.',
          },
        })
      }

      if (error.validation) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos',
            details: error.validation,
          },
        })
      }

      if (error.statusCode && error.statusCode < 500) {
        return reply.status(error.statusCode).send({
          error: {
            code: error.code ?? 'CLIENT_ERROR',
            message: error.message,
          },
        })
      }

      const isProduction = process.env.NODE_ENV === 'production'

      return reply.status(500).send({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor',
          ...(isProduction ? {} : { details: error.message }),
        },
      })
    },
  )

  app.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Rota ${request.method} ${request.url} não encontrada`,
      },
    })
  })
}
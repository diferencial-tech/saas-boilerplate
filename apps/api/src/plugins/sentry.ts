import fp from 'fastify-plugin'
import * as Sentry from '@sentry/node'
import type { FastifyInstance } from 'fastify'
import { env } from '../config/env.js'
import { logger } from '@saas/logger'

export default fp(async (app: FastifyInstance) => {
  if (!env.SENTRY_DSN) {
    logger.warn('SENTRY_DSN não configurado — monitoramento desativado')
    return
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    enabled: env.NODE_ENV !== 'test',
  })

  app.addHook('onRequest', async (request) => {
    Sentry.setUser(
      request.user
        ? { id: request.user.sub, email: request.user.email }
        : null,
    )
  })

  app.addHook('onError', async (_request, _reply, error) => {
    Sentry.captureException(error)
  })

  app.addHook('onClose', async () => {
    await Sentry.close(2000)
  })

  logger.info('Sentry inicializado')
})
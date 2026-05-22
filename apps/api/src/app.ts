import Fastify from 'fastify'
import { logger } from '@saas/logger'
import { jwtPlugin, redisPlugin, securityPlugin } from './plugins/index.js'
import { env } from './config/env.js'

export async function buildApp() {
  const app = Fastify({
    logger: false,
  })

  app.addHook('onRequest', async (request) => {
    logger.info(
      { method: request.method, url: request.url },
      'Requisição recebida',
    )
  })

  app.addHook('onResponse', async (request, reply) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
      },
      'Resposta enviada',
    )
  })

  await app.register(securityPlugin)
  await app.register(jwtPlugin)
  await app.register(redisPlugin)

  app.get('/health', async () => {
    return {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }
  })

  return app
}
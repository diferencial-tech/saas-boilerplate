import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { env } from '../config/env.js'
import { logger } from '@saas/logger'

export default fp(async (app: FastifyInstance) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

  redis.on('connect', () => {
    logger.info('Redis conectado')
  })

  redis.on('error', (err) => {
    logger.error({ err }, 'Erro na conexão com Redis')
  })

  await redis.connect()

  app.decorate('redis', redis)

  app.addHook('onClose', async () => {
    await redis.quit()
    logger.info('Redis desconectado')
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}
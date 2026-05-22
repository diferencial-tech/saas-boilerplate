import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import { env } from '../config/env.js'

export default fp(async (app: FastifyInstance) => {
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente em alguns instantes.',
      },
    }),
  })
})
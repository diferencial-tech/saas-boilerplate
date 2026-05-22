import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { env } from '../config/env.js'
import type { JwtPayload } from '@saas/shared'

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  })

  app.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify()
      } catch {
        reply.status(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token inválido ou expirado',
          },
        })
      }
    },
  )
})

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}
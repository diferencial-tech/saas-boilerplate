import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Role } from '@saas/shared'
import { sendForbidden, sendUnauthorized } from '../../utils/index.js'

export function requireRoles(...roles: Role[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.user) {
      return sendUnauthorized(reply)
    }

    if (!roles.includes(request.user.role as Role)) {
      return sendForbidden(reply)
    }
  }
}
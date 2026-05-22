import type { FastifyRequest, FastifyReply } from 'fastify'
import { sendForbidden } from '../../utils/index.js'

export async function requireTenant(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    return sendForbidden(reply)
  }

  if (request.user.role === 'ADMIN') {
    return
  }

  if (!request.user.tenantId) {
    return sendForbidden(reply)
  }
}
import type { FastifyReply } from 'fastify'
import type { ApiError } from '@saas/shared'

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const error: ApiError = { code, message, details }
  reply.status(statusCode).send({ error })
}

export function sendValidationError(
  reply: FastifyReply,
  details: unknown,
): void {
  sendError(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos', details)
}

export function sendUnauthorized(reply: FastifyReply): void {
  sendError(reply, 401, 'UNAUTHORIZED', 'Não autorizado')
}

export function sendForbidden(reply: FastifyReply): void {
  sendError(reply, 403, 'FORBIDDEN', 'Acesso negado')
}

export function sendNotFound(
  reply: FastifyReply,
  resource = 'Recurso',
): void {
  sendError(reply, 404, 'NOT_FOUND', `${resource} não encontrado`)
}

export function sendConflict(
  reply: FastifyReply,
  message: string,
): void {
  sendError(reply, 409, 'CONFLICT', message)
}
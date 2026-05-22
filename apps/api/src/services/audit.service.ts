import { prisma } from '../database/prisma.js'
import { logger } from '@saas/logger'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
type AuditEntity = 'USER' | 'TENANT' | 'SESSION'

interface CreateAuditLogParams {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  userId?: string | null
  previousData?: unknown
  newData?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

export function createAuditLog(params: CreateAuditLogParams): void {
  prisma.auditLog
    .create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId ?? null,
        previousData: params.previousData
          ? JSON.parse(JSON.stringify(params.previousData))
          : undefined,
        newData: params.newData
          ? JSON.parse(JSON.stringify(params.newData))
          : undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Falha ao registrar audit log')
    })
}
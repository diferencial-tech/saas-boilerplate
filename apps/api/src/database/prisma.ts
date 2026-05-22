import { PrismaClient } from '@prisma/client'
import { logger } from '@saas/logger'
import { env } from '../config/env.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

prisma.$connect().then(() => {
  logger.info('Banco de dados conectado')
}).catch((err: unknown) => {
  logger.error({ err }, 'Erro ao conectar no banco de dados')
  process.exit(1)
})
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma.js'
import type { LoginInput, RegisterInput } from '@saas/validators'
import { ROLES } from '@saas/shared'
import { createAuditLog } from './audit.service.js'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function generateRefreshToken(): string {
  return randomBytes(64).toString('hex')
}

interface RequestMeta {
  ipAddress?: string | null
  userAgent?: string | null
}

export async function registerService(
  data: RegisterInput,
  meta: RequestMeta = {},
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: ROLES.USER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true,
    },
  })

  createAuditLog({
    action: 'CREATE',
    entity: 'USER',
    entityId: user.id,
    userId: user.id,
    newData: { name: user.name, email: user.email, role: user.role },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  })

  return user
}

export async function loginService(
  data: LoginInput,
  app: FastifyInstance,
  meta: RequestMeta = {},
) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user || !user.isActive) {
    createAuditLog({
      action: 'LOGIN_FAILED',
      entity: 'USER',
      entityId: data.email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })
    throw new Error('INVALID_CREDENTIALS')
  }

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash)

  if (!passwordMatch) {
    createAuditLog({
      action: 'LOGIN_FAILED',
      entity: 'USER',
      entityId: user.id,
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })
    throw new Error('INVALID_CREDENTIALS')
  }

  const accessToken = app.jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    { expiresIn: '15m' },
  )

  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashToken(refreshToken)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
    },
  })

  createAuditLog({
    action: 'LOGIN',
    entity: 'SESSION',
    entityId: user.id,
    userId: user.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  }
}

export async function refreshTokenService(
  token: string,
  app: FastifyInstance,
) {
  const tokenHash = hashToken(token)

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!storedToken) {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  if (storedToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revokedAt: new Date() },
    })
    throw new Error('REFRESH_TOKEN_REUSE_DETECTED')
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error('REFRESH_TOKEN_EXPIRED')
  }

  if (!storedToken.user.isActive) {
    throw new Error('INVALID_CREDENTIALS')
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  })

  const newAccessToken = app.jwt.sign(
    {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      tenantId: storedToken.user.tenantId,
    },
    { expiresIn: '15m' },
  )

  const newRefreshToken = generateRefreshToken()
  const newRefreshTokenHash = hashToken(newRefreshToken)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: {
      tokenHash: newRefreshTokenHash,
      userId: storedToken.user.id,
      expiresAt,
    },
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export async function logoutService(
  token: string,
  meta: RequestMeta = {},
  userId?: string,
) {
  const tokenHash = hashToken(token)

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  })

  if (userId) {
    createAuditLog({
      action: 'LOGOUT',
      entity: 'SESSION',
      entityId: userId,
      userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })
  }
}
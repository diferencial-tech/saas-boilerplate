import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { ROLES } from '@saas/shared'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('🌱 Iniciando seed...')

  const adminEmail = 'admin@saas.com'
  const adminPassword = 'Admin@123456'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('✅ Admin já existe, pulando criação')
    return
  }

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: ROLES.ADMIN,
      tenantId: null,
    },
  })

  console.log(`✅ Admin criado: ${admin.email}`)
  console.log(`🔑 Senha inicial: ${adminPassword}`)
  console.log('⚠️  Troque a senha após o primeiro login!')
}

main()
  .catch((err) => {
    console.error('❌ Erro no seed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
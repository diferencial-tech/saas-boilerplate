import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ROLES } from '@saas/shared'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const adminEmail = 'admin@saas.com'
  const adminPassword = 'Admin@123456'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('♻️  Atualizando senha do admin existente...')
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash },
    })
    console.log('✅ Senha do admin atualizada')
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      passwordHash,
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
import { buildApp } from './app.js'
import { env } from './config/env.js'
import { logger } from '@saas/logger'

async function main() {
  const app = await buildApp()

  try {
    await app.listen({
      port: env.API_PORT,
      host: '0.0.0.0',
    })

    logger.info(`🚀 API rodando em http://localhost:${env.API_PORT}`)
    logger.info(`🌍 Ambiente: ${env.NODE_ENV}`)
  } catch (err) {
    logger.error({ err }, 'Erro ao iniciar o servidor')
    process.exit(1)
  }
}

main()
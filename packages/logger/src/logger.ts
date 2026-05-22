import pino from 'pino'

const isDevelopment = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV ?? 'development',
  },
  redact: {
    paths: ['password', 'passwordHash', '*.password', '*.passwordHash', 'authorization', '*.token'],
    censor: '[REDACTED]',
  },
})
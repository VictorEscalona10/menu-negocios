import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Creamos la función que configura el pool de Postgres con Supavisor
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL!
  const pool = new Pool({
    connectionString,
    // En entornos serverless mantenemos el límite en 1 conexión por función para no saturar el pooler
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)

  // Le pasamos el adaptador a Prisma 7
  return new PrismaClient({ adapter })
}

// 2. Mantenemos la conexión global con version tag para forzar recarga tras prisma generate
const PRISMA_CLIENT_VERSION = 'v2.2-plans-relations'
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
  prismaVersion: string | undefined
}

export const prisma = (globalForPrisma.prisma && globalForPrisma.prismaVersion === PRISMA_CLIENT_VERSION)
  ? globalForPrisma.prisma
  : (() => {
      const client = prismaClientSingleton()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client
        globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION
      }
      return client
    })()
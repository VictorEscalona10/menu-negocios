import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Creamos la función que configura el adaptador de Postgres
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL!
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  // Le pasamos el adaptador obligatoriamente a Prisma 7
  return new PrismaClient({ adapter })
}

// 2. Mantenemos la conexión global para que Next.js no colapse en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
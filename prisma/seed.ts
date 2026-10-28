// prisma/seed.ts
import 'dotenv/config'
import { seedPlans } from './seed-plans.ts'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL en las variables de entorno.')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('=== Iniciando Base Database Seed ===\n')

    // 1. Seed de Planes de Suscripción (Básico $15 / Pro $25)
    await seedPlans(prisma)

    console.log('=== Seed Principal Finalizado con Éxito ===\n')
  } catch (error) {
    console.error('Error durante la ejecución del seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

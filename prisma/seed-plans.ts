// prisma/seed-plans.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export interface PlanSeedData {
  code: string
  name: string
  description: string
  price: number
  currency: string
  durationDays: number
  trialDays: number
  features: string[]
  isActive: boolean
}

export const INITIAL_PLANS: PlanSeedData[] = [
  {
    code: 'BASIC',
    name: 'Plan Básico',
    description: 'Ideal para dark kitchens y locales que gestionan sus despachos y pedidos directamente por WhatsApp.',
    price: 15.0,
    currency: 'USD',
    durationDays: 30,
    trialDays: 15,
    features: [
      'Menú digital con pedidos directos por WhatsApp',
      'Plantillas básicas de diseño en /dashboard/settings',
      'Catálogo ilimitado de platos, bebidas y categorías',
      'Configuración de zonas de entrega y tarifas de delivery',
      'Código QR en alta definición para tu mostrador',
      '0% comisiones por venta',
    ],
    isActive: true,
  },
  {
    code: 'PRO',
    name: 'Plan Pro',
    description: 'Control total de salón: mesas, meseros, pantalla de cocina en vivo y personalización avanzada sección por sección.',
    price: 25.0,
    currency: 'USD',
    durationDays: 30,
    trialDays: 15,
    features: [
      'Menú digital con pedidos directos por WhatsApp',
      'Personalización avanzada sección por sección (/dashboard/customization)',
      'Menú interactivo: clientes piden desde su mesa con código QR',
      'Menú de solo ver carta para clientes dentro del local',
      'Menú del mesero para tomar comandas',
      'Gestión de mesas y meseros (/dashboard/mesas)',
      'Panel de mesero en tiempo real (/mesero/[slug])',
      'Gestión de pedidos y comandas en vivo en pantalla de cocina (/dashboard/pedidos)',
      'Catálogo ilimitado y 0% comisiones por venta',
    ],
    isActive: true,
  },
]

export async function seedPlans(client?: PrismaClient): Promise<void> {
  let prisma = client
  let shouldDisconnect = false

  if (!prisma) {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('Falta DATABASE_URL en las variables de entorno.')
    }
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({ adapter })
    shouldDisconnect = true
  }

  try {
    console.log('\n--- Seed de Planes de Suscripción ---')

    for (const planData of INITIAL_PLANS) {
      const savedPlan = await prisma.plan.upsert({
        where: { code: planData.code },
        create: {
          code: planData.code,
          name: planData.name,
          description: planData.description,
          price: planData.price,
          currency: planData.currency,
          durationDays: planData.durationDays,
          trialDays: planData.trialDays,
          features: planData.features,
          isActive: planData.isActive,
        },
        update: {
          name: planData.name,
          description: planData.description,
          price: planData.price,
          currency: planData.currency,
          durationDays: planData.durationDays,
          trialDays: planData.trialDays,
          features: planData.features,
          isActive: planData.isActive,
        },
      })
      console.log(`  ✓ Plan ${savedPlan.name} (${savedPlan.code}): $${savedPlan.price}/mes, ${savedPlan.durationDays}d duración, ${savedPlan.trialDays}d prueba`)
    }

    const allPlans = await prisma.plan.findMany({ orderBy: { price: 'asc' } })
    console.log(`\nVerificación: ${allPlans.length} planes registrados en la base de datos.\n`)
  } finally {
    if (shouldDisconnect && prisma) {
      await prisma.$disconnect()
    }
  }
}

// Ejecución directa si se invoca con `node prisma/seed-plans.ts`
if (process.argv[1]?.includes('seed-plans')) {
  seedPlans().catch((err) => {
    console.error('Error al ejecutar seed-plans:', err)
    process.exit(1)
  })
}

// app/api/checkout/vexpay/route.ts
// Crea una sesión de checkout en VEXPay y retorna la URL de pago
import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { vexpay } from '@/lib/vexpay'

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar al usuario
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Leer body
    const body = await request.json()
    const { storeId, planCode } = body as { storeId: string; planCode: string }

    if (!storeId || !planCode) {
      return Response.json({ error: 'Faltan storeId o planCode' }, { status: 400 })
    }

    // 3. Verificar que el usuario es dueño del store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { plan: true },
    })

    if (!store || store.userId !== user.id) {
      return Response.json({ error: 'No tienes permisos sobre este negocio' }, { status: 403 })
    }

    // 4. Buscar el plan en la DB
    const plan = await prisma.plan.findUnique({
      where: { code: planCode },
    })

    if (!plan) {
      return Response.json({ error: `Plan "${planCode}" no encontrado` }, { status: 404 })
    }

    // 5. Determinar la URL base (producción vs desarrollo)
    const envUrl = process.env.NEXT_PUBLIC_URL?.trim()
    const baseUrl = envUrl ? envUrl : request.nextUrl.origin

    // 6. Crear referencia única para esta transacción
    const reference = `sub_${store.id}_${planCode}_${Date.now()}`

    // Pre-calcular monto en Bs y tasa oficial BCV
    let amountBs: number | null = null
    let bcvRate: number | null = null
    try {
      const quote = await vexpay.quotes.retrieve({ usdAmount: plan.price })
      if (quote) {
        amountBs = quote.vesAmount
        bcvRate = quote.bcvRate
      }
    } catch (err) {
      console.warn('[VEXPay] No se pudo pre-calcular la tasa BCV:', err)
    }

    // 7. Crear sesión de checkout en VEXPay
    const session = await vexpay.checkout.sessions.create({
      amountUsd: plan.price,
      description: `Suscripción ${plan.name} — ${store.name}`,
      reference,
      successUrl: `${baseUrl}/dashboard/settings/pago?status=success&ref=${reference}`,
      cancelUrl: `${baseUrl}/dashboard?payment=cancelled`,
      allowedOrigins: [baseUrl],
    })

    // 8. Crear registro de pago PENDING en nuestra DB
    const now = new Date()
    const startsAt = store.currentPeriodEnd && new Date(store.currentPeriodEnd) > now
      ? new Date(store.currentPeriodEnd)
      : now
    const periodEndsAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    await prisma.subscriptionPayment.create({
      data: {
        storeId: store.id,
        planId: plan.id,
        amountUsd: plan.price,
        amountBs,
        bcvRate,
        gateway: 'VEXPAY',
        gatewayRef: reference,
        status: 'PENDING',
        periodStartsAt: startsAt,
        periodEndsAt: periodEndsAt,
      },
    })

    // 9. Retornar la URL de checkout para redirect
    return Response.json({
      checkoutUrl: session.url,
      clientSecret: session.clientSecret,
      sessionId: session.id,
    })
  } catch (err) {
    console.error('[VEXPay Checkout] Error:', err)
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    return Response.json({ error: message }, { status: 500 })
  }
}

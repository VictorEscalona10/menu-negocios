// app/api/webhooks/vexpay/route.ts
// Webhook handler para confirmar pagos de VEXPay
// VEXPay envía POST aquí cuando un pago se completa, falla o revierte
import { prisma } from '@/lib/prisma'
import { verifyVexpayWebhook } from '@/lib/vexpay'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    // 1. Leer el raw body (necesario para verificar la firma HMAC)
    const rawBody = await request.text()
    const signatureHeader = request.headers.get('vexpay-signature')
    const eventId = request.headers.get('vexpay-event-id')

    // 2. Verificar firma
    const payload = verifyVexpayWebhook(rawBody, signatureHeader)
    if (!payload) {
      return new Response('Firma inválida', { status: 400 })
    }

    const ref = payload.data.reference
    console.log(`[VEXPay Webhook] Evento: ${payload.event} | Ref: ${ref} | EventId: ${eventId}`)

    if (!ref) {
      console.warn('[VEXPay Webhook] Evento sin referencia de pago')
      return new Response('Sin referencia (ignorado)', { status: 200 })
    }

    // 3. Buscar el pago pendiente por referencia
    const payment = await prisma.subscriptionPayment.findFirst({
      where: {
        gatewayRef: ref,
        gateway: 'VEXPAY',
      },
      include: {
        store: true,
        plan: true,
      },
    })

    if (!payment) {
      console.warn(`[VEXPay Webhook] Pago no encontrado para ref: ${ref}`)
      // Retornamos 200 para que VEXPay no reenvíe el webhook indefinidamente
      return new Response('Pago no encontrado (ignorado)', { status: 200 })
    }

    // 4. Idempotencia: si ya fue procesado, ignorar
    if (payment.status === 'APPROVED' && payload.event === 'payment.completed') {
      console.log(`[VEXPay Webhook] Pago ${payment.id} ya estaba APPROVED, ignorando duplicado`)
      return new Response('Ya procesado', { status: 200 })
    }

    // 5. Procesar según el tipo de evento
    switch (payload.event) {
      case 'payment.completed': {
        // Actualizar pago a APPROVED
        await prisma.subscriptionPayment.update({
          where: { id: payment.id },
          data: {
            status: 'APPROVED',
            amountBs: payload.data.vesAmount || payment.amountBs,
            bcvRate: payload.data.bcvRate || payment.bcvRate,
          },
        })

        const gracePeriodEndsAt = new Date(payment.periodEndsAt.getTime() + 5 * 24 * 60 * 60 * 1000)

        // Activar la suscripción del store con 5 días de gracia tras finalizar el período
        await prisma.store.update({
          where: { id: payment.storeId },
          data: {
            planId: payment.planId,
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: payment.periodEndsAt,
            gracePeriodEndsAt,
            isActive: true,
            subscriptionUpdatedAt: new Date(),
          },
        })

        console.log(`[VEXPay Webhook] ✅ Pago ${payment.id} confirmado → Store ${payment.store.name} activo con ${payment.plan.name}`)

        // Revalidar páginas del dashboard
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')
        break
      }

      case 'payment.failed':
      case 'payment.canceled': {
        await prisma.subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: 'REJECTED' },
        })

        console.log(`[VEXPay Webhook] ❌ Pago ${payment.id} rechazado/cancelado`)
        break
      }

      case 'payment.reversed': {
        await prisma.subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: 'REJECTED' },
        })

        console.warn(`[VEXPay Webhook] ⚠️ Pago ${payment.id} revertido`)
        break
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[VEXPay Webhook] Error procesando:', err)
    return new Response('Error interno', { status: 500 })
  }
}

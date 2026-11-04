// src/actions/subscription.ts
'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PlanType } from '@/lib/subscription'
import { vexpay } from '@/lib/vexpay'
import { headers } from 'next/headers'

/**
 * Valida que el usuario autenticado sea el dueño legítimo del Store
 */
export async function verifyStoreOwnership(storeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('No autorizado. Debes iniciar sesión.')
    }

    const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
            plan: true,
        },
    })

    if (!store || store.userId !== user.id) {
        throw new Error('No tienes permisos sobre este negocio.')
    }

    return { user, store }
}

/**
 * Resuelve el registro de la tabla Plan por su código ('BASIC' | 'PRO')
 */
export async function getPlanByCode(code: PlanType) {
    const plan = await prisma.plan.findUnique({
        where: { code },
    })

    if (!plan) {
        // Fallback de seguridad si aún no se había ejecutado el seed
        return await prisma.plan.create({
            data: {
                code,
                name: code === 'PRO' ? 'Plan Pro' : 'Plan Básico',
                price: code === 'PRO' ? 25.0 : 15.0,
                durationDays: 30,
                trialDays: 15,
                currency: 'USD',
                isActive: true,
            },
        })
    }

    return plan
}

/**
 * Revalida todas las rutas afectadas por cambios en suscripción
 */
export async function revalidateAllSubscriptionRoutes(slug: string) {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/customization')
    revalidatePath('/dashboard/mesas')
    revalidatePath('/dashboard/pedidos')
    revalidatePath(`/menu/${slug}`)
}

/**
 * Activa o inicializa la prueba gratuita de 15 días con el plan seleccionado
 */
export async function activateFreeTrial(storeId: string, planCode: PlanType) {
    const { store } = await verifyStoreOwnership(storeId)
    const planRecord = await getPlanByCode(planCode)

    const trialDays = planRecord.trialDays || 15
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)

    await prisma.store.update({
        where: { id: store.id },
        data: {
            planId: planRecord.id,
            subscriptionStatus: 'TRIAL',
            trialEndsAt,
            currentPeriodEnd: null,
            gracePeriodEndsAt: null,
            hasUsedTrial: true,
            isActive: true,
            subscriptionUpdatedAt: new Date(),
        },
    })

    await revalidateAllSubscriptionRoutes(store.slug)
    return { success: true }
}

/**
 * Cambia el plan configurado del negocio
 */
export async function changePlanAction(storeId: string, newPlanCode: PlanType) {
    const { store } = await verifyStoreOwnership(storeId)
    const planRecord = await getPlanByCode(newPlanCode)

    await prisma.store.update({
        where: { id: store.id },
        data: {
            planId: planRecord.id,
            subscriptionUpdatedAt: new Date(),
        },
    })

    await revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: `Plan cambiado a ${planRecord.name}` }
}

// ==============================================================================
// PASARELA DE PAGO VEXPAY — Pago en Bolívares (Pago Móvil / C2P)
// ==============================================================================

/**
 * Crea una sesión de checkout en VEXPay y retorna la URL de pago.
 * El monto se envía en USD y VEXPay lo convierte automáticamente a Bs con tasa BCV.
 */
export async function createVexpayCheckout(storeId: string, planCode: PlanType) {
    const { store } = await verifyStoreOwnership(storeId)
    const planRecord = await getPlanByCode(planCode)

    // Determinar la URL base
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    const envUrl = process.env.NEXT_PUBLIC_URL?.trim()
    const baseUrl = envUrl ? envUrl : `${protocol}://${host}`

    // Referencia única para rastrear este pago
    const reference = `sub_${store.id}_${planCode}_${Date.now()}`

    // Obtener cotización oficial BCV en Bs para enriquecer el registro
    let amountBs: number | null = null
    let bcvRate: number | null = null
    try {
        const quote = await vexpay.quotes.retrieve({ usdAmount: planRecord.price })
        if (quote) {
            amountBs = quote.vesAmount
            bcvRate = quote.bcvRate
        }
    } catch (err) {
        console.warn('[VEXPay] No se pudo pre-calcular la tasa BCV:', err)
    }

    // Crear sesión en VEXPay (permite Pago Móvil / C2P en Bolívares al cambio oficial)
    const session = await vexpay.checkout.sessions.create({
        amountUsd: planRecord.price,
        description: `Suscripción ${planRecord.name} — ${store.name}`,
        reference,
        successUrl: `${baseUrl}/dashboard/settings/pago?status=success&ref=${reference}`,
        cancelUrl: `${baseUrl}/dashboard?payment=cancelled`,
        allowedOrigins: [baseUrl],
    })

    // Calcular período: si ya tenía días activos futuros, sumamos los 30 días al período restante
    const now = new Date()
    const startsAt = store.currentPeriodEnd && new Date(store.currentPeriodEnd) > now
        ? new Date(store.currentPeriodEnd)
        : now
    const periodEndsAt = new Date(startsAt.getTime() + planRecord.durationDays * 24 * 60 * 60 * 1000)

    await prisma.subscriptionPayment.create({
        data: {
            storeId: store.id,
            planId: planRecord.id,
            amountUsd: planRecord.price,
            amountBs,
            bcvRate,
            gateway: 'VEXPAY',
            gatewayRef: reference,
            status: 'PENDING',
            periodStartsAt: startsAt,
            periodEndsAt: periodEndsAt,
        },
    })

    return {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
    }
}

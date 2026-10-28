// src/actions/subscription.ts
'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PlanType } from '@/lib/subscription'

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
async function getPlanByCode(code: PlanType) {
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
function revalidateAllSubscriptionRoutes(slug: string) {
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

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true }
}

/**
 * Simulación de pago o registro de suscripción por 30 días (para pruebas antes de VexPay)
 */
export async function processSubscriptionPayment(storeId: string, planCode?: PlanType, days: number = 30) {
    const { store } = await verifyStoreOwnership(storeId)

    const targetCode: PlanType = planCode || (store.plan?.code as PlanType) || 'BASIC'
    const planRecord = await getPlanByCode(targetCode)

    const startsAt = new Date()
    const periodEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    // 1. Crear registro de pago / transacción para auditoría
    await prisma.subscriptionPayment.create({
        data: {
            storeId: store.id,
            planId: planRecord.id,
            amountUsd: planRecord.price,
            gateway: 'SIMULATED',
            status: 'APPROVED',
            periodStartsAt: startsAt,
            periodEndsAt: periodEndsAt,
        },
    })

    // 2. Actualizar estado del Store a ACTIVE por 30 días
    await prisma.store.update({
        where: { id: store.id },
        data: {
            planId: planRecord.id,
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: periodEndsAt,
            gracePeriodEndsAt: null,
            isActive: true,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: `Suscripción de ${days} días activada para el ${planRecord.name} ($${planRecord.price})` }
}

/**
 * Upgrade inmediato al Plan Pro ($25)
 */
export async function upgradeToProPlan(storeId: string) {
    const { store } = await verifyStoreOwnership(storeId)
    const proPlan = await getPlanByCode('PRO')

    const startsAt = new Date()
    const periodEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // 1. Registrar recibo de pago de upgrade
    await prisma.subscriptionPayment.create({
        data: {
            storeId: store.id,
            planId: proPlan.id,
            amountUsd: proPlan.price,
            gateway: 'SIMULATED',
            gatewayRef: 'UPGRADE-TO-PRO',
            status: 'APPROVED',
            periodStartsAt: startsAt,
            periodEndsAt: periodEndsAt,
        },
    })

    // 2. Actualizar negocio a PRO
    await prisma.store.update({
        where: { id: store.id },
        data: {
            planId: proPlan.id,
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: periodEndsAt,
            gracePeriodEndsAt: null,
            isActive: true,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: '¡Has mejorado con éxito al Plan Pro! Todas las funciones avanzadas están desbloqueadas.' }
}

/**
 * Cambia el plan del negocio (ej. al renovar o en configuración)
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

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: `Plan cambiado a ${planRecord.name}` }
}

// ==============================================================================
// HERRAMIENTAS DE PRUEBA Y SIMULACIÓN PARA QA (Comprobar flujo antes de VexPay)
// ==============================================================================

/**
 * 1. Simula que los 15 días de prueba se vencieron hoy -> Bloquea el sistema de inmediato
 */
export async function testSimulateTrialExpired(storeId: string) {
    const { store } = await verifyStoreOwnership(storeId)

    const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas en el pasado

    await prisma.store.update({
        where: { id: store.id },
        data: {
            subscriptionStatus: 'TRIAL',
            trialEndsAt: expiredDate,
            currentPeriodEnd: null,
            gracePeriodEndsAt: null,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: 'Prueba de 15 días vencida simulada (Sistema Bloqueado)' }
}

/**
 * 2. Simula que la suscripción paga venció y entra en los 5 días de gracia -> Muestra banner de alerta
 */
export async function testSimulateGracePeriod(storeId: string, daysLeft: number = 3) {
    const { store } = await verifyStoreOwnership(storeId)

    const pastPaidEnd = new Date(Date.now() - 24 * 60 * 60 * 1000) // Venció ayer
    const graceEnd = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000) // Le quedan X días de gracia

    await prisma.store.update({
        where: { id: store.id },
        data: {
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: pastPaidEnd,
            gracePeriodEndsAt: graceEnd,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: `Período de gracia activado con ${daysLeft} días restantes (Banner visible)` }
}

/**
 * 3. Simula que se vencieron los 5 días de gracia y no pagó -> Bloquea el sistema
 */
export async function testSimulateGraceExpired(storeId: string) {
    const { store } = await verifyStoreOwnership(storeId)

    const pastPaidEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Venció hace 7 días
    const pastGraceEnd = new Date(Date.now() - 2 * 60 * 60 * 1000) // Gracia venció hace 2 horas

    await prisma.store.update({
        where: { id: store.id },
        data: {
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: pastPaidEnd,
            gracePeriodEndsAt: pastGraceEnd,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: 'Período de gracia de 5 días expirado (Sistema Bloqueado)' }
}

/**
 * 4. Reinicia la prueba a 15 días limpios
 */
export async function testResetTrial(storeId: string) {
    const { store } = await verifyStoreOwnership(storeId)

    const freshTrialEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    await prisma.store.update({
        where: { id: store.id },
        data: {
            subscriptionStatus: 'TRIAL',
            trialEndsAt: freshTrialEnd,
            currentPeriodEnd: null,
            gracePeriodEndsAt: null,
            isActive: true,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: 'Prueba de 15 días restaurada correctamente' }
}

/**
 * 5. Alterna entre Plan Básico y Plan Pro para probar restricciones
 */
export async function testTogglePlan(storeId: string) {
    const { store } = await verifyStoreOwnership(storeId)
    const currentCode = store.plan?.code || 'BASIC'
    const newCode: PlanType = currentCode === 'PRO' ? 'BASIC' : 'PRO'
    const newPlan = await getPlanByCode(newCode)

    await prisma.store.update({
        where: { id: store.id },
        data: {
            planId: newPlan.id,
            subscriptionUpdatedAt: new Date(),
        },
    })

    revalidateAllSubscriptionRoutes(store.slug)
    return { success: true, message: `Plan cambiado a ${newPlan.name} para pruebas` }
}

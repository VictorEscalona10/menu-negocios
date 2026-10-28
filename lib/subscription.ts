// lib/subscription.ts
// Lógica de cálculo y verificación de suscripciones y planes de Komy (docs/DESIGN.md §21)

export type PlanType = 'BASIC' | 'PRO'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED'

export interface PlanDetails {
    id: PlanType
    name: string
    price: number
    badge: string
    description: string
    features: string[]
    notIncluded?: string[]
}

export const PLANS: Record<PlanType, PlanDetails> = {
    BASIC: {
        id: 'BASIC',
        name: 'Plan Básico',
        price: 15,
        badge: 'Emprendedores & Dark Kitchens',
        description: 'Ideal para negocios que gestionan sus pedidos directamente a través de WhatsApp.',
        features: [
            'Menú con pedidos directos por WhatsApp',
            'Plantillas básicas del dashboard y ajustes (/dashboard/settings)',
            'Catálogo ilimitado de platos y categorías',
            'Configuración de zonas de entrega y tarifas de delivery',
            'Código QR en alta definición para tu local',
            '0% comisiones por venta',
        ],
        notIncluded: [
            'Sin gestión de pedidos en vivo en cocina (/dashboard/pedidos)',
            'Sin creación ni gestión de mesas ni meseros (/dashboard/mesas)',
            'Sin panel exclusivo de meseros (/mesero/[slug])',
            'Sin pedidos directos desde la mesa ni modo solo ver carta',
            'Sin personalización avanzada sección por sección (/dashboard/customization)',
        ],
    },
    PRO: {
        id: 'PRO',
        name: 'Plan Pro',
        price: 25,
        badge: 'Restaurante Completo · Salón & Cocina',
        description: 'Todo lo que necesitas para tu local: salón, mesas, meseros, cocina y personalización total.',
        features: [
            'Menú con pedidos directos por WhatsApp',
            'Personalización avanzada del menú sección por sección (/dashboard/customization)',
            'Menú interactivo: clientes piden desde su mesa con código QR',
            'Menú de solo ver carta para clientes dentro del local',
            'Menú del mesero para tomar comandas',
            'Poder crear mesas, meseros y gestionar el salón (/dashboard/mesas)',
            'Panel exclusivo para meseros en tiempo real (/mesero/[slug])',
            'Gestión de pedidos y comandas en vivo en pantalla de cocina (/dashboard/pedidos)',
            'Plantillas básicas del dashboard y ajustes (/dashboard/settings)',
            '0% comisiones por venta',
        ],
    },
}

export interface StoreSubscriptionFields {
    planId?: string | null
    plan?: { code?: string | null; name?: string | null; price?: number | null } | string | null
    subscriptionStatus?: string | null
    trialEndsAt?: Date | string | null
    currentPeriodEnd?: Date | string | null
    gracePeriodEndsAt?: Date | string | null
    hasUsedTrial?: boolean | null
    isActive?: boolean | null
}

export interface SubscriptionInfo {
    plan: PlanType
    planDetails: PlanDetails
    status: SubscriptionStatus
    isBlocked: boolean
    isTrial: boolean
    isActivePaid: boolean
    isGracePeriod: boolean
    daysRemaining: number
    blockReason?: 'trial_expired' | 'grace_expired' | 'manual_pause' | null
    trialEndsAt: Date | null
    currentPeriodEnd: Date | null
    gracePeriodEndsAt: Date | null
    // Gatekeeping flags por funcionalidad
    canAccessPro: boolean
    canAccessCustomization: boolean
    canAccessMesas: boolean
    canAccessLiveKitchen: boolean
    canAccessWaiters: boolean
    canAccessTableOrders: boolean
}

/**
 * Calcula de forma 100% determinista el estado de suscripción de un Store:
 * 1. 15 días de prueba gratis del plan seleccionado al registrarse.
 * 2. Si vencen los 15 días sin pagar -> Bloqueo del sistema (NADA se elimina).
 * 3. Si pagó suscripción (30 días) y vence -> 5 días de período de gracia con banner de alerta.
 * 4. Si no paga en los 5 días de gracia -> Bloqueo del sistema (NADA se elimina).
 */
export function getSubscriptionInfo(store: StoreSubscriptionFields): SubscriptionInfo {
    // 1. Resolver el código del plan (soporta relación prisma { code: 'PRO' } o string legacy 'PRO')
    let rawPlanCode = 'BASIC'
    if (typeof store.plan === 'string') {
        rawPlanCode = store.plan
    } else if (store.plan && typeof store.plan === 'object' && store.plan.code) {
        rawPlanCode = store.plan.code
    }

    const plan: PlanType = rawPlanCode.toUpperCase() === 'PRO' ? 'PRO' : 'BASIC'
    const planDetails = PLANS[plan]

    const now = new Date()
    const trialEndsAt = store.trialEndsAt ? new Date(store.trialEndsAt) : null
    const currentPeriodEnd = store.currentPeriodEnd ? new Date(store.currentPeriodEnd) : null
    let gracePeriodEndsAt = store.gracePeriodEndsAt ? new Date(store.gracePeriodEndsAt) : null

    // Si tiene fecha de fin de período pero no se fijó la fecha de gracia,
    // se calculan exactamente 5 días adicionales después de currentPeriodEnd
    if (currentPeriodEnd && !gracePeriodEndsAt) {
        gracePeriodEndsAt = new Date(currentPeriodEnd.getTime() + 5 * 24 * 60 * 60 * 1000)
    }

    const rawStatus = (store.subscriptionStatus as SubscriptionStatus) || 'TRIAL'

    let status: SubscriptionStatus = rawStatus
    let isBlocked = false
    let isTrial = false
    let isActivePaid = false
    let isGracePeriod = false
    let daysRemaining = 0
    let blockReason: 'trial_expired' | 'grace_expired' | 'manual_pause' | null = null

    // Si el local fue pausado manualmente
    if (store.isActive === false) {
        return {
            plan,
            planDetails,
            status: 'EXPIRED',
            isBlocked: true,
            isTrial: false,
            isActivePaid: false,
            isGracePeriod: false,
            daysRemaining: 0,
            blockReason: 'manual_pause',
            trialEndsAt,
            currentPeriodEnd,
            gracePeriodEndsAt,
            canAccessPro: false,
            canAccessCustomization: false,
            canAccessMesas: false,
            canAccessLiveKitchen: false,
            canAccessWaiters: false,
            canAccessTableOrders: false,
        }
    }

    // Caso 1: Período de prueba gratuito inicial (15 días)
    if (rawStatus === 'TRIAL') {
        if (!trialEndsAt) {
            isTrial = true
            daysRemaining = 15
        } else if (now.getTime() <= trialEndsAt.getTime()) {
            isTrial = true
            const msLeft = trialEndsAt.getTime() - now.getTime()
            daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
        } else {
            // Prueba expirada -> Se bloquea el sistema (nada se borra)
            status = 'EXPIRED'
            isBlocked = true
            blockReason = 'trial_expired'
            daysRemaining = 0
        }
    }
    // Caso 2: Suscripción Paga mensual (30 días)
    else if (rawStatus === 'ACTIVE') {
        if (!currentPeriodEnd) {
            isActivePaid = true
            daysRemaining = 30
        } else if (now.getTime() <= currentPeriodEnd.getTime()) {
            isActivePaid = true
            const msLeft = currentPeriodEnd.getTime() - now.getTime()
            daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
        } else {
            // Terminó el mes pago -> Entra en período de gracia de 5 días
            if (gracePeriodEndsAt && now.getTime() <= gracePeriodEndsAt.getTime()) {
                status = 'GRACE_PERIOD'
                isGracePeriod = true
                const msLeft = gracePeriodEndsAt.getTime() - now.getTime()
                daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
            } else {
                // Pasaron los 5 días de gracia y no renovó -> Se bloquea
                status = 'EXPIRED'
                isBlocked = true
                blockReason = 'grace_expired'
                daysRemaining = 0
            }
        }
    }
    // Caso 3: Estado registrado como GRACE_PERIOD
    else if (rawStatus === 'GRACE_PERIOD') {
        if (gracePeriodEndsAt && now.getTime() <= gracePeriodEndsAt.getTime()) {
            isGracePeriod = true
            const msLeft = gracePeriodEndsAt.getTime() - now.getTime()
            daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
        } else {
            status = 'EXPIRED'
            isBlocked = true
            blockReason = 'grace_expired'
            daysRemaining = 0
        }
    }
    // Caso 4: Registrado como EXPIRED
    else {
        isBlocked = true
        blockReason = trialEndsAt && now.getTime() > trialEndsAt.getTime() ? 'trial_expired' : 'grace_expired'
        daysRemaining = 0
    }

    // Funcionalidades Pro permitidas solo si el plan es PRO y el sistema NO está bloqueado
    const canAccessPro = plan === 'PRO' && !isBlocked

    return {
        plan,
        planDetails,
        status,
        isBlocked,
        isTrial,
        isActivePaid,
        isGracePeriod,
        daysRemaining,
        blockReason,
        trialEndsAt,
        currentPeriodEnd,
        gracePeriodEndsAt,
        canAccessPro,
        canAccessCustomization: canAccessPro,
        canAccessMesas: canAccessPro,
        canAccessLiveKitchen: canAccessPro,
        canAccessWaiters: canAccessPro,
        canAccessTableOrders: canAccessPro,
    }
}

/**
 * Valida si un negocio tiene permiso para acceder a una característica específica
 */
export function canAccessFeature(
    subscription: SubscriptionInfo,
    _feature: 'customization' | 'mesas' | 'pedidos' | 'waiters' | 'table_orders' | 'view_orders'
): boolean {
    if (subscription.isBlocked) return false
    if (subscription.plan === 'PRO') return true
    return false
}

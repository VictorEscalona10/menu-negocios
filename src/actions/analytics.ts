// src/actions/analytics.ts
'use server'

import { prisma } from '@/lib/prisma'
import { verifyStoreOwnership } from '@/src/actions/subscription'
import { getSubscriptionInfo } from '@/lib/subscription'
import {
    AnalyticsDateRange,
    normalizeAnalyticsRange,
    resolveDateRange,
} from '@/lib/analytics-range'

// Se re-exporta para conservar la API pública existente del módulo de analítica.
export type { AnalyticsDateRange } from '@/lib/analytics-range'

export interface AnalyticsItemMetric {
    name: string
    quantity: number
    revenue: number
    isCombo: boolean
    comboBadge?: string | null
    productId?: string | null
    imageUrl?: string | null
    categoryName?: string | null
}

export interface ComboPerformanceMetrics {
    comboRevenue: number
    individualRevenue: number
    comboQuantity: number
    individualQuantity: number
    comboSharePercent: number // % de facturación proveniente de combos
    comboQuantityPercent: number // % de platos pedidos que fueron combos
    topCombos: AnalyticsItemMetric[]
    totalCombosInCatalog: number
}

export interface LowRotationProductMetric extends AnalyticsItemMetric {
    price: number
    status: 'zero_sales' | 'low_rotation'
    statusLabel: string
    suggestion: string
}

export interface ChannelBreakdownMetric {
    channel: 'whatsapp' | 'table' | 'waiter' | string
    channelLabel: string
    ordersCount: number
    revenue: number
    percentage: number // % sobre la facturación total
}

export interface WaiterPerformanceMetric {
    waiterId?: string | null
    waiterName: string
    ordersCount: number
    revenue: number
    averageTicket: number
}

export interface AnalyticsPlanGatekeeping {
    plan: 'BASIC' | 'PRO'
    isPro: boolean
    allowedRanges: AnalyticsDateRange[]
    maxRankingItems: number | null // 5 para Básico, null (ilimitado) para Pro
    hasCustomDateRange: boolean
    hasChannelBreakdown: boolean
    hasWaiterPerformance: boolean
}

export interface DailySalesMetric {
    date: string // 'YYYY-MM-DD'
    label: string // 'Vie 23'
    dayOfWeek: string // 'Viernes'
    revenue: number
    ordersCount: number
    isPeakDay: boolean
    isWeekend: boolean
}

export interface StoreAnalyticsData {
    totalRevenue: number
    totalOrders: number
    averageTicket: number
    items: AnalyticsItemMetric[]
    topSoldByQuantity: AnalyticsItemMetric[]
    topSoldByRevenue: AnalyticsItemMetric[]
    lowRotationProducts: LowRotationProductMetric[]
    combos: ComboPerformanceMetrics
    dailySales: DailySalesMetric[]
    gatekeeping: AnalyticsPlanGatekeeping
    channelBreakdown: ChannelBreakdownMetric[] | null
    waiterPerformance: WaiterPerformanceMetric[] | null
    periodStart: string
    periodEnd: string
    range: AnalyticsDateRange
    storeName: string
    storeSlug: string
    isBlocked: boolean
}

export interface StoreAnalyticsResponse {
    success: boolean
    error?: string
    data?: StoreAnalyticsData
}

/**
 * Server Action para consultar las estadísticas analíticas agregadas de una tienda.
 * Extrae y procesa los datos reales de `public.orders` excluyendo órdenes canceladas,
 * y calcula métricas exclusivas de Combos vs platos individuales.
 */
export async function getStoreAnalytics(
    storeId: string,
    range: AnalyticsDateRange = '7d',
    customFrom?: string | Date,
    customTo?: string | Date
): Promise<StoreAnalyticsResponse> {
    try {
        // 1. Validar autenticación y pertenencia de la tienda
        const { store } = await verifyStoreOwnership(storeId)

        // 2. Verificar estado de suscripción y reglas del plan (T80)
        const subscription = getSubscriptionInfo(store)
        const isPro = Boolean(subscription.canAccessPro)
        const plan = subscription.plan

        if (subscription.isBlocked) {
            return {
                success: false,
                error: 'El acceso a estadísticas está bloqueado debido al estado de la suscripción.',
                data: {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageTicket: 0,
                    items: [],
                    topSoldByQuantity: [],
                    topSoldByRevenue: [],
                    lowRotationProducts: [],
                    combos: {
                        comboRevenue: 0,
                        individualRevenue: 0,
                        comboQuantity: 0,
                        individualQuantity: 0,
                        comboSharePercent: 0,
                        comboQuantityPercent: 0,
                        topCombos: [],
                        totalCombosInCatalog: 0,
                    },
                    dailySales: [],
                    gatekeeping: {
                        plan,
                        isPro,
                        allowedRanges: isPro ? ['today', '7d', '30d', 'month', 'custom'] : ['7d', '30d'],
                        maxRankingItems: isPro ? null : 5,
                        hasCustomDateRange: isPro,
                        hasChannelBreakdown: isPro,
                        hasWaiterPerformance: isPro,
                    },
                    channelBreakdown: null,
                    waiterPerformance: null,
                    periodStart: new Date().toISOString(),
                    periodEnd: new Date().toISOString(),
                    range: '7d',
                    storeName: store.name,
                    storeSlug: store.slug,
                    isBlocked: true,
                },
            }
        }

        // 3. Reglas de Negocio por Plan (Gatekeeping de Rango Temporal)
        // El Plan Básico solo permite '7d' y '30d'. Si solicita 'today', 'month' o 'custom', se normaliza a '7d'
        const effectiveRange = normalizeAnalyticsRange(range, isPro)

        // Resolver las fechas efectivas (rango custom solo permitido en Plan Pro).
        // `endExclusive` incluye el día "Hasta" completo en las consultas SQL.
        const { startDate, endDate, endExclusive } = resolveDateRange(
            effectiveRange,
            isPro ? customFrom : undefined,
            isPro ? customTo : undefined
        )

        // 4. Consulta de métricas globales (órdenes no canceladas)
        const summaryRows = await prisma.$queryRaw<Array<{ totalOrders: number; totalRevenue: number }>>`
            SELECT 
                COUNT(*)::int AS "totalOrders",
                COALESCE(SUM(total::float8), 0)::float8 AS "totalRevenue"
            FROM public.orders
            WHERE restaurant_id = ${store.userId}::uuid
              AND status != 'cancelled'
              AND created_at >= ${startDate}
              AND created_at < ${endExclusive}
        `

        const rawSummary = summaryRows[0] || { totalOrders: 0, totalRevenue: 0 }
        const totalOrders = Number(rawSummary.totalOrders) || 0
        const totalRevenue = Number(Number(rawSummary.totalRevenue).toFixed(2)) || 0
        const averageTicket = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0

        // 5. Consulta optimizada de platos ordenados desde items JSONB
        // Excluye metadatos informativos que comienzan con ℹ️
        const itemRows = await prisma.$queryRaw<Array<{
            name: string
            itemId?: string | null
            productId?: string | null
            quantity: number
            revenue: number
        }>>`
            SELECT 
                TRIM(item->>'name') AS name,
                MAX(item->>'id') AS "itemId",
                MAX(item->>'productId') AS "productId",
                SUM(COALESCE((item->>'quantity')::int, 1))::int AS quantity,
                SUM(COALESCE((item->>'quantity')::int, 1) * COALESCE((item->>'price')::float8, 0))::float8 AS revenue
            FROM public.orders,
                 jsonb_array_elements(
                   CASE 
                     WHEN jsonb_typeof(items) = 'array' THEN items 
                     ELSE '[]'::jsonb 
                   END
                 ) AS item
            WHERE restaurant_id = ${store.userId}::uuid
              AND status != 'cancelled'
              AND created_at >= ${startDate}
              AND created_at < ${endExclusive}
              AND item->>'name' IS NOT NULL
              AND item->>'name' NOT LIKE 'ℹ️%'
            GROUP BY TRIM(item->>'name')
            ORDER BY quantity DESC, revenue DESC
        `

        // 6. Obtener catálogo de productos del local para identificar Combos y analizar rotación
        const storeProducts = await prisma.product.findMany({
            where: { category: { storeId: store.id } },
            select: {
                id: true,
                name: true,
                isCombo: true,
                comboBadge: true,
                price: true,
                imageUrl: true,
                isAvailable: true,
                category: {
                    select: { name: true },
                },
            },
        })

        // Mapas de indexación rápida por ID y por nombre normalizado
        const productById = new Map<string, (typeof storeProducts)[0]>()
        const productByName = new Map<string, (typeof storeProducts)[0]>()
        for (const p of storeProducts) {
            productById.set(p.id, p)
            productByName.set(p.name.toLowerCase().trim(), p)
        }

        // 7. Enriquecer los ítems cruzando nombres e IDs con la tabla Product del local
        const items: AnalyticsItemMetric[] = itemRows.map((r) => {
            const cleanName = (r.name || '').trim()
            const idToMatch = r.productId || r.itemId
            const matched = (idToMatch ? productById.get(idToMatch) : null) || productByName.get(cleanName.toLowerCase())

            const isCombo = matched ? Boolean(matched.isCombo) : cleanName.toLowerCase().includes('combo')
            const comboBadge = matched?.comboBadge || (isCombo ? 'Combo' : null)

            return {
                name: cleanName || 'Sin nombre',
                quantity: Number(r.quantity) || 0,
                revenue: Number(Number(r.revenue).toFixed(2)) || 0,
                isCombo,
                comboBadge,
                productId: matched?.id || idToMatch || null,
                imageUrl: matched?.imageUrl || null,
                categoryName: matched?.category?.name || null,
            }
        })

        // 8. Algoritmo y Métricas Exclusivas de Combos (T78)
        const comboRevenue = Number(
            items
                .filter((i) => i.isCombo)
                .reduce((acc, i) => acc + i.revenue, 0)
                .toFixed(2)
        )
        const individualRevenue = Number(
            items
                .filter((i) => !i.isCombo)
                .reduce((acc, i) => acc + i.revenue, 0)
                .toFixed(2)
        )
        const comboQuantity = items
            .filter((i) => i.isCombo)
            .reduce((acc, i) => acc + i.quantity, 0)
        const individualQuantity = items
            .filter((i) => !i.isCombo)
            .reduce((acc, i) => acc + i.quantity, 0)

        const totalItemsRevenue = comboRevenue + individualRevenue
        // Porcentaje de penetración de combos sobre el total facturado
        const comboSharePercent = totalRevenue > 0
            ? Number(((comboRevenue / totalRevenue) * 100).toFixed(1))
            : (totalItemsRevenue > 0
                ? Number(((comboRevenue / totalItemsRevenue) * 100).toFixed(1))
                : 0)

        const totalItemsQuantity = comboQuantity + individualQuantity
        const comboQuantityPercent = totalItemsQuantity > 0
            ? Number(((comboQuantity / totalItemsQuantity) * 100).toFixed(1))
            : 0

        // Ranking de Combos más pedidos con su insignia promocional (comboBadge)
        const topCombos = items
            .filter((i) => i.isCombo)
            .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)

        const totalCombosInCatalog = storeProducts.filter((p) => p.isCombo).length

        const combos: ComboPerformanceMetrics = {
            comboRevenue,
            individualRevenue,
            comboQuantity,
            individualQuantity,
            comboSharePercent,
            comboQuantityPercent,
            topCombos,
            totalCombosInCatalog,
        }

        // 9. Ingeniería de Menú: Platos Más y Menos Vendidos (T79)
        // 9.1 Ranking de platos ordenados por Volumen (unidades pedidas)
        const topSoldByQuantity = [...items].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)

        // 9.2 Ranking de platos ordenados por Facturación ($ aportado al negocio)
        const topSoldByRevenue = [...items].sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)

        // 9.3 Detección de Platos de Baja Rotación (0 ventas o volumen crítico)
        const soldProductIds = new Set<string>()
        const soldProductNames = new Set<string>()
        for (const item of items) {
            if (item.productId) soldProductIds.add(item.productId)
            soldProductNames.add(item.name.toLowerCase().trim())
        }

        // Platos activos del catálogo que tuvieron 0 ventas en el período solicitado
        const zeroSalesProducts: LowRotationProductMetric[] = storeProducts
            .filter((p) => !soldProductIds.has(p.id) && !soldProductNames.has(p.name.toLowerCase().trim()))
            .map((p) => ({
                name: p.name,
                quantity: 0,
                revenue: 0,
                price: Number(p.price) || 0,
                isCombo: Boolean(p.isCombo),
                comboBadge: p.comboBadge,
                productId: p.id,
                imageUrl: p.imageUrl,
                categoryName: p.category?.name || null,
                status: 'zero_sales' as const,
                statusLabel: '0 ventas',
                suggestion: p.isCombo
                    ? 'Promocionar combo en redes o crear oferta de fin de semana'
                    : 'Crear un combo con este plato o ajustar su visibilidad en el menú',
            }))

        // Platos que se vendieron pero tienen muy baja rotación (1 o 2 unidades vendidas)
        const lowSalesProducts: LowRotationProductMetric[] = items
            .filter((item) => item.quantity <= 2)
            .map((item) => {
                const matched = (item.productId ? productById.get(item.productId) : null) || productByName.get(item.name.toLowerCase().trim())
                return {
                    ...item,
                    price: matched?.price ? Number(matched.price) : 0,
                    status: 'low_rotation' as const,
                    statusLabel: 'Baja rotación',
                    suggestion: item.isCombo
                        ? 'Revisar precio o ajustar los complementos del combo'
                        : 'Sugerir como adicional en el carrito o destacar como especial',
                }
            })

        // Lista consolidada de alerta de baja rotación ordenada de menor a mayor venta
        const lowRotationProducts: LowRotationProductMetric[] = [
            ...zeroSalesProducts,
            ...lowSalesProducts,
        ].sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)

        // 10. Reglas de Negocio por Plan (Gatekeeping Analítico T80)
        // 10.1 En Plan Básico: Restringir rankings a Top 5. En Plan Pro: Rankings ilimitados completos.
        const finalTopSoldByQuantity = isPro ? topSoldByQuantity : topSoldByQuantity.slice(0, 5)
        const finalTopSoldByRevenue = isPro ? topSoldByRevenue : topSoldByRevenue.slice(0, 5)
        const finalTopCombos = isPro ? topCombos : topCombos.slice(0, 5)
        const finalLowRotation = isPro ? lowRotationProducts : lowRotationProducts.slice(0, 5)

        // 10.2 Métricas exclusivas del Plan Pro: Desglose por Canal y Rendimiento de Meseros
        let channelBreakdown: ChannelBreakdownMetric[] | null = null
        let waiterPerformance: WaiterPerformanceMetric[] | null = null

        if (isPro) {
            // Desglose de ventas por canal (WhatsApp vs Mesa QR vs Mesero)
            const channelRows = await prisma.$queryRaw<Array<{ channel: string; ordersCount: number; revenue: number }>>`
                SELECT 
                    COALESCE(source, 'whatsapp') AS channel,
                    COUNT(*)::int AS "ordersCount",
                    COALESCE(SUM(total::float8), 0)::float8 AS "revenue"
                FROM public.orders
                WHERE restaurant_id = ${store.userId}::uuid
                  AND status != 'cancelled'
                  AND created_at >= ${startDate}
                  AND created_at < ${endExclusive}
                GROUP BY COALESCE(source, 'whatsapp')
                ORDER BY revenue DESC
            `

            channelBreakdown = channelRows.map((c) => {
                const ch = (c.channel || 'whatsapp').toLowerCase()
                let channelLabel = 'WhatsApp'
                if (ch === 'table') channelLabel = 'Mesa QR'
                else if (ch === 'waiter') channelLabel = 'Comanda Mesero'

                const rev = Number(Number(c.revenue).toFixed(2)) || 0
                const percentage = totalRevenue > 0 ? Number(((rev / totalRevenue) * 100).toFixed(1)) : 0

                return {
                    channel: ch,
                    channelLabel,
                    ordersCount: Number(c.ordersCount) || 0,
                    revenue: rev,
                    percentage,
                }
            })

            // Rendimiento de meseros (Comandas tomadas, facturación y ticket promedio)
            const waiterRows = await prisma.$queryRaw<Array<{
                waiterName: string
                waiterId?: string | null
                ordersCount: number
                revenue: number
                averageTicket: number
            }>>`
                SELECT 
                    waiter_name AS "waiterName",
                    MAX(waiter_id::text) AS "waiterId",
                    COUNT(*)::int AS "ordersCount",
                    COALESCE(SUM(total::float8), 0)::float8 AS "revenue",
                    COALESCE(AVG(total::float8), 0)::float8 AS "averageTicket"
                FROM public.orders
                WHERE restaurant_id = ${store.userId}::uuid
                  AND status != 'cancelled'
                  AND waiter_name IS NOT NULL
                  AND created_at >= ${startDate}
                  AND created_at < ${endExclusive}
                GROUP BY waiter_name
                ORDER BY revenue DESC, "ordersCount" DESC
            `

            waiterPerformance = waiterRows.map((w) => ({
                waiterId: w.waiterId || null,
                waiterName: w.waiterName || 'Mesero',
                ordersCount: Number(w.ordersCount) || 0,
                revenue: Number(Number(w.revenue).toFixed(2)) || 0,
                averageTicket: Number(Number(w.averageTicket).toFixed(2)) || 0,
            }))
        }

        // 11. Evolución Temporal de Ventas Diarias (T84)
        const dailyRows = await prisma.$queryRaw<Array<{
            dateKey: string
            ordersCount: number
            revenue: number
        }>>`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD') AS "dateKey",
                COUNT(*)::int AS "ordersCount",
                COALESCE(SUM(total::float8), 0)::float8 AS "revenue"
            FROM public.orders
            WHERE restaurant_id = ${store.userId}::uuid
              AND status != 'cancelled'
              AND created_at >= ${startDate}
              AND created_at < ${endExclusive}
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY "dateKey" ASC
        `

        const dailyMap = new Map<string, { ordersCount: number; revenue: number }>()
        for (const row of dailyRows) {
            dailyMap.set(row.dateKey, row)
        }

        // Generar secuencia continua de días en el rango seleccionado
        const dailySales: DailySalesMetric[] = []
        const currentCursor = new Date(startDate)
        currentCursor.setHours(0, 0, 0, 0)
        // Último instante del período (el fin es exclusivo en SQL).
        const targetEnd = new Date(endExclusive.getTime() - 1)

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        const dayShorts = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

        let dayCounter = 0
        while (currentCursor <= targetEnd && dayCounter < 90) {
            const year = currentCursor.getFullYear()
            const month = String(currentCursor.getMonth() + 1).padStart(2, '0')
            const day = String(currentCursor.getDate()).padStart(2, '0')
            const dateKey = `${year}-${month}-${day}`

            const dayOfWeekNum = currentCursor.getDay()
            const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6
            const dayNumber = currentCursor.getDate()

            const found = dailyMap.get(dateKey)
            const revenue = found ? Number(Number(found.revenue).toFixed(2)) : 0
            const ordersCount = found ? Number(found.ordersCount) : 0

            dailySales.push({
                date: dateKey,
                label: `${dayShorts[dayOfWeekNum]} ${dayNumber}`,
                dayOfWeek: dayNames[dayOfWeekNum],
                revenue,
                ordersCount,
                isPeakDay: false,
                isWeekend,
            })

            currentCursor.setDate(currentCursor.getDate() + 1)
            dayCounter++
        }

        // Marcar el día de mayor facturación (Peak Day)
        const maxDailyRevenue = Math.max(...dailySales.map((d) => d.revenue), 0)
        if (maxDailyRevenue > 0) {
            for (const d of dailySales) {
                if (d.revenue === maxDailyRevenue) {
                    d.isPeakDay = true
                }
            }
        }

        const gatekeeping: AnalyticsPlanGatekeeping = {
            plan,
            isPro,
            allowedRanges: isPro ? ['today', '7d', '30d', 'month', 'custom'] : ['7d', '30d'],
            maxRankingItems: isPro ? null : 5,
            hasCustomDateRange: isPro,
            hasChannelBreakdown: isPro,
            hasWaiterPerformance: isPro,
        }

        return {
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                averageTicket,
                items,
                topSoldByQuantity: finalTopSoldByQuantity,
                topSoldByRevenue: finalTopSoldByRevenue,
                lowRotationProducts: finalLowRotation,
                combos: {
                    ...combos,
                    topCombos: finalTopCombos,
                },
                dailySales,
                gatekeeping,
                channelBreakdown,
                waiterPerformance,
                periodStart: startDate.toISOString(),
                periodEnd: endDate.toISOString(),
                range: effectiveRange,
                storeName: store.name,
                storeSlug: store.slug,
                isBlocked: false,
            },
        }
    } catch (error) {
        console.error('[getStoreAnalytics] Error al calcular estadísticas:', error)
        const msg = error instanceof Error ? error.message : 'Error interno al consultar estadísticas'
        return { success: false, error: msg }
    }
}

// ==============================================================================
// REGISTRO DE INTENCIÓN DE COMPRA (Mantenido para FloatingCart)
// ==============================================================================

const VALID_DELIVERY_TYPES = ['delivery', 'pickup', 'dinein'] as const

export async function logOrderIntent(storeId: string, total: number, deliveryType: string) {
    try {
        if (!VALID_DELIVERY_TYPES.includes(deliveryType as 'delivery' | 'pickup' | 'dinein')) {
            return { success: false }
        }

        if (typeof total !== 'number' || isNaN(total) || total <= 0 || total > 100_000) {
            return { success: false }
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!storeId || !uuidRegex.test(storeId)) {
            return { success: false }
        }

        const storeExists = await prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true },
        })

        if (!storeExists) {
            return { success: false }
        }

        await prisma.orderIntentLog.create({
            data: {
                storeId,
                total: Math.round(total * 100) / 100,
                deliveryType,
            },
        })

        return { success: true }
    } catch (error) {
        console.error('Error logging order intent:', error)
        return { success: false }
    }
}


// src/actions/order-history.ts
// Historial de órdenes y directorio de clientes del restaurante.
// La C.I. (customer_cedula) es la clave de agrupación del cliente: dos
// personas pueden llamarse igual, pero su cédula las distingue.

'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyStoreOwnership } from '@/src/actions/subscription'
import { getSubscriptionInfo } from '@/lib/subscription'
import {
    AnalyticsDateRange,
    normalizeAnalyticsRange,
    resolveDateRange,
    ResolvedDateRange,
} from '@/lib/analytics-range'

// ==============================================================================
// TIPOS
// ==============================================================================

export type OrderHistoryStatus = 'pending' | 'cooking' | 'completed' | 'cancelled'
export type OrderHistoryStatusFilter = 'all' | OrderHistoryStatus
export type OrderHistorySource = 'whatsapp' | 'table' | 'waiter'
export type CustomerSort = 'orders' | 'spent' | 'recent'

export interface OrderHistoryLine {
    name: string
    quantity: number
    price: number
    notes: string | null
    isInfo: boolean
}

export interface OrderHistoryItem {
    id: string
    customerName: string
    customerCedula: string | null
    total: number
    status: OrderHistoryStatus
    source: OrderHistorySource
    tableNumber: string | null
    waiterName: string | null
    createdAt: string
    createdAtLabel: string
    deliveredAt: string | null
    items: OrderHistoryLine[]
    itemsCount: number
    itemsSummary: string
}

export interface OrdersHistoryData {
    orders: OrderHistoryItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    counts: Record<OrderHistoryStatusFilter, number>
    ordersWithoutCedula: number
    allTime: boolean
    period: { start: string; end: string } | null
}

export interface OrdersHistoryResponse {
    success: boolean
    error?: string
    data?: OrdersHistoryData
}

export interface OrdersHistoryQuery {
    storeId: string
    range?: AnalyticsDateRange
    from?: string
    to?: string
    allTime?: boolean
    status?: OrderHistoryStatusFilter
    search?: string
    page?: number
    pageSize?: number
}

export interface StoreCustomer {
    cedula: string
    name: string
    namesCount: number
    ordersCount: number
    totalSpent: number
    averageTicket: number
    firstOrderAt: string
    firstOrderAtLabel: string
    lastOrderAt: string
    lastOrderAtLabel: string
}

export interface CustomersSummary {
    totalCustomers: number
    repeatCustomers: number
    ordersWithCedula: number
    ordersWithoutCedula: number
}

export interface CustomersData {
    customers: StoreCustomer[]
    summary: CustomersSummary
    total: number
    page: number
    pageSize: number
    totalPages: number
    allTime: boolean
    sort: CustomerSort
    period: { start: string; end: string } | null
}

export interface CustomersResponse {
    success: boolean
    error?: string
    data?: CustomersData
}

export interface CustomersQuery {
    storeId: string
    range?: AnalyticsDateRange
    from?: string
    to?: string
    allTime?: boolean
    sort?: CustomerSort
    search?: string
    page?: number
    pageSize?: number
}

// ==============================================================================
// CONSTANTES Y HELPERS
// ==============================================================================

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
const MAX_SEARCH_LENGTH = 60
const MAX_PAGE = 100_000

// El proyecto aún no tiene Store.timeZone: se fija Venezuela para que las
// etiquetas de fecha sean deterministas en servidor y cliente (sin hydration
// mismatch). Cuando exista zona horaria por local, se cambia solo aquí.
const DISPLAY_TIME_ZONE = 'America/Caracas'

const VALID_STATUS_FILTERS: readonly OrderHistoryStatusFilter[] = [
    'all',
    'pending',
    'cooking',
    'completed',
    'cancelled',
]

const VALID_STATUSES: readonly OrderHistoryStatus[] = [
    'pending',
    'cooking',
    'completed',
    'cancelled',
]

const VALID_SORTS: readonly CustomerSort[] = ['orders', 'spent', 'recent']

/**
 * Expresión SQL compartida para resolver la C.I. del cliente:
 * 1. Columna nueva (solo dígitos).
 * 2. Fallback a órdenes antiguas con "Nombre (C.I: 12345678)" en customer_name.
 */
const CEDULA_SQL = Prisma.sql`COALESCE(
    NULLIF(regexp_replace(customer_cedula, '[^0-9]', '', 'g'), ''),
    NULLIF(regexp_replace(substring(customer_name FROM '[(]C[.]I:[[:space:]]*([^)]+)[)]'), '[^0-9]', '', 'g'), '')
)`

/** Nombre visible sin el sufijo "(C.I: ...)" de órdenes antiguas. */
const CLEAN_NAME_SQL = Prisma.sql`regexp_replace(customer_name, '[[:space:]]*[(]C[.]I:.*[)][[:space:]]*$', '')`

const REAL_NAME_FILTER_SQL = Prisma.sql`name !~* '^Mesa[[:space:]]'`

interface RawOrderRow {
    id: string
    customerName: string
    customerCedula: string | null
    total: number
    status: string
    source: string | null
    tableNumber: string | null
    waiterName: string | null
    createdAt: Date | string
    deliveredAt: Date | string | null
    items: unknown
}

interface RawCustomerRow {
    cedula: string
    name: string
    namesCount: number
    ordersCount: number
    totalSpent: number
    firstOrderAt: Date | string
    lastOrderAt: Date | string
}

interface RawCustomersSummaryRow {
    totalCustomers: number
    repeatCustomers: number
    ordersWithCedula: number
    ordersWithoutCedula: number
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function normalizeSearch(value: unknown): string {
    if (typeof value !== 'string') return ''
    return value.trim().slice(0, MAX_SEARCH_LENGTH)
}

/** Escapa comodines de ILIKE para que el texto se busque de forma literal. */
function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

function toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function formatDateTime(value: Date | string): string {
    return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: DISPLAY_TIME_ZONE,
    }).format(value instanceof Date ? value : new Date(value))
}

function formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: DISPLAY_TIME_ZONE,
    }).format(value instanceof Date ? value : new Date(value))
}

function parseStatus(value: unknown): OrderHistoryStatusFilter {
    return VALID_STATUS_FILTERS.includes(value as OrderHistoryStatusFilter)
        ? (value as OrderHistoryStatusFilter)
        : 'all'
}

function parseSort(value: unknown): CustomerSort {
    return VALID_SORTS.includes(value as CustomerSort) ? (value as CustomerSort) : 'orders'
}

function parseSource(value: unknown): OrderHistorySource {
    if (value === 'table' || value === 'waiter') return value
    return 'whatsapp'
}

function parseStatusValue(value: unknown): OrderHistoryStatus {
    return VALID_STATUSES.includes(value as OrderHistoryStatus)
        ? (value as OrderHistoryStatus)
        : 'pending'
}

function normalizeItems(raw: unknown): OrderHistoryLine[] {
    let parsed: unknown = raw
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed)
        } catch {
            return []
        }
    }
    if (!Array.isArray(parsed)) return []

    const lines: OrderHistoryLine[] = []
    for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') continue
        const item = entry as Record<string, unknown>
        const name = typeof item.name === 'string' ? item.name.trim() : ''
        if (!name) continue

        const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1))
        const price = Number(item.price) || 0
        const notes = typeof item.notes === 'string' && item.notes.trim() ? item.notes.trim() : null

        lines.push({
            name,
            quantity,
            price,
            notes,
            isInfo: name.startsWith('ℹ️'),
        })
    }
    return lines
}

function buildItemsSummary(items: OrderHistoryLine[]): {
    itemsCount: number
    itemsSummary: string
} {
    const visible = items.filter((item) => !item.isInfo)
    const itemsCount = visible.reduce((acc, item) => acc + item.quantity, 0)
    const summary = visible
        .slice(0, 3)
        .map((item) => `${item.quantity}× ${item.name}`)
        .join(', ')
    const extra = visible.length > 3 ? ` +${visible.length - 3} más` : ''
    return {
        itemsCount,
        itemsSummary: summary ? `${summary}${extra}` : 'Sin productos',
    }
}

/**
 * Condiciones base del historial de órdenes.
 * Importante: `restaurant_id` SIEMPRE va primero. Prisma se conecta con un rol
 * que evade RLS, así que el aislamiento entre restaurantes se hace aquí.
 */
function buildOrderConditions(
    restaurantId: string,
    period: ResolvedDateRange | null,
    status: OrderHistoryStatusFilter,
    search: string
): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [Prisma.sql`restaurant_id = ${restaurantId}::uuid`]

    if (period) {
        conditions.push(Prisma.sql`created_at >= ${period.startDate}`)
        conditions.push(Prisma.sql`created_at < ${period.endExclusive}`)
    }

    if (status !== 'all') {
        conditions.push(Prisma.sql`status = ${status}`)
    }

    if (search) {
        const like = `%${escapeLike(search)}%`
        const digits = search.replace(/\D/g, '')
        if (digits) {
            const digitsLike = `%${digits}%`
            conditions.push(Prisma.sql`(
                customer_name ILIKE ${like}
                OR COALESCE(customer_cedula, '') ILIKE ${digitsLike}
            )`)
        } else {
            conditions.push(Prisma.sql`customer_name ILIKE ${like}`)
        }
    }

    return conditions
}

function safePeriod(
    range: AnalyticsDateRange,
    from: string | undefined,
    to: string | undefined,
    allTime: boolean,
    isPro: boolean
): { range: AnalyticsDateRange; period: ResolvedDateRange | null } {
    const effectiveRange = normalizeAnalyticsRange(range, isPro)
    return {
        range: effectiveRange,
        period: allTime
            ? null
            : resolveDateRange(
                  effectiveRange,
                  isPro ? from : undefined,
                  isPro ? to : undefined
              ),
    }
}

function periodToJson(period: ResolvedDateRange | null): { start: string; end: string } | null {
    return period
        ? { start: period.startDate.toISOString(), end: period.endDate.toISOString() }
        : null
}

// ==============================================================================
// 1. HISTORIAL DE ÓRDENES
// ==============================================================================

export async function getStoreOrdersHistory(
    query: OrdersHistoryQuery
): Promise<OrdersHistoryResponse> {
    try {
        const { store } = await verifyStoreOwnership(query.storeId)

        const subscription = getSubscriptionInfo(store)
        if (subscription.isBlocked) {
            return {
                success: false,
                error: 'El acceso a estadísticas está bloqueado por el estado de la suscripción.',
            }
        }

        const isPro = Boolean(subscription.canAccessPro)
        const allTime = query.allTime === true
        const status = parseStatus(query.status)
        const search = normalizeSearch(query.search)
        const pageSize = clampInt(query.pageSize, 5, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)
        const requestedPage = clampInt(query.page, 1, MAX_PAGE, 1)

        const { period } = safePeriod(
            query.range ?? '7d',
            query.from,
            query.to,
            allTime,
            isPro
        )

        const baseConditions = buildOrderConditions(store.userId, period, 'all', search)
        const baseWhere = Prisma.join(baseConditions, ' AND ')

        // Conteo por estado (sin aplicar el filtro de estado, sí la búsqueda).
        const statusRows = await prisma.$queryRaw<Array<{ status: string; count: number }>>(
            Prisma.sql`
                SELECT status, COUNT(*)::int AS count
                FROM public.orders
                WHERE ${baseWhere}
                GROUP BY status
            `
        )

        const counts: Record<OrderHistoryStatusFilter, number> = {
            all: 0,
            pending: 0,
            cooking: 0,
            completed: 0,
            cancelled: 0,
        }
        for (const row of statusRows) {
            const key = parseStatusValue(row.status)
            const count = Number(row.count) || 0
            counts[key] += count
            counts.all += count
        }

        // Órdenes sin C.I. (mesa/mesero o cuando el local desactivó la cédula).
        const withoutCedulaRows = await prisma.$queryRaw<Array<{ count: number }>>(
            Prisma.sql`
                SELECT COUNT(*)::int AS count
                FROM public.orders
                WHERE ${baseWhere}
                  AND ${CEDULA_SQL} IS NULL
            `
        )
        const ordersWithoutCedula = Number(withoutCedulaRows[0]?.count) || 0

        // Conteo total con el filtro de estado aplicado.
        const filteredConditions = buildOrderConditions(store.userId, period, status, search)
        const filteredWhere = Prisma.join(filteredConditions, ' AND ')
        const totalRows = await prisma.$queryRaw<Array<{ total: number }>>(
            Prisma.sql`
                SELECT COUNT(*)::int AS total
                FROM public.orders
                WHERE ${filteredWhere}
            `
        )
        const total = Number(totalRows[0]?.total) || 0
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const page = Math.min(requestedPage, totalPages)
        const offset = (page - 1) * pageSize

        const rows = await prisma.$queryRaw<RawOrderRow[]>(
            Prisma.sql`
                SELECT
                    id::text AS id,
                    ${CLEAN_NAME_SQL} AS "customerName",
                    ${CEDULA_SQL} AS "customerCedula",
                    total::float8 AS total,
                    status,
                    COALESCE(source, 'whatsapp') AS source,
                    table_number AS "tableNumber",
                    waiter_name AS "waiterName",
                    created_at AS "createdAt",
                    delivered_at AS "deliveredAt",
                    items
                FROM public.orders
                WHERE ${filteredWhere}
                ORDER BY created_at DESC
                LIMIT ${pageSize} OFFSET ${offset}
            `
        )

        const orders: OrderHistoryItem[] = rows.map((row) => {
            const items = normalizeItems(row.items)
            const { itemsCount, itemsSummary } = buildItemsSummary(items)

            return {
                id: row.id,
                customerName: (row.customerName || '').trim() || 'Cliente',
                customerCedula: row.customerCedula || null,
                total: Number(Number(row.total).toFixed(2)) || 0,
                status: parseStatusValue(row.status),
                source: parseSource(row.source),
                tableNumber: row.tableNumber || null,
                waiterName: row.waiterName || null,
                createdAt: toIso(row.createdAt),
                createdAtLabel: formatDateTime(row.createdAt),
                deliveredAt: row.deliveredAt ? toIso(row.deliveredAt) : null,
                items,
                itemsCount,
                itemsSummary,
            }
        })

        return {
            success: true,
            data: {
                orders,
                total,
                page,
                pageSize,
                totalPages,
                counts,
                ordersWithoutCedula,
                allTime,
                period: periodToJson(period),
            },
        }
    } catch (error) {
        console.error('[getStoreOrdersHistory] Error:', error)
        const message = error instanceof Error ? error.message : 'Error interno al consultar el historial'
        return { success: false, error: message }
    }
}

// ==============================================================================
// 2. DIRECTORIO DE CLIENTES (AGRUPADO POR C.I.)
// ==============================================================================

export async function getStoreCustomers(query: CustomersQuery): Promise<CustomersResponse> {
    try {
        const { store } = await verifyStoreOwnership(query.storeId)

        const subscription = getSubscriptionInfo(store)
        if (subscription.isBlocked) {
            return {
                success: false,
                error: 'El acceso a estadísticas está bloqueado por el estado de la suscripción.',
            }
        }

        const isPro = Boolean(subscription.canAccessPro)
        // Por defecto el directorio cubre TODO el historial; la UI ofrece
        // limitarlo al período seleccionado con `allTime: false`.
        const allTime = query.allTime !== false
        const sort = parseSort(query.sort)
        const search = normalizeSearch(query.search)
        const pageSize = clampInt(query.pageSize, 5, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)
        const requestedPage = clampInt(query.page, 1, MAX_PAGE, 1)

        const { period } = safePeriod(
            query.range ?? '7d',
            query.from,
            query.to,
            allTime,
            isPro
        )

        const baseConditions: Prisma.Sql[] = [
            Prisma.sql`restaurant_id = ${store.userId}::uuid`,
            Prisma.sql`status <> 'cancelled'`,
        ]
        if (period) {
            baseConditions.push(Prisma.sql`created_at >= ${period.startDate}`)
            baseConditions.push(Prisma.sql`created_at < ${period.endExclusive}`)
        }

        const baseCte = Prisma.sql`
            WITH base AS (
                SELECT
                    ${CEDULA_SQL} AS cedula,
                    ${CLEAN_NAME_SQL} AS name,
                    total::float8 AS total,
                    created_at
                FROM public.orders
                WHERE ${Prisma.join(baseConditions, ' AND ')}
            ),
            identified AS (
                SELECT * FROM base WHERE cedula IS NOT NULL
            ),
            aggregated AS (
                SELECT
                    cedula,
                    COUNT(*)::int AS "ordersCount",
                    COALESCE(SUM(total), 0)::float8 AS "totalSpent",
                    MIN(created_at) AS "firstOrderAt",
                    MAX(created_at) AS "lastOrderAt",
                    (COUNT(DISTINCT name) FILTER (WHERE ${REAL_NAME_FILTER_SQL}))::int AS "namesCount",
                    (array_agg(name ORDER BY created_at DESC))[1] AS "latestName",
                    (array_agg(name ORDER BY created_at DESC) FILTER (WHERE ${REAL_NAME_FILTER_SQL}))[1] AS "realName"
                FROM identified
                GROUP BY cedula
            )
        `

        // Búsqueda por C.I. (con o sin puntos) o por nombre.
        const searchConditions: Prisma.Sql[] = [Prisma.sql`TRUE`]
        if (search) {
            const like = `%${escapeLike(search)}%`
            const digits = search.replace(/\D/g, '')
            if (digits) {
                const digitsLike = `%${digits}%`
                searchConditions.push(Prisma.sql`(
                    cedula ILIKE ${digitsLike}
                    OR COALESCE("realName", "latestName", '') ILIKE ${like}
                )`)
            } else {
                searchConditions.push(
                    Prisma.sql`COALESCE("realName", "latestName", '') ILIKE ${like}`
                )
            }
        }
        const searchWhere = Prisma.join(searchConditions, ' AND ')

        // Resumen global (no depende de la búsqueda ni de la página).
        const summaryRows = await prisma.$queryRaw<RawCustomersSummaryRow[]>(
            Prisma.sql`
                ${baseCte}
                SELECT
                    (SELECT COUNT(*)::int FROM aggregated) AS "totalCustomers",
                    (SELECT COUNT(*)::int FROM aggregated WHERE "ordersCount" >= 2) AS "repeatCustomers",
                    (SELECT COUNT(*)::int FROM identified) AS "ordersWithCedula",
                    (SELECT COUNT(*)::int FROM base WHERE cedula IS NULL) AS "ordersWithoutCedula"
            `
        )
        const rawSummary = summaryRows[0]
        const summary: CustomersSummary = {
            totalCustomers: Number(rawSummary?.totalCustomers) || 0,
            repeatCustomers: Number(rawSummary?.repeatCustomers) || 0,
            ordersWithCedula: Number(rawSummary?.ordersWithCedula) || 0,
            ordersWithoutCedula: Number(rawSummary?.ordersWithoutCedula) || 0,
        }

        const totalRows = await prisma.$queryRaw<Array<{ total: number }>>(
            Prisma.sql`
                ${baseCte}
                SELECT COUNT(*)::int AS total
                FROM aggregated
                WHERE ${searchWhere}
            `
        )
        const total = Number(totalRows[0]?.total) || 0
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const page = Math.min(requestedPage, totalPages)
        const offset = (page - 1) * pageSize

        // ORDER BY elegido por lista blanca (nunca se interpola input del cliente).
        let orderBy: Prisma.Sql
        switch (sort) {
            case 'spent':
                orderBy = Prisma.sql`ORDER BY "totalSpent" DESC, "ordersCount" DESC, "lastOrderAt" DESC`
                break
            case 'recent':
                orderBy = Prisma.sql`ORDER BY "lastOrderAt" DESC, "ordersCount" DESC`
                break
            default:
                orderBy = Prisma.sql`ORDER BY "ordersCount" DESC, "totalSpent" DESC, "lastOrderAt" DESC`
                break
        }

        const rows = await prisma.$queryRaw<RawCustomerRow[]>(
            Prisma.sql`
                ${baseCte}
                SELECT
                    cedula,
                    COALESCE(
                        NULLIF("realName", ''),
                        CASE
                            WHEN "latestName" IS NULL OR "latestName" ~* '^Mesa[[:space:]]' THEN 'Cliente'
                            ELSE "latestName"
                        END
                    ) AS name,
                    GREATEST("namesCount", 1)::int AS "namesCount",
                    "ordersCount",
                    "totalSpent",
                    "firstOrderAt",
                    "lastOrderAt"
                FROM aggregated
                WHERE ${searchWhere}
                ${orderBy}
                LIMIT ${pageSize} OFFSET ${offset}
            `
        )

        const customers: StoreCustomer[] = rows.map((row) => {
            const ordersCount = Number(row.ordersCount) || 0
            const totalSpent = Number(Number(row.totalSpent).toFixed(2)) || 0

            return {
                cedula: row.cedula,
                name: (row.name || '').trim() || 'Cliente',
                namesCount: Number(row.namesCount) || 1,
                ordersCount,
                totalSpent,
                averageTicket:
                    ordersCount > 0 ? Number((totalSpent / ordersCount).toFixed(2)) : 0,
                firstOrderAt: toIso(row.firstOrderAt),
                firstOrderAtLabel: formatDate(row.firstOrderAt),
                lastOrderAt: toIso(row.lastOrderAt),
                lastOrderAtLabel: formatDate(row.lastOrderAt),
            }
        })

        return {
            success: true,
            data: {
                customers,
                summary,
                total,
                page,
                pageSize,
                totalPages,
                allTime,
                sort,
                period: periodToJson(period),
            },
        }
    } catch (error) {
        console.error('[getStoreCustomers] Error:', error)
        const message = error instanceof Error ? error.message : 'Error interno al consultar clientes'
        return { success: false, error: message }
    }
}

// src/lib/analytics-range.ts
// Resolución compartida de períodos para el módulo de estadísticas e historial.
// Se centraliza aquí para que las métricas, la lista de órdenes y el directorio
// de clientes usen exactamente el mismo rango de fechas.

export const ANALYTICS_DATE_RANGES = ['today', '7d', '30d', 'month', 'custom'] as const

export type AnalyticsDateRange = (typeof ANALYTICS_DATE_RANGES)[number]

export interface ResolvedDateRange {
    /** Inicio del período (inclusive). */
    startDate: Date
    /** Fin del período (inclusive) tal como se muestra en la UI. */
    endDate: Date
    /** Inicio del día siguiente al fin (exclusivo) para consultas SQL. */
    endExclusive: Date
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Valida un valor arbitrario (searchParams) como rango analítico.
 * Si no es válido, cae en '7d' (el rango por defecto del módulo).
 */
export function parseAnalyticsDateRange(value: unknown): AnalyticsDateRange {
    if (typeof value === 'string' && (ANALYTICS_DATE_RANGES as readonly string[]).includes(value)) {
        return value as AnalyticsDateRange
    }
    return '7d'
}

/**
 * Aplica el gatekeeping de rangos por plan:
 * - Plan Básico: solo '7d' y '30d'.
 * - Plan Pro: cualquier rango (today, month, custom).
 */
export function normalizeAnalyticsRange(
    range: AnalyticsDateRange,
    isPro: boolean
): AnalyticsDateRange {
    if (isPro) return range
    return range === '30d' ? '30d' : '7d'
}

/**
 * Convierte un input de fecha ('YYYY-MM-DD' o Date) al inicio del día en UTC.
 * El proyecto todavía no tiene `Store.timeZone`, así que se mantiene la
 * semántica histórica (medianoche UTC) y solo se corrige el fin de día.
 */
function parseDateOnly(value?: string | Date | null): Date | null {
    if (!value) return null

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : new Date(value.getTime())
    }

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch
        return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    }

    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Resuelve las fechas de inicio y fin según el rango solicitado.
 *
 * Importante: `endExclusive` permite hacer `created_at < endExclusive` para
 * incluir el día "Hasta" completo (antes se comparaba contra la medianoche
 * del día final y se perdían las órdenes de ese día).
 */
export function resolveDateRange(
    range: AnalyticsDateRange,
    customFrom?: string | Date,
    customTo?: string | Date
): ResolvedDateRange {
    const now = new Date()
    let startDate: Date
    let endDate = new Date(now)
    let endExclusive = new Date(now.getTime() + 1)

    switch (range) {
        case 'today': {
            startDate = new Date(now)
            startDate.setHours(0, 0, 0, 0)
            break
        }
        case '7d': {
            startDate = new Date(now.getTime() - 7 * DAY_MS)
            break
        }
        case '30d': {
            startDate = new Date(now.getTime() - 30 * DAY_MS)
            break
        }
        case 'month': {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
            break
        }
        case 'custom': {
            const parsedFrom = parseDateOnly(customFrom)
            const parsedTo = parseDateOnly(customTo)

            startDate = parsedFrom ?? new Date(now.getTime() - 7 * DAY_MS)

            if (parsedTo) {
                // Fin del día "Hasta" en UTC + inicio del día siguiente (exclusivo).
                endDate = new Date(parsedTo.getTime())
                endDate.setUTCHours(23, 59, 59, 999)
                endExclusive = new Date(parsedTo.getTime() + DAY_MS)
            }
            break
        }
        default: {
            startDate = new Date(now.getTime() - 7 * DAY_MS)
            break
        }
    }

    return { startDate, endDate, endExclusive }
}

// src/actions/waiters.ts
// MESEROS y MESAS — Sistema de Tres Menús (docs/DESIGN.md §12)
'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import {
    clearWaiterSessionCookie,
    generateAccessCode,
    getSessionWaiter,
    hashAccessCode,
    normalizeAccessCode,
    setWaiterSessionCookie,
    WAITER_SESSION_TTL_SECONDS,
} from '@/lib/waiterAuth'

// Rate limiting para mitigar ataques de fuerza bruta y DoS sobre scrypt
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkWaiterRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): { allowed: boolean; remainingSec: number } {
    const now = Date.now()
    const record = loginAttempts.get(key)

    if (!record || now > record.resetAt) {
        loginAttempts.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remainingSec: 0 }
    }

    if (record.count >= maxAttempts) {
        const remainingSec = Math.ceil((record.resetAt - now) / 1000)
        return { allowed: false, remainingSec }
    }

    record.count++
    return { allowed: true, remainingSec: 0 }
}

function clearWaiterRateLimit(key: string) {
    loginAttempts.delete(key)
}

export type ActionResult<T = object> =
    | { success: false; error?: string }
    | ({ success: true; error?: string } & T)

// ==============================================================================
// SEGURIDAD: sesión de admin (Supabase) + propiedad del local
// ==============================================================================

async function requireStoreOwner(storeId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión expirada')

    const store = await prisma.store.findFirst({
        where: { id: storeId, userId: user.id },
    })
    if (!store) throw new Error('Acceso denegado')

    return { user, store }
}

function errMsg(e: unknown, fallback: string): string {
    return e instanceof Error && e.message ? e.message : fallback
}

function revalidateMesas() {
    revalidatePath('/dashboard/mesas')
}

// ==============================================================================
// MESEROS (acciones de ADMIN)
// ==============================================================================

export async function createWaiter(
    storeId: string,
    name: string
): Promise<ActionResult<{ waiter?: { id: string; name: string }; accessCode?: string }>> {
    try {
        await requireStoreOwner(storeId)
        const cleanName = (name || '').trim()
        if (cleanName.length < 2) return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
        if (cleanName.length > 40) return { success: false, error: 'El nombre no puede superar los 40 caracteres' }

        // Clave aleatoria + hash scrypt (el claro solo se devuelve UNA vez)
        let code = ''
        let hash = ''
        for (let attempt = 0; attempt < 5; attempt++) {
            code = generateAccessCode()
            hash = hashAccessCode(storeId, code)
            const exists = await prisma.waiter.findFirst({ where: { storeId, accessCodeHash: hash } })
            if (!exists) break
            code = ''
        }
        if (!code) return { success: false, error: 'No se pudo generar una clave única, inténtalo de nuevo' }

        const waiter = await prisma.waiter.create({
            data: { storeId, name: cleanName, accessCodeHash: hash },
            select: { id: true, name: true },
        })

        revalidateMesas()
        return { success: true, waiter, accessCode: code }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo crear el mesero') }
    }
}

export async function regenerateWaiterCode(
    waiterId: string
): Promise<ActionResult<{ accessCode?: string }>> {
    try {
        const waiter = await prisma.waiter.findUnique({ where: { id: waiterId } })
        if (!waiter) return { success: false, error: 'Mesero no encontrado' }
        await requireStoreOwner(waiter.storeId)

        let code = ''
        let hash = ''
        for (let attempt = 0; attempt < 5; attempt++) {
            code = generateAccessCode()
            hash = hashAccessCode(waiter.storeId, code)
            const exists = await prisma.waiter.findFirst({
                where: { storeId: waiter.storeId, accessCodeHash: hash, NOT: { id: waiterId } },
            })
            if (!exists) break
            code = ''
        }
        if (!code) return { success: false, error: 'No se pudo generar una clave única, inténtalo de nuevo' }

        // Nueva clave ⇒ invalida todas las sesiones abiertas del mesero
        await prisma.$transaction([
            prisma.waiter.update({ where: { id: waiterId }, data: { accessCodeHash: hash } }),
            prisma.waiterSession.deleteMany({ where: { waiterId } }),
        ])

        revalidateMesas()
        return { success: true, accessCode: code }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo regenerar la clave') }
    }
}

export async function setWaiterActive(waiterId: string, active: boolean): Promise<ActionResult> {
    try {
        const waiter = await prisma.waiter.findUnique({ where: { id: waiterId } })
        if (!waiter) return { success: false, error: 'Mesero no encontrado' }
        await requireStoreOwner(waiter.storeId)

        await prisma.$transaction([
            prisma.waiter.update({ where: { id: waiterId }, data: { isActive: active } }),
            // Desactivar cierra las sesiones abiertas (si vuelve, debe reloguear)
            ...(active ? [] : [prisma.waiterSession.deleteMany({ where: { waiterId } })]),
        ])

        revalidateMesas()
        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo actualizar el mesero') }
    }
}

export async function deleteWaiter(waiterId: string): Promise<ActionResult> {
    try {
        const waiter = await prisma.waiter.findUnique({ where: { id: waiterId } })
        if (!waiter) return { success: false, error: 'Mesero no encontrado' }
        await requireStoreOwner(waiter.storeId)

        // Las mesas asignadas quedan libres (onDelete: SetNull en la FK)
        await prisma.waiter.delete({ where: { id: waiterId } })

        revalidateMesas()
        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo eliminar el mesero') }
    }
}

// ==============================================================================
// MESAS (acciones de ADMIN)
// ==============================================================================

function newQrToken(): string {
    return randomBytes(16).toString('hex') // 32 hex chars, opaco e impredecible
}

export async function createTable(
    storeId: string,
    number: string
): Promise<ActionResult<{ table?: { id: string; number: string } }>> {
    try {
        await requireStoreOwner(storeId)
        const clean = (number || '').trim()
        if (!clean) return { success: false, error: 'Ingresa el número o nombre de la mesa' }
        if (clean.length > 30) return { success: false, error: 'El número no puede superar los 30 caracteres' }

        const dup = await prisma.table.findFirst({ where: { storeId, number: clean } })
        if (dup) return { success: false, error: `La mesa "${clean}" ya existe` }

        const table = await prisma.table.create({
            data: { storeId, number: clean, qrToken: newQrToken() },
            select: { id: true, number: true },
        })

        revalidateMesas()
        return { success: true, table }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo crear la mesa') }
    }
}

export async function createTablesBulk(
    storeId: string,
    from: number,
    to: number
): Promise<ActionResult<{ created: number; skipped: number }>> {
    try {
        await requireStoreOwner(storeId)
        if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
            return { success: false, error: 'Rango inválido (ej: de 1 a 20)' }
        }
        if (to - from + 1 > 100) return { success: false, error: 'Máximo 100 mesas por lote' }

        const existing = await prisma.table.findMany({
            where: { storeId, number: { in: Array.from({ length: to - from + 1 }, (_, i) => String(from + i)) } },
            select: { number: true },
        })
        const existingSet = new Set(existing.map((t) => t.number))

        let created = 0
        let skipped = 0
        for (let n = from; n <= to; n++) {
            const num = String(n)
            if (existingSet.has(num)) {
                skipped++
                continue
            }
            await prisma.table.create({
                data: { storeId, number: num, qrToken: newQrToken() },
            })
            created++
        }

        revalidateMesas()
        return { success: true, created, skipped }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudieron crear las mesas') }
    }
}

export async function deleteTable(tableId: string): Promise<ActionResult> {
    try {
        const table = await prisma.table.findUnique({ where: { id: tableId } })
        if (!table) return { success: false, error: 'Mesa no encontrada' }
        await requireStoreOwner(table.storeId)

        await prisma.table.delete({ where: { id: tableId } })
        revalidateMesas()
        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo eliminar la mesa') }
    }
}

export async function setTableActive(tableId: string, active: boolean): Promise<ActionResult> {
    try {
        const table = await prisma.table.findUnique({ where: { id: tableId } })
        if (!table) return { success: false, error: 'Mesa no encontrada' }
        await requireStoreOwner(table.storeId)

        // Desactivar una mesa también la libera
        await prisma.table.update({
            where: { id: tableId },
            data: { isActive: active, ...(active ? {} : { waiterId: null }) },
        })
        revalidateMesas()
        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo actualizar la mesa') }
    }
}

export async function assignWaiter(tableId: string, waiterId: string | null): Promise<ActionResult> {
    try {
        const table = await prisma.table.findUnique({ where: { id: tableId } })
        if (!table) return { success: false, error: 'Mesa no encontrada' }
        await requireStoreOwner(table.storeId)

        if (waiterId) {
            const waiter = await prisma.waiter.findFirst({
                where: { id: waiterId, storeId: table.storeId },
            })
            if (!waiter) return { success: false, error: 'Mesero no encontrado en este local' }
        }

        await prisma.table.update({ where: { id: tableId }, data: { waiterId } })
        revalidateMesas()
        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo asignar el mesero') }
    }
}

// ==============================================================================
// SESIÓN DEL MESERO (público, protegido por la clave de acceso)
// ==============================================================================

export async function signInWaiter(
    slug: string,
    accessCode: string
): Promise<ActionResult<{ waiter?: { id: string; name: string } }>> {
    try {
        const headersList = await headers()
        const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'anonymous'
        const rateLimitKey = `waiter_login:${slug}:${clientIp}`

        const { allowed, remainingSec } = checkWaiterRateLimit(rateLimitKey, 5, 60_000)
        if (!allowed) {
            return { success: false, error: `Demasiados intentos fallidos. Intenta de nuevo en ${remainingSec} segundos.` }
        }

        const store = await prisma.store.findUnique({ where: { slug } })
        if (!store) return { success: false, error: 'Clave incorrecta.' }

        const code = normalizeAccessCode(accessCode)
        if (code.length < 4) return { success: false, error: 'Clave incorrecta.' }

        const hash = hashAccessCode(store.id, code)
        const waiter = await prisma.waiter.findFirst({
            where: { storeId: store.id, accessCodeHash: hash, isActive: true },
            select: { id: true, name: true },
        })
        if (!waiter) return { success: false, error: 'Clave incorrecta.' }

        // Login exitoso: limpiar contador de intentos fallidos
        clearWaiterRateLimit(rateLimitKey)

        const token = randomBytes(32).toString('hex')
        const tokenHash = createHash('sha256').update(token).digest('hex')

        await prisma.$transaction([
            // Limpia sesiones vencidas de este mesero
            prisma.waiterSession.deleteMany({
                where: { waiterId: waiter.id, expiresAt: { lt: new Date() } },
            }),
            prisma.waiterSession.create({
                data: {
                    tokenHash,
                    waiterId: waiter.id,
                    expiresAt: new Date(Date.now() + WAITER_SESSION_TTL_SECONDS * 1000),
                },
            }),
        ])

        await setWaiterSessionCookie(token)
        return { success: true, waiter }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo iniciar sesión') }
    }
}

export async function signOutWaiter(): Promise<ActionResult> {
    try {
        const session = await getSessionWaiter()
        if (session) {
            await prisma.waiterSession.deleteMany({ where: { id: session.sessionId } })
        }
        await clearWaiterSessionCookie()
        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo cerrar la sesión') }
    }
}

// ==============================================================================
// TOMA / LIBERACIÓN DE MESAS (solo mesero con sesión válida)
// ==============================================================================

export async function claimTable(
    tableId: string
): Promise<ActionResult<{ table?: { id: string; number: string; qrToken: string } }>> {
    try {
        const session = await getSessionWaiter()
        if (!session) return { success: false, error: 'Tu sesión expiró. Ingresa tu clave de nuevo.' }

        const table = await prisma.table.findUnique({ where: { id: tableId } })
        if (!table || !table.isActive || table.storeId !== session.storeId) {
            return { success: false, error: 'Mesa no disponible' }
        }

        // Idempotente: si ya es suya, no hace falta reclamar
        if (table.waiterId === session.id) {
            return { success: true, table: { id: table.id, number: table.number, qrToken: table.qrToken } }
        }

        // Condición de carrera resuelta en DB: solo gana quien hace match con waiterId IS NULL
        const claimed = await prisma.table.updateMany({
            where: { id: tableId, isActive: true, waiterId: null },
            data: { waiterId: session.id },
        })

        if (claimed.count === 1) {
            return { success: true, table: { id: table.id, number: table.number, qrToken: table.qrToken } }
        }

        return { success: false, error: 'La mesa ya fue tomada por otro mesero' }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo tomar la mesa') }
    }
}

export async function releaseTable(tableId: string): Promise<ActionResult> {
    try {
        const session = await getSessionWaiter()
        if (!session) return { success: false, error: 'Tu sesión expiró. Ingresa tu clave de nuevo.' }

        const released = await prisma.table.updateMany({
            where: { id: tableId, waiterId: session.id },
            data: { waiterId: null },
        })
        if (released.count === 0) return { success: false, error: 'Esta mesa no es tuya' }

        return { success: true }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo liberar la mesa') }
    }
}

// ==============================================================================
// DISPONIBILIDAD (lectura pública para el picker de mesas / fallback polling)
// ==============================================================================

export async function getTableStatuses(storeId: string): Promise<
    ActionResult<{ tables?: Array<{ id: string; number: string; waiterId: string | null; isActive: boolean }> }>
> {
    try {
        const tables = await prisma.table.findMany({
            where: { storeId, isActive: true },
            select: { id: true, number: true, waiterId: true, isActive: true },
            orderBy: { number: 'asc' },
        })
        return { success: true, tables }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudieron cargar las mesas') }
    }
}

// ==============================================================================
// MIS MESAS — panel del mesero /mesero/[slug] (docs/DESIGN.md §18, T54)
// ==============================================================================

/**
 * Mesas de la SESIÓN ACTUAL (asignadas por admin + tomadas por ella) y activas.
 * A diferencia de `getTableStatuses` (lectura pública, sin tokens), aquí sí se
 * devuelve `qrToken`: solo la dueña de la mesa puede abrir /menu?mesa=<token>.
 * Si la sesión pertenece a otro store → error (nunca lista de otro local).
 */
export async function getMyTables(storeId: string): Promise<
    ActionResult<{ tables: Array<{ id: string; number: string; qrToken: string }> }>
> {
    try {
        const session = await getSessionWaiter()
        if (!session || session.storeId !== storeId) {
            return { success: false, error: 'Tu sesión expiró. Ingresa tu clave de nuevo.' }
        }

        const tables = await prisma.table.findMany({
            where: { storeId, waiterId: session.id, isActive: true },
            select: { id: true, number: true, qrToken: true },
            orderBy: { number: 'asc' },
        })
        return { success: true, tables }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudieron cargar tus mesas') }
    }
}

// ==============================================================================
// PEDIDOS DEL MESERO (v2.1 — docs/DESIGN.md §18-19, T53/T55/T62)
// public.orders NO es modelo Prisma (FK a auth.users) ⇒ SQL crudo, como en
// orders.ts. El RLS de orders no da SELECT a anon, así que el panel del mesero
// NO se suscribe a la tabla: recibe un ping por Realtime Broadcast
// (`waiter-<waiterId>`, emitido por el trigger `trg_broadcast_waiter_order`) y
// relee con estas actions, autenticadas por la cookie httpOnly (T62).
// ==============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type WaiterOrderStatus = 'pending' | 'cooking' | 'completed' | 'cancelled'

export interface WaiterOrder {
    id: string
    customerName: string
    items: Array<{ name?: string; quantity?: number; price?: number; notes?: string }>
    total: number
    status: WaiterOrderStatus
    tableNumber: string | null
    createdAt: Date
    /** null = sin entregar; sello "Entregado" sobre la columna Listos. */
    deliveredAt: Date | null
    deliveredBy: string | null
}

/** Fila cruda de public.orders (mapeada a WaiterOrder antes de devolverla). */
type RawWaiterOrderRow = {
    id: string
    customerName: string
    items: unknown
    total: number
    status: string
    tableNumber: string | null
    createdAt: Date
    deliveredAt: Date | null
    deliveredBy: string | null
}

/**
 * "Mis pedidos": SOLO los de la sesión actual (`waiter_id` propio) y de HOY,
 * más recientes primero. Sin sesión válida → error (nunca lista de otros).
 */
export async function getWaiterOrders(): Promise<ActionResult<{ orders: WaiterOrder[] }>> {
    try {
        const session = await getSessionWaiter()
        if (!session) return { success: false, error: 'Tu sesión expiró. Ingresa tu clave de nuevo.' }

        // Día local desde medianoche — mismo criterio que el filtro de hoy de
        // /dashboard/pedidos (startOfToday.setHours(0,0,0,0)).
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const rows = await prisma.$queryRaw<RawWaiterOrderRow[]>`
            SELECT
                id::text AS id,
                customer_name AS "customerName",
                items,
                total::float8 AS total,
                status,
                table_number AS "tableNumber",
                created_at AS "createdAt",
                delivered_at AS "deliveredAt",
                delivered_by AS "deliveredBy"
            FROM public.orders
            WHERE waiter_id = ${session.id}
              AND created_at >= ${startOfToday}
            ORDER BY created_at DESC
        `

        const orders: WaiterOrder[] = rows.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            items: Array.isArray(r.items) ? (r.items as WaiterOrder['items']) : [],
            total: Number(r.total) || 0,
            status: (r.status as WaiterOrderStatus) ?? 'pending',
            tableNumber: r.tableNumber,
            createdAt: r.createdAt,
            deliveredAt: r.deliveredAt,
            deliveredBy: r.deliveredBy,
        }))

        return { success: true, orders }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudieron cargar tus pedidos') }
    }
}

/**
 * Sello "Entregado" por el MESERO (docs/DESIGN.md §19):
 * exige sesión válida + `waiter_id` propio + `status='completed'`.
 * Idempotente: si ya estaba entregado, el UPDATE sigue coincidiendo y solo
 * sobrescribe `delivered_at`/`delivered_by` (sin error, sin doble sello).
 */
export async function markOrderDelivered(orderId: string): Promise<ActionResult<{ deliveredAt: Date }>> {
    try {
        if (!UUID_RE.test(orderId || '')) return { success: false, error: 'Pedido no encontrado' }

        const session = await getSessionWaiter()
        if (!session) return { success: false, error: 'Tu sesión expiró. Ingresa tu clave de nuevo.' }

        const updated = await prisma.$queryRaw<Array<{ deliveredAt: Date }>>`
            UPDATE public.orders
               SET delivered_at = now(), delivered_by = ${session.name}
             WHERE id = ${orderId}::uuid
               AND waiter_id = ${session.id}
               AND status = 'completed'
         RETURNING delivered_at AS "deliveredAt"
        `
        if (updated.length === 1) return { success: true, deliveredAt: updated[0].deliveredAt }

        // ¿Por qué no coincidió? (solo metadatos; nunca items ni datos de clientes)
        const rows = await prisma.$queryRaw<Array<{ waiterId: string | null; status: string }>>`
            SELECT waiter_id AS "waiterId", status FROM public.orders WHERE id = ${orderId}::uuid
        `
        if (rows.length === 0) return { success: false, error: 'Pedido no encontrado' }
        if (rows[0].waiterId !== session.id) return { success: false, error: 'Este pedido no es tuyo' }
        return { success: false, error: 'El pedido aún no está listo para entregarlo' }
    } catch (e) {
        return { success: false, error: errMsg(e, 'No se pudo marcar el pedido como entregado') }
    }
}

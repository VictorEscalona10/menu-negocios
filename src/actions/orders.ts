// src/actions/orders.ts
'use server'

import { prisma } from '@/lib/prisma'
import { getSessionWaiter } from '@/lib/waiterAuth'
import { createClient } from '@/utils/supabase/server'

export type OrderSource = 'whatsapp' | 'table' | 'waiter'

export interface CreateOrderPayload {
    storeId: string
    customerName?: string // Opcional en modos mesa/mesero (docs/DESIGN.md §13.2)
    customerCedula?: string
    items: Array<{
        name: string
        quantity: number
        price: number
        notes?: string
        selectedOptions?: Array<{ name: string; price: number }>
    }>
    total: number
    deliveryType?: string
    notes?: string
    // --- Sistema de Tres Menús ---
    tableToken?: string // ?mesa=<qrToken>. Se resuelve TODO en el servidor
    source?: OrderSource // default 'whatsapp' (menú actual, intacto)
}

export async function createPublicOrder(payload: CreateOrderPayload) {
    try {
        const {
            storeId,
            customerName,
            customerCedula,
            items,
            total,
            deliveryType,
            notes,
            tableToken,
            source = 'whatsapp',
        } = payload

        if (!storeId || !items || items.length === 0) {
            return { success: false, error: 'Datos incompletos para crear el pedido' }
        }

        // En el menú actual (WhatsApp) el nombre sigue siendo obligatorio;
        // en los modos mesa/mesero es opcional.
        if (source === 'whatsapp' && !customerName) {
            return { success: false, error: 'Faltan datos del cliente' }
        }

        // 1. Buscamos el Store para obtener el userId (dueño del restaurante en auth.users)
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, userId: true },
        })

        if (!store || !store.userId) {
            console.error('No se encontró el local o su userId para storeId:', storeId)
            return { success: false, error: 'Restaurante no encontrado' }
        }

        // --- Sistema de Tres Menús: resolver mesa y mesero EN EL SERVIDOR ---
        // El cliente jamás envía el número de mesa ni el nombre/id del mesero:
        // se derivan del token de la QR y de la cookie de sesión (waiter_id + waiter_name).
        let tableNumber: string | null = null
        let waiterName: string | null = null
        let waiterId: string | null = null

        if (tableToken) {
            const table = await prisma.table.findFirst({
                where: { qrToken: tableToken, storeId: store.id, isActive: true },
                select: { id: true, number: true, waiterId: true },
            })
            if (!table) {
                return { success: false, error: 'Código de mesa no válido' }
            }
            tableNumber = table.number

            if (source === 'waiter') {
                const session = await getSessionWaiter()
                if (!session || session.storeId !== store.id) {
                    return { success: false, error: 'Tu sesión de mesero expiró. Ingresa tu clave.' }
                }
                // Solo puede pedir para mesas libres o suyas (no de otro mesero)
                if (table.waiterId && table.waiterId !== session.id) {
                    return { success: false, error: 'Esta mesa está asignada a otro mesero' }
                }
                waiterName = session.name
                waiterId = session.id // Waiter.id (sesión cookie) → columna orders.waiter_id (v2.1)
            }
        } else if (source !== 'whatsapp') {
            return { success: false, error: 'Falta el código de la mesa' }
        }

        const safeTotal = Math.round(Number(total) * 100) / 100

        // 2. Formatear items para jsonb
        const formattedItems = items.map((item) => {
            const optionsStr = item.selectedOptions && item.selectedOptions.length > 0
                ? item.selectedOptions.map(o => o.name).join(', ')
                : ''

            const itemNotesParts = [item.notes, optionsStr ? `Extras: ${optionsStr}` : ''].filter(Boolean)

            return {
                name: item.name,
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0,
                notes: itemNotesParts.length > 0 ? itemNotesParts.join(' • ') : undefined,
            }
        })

        // Si hay notas generales o tipo de entrega, agregamos un item informativo para cocina
        if (notes || deliveryType) {
            const extraDetails = [
                deliveryType ? `Tipo: ${deliveryType.toUpperCase()}` : '',
                notes ? `Nota cliente: ${notes}` : ''
            ].filter(Boolean).join(' | ')

            if (extraDetails) {
                formattedItems.push({
                    name: `ℹ️ ${extraDetails}`,
                    quantity: 1,
                    price: 0,
                    notes: undefined,
                })
            }
        }

        const itemsJson = JSON.stringify(formattedItems)

        // Nombre a mostrar en el panel. En modos mesa/mesero sin nombre de
        // cliente se muestra la mesa (y el mesero si aplica).
        const cleanName = (customerName || '').trim()
        let customerDisplayName: string
        if (cleanName) {
            customerDisplayName = customerCedula ? `${cleanName} (C.I: ${customerCedula.trim()})` : cleanName
        } else if (tableNumber) {
            customerDisplayName =
                source === 'waiter' && waiterName ? `Mesa ${tableNumber} (${waiterName})` : `Mesa ${tableNumber}`
        } else {
            customerDisplayName = 'Cliente'
        }

        // 3. Insertar en la tabla public.orders con SQL directo
        // Esto dispara inmediatamente la publicación supabase_realtime
        await prisma.$executeRaw`
            INSERT INTO public.orders (
                restaurant_id,
                customer_name,
                items,
                total,
                status,
                table_number,
                waiter_name,
                waiter_id,
                source
            ) VALUES (
                ${store.userId}::uuid,
                ${customerDisplayName},
                ${itemsJson}::jsonb,
                ${safeTotal},
                'pending',
                ${tableNumber},
                ${waiterName},
                ${waiterId},
                ${source}
            );
        `

        return { success: true }
    } catch (error) {
        console.error('Error al registrar pedido en public.orders:', error)
        return { success: false, error: 'Error interno al registrar el pedido' }
    }
}

// ==============================================================================
// ENTREGA DE PEDIDOS — ADMIN (v2.1, docs/DESIGN.md §19 / T53)
// El sello "Entregado" vive como delivered_at/delivered_by sobre status='completed'
// (no hay 4.ª columna en el Kanban). Prisma es dueño de la tabla ⇒ bypass RLS.
// ==============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function markOrderDeliveredAdmin(
    orderId: string
): Promise<{ success: false; error: string } | { success: true; deliveredAt: Date }> {
    try {
        if (!UUID_RE.test(orderId || '')) return { success: false, error: 'Pedido no encontrado' }

        // Admin = Supabase auth; el pedido solo existe si restaurant_id = user.id
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Sesión expirada' }

        // Idempotente: si ya estaba entregado, el UPDATE sigue coincidiendo
        // (status = 'completed') y solo sobrescribe el sello — sin error, sin doble sello.
        const updated = await prisma.$queryRaw<Array<{ deliveredAt: Date }>>`
            UPDATE public.orders
               SET delivered_at = now(), delivered_by = 'admin'
             WHERE id = ${orderId}::uuid
               AND restaurant_id = ${user.id}::uuid
               AND status = 'completed'
         RETURNING delivered_at AS "deliveredAt"
        `
        if (updated.length === 1) return { success: true, deliveredAt: updated[0].deliveredAt }

        // ¿Por qué no coincidió? (solo metadatos del pedido, sin exponer items/clientes)
        const rows = await prisma.$queryRaw<Array<{ restaurantId: string }>>`
            SELECT restaurant_id::text AS "restaurantId" FROM public.orders WHERE id = ${orderId}::uuid
        `
        if (rows.length === 0) return { success: false, error: 'Pedido no encontrado' }
        if (rows[0].restaurantId !== user.id) return { success: false, error: 'Acceso denegado' }
        return { success: false, error: 'El pedido aún no está listo para entregarlo' }
    } catch (error) {
        console.error('Error al marcar pedido como entregado (admin):', error)
        return { success: false, error: 'No se pudo marcar el pedido como entregado' }
    }
}

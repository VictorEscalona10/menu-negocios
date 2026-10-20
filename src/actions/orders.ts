// src/actions/orders.ts
'use server'

import { prisma } from '@/lib/prisma'

export interface CreateOrderPayload {
    storeId: string
    customerName: string
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
}

export async function createPublicOrder(payload: CreateOrderPayload) {
    try {
        const { storeId, customerName, customerCedula, items, total, deliveryType, notes } = payload

        if (!storeId || !customerName || !items || items.length === 0) {
            return { success: false, error: 'Datos incompletos para crear el pedido' }
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
        const customerDisplayName = customerCedula ? `${customerName.trim()} (C.I: ${customerCedula.trim()})` : customerName.trim()

        // 3. Insertar en la tabla public.orders con SQL directo
        // Esto dispara inmediatamente la publicación supabase_realtime
        await prisma.$executeRaw`
            INSERT INTO public.orders (
                restaurant_id,
                customer_name,
                items,
                total,
                status
            ) VALUES (
                ${store.userId}::uuid,
                ${customerDisplayName},
                ${itemsJson}::jsonb,
                ${safeTotal},
                'pending'
            );
        `

        return { success: true }
    } catch (error) {
        console.error('Error al registrar pedido en public.orders:', error)
        return { success: false, error: 'Error interno al registrar el pedido' }
    }
}

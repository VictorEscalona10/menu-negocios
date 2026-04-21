// src/actions/analytics.ts
'use server'

import { prisma } from '@/lib/prisma'

const VALID_DELIVERY_TYPES = ['delivery', 'pickup', 'dinein'] as const;

/**
 * Logs an order intent (when a user clicks to send an order via WhatsApp).
 * This is a PUBLIC action (no auth required), so all inputs are validated.
 */
export async function logOrderIntent(storeId: string, total: number, deliveryType: string) {
    try {
        // 1. Validar deliveryType contra los valores permitidos
        if (!VALID_DELIVERY_TYPES.includes(deliveryType as any)) {
            return { success: false };
        }

        // 2. Validar que el total sea un número positivo y razonable
        if (typeof total !== 'number' || isNaN(total) || total <= 0 || total > 100_000) {
            return { success: false };
        }

        // 3. Validar formato del storeId (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!storeId || !uuidRegex.test(storeId)) {
            return { success: false };
        }

        // 4. Verificar que la tienda existe (query barata por primary key)
        const storeExists = await prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true }, // Solo necesitamos saber si existe
        });

        if (!storeExists) {
            return { success: false };
        }

        // 5. Todo validado — registrar el intent
        await prisma.orderIntentLog.create({
            data: {
                storeId,
                total: Math.round(total * 100) / 100, // Redondear a 2 decimales
                deliveryType,
            }
        });

        return { success: true };
    } catch (error) {
        // Silencioso: el logging nunca debe romper la experiencia del usuario
        console.error("Error logging order intent:", error);
        return { success: false };
    }
}

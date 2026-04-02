// src/actions/store.ts
'use server'

import { prisma } from "@/lib/prisma"; // Importamos tu instancia de Prisma
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(storeId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const backgroundColor = formData.get('backgroundColor') as string;
    const themeColor = formData.get('themeColor') as string;

    try {
        await prisma.store.update({
            where: { id: storeId },
            data: {
                name,
                whatsapp,
                backgroundColor,
                themeColor,
            },
        });

        // Esto le dice a Next.js que limpie la caché y actualice la vista de este local
        revalidatePath('/dashboard/settings');

        return { success: true, message: "Configuración actualizada correctamente" };
    } catch (error) {
        console.error("Error actualizando la tienda:", error);
        return { success: false, message: "Error al actualizar la configuración" };
    }
}
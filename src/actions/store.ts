// src/actions/store.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateStoreSettings(storeId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No autenticado");

    // Validar propiedad del local antes de cualquier operación
    const storeExists = await prisma.store.findFirst({
        where: { id: storeId, userId: user.id }
    });

    if (!storeExists) {
        throw new Error("No autorizado para editar este local");
    }

    const name = formData.get('name') as string
    const whatsapp = formData.get('whatsapp') as string
    const backgroundColor = formData.get('backgroundColor') as string
    const themeColor = formData.get('themeColor') as string
    const whatsappHeader = formData.get('whatsappHeader') as string
    const whatsappFooter = formData.get('whatsappFooter') as string

    const logo = formData.get('logo') as File | null;
    let logoUrl = undefined;

    if (logo && logo.size > 0) {
        const supabase = await createClient();

        // 1. ELIMINACIÓN INTELIGENTE: Buscamos si el local ya tenía un logo
        const existingStore = await prisma.store.findUnique({
            where: { id: storeId },
            select: { logoUrl: true }
        });

        // Si ya tenía uno, le decimos a Supabase que lo borre de su servidor
        if (existingStore?.logoUrl) {
            // El truco del .pop() extrae el nombre final del archivo de la URL pública
            const oldFileName = existingStore.logoUrl.split('/').pop();

            if (oldFileName) {
                await supabase.storage.from('logos').remove([oldFileName]);
            }
        }

        // 2. Subimos el logo nuevo (tu código original)
        const fileExt = logo.name.split('.').pop();
        const fileName = `${storeId}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('logos')
            .upload(fileName, logo, { upsert: true });

        if (error) {
            console.error("Error subiendo imagen:", error);
        } else if (data) {
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(fileName);

            logoUrl = publicUrl;
        }
    }

    const updateData: any = {
        name,
        whatsapp,
        backgroundColor,
        whatsappHeader,
        whatsappFooter,
        themeColor,
    };

    if (logoUrl) {
        updateData.logoUrl = logoUrl;
    }

    await prisma.store.update({
        where: { id: storeId },
        data: updateData,
    })

    revalidatePath('/dashboard/settings')
    revalidatePath(`/menu`)
}
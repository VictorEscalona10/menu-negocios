// src/actions/store.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateStoreSettings(storeId: string, formData: FormData) {
    const name = formData.get('name') as string
    const whatsapp = formData.get('whatsapp') as string
    const backgroundColor = formData.get('backgroundColor') as string
    const themeColor = formData.get('themeColor') as string
    const whatsappMessage = formData.get('whatsappMessage') as string

    // 1. Extraemos el archivo de la imagen (si el usuario subió uno)
    const logo = formData.get('logo') as File | null;
    let logoUrl = undefined;

    // 2. Si hay un logo y no está vacío, lo subimos a Supabase
    if (logo && logo.size > 0) {
        const supabase = await createClient();

        // Generamos un nombre único para evitar que las imágenes se sobreescriban
        const fileExt = logo.name.split('.').pop();
        const fileName = `${storeId}-${Date.now()}.${fileExt}`;

        // Subimos el archivo al bucket "logos"
        const { data, error } = await supabase.storage
            .from('logos')
            .upload(fileName, logo, { upsert: true });

        if (error) {
            console.error("Error subiendo imagen:", error);
        } else if (data) {
            // Si se subió bien, obtenemos la URL pública para guardarla en la base de datos
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(fileName);

            logoUrl = publicUrl;
        }
    }

    // 3. Preparamos los datos para actualizar en Prisma
    const updateData: any = {
        name,
        whatsapp,
        backgroundColor,
        whatsappMessage,
        themeColor,
    };

    // Solo actualizamos el logoUrl si realmente subieron una imagen nueva
    if (logoUrl) {
        updateData.logoUrl = logoUrl;
    }

    await prisma.store.update({
        where: { id: storeId },
        data: updateData,
    })

    revalidatePath('/dashboard/settings')
    revalidatePath(`/menu`) // Revalidamos la ruta pública para que los clientes vean el cambio
}
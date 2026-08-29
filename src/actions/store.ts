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
    const cardBackgroundColor = formData.get('cardBackgroundColor') as string

    // Nuevos campos de personalización visual y layout
    const buttonTextColor = formData.get('buttonTextColor') as string || '#ffffff'
    const menuLayout = formData.get('menuLayout') as string || 'LIST'
    const instagramUrl = formData.get('instagramUrl') as string || null
    const tiktokUrl = formData.get('tiktokUrl') as string || null
    const googleMapsUrl = formData.get('googleMapsUrl') as string || null

    // Delivery modes
    const enableDelivery = formData.get('enableDelivery') === 'on'
    const enablePickup = formData.get('enablePickup') === 'on'
    const enableDineIn = formData.get('enableDineIn') === 'on'
    const showProductImages = formData.get('showProductImages') === 'on'
    const forceNotesModal = formData.get('forceNotesModal') === 'on'
    const requireCedula = formData.get('requireCedula') === 'on'

    const textColor = formData.get('textColor') as string || '#e5e2e1'
    const subtextColor = formData.get('subtextColor') as string || '#e4beb5'
    const fontHeading = formData.get('fontHeading') as string || 'Epilogue'
    const fontBody = formData.get('fontBody') as string || 'Manrope'
    const upsellCategoryId = (formData.get('upsellCategoryId') as string || '').trim() || null

    if (!enableDelivery && !enablePickup && !enableDineIn) {
        throw new Error('Debes tener al menos un modo de entrega activo.')
    }

    let logoUrl = undefined;
    let bannerUrl = undefined;

    // --- LÓGICA DE SUBIDA DE LOGO ---
    const logo = formData.get('logo') as File | null;

    if (logo && logo.size > 0) {
        if (logo.size > 2 * 1024 * 1024) throw new Error("El logotipo excede el tamaño máximo permitido (2MB).");
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(logo.type)) throw new Error("Formato de logotipo no válido. Solo se permiten JPEG, PNG o WEBP.");

        const existingStore = await prisma.store.findUnique({
            where: { id: storeId },
            select: { logoUrl: true }
        });

        if (existingStore?.logoUrl) {
            const oldFileName = existingStore.logoUrl.split('/').pop();
            if (oldFileName) await supabase.storage.from('logos').remove([oldFileName]);
        }

        const fileExt = logo.name.split('.').pop();
        const fileName = `${storeId}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage.from('logos').upload(fileName, logo, { upsert: true });

        if (error) {
            console.error("Error subiendo logotipo:", error);
        } else if (data) {
            const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
            logoUrl = publicUrl;
        }
    }

    // --- LÓGICA DE SUBIDA DE BANNER ---
    const banner = formData.get('banner') as File | null;

    if (banner && banner.size > 0) {
        if (banner.size > 2 * 1024 * 1024) throw new Error("El banner excede el tamaño máximo permitido (2MB).");
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(banner.type)) throw new Error("Formato de banner no válido. Solo se permiten JPEG, PNG o WEBP.");

        const existingStore = await prisma.store.findUnique({
            where: { id: storeId },
            select: { bannerUrl: true }
        });

        if (existingStore?.bannerUrl) {
            const oldFileName = existingStore.bannerUrl.split('/').pop();
            if (oldFileName) await supabase.storage.from('logos').remove([oldFileName]); // Usamos el mismo bucket 'logos' para no romper nada
        }

        const fileExt = banner.name.split('.').pop();
        const fileName = `banner-${storeId}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage.from('logos').upload(fileName, banner, { upsert: true });

        if (error) {
            console.error("Error subiendo banner:", error);
        } else if (data) {
            const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
            bannerUrl = publicUrl;
        }
    }

    const updateData: any = {
        name,
        whatsapp,
        backgroundColor,
        whatsappHeader,
        whatsappFooter,
        themeColor,
        enableDelivery,
        enablePickup,
        enableDineIn,
        showProductImages,
        forceNotesModal,
        requireCedula,
        textColor,
        subtextColor,
        fontHeading,
        fontBody,
        upsellCategoryId,
        cardBackgroundColor,
        // Nuevos campos
        buttonTextColor,
        menuLayout,
        instagramUrl,
        tiktokUrl,
        googleMapsUrl,
    };

    if (logoUrl) updateData.logoUrl = logoUrl;
    if (bannerUrl) updateData.bannerUrl = bannerUrl;

    await prisma.store.update({
        where: { id: storeId },
        data: updateData,
    })

    revalidatePath('/dashboard/settings')
    revalidatePath(`/menu`)
}

export async function createDeliveryZone(storeId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const store = await prisma.store.findFirst({ where: { id: storeId, userId: user.id } });
    if (!store) throw new Error("No autorizado");

    const name = (formData.get('name') as string || '').trim();
    const price = parseFloat(formData.get('price') as string || '0');

    if (!name) throw new Error("El nombre de la zona es obligatorio");
    if (isNaN(price) || price < 0) throw new Error("El precio debe ser un número válido");

    await prisma.deliveryZone.create({
        data: { name, price, storeId }
    });

    revalidatePath('/dashboard/settings');
    revalidatePath(`/menu/${store.slug}`);
}

export async function updateDeliveryZone(zoneId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const zone = await prisma.deliveryZone.findFirst({
        where: { id: zoneId, store: { userId: user.id } },
        include: { store: true }
    });
    if (!zone) throw new Error("No autorizado");

    const name = (formData.get('name') as string || '').trim();
    const price = parseFloat(formData.get('price') as string || '0');

    if (!name) throw new Error("El nombre de la zona es obligatorio");
    if (isNaN(price) || price < 0) throw new Error("El precio debe ser un número válido");

    await prisma.deliveryZone.update({
        where: { id: zoneId },
        data: { name, price }
    });

    revalidatePath('/dashboard/settings');
    revalidatePath(`/menu/${zone.store.slug}`);
}

export async function deleteDeliveryZone(zoneId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const zone = await prisma.deliveryZone.findFirst({
        where: { id: zoneId, store: { userId: user.id } },
        include: { store: true }
    });
    if (!zone) throw new Error("No autorizado");

    await prisma.deliveryZone.delete({ where: { id: zoneId } });

    revalidatePath('/dashboard/settings');
    revalidatePath(`/menu/${zone.store.slug}`);
}
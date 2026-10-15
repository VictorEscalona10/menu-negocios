import { cache } from 'react'
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { AdvancedCustomization } from '@/src/types/customization'

/**
 * Consulta optimizada para la visualización del menú público.
 * Utiliza select para traer estrictamente lo necesario, excluyendo:
 * - userId y campos de auditoría interna
 * - Campos 3D pesados (model3dSources, model3dTaskId, etc.)
 */
async function fetchMenuDataFromDb(slug: string) {
    const store = await prisma.store.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            whatsapp: true,
            whatsappHeader: true,
            whatsappFooter: true,
            backgroundColor: true,
            themeColor: true,
            cardBackgroundColor: true,
            textColor: true,
            subtextColor: true,
            buttonTextColor: true,
            fontHeading: true,
            fontBody: true,
            menuLayout: true,
            customizationMode: true,
            instagramUrl: true,
            tiktokUrl: true,
            googleMapsUrl: true,
            isActive: true,
            enableDelivery: true,
            enablePickup: true,
            enableDineIn: true,
            showProductImages: true,
            forceNotesModal: true,
            requireCedula: true,
            showBsPrice: true,
            upsellCategoryId: true,
            logoUrl: true,
            bannerUrl: true,
            deliveryZones: {
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    price: true,
                },
            },
            categories: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    name: true,
                    order: true,
                    isActive: true,
                    storeId: true,
                    products: {
                        where: { isAvailable: true },
                        orderBy: [
                            { order: 'asc' },
                            { name: 'asc' },
                        ],
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            isAvailable: true,
                            imageUrl: true,
                            order: true,
                            isCombo: true,
                            comboBadge: true,
                            categoryId: true,
                            modifierGroups: {
                                orderBy: { name: 'asc' },
                                select: {
                                    id: true,
                                    name: true,
                                    isRequired: true,
                                    maxSelect: true,
                                    productId: true,
                                    options: {
                                        select: {
                                            id: true,
                                            name: true,
                                            price: true,
                                            isAvailable: true,
                                            modifierGroupId: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!store) {
        return null
    }

    const layoutRow = await prisma.customizationLayout.findUnique({
        where: { storeId: store.id },
        select: { layoutJson: true },
    })

    const layout = (layoutRow?.layoutJson ?? null) as AdvancedCustomization | null

    return {
        store,
        layout,
    }
}

/**
 * Función cacheada con deduplicación por petición (React.cache)
 * y persistencia en caché del servidor (Next.js unstable_cache con tags).
 *
 * El 99% de visitas de comensales responderán instantáneamente desde memoria
 * sin tocar Supabase. Se invalida bajo demanda mediante revalidateTag(`menu-${slug}`).
 */
export const getCachedMenu = cache(async (slug: string) => {
    return unstable_cache(
        async () => fetchMenuDataFromDb(slug),
        ['menu-store-data', slug],
        {
            tags: ['menu-data', `menu-${slug}`],
            revalidate: 86400, // 24 horas fallback, invalidación instantánea con tags
        }
    )()
})

/**
 * Invalida el caché del menú en memoria (tags) y la ruta estática (path).
 * Permite que los cambios del dueño del restaurante se reflejen inmediatamente.
 */
export function revalidateMenu(slug?: string) {
    if (slug) {
        revalidatePath(`/menu/${slug}`)
        revalidateTag(`menu-${slug}`, 'max')
    }
    revalidatePath('/menu/[slug]', 'page')
    revalidateTag('menu-data', 'max')
}


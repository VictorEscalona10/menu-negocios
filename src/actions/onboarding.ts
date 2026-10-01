// src/actions/onboarding.ts
'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStoreFromOnboarding(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("No autenticado")
    }

    // Verificar si el usuario ya posee un local registrado
    const existing = await prisma.store.findUnique({
        where: { userId: user.id }
    })

    if (existing) {
        return { success: true, slug: existing.slug }
    }

    const name = (formData.get('name') as string || '').trim()
    const rawWhatsapp = (formData.get('whatsapp') as string || '').trim()
    const whatsapp = rawWhatsapp.replace(/[^\d]/g, '') // Solo dígitos
    const customSlug = (formData.get('slug') as string || '').trim()

    if (!name) throw new Error("El nombre del local es obligatorio")
    if (!whatsapp) throw new Error("El número de WhatsApp es obligatorio")

    // Generar base de slug
    let baseSlug = (customSlug || name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    if (!baseSlug) baseSlug = 'mi-menu'

    // Asegurar unicidad del slug
    let finalSlug = baseSlug
    let counter = 1
    while (await prisma.store.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${counter}`
        counter++
    }

    // Estilos visuales y plantilla
    const backgroundColor = (formData.get('backgroundColor') as string) || '#0e0e10'
    const cardBackgroundColor = (formData.get('cardBackgroundColor') as string) || 'rgba(255,255,255,0.06)'
    const themeColor = (formData.get('themeColor') as string) || '#FF5630'
    const textColor = (formData.get('textColor') as string) || '#ffffff'
    const subtextColor = (formData.get('subtextColor') as string) || '#a1a1aa'
    const buttonTextColor = (formData.get('buttonTextColor') as string) || '#ffffff'
    const fontHeading = (formData.get('fontHeading') as string) || 'Epilogue'
    const fontBody = (formData.get('fontBody') as string) || 'Manrope'
    const menuLayout = (formData.get('menuLayout') as string) || 'LINKTREE'

    // Redes Sociales
    const instagramUrl = (formData.get('instagramUrl') as string || '').trim() || null
    const tiktokUrl = (formData.get('tiktokUrl') as string || '').trim() || null
    const googleMapsUrl = (formData.get('googleMapsUrl') as string || '').trim() || null

    // Subida opcional de Logotipo
    let logoUrl: string | null = null
    const logoFile = formData.get('logo') as File | null

    if (logoFile && logoFile.size > 0) {
        if (logoFile.size <= 2 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(logoFile.type)) {
            const fileExt = logoFile.name.split('.').pop()
            const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`
            const { data, error } = await supabase.storage.from('logos').upload(fileName, logoFile, { upsert: true })
            if (!error && data) {
                const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
                logoUrl = publicUrl
            }
        }
    }

    // Crear Tienda
    const newStore = await prisma.store.create({
        data: {
            userId: user.id,
            name,
            slug: finalSlug,
            whatsapp,
            backgroundColor,
            cardBackgroundColor,
            themeColor,
            textColor,
            subtextColor,
            buttonTextColor,
            fontHeading,
            fontBody,
            menuLayout,
            logoUrl,
            instagramUrl,
            tiktokUrl,
            googleMapsUrl,
        }
    })

    // Categoría inicial opcional
    const initialCategory = (formData.get('initialCategory') as string || '').trim()
    if (initialCategory) {
        await prisma.category.create({
            data: {
                name: initialCategory,
                storeId: newStore.id,
                order: 0,
            }
        })
    }

    revalidatePath('/dashboard')
    revalidatePath(`/menu/${finalSlug}`)

    return { success: true, slug: finalSlug }
}

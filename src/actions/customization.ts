// src/actions/customization.ts
'use server'

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { revalidateMenu } from '@/lib/menu'
import { createClient } from '@/utils/supabase/server'
import type { ZodError } from 'zod'
import {
    customizationModeSchema,
    saveLayoutSchema,
    sectionSchema,
    sectionTypeSchema,
    templateSchema,
    uploadImageSchema,
    createDefaultLayout,
    defaultAlignmentFor,
    type AdvancedCustomization,
    type CustomizationMode,
    type DeviceView,
    type GlobalStyle,
    type Section,
    type SectionType,
    type TemplateScope,
} from '@/src/types/customization'

const BUCKET = 'advanced-customization'

// Verifica sesión + propiedad del local (mismo patrón que updateStoreSettings)
async function requireStoreOwner(storeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión expirada')

    const store = await prisma.store.findFirst({
        where: { id: storeId, userId: user.id },
    })
    if (!store) throw new Error('Acceso denegado')

    return { user, store, supabase }
}

function collectReferencedImageUrls(sections: Section[]): Set<string> {
    const referenced = new Set<string>()
    for (const section of sections) {
        const config = section.config
        if ('items' in config) {
            for (const item of config.items) {
                if (item.imageUrl) referenced.add(item.imageUrl)
            }
        } else if ('imageUrl' in config && config.imageUrl) {
            referenced.add(config.imageUrl)
        }
    }
    return referenced
}

function toStoragePath(bucketPath: string): string {
    const prefix = `${BUCKET}/`
    return bucketPath.startsWith(prefix) ? bucketPath.slice(prefix.length) : bucketPath
}

type LayoutView = { global: GlobalStyle; sections: Section[]; deviceView: DeviceView }

// Lee el layout guardado (Json de Prisma) con defaults defensivos
function toLayoutView(raw: unknown): LayoutView {
    const fallback = createDefaultLayout()
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback

    const record = raw as Record<string, unknown>
    const global = record.global
    return {
        global:
            global && typeof global === 'object' && !Array.isArray(global)
                ? ({ ...fallback.global, ...global } as GlobalStyle)
                : fallback.global,
        sections: Array.isArray(record.sections) ? (record.sections as Section[]) : [],
        deviceView:
            record.deviceView === 'phone' || record.deviceView === 'tablet' || record.deviceView === 'desktop'
                ? record.deviceView
                : fallback.deviceView,
    }
}

// Preview SVG data-url cuando la plantilla no trae imagen (DB lo exige)
function generatePreviewUrl(label: string): string {
    const safe = label
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">' +
        '<rect width="320" height="200" fill="#0e0e10"/>' +
        '<rect x="16" y="16" width="44" height="44" rx="22" fill="#FF5630"/>' +
        '<text x="160" y="116" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">' +
        safe +
        '</text></svg>'
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Devuelve el layoutJson del store o null. Si es null y el store está en modo
// AVANCED, el editor debe mostrar el empty state ("empezar a construir").
export async function getCustomizationLayout(storeId: string): Promise<AdvancedCustomization | null> {
    await requireStoreOwner(storeId)

    const layout = await prisma.customizationLayout.findUnique({
        where: { storeId },
        select: { layoutJson: true },
    })

    return (layout?.layoutJson ?? null) as AdvancedCustomization | null
}

// Plantillas visibles para el usuario: isPublic=true (globales) + las propias
// de sus stores. scope/sectionType opcional para filtrar (T19 picker).
export async function getTemplates(scope?: TemplateScope, sectionType?: SectionType) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión expirada')

    return prisma.customizationTemplate.findMany({
        where: {
            AND: [
                ...(scope ? [{ scope }] : []),
                ...(sectionType ? [{ sectionType }] : []),
                { OR: [{ isPublic: true }, { store: { userId: user.id } }] },
            ],
        },
        // isPublic=false (propias) primero, luego alfabético
        orderBy: [{ isPublic: 'asc' }, { name: 'asc' }],
    })
}

// "sections.6.config.url: La URL es obligatoria" (máx. 3 issues)
function formatIssues(error: ZodError): string {
    return error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join(' | ')
}

// Fusiona el configJson de una plantilla con el layout guardado, persiste el
// resultado y lo devuelve. El editor lo recibe y hace setLayoutJson (estado limpio).
// - FULL_PAGE: toma global + sections de la plantilla; el deviceView del store
//   prevalece (DESIGN §6.4.3 "store settings taking precedence")
// - SECTION: agrega la sección de la plantilla al final del layout actual
export async function applyTemplate(storeId: string, templateId: string): Promise<AdvancedCustomization> {
    const { user, store } = await requireStoreOwner(storeId)

    const template = await prisma.customizationTemplate.findFirst({
        where: {
            id: templateId,
            OR: [{ isPublic: true }, { store: { userId: user.id } }],
        },
    })
    if (!template) throw new Error('Plantilla no encontrada')

    const saved = await prisma.customizationLayout.findUnique({
        where: { storeId },
        select: { layoutJson: true },
    })
    const current = toLayoutView(saved?.layoutJson ?? null)
    const config = template.configJson as unknown

    let merged: unknown
    if (template.scope === 'FULL_PAGE') {
        const fullPage = saveLayoutSchema.safeParse(config)
        if (!fullPage.success) {
            throw new Error(`Plantilla inválida (FULL_PAGE): ${formatIssues(fullPage.error)}`)
        }
        merged = {
            version: 1,
            global: fullPage.data.global,
            sections: fullPage.data.sections,
            deviceView: saved ? current.deviceView : fullPage.data.deviceView,
        }
    } else {
        const type = sectionTypeSchema.safeParse(template.sectionType)
        if (!type.success) {
            throw new Error('Plantilla inválida (SECTION): sectionType faltante o no soportado')
        }

        const section = sectionSchema.safeParse({
            id: 'template',
            type: type.data,
            visible: true,
            alignment: defaultAlignmentFor(type.data),
            config,
        })
        if (!section.success) {
            throw new Error(`Plantilla inválida (SECTION): ${formatIssues(section.error)}`)
        }

        merged = {
            version: 1,
            global: current.global,
            sections: [...current.sections, { ...section.data, id: crypto.randomUUID() }],
            deviceView: current.deviceView,
        }
    }

    const validated = saveLayoutSchema.safeParse(merged)
    if (!validated.success) throw new Error(`Layout resultante inválido: ${formatIssues(validated.error)}`)

    await prisma.customizationLayout.upsert({
        where: { storeId },
        create: { storeId, layoutJson: validated.data, version: 1 },
        update: { layoutJson: validated.data, version: { increment: 1 } },
    })

    revalidateMenu(store.slug)
    revalidatePath('/dashboard/customization')

    return validated.data
}

// Guarda la configuración como plantilla privada del store (isPublic=false por defecto)
export async function saveAsTemplate(storeId: string, templateData: unknown) {
    await requireStoreOwner(storeId)

    const parsed = templateSchema.safeParse(templateData)
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Plantilla inválida')
    }
    const data = parsed.data

    const created = await prisma.customizationTemplate.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            scope: data.scope,
            sectionType: data.sectionType ?? null,
            previewUrl: data.previewUrl ?? generatePreviewUrl(data.name),
            configJson: data.configJson as Prisma.InputJsonValue,
            isPublic: data.isPublic ?? false,
            storeId,
        },
    })

    revalidatePath('/dashboard/customization')

    return created
}

const IMAGE_EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

// Sube al bucket advanced-customization ({storeId}/{uuid}.{ext}), crea el
// registro CustomizationImage y retorna la URL pública de la imagen.
export async function uploadCustomizationImage(storeId: string, file: File, altText?: string): Promise<string> {
    const { supabase } = await requireStoreOwner(storeId)

    const parsed = uploadImageSchema.safeParse({ file, altText })
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Imagen inválida')
    }

    const path = `${storeId}/${crypto.randomUUID()}.${IMAGE_EXT_BY_MIME[parsed.data.file.type]}`

    const { error } = await supabase.storage.from(BUCKET).upload(path, parsed.data.file, {
        contentType: parsed.data.file.type,
        upsert: false,
    })
    if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const image = await prisma.customizationImage.create({
        data: {
            storeId,
            url: data.publicUrl,
            bucketPath: `${BUCKET}/${path}`,
            altText: parsed.data.altText ?? null,
        },
    })

    return image.url
}

export async function saveCustomizationLayout(storeId: string, layoutJson: unknown) {
    const { store, supabase } = await requireStoreOwner(storeId)

    const parsed = saveLayoutSchema.safeParse(layoutJson)
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Configuración inválida')
    }
    const layout = parsed.data

    await prisma.customizationLayout.upsert({
        where: { storeId },
        create: { storeId, layoutJson: layout, version: 1 },
        update: { layoutJson: layout, version: { increment: 1 } },
    })

    // Imágenes huerfanas: registradas para este store pero ya no referenciadas
    // por ninguna sección del layout (ej: sección borrada). Se purgan aquí para
    // que un undo/redo nunca borre imágenes que volvieron a estar en uso.
    const referenced = collectReferencedImageUrls(layout.sections)
    const storedImages = await prisma.customizationImage.findMany({ where: { storeId } })
    const orphans = storedImages.filter((image) => !referenced.has(image.url))

    if (orphans.length > 0) {
        // Si falla el borrado del bucket (bucket aún no existe, red, etc.)
        // no bloqueamos el guardado: se reintenta en el próximo save.
        await supabase.storage.from(BUCKET).remove(orphans.map((image) => toStoragePath(image.bucketPath)))
        await prisma.customizationImage.deleteMany({
            where: { id: { in: orphans.map((image) => image.id) } },
        })
    }

    revalidateMenu(store.slug)
    revalidatePath('/dashboard/customization')
}

export async function deleteCustomizationLayout(storeId: string) {
    const { store } = await requireStoreOwner(storeId)

    await prisma.$transaction([
        prisma.customizationLayout.deleteMany({ where: { storeId } }),
        prisma.store.update({
            where: { id: storeId },
            data: { customizationMode: 'THEME' },
        }),
    ])

    revalidateMenu(store.slug)
    revalidatePath('/dashboard/customization')
}

// THEME ↔ AVANCED en Store.customizationMode
export async function toggleCustomizationMode(storeId: string, mode: CustomizationMode) {
    const { store } = await requireStoreOwner(storeId)

    const parsed = customizationModeSchema.safeParse(mode)
    if (!parsed.success) throw new Error('Modo de personalización no válido')

    await prisma.store.update({
        where: { id: storeId },
        data: { customizationMode: parsed.data },
    })

    revalidateMenu(store.slug)
    revalidatePath('/dashboard/customization')

    return parsed.data
}

// Quita referencias a una URL del layout guardado (sección image o items de carousel)
function stripImageReferences(sections: Section[], url: string): Section[] {
    return sections.map((section) => {
        const config = section.config
        if ('items' in config) {
            if (!config.items.some((item) => item.imageUrl === url)) return section
            return {
                ...section,
                config: { ...config, items: config.items.filter((item) => item.imageUrl !== url) },
            }
        }
        if ('imageUrl' in config && config.imageUrl === url) {
            return { ...section, config: { ...config, imageUrl: '' } }
        }
        return section
    })
}

// Borra el file del bucket + el registro CustomizationImage.
// También limpia el layout guardado si la sección que usaba la imagen ya no
// existe o si quedó alguna referencia colgada a esta URL (evita imágenes 404).
export async function deleteCustomizationImage(imageId: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión expirada')

    const image = await prisma.customizationImage.findUnique({
        where: { id: imageId },
        include: { store: { select: { userId: true, slug: true } } },
    })
    if (!image) throw new Error('Imagen no encontrada')
    if (image.store.userId !== user.id) throw new Error('Acceso denegado')

    // El file puede no existir ya (borrado previo): no bloqueamos el cleanup
    await supabase.storage.from(BUCKET).remove([toStoragePath(image.bucketPath)])
    await prisma.customizationImage.delete({ where: { id: imageId } })

    // Limpieza de referencias en el layout guardado
    const layoutRow = await prisma.customizationLayout.findUnique({
        where: { storeId: image.storeId },
        select: { layoutJson: true },
    })
    if (!layoutRow) return

    const layout = layoutRow.layoutJson as unknown as AdvancedCustomization
    if (!Array.isArray(layout?.sections)) return

    const sections = stripImageReferences(layout.sections, image.url)
    const changed = sections.some((section, index) => section !== layout.sections[index])
    if (!changed) return

    await prisma.customizationLayout.update({
        where: { storeId: image.storeId },
        data: {
            layoutJson: { ...layout, sections } as unknown as Prisma.InputJsonValue,
            version: { increment: 1 },
        },
    })

    revalidateMenu(image.store.slug)
    revalidatePath('/dashboard/customization')
}

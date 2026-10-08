'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
    createImageToModel,
    createMultiviewToModel,
    getTask,
    downloadFile,
} from '@/lib/tripo'

const BUCKET = 'models-3d'
const MAX_PHOTOS = 3
const MAX_PHOTO_BYTES = 8 * 1024 * 1024

const PHOTO_EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

export type Model3DResult = { ok: true } | { ok: false; error: string }

function productSrcPaths(storeId: string, productId: string): string[] {
    return [1, 2, 3].flatMap((n) =>
        Object.values(PHOTO_EXT_BY_MIME).map((ext) => `${storeId}/${productId}/src-${n}.${ext}`),
    )
}

export type Model3DPollResult =
    | { status: 'NONE' }
    | { status: 'PROCESSING'; progress: number }
    | { status: 'SUCCEEDED'; modelUrl: string; thumbUrl: string | null }
    | { status: 'FAILED'; error: string }

async function authProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const product = await prisma.product.findFirst({
        where: { id: productId, category: { store: { userId: user.id } } },
        include: { category: { include: { store: true } } },
    })
    if (!product) throw new Error('No autorizado')

    return { product, supabase, storeId: product.category.storeId }
}

async function uploadToBucket(
    supabase: Awaited<ReturnType<typeof createClient>>,
    path: string,
    data: Blob | File,
    contentType: string,
): Promise<string> {
    const { error } = await supabase.storage.from(BUCKET).upload(path, data, {
        contentType,
        upsert: true,
    })
    if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`)
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return publicUrl.publicUrl
}

export async function startModel3D(productId: string, formData: FormData): Promise<Model3DResult> {
    try {
        const { product, supabase, storeId } = await authProduct(productId)

        const photos = formData.getAll('photos').filter(
            (f): f is File => f instanceof File && f.size > 0,
        )

        let sourceUrls: string[]

        if (photos.length > 0) {
            if (photos.length > MAX_PHOTOS) {
                return { ok: false, error: `Máximo ${MAX_PHOTOS} fotos` }
            }
            for (const photo of photos) {
                if (!PHOTO_EXT_BY_MIME[photo.type]) {
                    return { ok: false, error: 'Formato no válido. Solo JPEG, PNG o WEBP.' }
                }
                if (photo.size > MAX_PHOTO_BYTES) {
                    return { ok: false, error: 'Cada foto debe pesar 8MB o menos.' }
                }
            }

            await supabase.storage.from(BUCKET).remove(productSrcPaths(storeId, productId))

            sourceUrls = []
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i]
                const path = `${storeId}/${productId}/src-${i + 1}.${PHOTO_EXT_BY_MIME[photo.type]}`
                sourceUrls.push(await uploadToBucket(supabase, path, photo, photo.type))
            }
        } else if (product.model3dSources.length > 0) {
            sourceUrls = product.model3dSources
        } else {
            return { ok: false, error: 'Sube al menos una foto para convertir el producto en 3D.' }
        }

        const taskId =
            sourceUrls.length === 1
                ? await createImageToModel(sourceUrls[0])
                : await createMultiviewToModel(sourceUrls)

        await supabase.storage.from(BUCKET).remove([
            `${storeId}/${productId}/model.glb`,
            `${storeId}/${productId}/preview.png`,
        ])

        await prisma.product.update({
            where: { id: productId },
            data: {
                model3dStatus: 'PROCESSING',
                model3dTaskId: taskId,
                model3dSources: sourceUrls,
                model3dUrl: null,
                model3dThumbUrl: null,
                model3dError: null,
            },
        })

        revalidatePath('/dashboard/products')
        return { ok: true }
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Error inesperado' }
    }
}

export async function pollModel3D(productId: string): Promise<Model3DPollResult> {
    try {
        const { product, supabase, storeId } = await authProduct(productId)

        if (!product.model3dStatus) return { status: 'NONE' }
        if (product.model3dStatus === 'SUCCEEDED' && product.model3dUrl) {
            return { status: 'SUCCEEDED', modelUrl: product.model3dUrl, thumbUrl: product.model3dThumbUrl }
        }
        if (product.model3dStatus === 'FAILED') {
            return { status: 'FAILED', error: product.model3dError || 'La conversión falló' }
        }
        if (!product.model3dTaskId) return { status: 'NONE' }

        let task
        try {
            task = await getTask(product.model3dTaskId)
        } catch (error) {
            const message = error instanceof Error ? error.message : ''
            if (message.startsWith('Error de la API de Tripo')) {
                await prisma.product.update({
                    where: { id: productId },
                    data: { model3dStatus: 'FAILED', model3dError: message },
                })
                revalidatePath('/dashboard/products')
                return { status: 'FAILED', error: message }
            }
            return { status: 'PROCESSING', progress: 0 }
        }

        if (task.status === 'queued') return { status: 'PROCESSING', progress: 0 }
        if (task.status === 'running') {
            return { status: 'PROCESSING', progress: task.progress ?? 0 }
        }

        if (task.status === 'success') {
            const modelUrl = task.output?.model_url
            if (!modelUrl) {
                const error = 'Tripo terminó la tarea pero no devolvió el modelo'
                await prisma.product.update({
                    where: { id: productId },
                    data: { model3dStatus: 'FAILED', model3dError: error },
                })
                revalidatePath('/dashboard/products')
                return { status: 'FAILED', error }
            }

            const glb = await downloadFile(modelUrl)
            const savedModelUrl = await uploadToBucket(
                supabase,
                `${storeId}/${productId}/model.glb`,
                new Blob([glb], { type: 'model/gltf-binary' }),
                'model/gltf-binary',
            )

            let savedThumbUrl: string | null = null
            const previewUrl = task.output?.rendered_image_url
            if (previewUrl) {
                try {
                    const preview = await downloadFile(previewUrl)
                    savedThumbUrl = await uploadToBucket(
                        supabase,
                        `${storeId}/${productId}/preview.png`,
                        new Blob([preview], { type: 'image/png' }),
                        'image/png',
                    )
                } catch {
                    savedThumbUrl = null
                }
            }

            await prisma.product.update({
                where: { id: productId },
                data: {
                    model3dStatus: 'SUCCEEDED',
                    model3dUrl: savedModelUrl,
                    model3dThumbUrl: savedThumbUrl,
                    model3dError: null,
                },
            })
            revalidatePath('/dashboard/products')
            return { status: 'SUCCEEDED', modelUrl: savedModelUrl, thumbUrl: savedThumbUrl }
        }

        const errorByStatus: Record<string, string> = {
            failed: 'Tripo no pudo generar el modelo',
            banned: 'La tarea fue rechazada por la política de contenido',
            expired: 'La tarea expiró',
            cancelled: 'La tarea fue cancelada',
            unknown: 'No se pudo determinar el estado de la tarea',
        }
        const error = errorByStatus[task.status] || `La tarea terminó con estado "${task.status}"`
        await prisma.product.update({
            where: { id: productId },
            data: { model3dStatus: 'FAILED', model3dError: error },
        })
        revalidatePath('/dashboard/products')
        return { status: 'FAILED', error }
    } catch (error) {
        if (error instanceof Error && (error.message === 'No autenticado' || error.message === 'No autorizado')) {
            throw error
        }
        return { status: 'PROCESSING', progress: 0 }
    }
}

export async function deleteModel3D(productId: string): Promise<Model3DResult> {
    try {
        const { supabase, storeId } = await authProduct(productId)

        await supabase.storage.from(BUCKET).remove([
            ...productSrcPaths(storeId, productId),
            `${storeId}/${productId}/model.glb`,
            `${storeId}/${productId}/preview.png`,
        ])

        await prisma.product.update({
            where: { id: productId },
            data: {
                model3dStatus: null,
                model3dTaskId: null,
                model3dUrl: null,
                model3dThumbUrl: null,
                model3dError: null,
                model3dSources: [],
            },
        })

        revalidatePath('/dashboard/products')
        return { ok: true }
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Error inesperado' }
    }
}

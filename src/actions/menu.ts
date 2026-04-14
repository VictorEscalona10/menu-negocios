// src/actions/menu.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createCategory(storeId: string, formData: FormData) {
    const name = formData.get('name') as string

    await prisma.category.create({
        data: {
            name,
            storeId,
        }
    })

    revalidatePath('/dashboard/products')
}

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const categoryId = formData.get('categoryId') as string

    // 1. Obtener el archivo de imagen
    const imageFile = formData.get('image') as File | null
    let imageUrl = null

    // 2. Subir imagen a Supabase si existe
    if (imageFile && imageFile.size > 0) {
        const supabase = await createClient()
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data, error } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile)

        if (error) {
            console.error("Error subiendo imagen de producto:", error)
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName)
            imageUrl = publicUrl
        }
    }

    // 3. Crear el producto en la base de datos
    await prisma.product.create({
        data: {
            name,
            description,
            price,
            categoryId,
            imageUrl, // Se guarda la URL de la imagen aquí
        }
    })

    revalidatePath('/dashboard/products')
}

export async function updateProduct(productId: string, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const categoryId = formData.get('categoryId') as string

    // 1. Obtener los datos actuales del producto para saber si tiene imagen
    const currentProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { imageUrl: true }
    })

    // 2. Obtener el nuevo archivo de imagen
    const imageFile = formData.get('image') as File | null
    let imageUrl = currentProduct?.imageUrl

    // 3. Subir nueva imagen si existe
    if (imageFile && imageFile.size > 0) {
        const supabase = await createClient()
        
        // Subimos la nueva imagen
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data, error } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile)

        if (!error) {
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName)
            
            // Si había una imagen anterior, la borramos
            if (currentProduct?.imageUrl) {
                const oldFileName = currentProduct.imageUrl.split('/').pop()
                if (oldFileName) {
                    await supabase.storage.from('products').remove([oldFileName])
                }
            }
            
            imageUrl = publicUrl
        }
    }

    // 4. Actualizar el producto en la base de datos
    await prisma.product.update({
        where: { id: productId },
        data: {
            name,
            description,
            price,
            categoryId,
            imageUrl,
        }
    })

    revalidatePath('/dashboard/products')
}

export async function deleteCategory(categoryId: string) {
    // Prisma con cascade eliminará también sus productos
    await prisma.category.delete({
        where: {
            id: categoryId
        }
    })
    revalidatePath('/dashboard/products')
}

export async function deleteProduct(productId: string) {
    // 1. Buscamos el producto antes de borrarlo para saber si tenía foto
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { imageUrl: true }
    });

    // 2. Si tenía imagen, la borramos del bucket de Supabase
    if (product?.imageUrl) {
        const supabase = await createClient();
        const fileName = product.imageUrl.split('/').pop();

        if (fileName) {
            await supabase.storage.from('products').remove([fileName]);
        }
    }

    // 3. Ahora sí borramos el producto de la base de datos
    await prisma.product.delete({
        where: {
            id: productId
        }
    });

    revalidatePath('/dashboard/products')
}

export async function toggleProductAvailability(productId: string, currentValue: boolean) {
    await prisma.product.update({
        where: { id: productId },
        data: { isAvailable: !currentValue }
    })
    revalidatePath('/dashboard/products')
}
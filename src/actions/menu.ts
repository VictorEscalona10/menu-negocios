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
    await prisma.product.delete({
        where: {
            id: productId
        }
    })
    revalidatePath('/dashboard/products')
}
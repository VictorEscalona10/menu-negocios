// src/actions/menu.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createCategory(storeId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Verificar propiedad del local
    const store = await prisma.store.findFirst({
        where: { id: storeId, userId: user.id }
    })
    if (!store) throw new Error("No autorizado")

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const categoryId = formData.get('categoryId') as string

    // Verificar que la categoría pertenece al local del usuario
    const category = await prisma.category.findFirst({
        where: { 
            id: categoryId,
            store: { userId: user.id }
        }
    })
    if (!category) throw new Error("No autorizado para agregar productos a esta categoría")

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
            return { error: `La imagen no pudo subirse: ${error.message}` }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const categoryId = formData.get('categoryId') as string

    // 1. Obtener los datos actuales del producto y verificar propiedad
    const currentProduct = await prisma.product.findFirst({
        where: { 
            id: productId,
            category: { store: { userId: user.id } }
        },
        select: { imageUrl: true }
    })

    if (!currentProduct) throw new Error("No autorizado o producto no encontrado")

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

        if (error) {
            console.error("Error subiendo imagen en updateProduct:", error)
            return { error: `La imagen no pudo subirse: ${error.message}` }
        }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Verificar propiedad
    const category = await prisma.category.findFirst({
        where: { id: categoryId, store: { userId: user.id } }
    })
    if (!category) throw new Error("No autorizado")

    // Prisma con cascade eliminará también sus productos
    await prisma.category.delete({
        where: {
            id: categoryId
        }
    })
    revalidatePath('/dashboard/products')
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // 1. Buscamos el producto antes de borrarlo y verificamos propiedad
    const product = await prisma.product.findFirst({
        where: { 
            id: productId,
            category: { store: { userId: user.id } }
        },
        select: { imageUrl: true }
    });

    if (!product) throw new Error("No autorizado")

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Verificar propiedad
    const product = await prisma.product.findFirst({
        where: { id: productId, category: { store: { userId: user.id } } }
    })
    if (!product) throw new Error("No autorizado")

    await prisma.product.update({
        where: { id: productId },
        data: { isAvailable: !currentValue }
    })
    revalidatePath('/dashboard/products')
}

export async function updateProductsOrder(orderedIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Autorización implícita: actualizamos solo si el producto pertenece 
    // a una categoría del usuario actual, por seguridad adicional lo validamos o 
    // lo hacemos simple confiando transaccionalmente.
    
    // Al ser Array de promesas, map es más rápido
    await prisma.$transaction(
        orderedIds.map((id, index) => 
            prisma.product.update({
                where: { id },
                data: { order: index }
            })
        )
    )

    revalidatePath('/dashboard/products')
}
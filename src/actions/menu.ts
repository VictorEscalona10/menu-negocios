// src/actions/menu.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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

    await prisma.product.create({
        data: {
            name,
            description,
            price,
            categoryId,
        }
    })

    revalidatePath('/dashboard/products')
}

export async function deleteCategory(categoryId: string) {
    // Prisma on cascade eliminará también sus productos
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
// src/actions/modifiers.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createModifierGroup(productId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Verificar propiedad del producto
    const product = await prisma.product.findFirst({
        where: { id: productId, category: { store: { userId: user.id } } }
    })
    if (!product) throw new Error("No autorizado")

    const name = formData.get('name') as string;
    const isRequired = formData.get('isRequired') === 'true';
    const maxSelectRaw = formData.get('maxSelect') as string;

    // Si no definen un máximo, lo dejamos en null (infinito)
    const maxSelect = maxSelectRaw ? parseInt(maxSelectRaw) : null;

    await prisma.modifierGroup.create({
        data: { name, isRequired, maxSelect, productId }
    });

    revalidatePath(`/dashboard/products`);
}

export async function createModifierOption(modifierGroupId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Verificar propiedad del grupo (y por ende de la tienda)
    const group = await prisma.modifierGroup.findFirst({
        where: { 
            id: modifierGroupId,
            product: { category: { store: { userId: user.id } } }
        }
    })
    if (!group) throw new Error("No autorizado")

    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string) || 0;

    await prisma.modifierOption.create({
        data: { name, price, modifierGroupId }
    });

    revalidatePath(`/dashboard/products`);
}

export async function deleteModifierGroup(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // 1. Buscamos el grupo incluyendo la cadena de propiedad
    const group = await prisma.modifierGroup.findUnique({
        where: { id },
        include: {
            product: {
                include: {
                    category: {
                        include: {
                            store: true
                        }
                    }
                }
            }
        }
    })

    // 2. Verificaciones explícitas
    if (!group) throw new Error("El grupo de extras no existe o ya fue eliminado.")
    
    if (group.product.category.store.userId !== user.id) {
        throw new Error("No tienes permiso para eliminar este grupo.")
    }

    await prisma.modifierGroup.delete({ where: { id } });
    revalidatePath(`/dashboard/products`);
}

export async function deleteModifierOption(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // 1. Buscamos la opción incluyendo la cadena de propiedad
    const option = await prisma.modifierOption.findUnique({
        where: { id },
        include: {
            modifierGroup: {
                include: {
                    product: {
                        include: {
                            category: {
                                include: {
                                    store: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // 2. Verificaciones explícitas
    if (!option) throw new Error("La opción no existe o ya fue eliminada.")

    if (option.modifierGroup.product.category.store.userId !== user.id) {
        throw new Error("No tienes permiso para eliminar esta opción.")
    }

    await prisma.modifierOption.delete({ where: { id } });
    revalidatePath(`/dashboard/products`);
}
// src/actions/modifiers.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createModifierGroup(productId: string, formData: FormData) {
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
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string) || 0;

    await prisma.modifierOption.create({
        data: { name, price, modifierGroupId }
    });

    revalidatePath(`/dashboard/products`);
}

export async function deleteModifierGroup(id: string) {
    await prisma.modifierGroup.delete({ where: { id } });
    revalidatePath(`/dashboard/products`);
}

export async function deleteModifierOption(id: string) {
    await prisma.modifierOption.delete({ where: { id } });
    revalidatePath(`/dashboard/products`);
}
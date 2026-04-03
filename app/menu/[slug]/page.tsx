// app/menu/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SharedMenuUI from '@/app/components/SharedMenuUI'

export default async function MenuPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    // En Next.js 15+, params es una promesa, así que la esperamos
    const { slug } = await params;

    // Buscamos el local por su slug y traemos sus categorías con los productos DISPONIBLES
    const store = await prisma.store.findUnique({
        where: { slug },
        include: {
            categories: {
                include: {
                    products: {
                        where: { isAvailable: true },
                        include: {
                            modifierGroups: {
                                include: {
                                    options: true
                                },
                                orderBy: {
                                    name: 'asc'
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!store) {
        notFound();
    }

    return <SharedMenuUI store={store} />;
}
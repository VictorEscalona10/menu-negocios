// app/menu/[slug]/page.tsx
export const dynamic = 'force-dynamic';
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
                where: { isActive: true },
                orderBy: { order: 'asc' },
                include: {
                    products: {
                        where: { isAvailable: true },
                        orderBy: [
                            { order: 'asc' },
                            { name: 'asc' }
                        ],
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

    if (!store.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#131313] text-white p-6 font-sans">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-6">
                        <span className="text-4xl opacity-50">🏪</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Local en mantenimiento</h1>
                    <p className="text-zinc-400 text-sm">
                        Este menú digital se encuentra temporalmente inactivo. Por favor, vuelve más tarde.
                    </p>
                </div>
            </div>
        )
    }

    return <SharedMenuUI store={store} />;
}
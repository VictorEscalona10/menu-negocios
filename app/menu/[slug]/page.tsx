// app/menu/[slug]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { AdvancedCustomization } from '@/src/types/customization'
import SharedMenuUI from '@/app/components/SharedMenuUI'
import AdvancedMenuUI from '@/app/components/AdvancedMenuUI'

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
            },
            deliveryZones: {
                orderBy: { name: 'asc' }
            }
        }
    });

    if (!store) {
        notFound();
    }

    // Lectura pública del diseño (esta página no requiere sesión; la acción
    // getCustomizationLayout exige propietario y rompería a los visitantes)
    const layoutRow = await prisma.customizationLayout.findUnique({
        where: { storeId: store.id },
        select: { layoutJson: true },
    })
    const layout = (layoutRow?.layoutJson ?? null) as AdvancedCustomization | null

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

    if (store.customizationMode === 'AVANCED' && layout) {
        return <AdvancedMenuUI store={store} layoutJson={layout} />
    }

    if (store.customizationMode === 'AVANCED' && !layout) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black p-6 font-sans">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-200 rounded-full mx-auto flex items-center justify-center mb-6">
                        <span className="text-4xl opacity-80">🛠️</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Configura tu menú</h1>
                    <p className="text-zinc-600 text-sm">
                        Empieza configurando tu menú en el panel de administración para que aparezca aquí.
                    </p>
                    <div className="flex space-x-2">
                        <a
                            href="/dashboard/customization"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 font-medium"
                        >
                            Ir al editor
                        </a>
                    <Link
                        href="/"
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
                    >
                        Cancelar
                    </Link>
                    </div>
                </div>
            </div>
        )
    }

    return <SharedMenuUI store={store} />;
}
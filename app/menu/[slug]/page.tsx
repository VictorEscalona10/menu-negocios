// app/menu/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCachedMenu } from '@/lib/menu'
import SharedMenuUI from '@/app/components/SharedMenuUI'
import AdvancedMenuUI from '@/app/components/AdvancedMenuUI'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { Home2Outlined, Gear1Outlined } from '@lineiconshq/free-icons'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const data = await getCachedMenu(slug)

    if (!data?.store) {
        return {
            title: 'Menú no encontrado',
        }
    }

    const { store } = data
    return {
        title: `${store.name} | Menú Digital`,
        description: `Consulta la carta y realiza tus pedidos en ${store.name}`,
        openGraph: {
            title: store.name,
            description: `Menú digital de ${store.name}`,
            images: store.logoUrl ? [{ url: store.logoUrl }] : store.bannerUrl ? [{ url: store.bannerUrl }] : [],
        },
    }
}

export default async function MenuPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // Consulta cacheada en memoria con React.cache y Next unstable_cache
    const menuData = await getCachedMenu(slug)

    if (!menuData || !menuData.store) {
        notFound()
    }

    const { store, layout } = menuData

    if (!store.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#131313] text-white p-6 font-sans">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-6">
                        <Lineicons icon={Home2Outlined} size={36} className="text-zinc-400" />
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
                        <Lineicons icon={Gear1Outlined} size={36} className="text-zinc-600" />
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

    return <SharedMenuUI store={store} />
}
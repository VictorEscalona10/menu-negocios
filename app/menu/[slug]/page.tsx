// app/menu/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCachedMenu } from '@/lib/menu'
import SharedMenuUI from '@/app/components/SharedMenuUI'
import AdvancedMenuUI from '@/app/components/AdvancedMenuUI'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { Home2Outlined, Gear1Outlined, Ban2Outlined } from '@lineiconshq/free-icons'
import { prisma } from '@/lib/prisma'
import { getSessionWaiter } from '@/lib/waiterAuth'
import type { OrderContext } from '@/src/types/order'

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
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ mesa?: string | string[]; ver?: string | string[] }>
}) {
    const { slug } = await params
    const { mesa, ver } = await searchParams

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

    // ==========================================================================
    // SISTEMA DE TRES MENÚS — resolución de modo (docs/DESIGN.md §9.1)
    // 1. Sin query 'mesa'  → modo WhatsApp (menú actual, intacto)
    // 2. 'mesa=<qrToken>'  → mesa válida + sesión de mesero → 'waiter', si no → 'table'
    // 3. 'mesa=<qrToken>&ver=1' (sin sesión) → 'view': carta de SOLO LECTURA
    //    (QR "solo ver carta": los pedidos los hace el mesero desde su panel).
    //    La sesión de mesero siempre gana: un mesero con 'ver=1' queda en 'waiter'.
    // La sesión de mesero vive solo en cookie httpOnly; jamás se lee de la URL.
    // ==========================================================================
    const mesaToken = typeof mesa === 'string' && mesa.trim() ? mesa.trim() : null
    const viewOnly = ver === '1' || ver === 'true'

    const table = mesaToken
        ? await prisma.table.findFirst({
              where: { qrToken: mesaToken, store: { slug }, isActive: true },
              select: { id: true, number: true, qrToken: true },
          })
        : null

    if (mesaToken && !table) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#131313] text-white p-6 font-sans">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-6">
                        <Lineicons icon={Ban2Outlined} size={36} className="text-zinc-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Código de mesa no válido</h1>
                    <p className="text-zinc-400 text-sm">
                        El código QR de esta mesa ya no está disponible. Pide una nueva o entra al menú general.
                    </p>
                    <Link
                        href={`/menu/${slug}`}
                        className="inline-block bg-white text-black px-5 py-2.5 rounded-md hover:bg-zinc-200 font-bold text-sm"
                    >
                        Ir al menú
                    </Link>
                </div>
            </div>
        )
    }

    // Sesión de mesero (cookie httpOnly). Si existe pero no hay mesa en la URL,
    // la barra de OrderModeBar bloquea el pedido hasta que elija una mesa.
    const session = await getSessionWaiter()
    const waiterSession = session && session.storeId === store.id ? session : null

    const orderContext: OrderContext = {
        mode: table ? (waiterSession ? 'waiter' : viewOnly ? 'view' : 'table') : 'whatsapp',
        table: table ?? null,
        waiter: waiterSession ? { id: waiterSession.id, name: waiterSession.name } : null,
    }

    if (store.customizationMode === 'AVANCED' && layout) {
        return <AdvancedMenuUI store={store} layoutJson={layout} orderContext={orderContext} orderSlug={slug} />
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

    return <SharedMenuUI store={store} orderContext={orderContext} orderSlug={slug} />
}
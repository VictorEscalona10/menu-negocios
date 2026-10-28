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
import { getSubscriptionInfo } from '@/lib/subscription'

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

    const subscription = getSubscriptionInfo(store)

    // T73: Si la suscripción está vencida/bloqueada o en pausa manual
    if (subscription.isBlocked || !store.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#131313] text-white p-6 font-sans">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-6">
                        <Lineicons icon={Home2Outlined} size={36} className="text-zinc-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Menú temporalmente no disponible</h1>
                    <p className="text-zinc-400 text-sm">
                        Este local se encuentra en mantenimiento. Por favor, vuelve más tarde.
                    </p>
                </div>
            </div>
        )
    }

    // ==========================================================================
    // SISTEMA DE TRES MENÚS — resolución de modo (docs/DESIGN.md §9.1)
    // T72: Si el local está en Plan Básico, se deshabilitan los modos de mesa
    // y el menú funciona exclusivamente en modo WhatsApp regular.
    // ==========================================================================
    const canUseTables = subscription.canAccessTableOrders
    const mesaToken = canUseTables && typeof mesa === 'string' && mesa.trim() ? mesa.trim() : null
    const viewOnly = canUseTables && (ver === '1' || ver === 'true')

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
    const waiterSession = canUseTables && session && session.storeId === store.id ? session : null

    const orderContext: OrderContext = {
        mode: table ? (waiterSession ? 'waiter' : viewOnly ? 'view' : 'table') : 'whatsapp',
        table: table ?? null,
        waiter: waiterSession ? { id: waiterSession.id, name: waiterSession.name } : null,
    }

    // T72: Personalización avanzada exclusiva del Plan Pro
    if (subscription.canAccessCustomization && store.customizationMode === 'AVANCED' && layout) {
        return <AdvancedMenuUI store={store} layoutJson={layout} orderContext={orderContext} orderSlug={slug} />
    }

    if (subscription.canAccessCustomization && store.customizationMode === 'AVANCED' && !layout) {
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
                    <div className="flex justify-center space-x-2 pt-2">
                        <Link
                            href="/dashboard/customization"
                            className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 text-xs font-bold"
                        >
                            Ir al editor
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return <SharedMenuUI store={store} orderContext={orderContext} orderSlug={slug} />
}
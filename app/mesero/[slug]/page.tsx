// app/mesero/[slug]/page.tsx
// Panel del MESERO — ruta PÚBLICA (docs/DESIGN.md §18, v2.1 / T54)
// - SIN Supabase auth: la identificación es solo la cookie httpOnly `komy_waiter`.
// - El middleware NO cubre /mesero/* (matcher: /dashboard, /onboarding, /login, /register).
// - Sin sesión (o si pertenece a OTRO local) → form de clave inline (WaiterLoginModal).
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getSessionWaiter } from '@/lib/waiterAuth'
import WaiterLoginModal from '@/app/components/WaiterLoginModal'
import MeseroPanel from './MeseroPanel'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { User4Outlined } from '@lineiconshq/free-icons'

interface MeseroPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MeseroPageProps): Promise<Metadata> {
    const { slug } = await params
    const store = await prisma.store.findUnique({ where: { slug }, select: { name: true } })
    return { title: store ? `Panel del mesero · ${store.name}` : 'Panel del mesero' }
}

export default async function MeseroPage({ params }: MeseroPageProps) {
    const { slug } = await params

    const store = await prisma.store.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true, themeColor: true },
    })
    if (!store) notFound()

    // Sesión de mesero (cookie). Si es de OTRO local, aquí no cuenta: hay que
    // identificarse con la clave de este store (validación de pertenencia, T54).
    const session = await getSessionWaiter()
    const waiter = session && session.storeId === store.id ? { id: session.id, name: session.name } : null

    const themeColor = store.themeColor || '#FF5630'

    // --- Sin sesión → form de clave inline (signInWaiter → router.refresh) ---
    if (!waiter) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-5">
                <div className="w-full max-w-sm space-y-5">
                    <div className="text-center space-y-1.5">
                        <span
                            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${themeColor}22` }}
                            aria-hidden
                        >
                            <Lineicons icon={User4Outlined} size={22} style={{ color: themeColor }} />
                        </span>
                        <h1 className="text-lg font-black text-zinc-900 tracking-tight">Panel del mesero</h1>
                        <p className="text-xs text-zinc-500">{store.name}</p>
                    </div>

                    <WaiterLoginModal variant="inline" slug={store.slug} themeColor={themeColor} />

                    <p className="text-center text-[11px] text-zinc-600">
                        ¿No eres mesero?{' '}
                        <Link
                            href={`/menu/${store.slug}`}
                            className="text-zinc-500 underline underline-offset-2 hover:text-zinc-900 transition-colors"
                        >
                            Ver el menú
                        </Link>
                    </p>
                </div>
            </div>
        )
    }

    // --- Con sesión → panel (bloques: Mis mesas + Mis pedidos) ---
    return (
        <MeseroPanel
            slug={store.slug}
            storeId={store.id}
            storeName={store.name}
            themeColor={themeColor}
            waiter={waiter}
        />
    )
}

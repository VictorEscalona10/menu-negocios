// app/dashboard/mesas/page.tsx
// Gestión de MESEROS y MESAS — Sistema de Tres Menús (docs/DESIGN.md §15)
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import WaitersManager from './WaitersManager'
import TablesManager from './TablesManager'
import WaiterPanelBlock from './WaiterPanelBlock'

export default async function MesasPage() {
    // 1. Sesión de admin (Supabase) + local propio (mismo patrón que settings)
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const store = await prisma.store.findUnique({
        where: { userId: user.id },
        select: {
            id: true,
            name: true,
            slug: true,
            waiters: {
                select: { id: true, name: true, isActive: true },
                orderBy: { createdAt: 'asc' },
            },
            tables: {
                select: { id: true, number: true, qrToken: true, waiterId: true, isActive: true },
                orderBy: { createdAt: 'asc' },
            },
        },
    })

    if (!store) {
        return redirect('/dashboard')
    }

    // Base absoluta para construir la URL de cada QR de mesa
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const baseUrl = `${proto}://${host}`

    const occupied = store.tables.filter((t) => t.waiterId && t.isActive).length

    return (
        <div className="min-h-[80vh] flex flex-col items-center p-4 md:p-6 lg:p-10 bg-zinc-50/50">
            <div className="w-full max-w-5xl bg-white p-5 md:p-10 rounded-3xl shadow-sm border border-zinc-200 relative">
                {/* Botón Volver */}
                <Link
                    href="/dashboard"
                    className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-zinc-500 hover:text-black transition-colors font-medium hover:-translate-x-1 duration-300"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden md:inline">Volver</span>
                </Link>

                <div className="text-center mb-4 pt-10 md:pt-4">
                    <h1 className="text-3xl font-extrabold text-zinc-900 mb-2 tracking-tight">Mesas y Meseros</h1>
                    <p className="text-zinc-500 font-medium">
                        Modo mesa: tus clientes escanean el QR de su mesa y el pedido llega directo al panel.
                    </p>
                </div>

                {/* Resumen rápido */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full">
                        {store.waiters.length} {store.waiters.length === 1 ? 'mesero' : 'meseros'}
                    </span>
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full">
                        {store.tables.length} {store.tables.length === 1 ? 'mesa' : 'mesas'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                        {occupied} ocupada{occupied === 1 ? '' : 's'}
                    </span>
                    <Link
                        href={`/menu/${store.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-full transition-colors"
                    >
                        Ver menú ↗
                    </Link>
                </div>

                {/* Bloque: Meseros */}
                <WaitersManager storeId={store.id} initialWaiters={store.waiters} tables={store.tables} />

                {/* Bloque: Mesas */}
                <div className="mt-10 pt-6 border-t border-zinc-200">
                    <TablesManager
                        storeId={store.id}
                        storeSlug={store.slug}
                        storeName={store.name}
                        baseUrl={baseUrl}
                        initialTables={store.tables}
                        waiters={store.waiters}
                    />
                </div>

                {/* Bloque: Panel del mesero (link copiable a /mesero/[slug], T57) */}
                <div className="mt-10 pt-6 border-t border-zinc-200">
                    <WaiterPanelBlock
                        baseUrl={baseUrl}
                        storeSlug={store.slug}
                        hasWaiters={store.waiters.length > 0}
                    />
                </div>
            </div>
        </div>
    )
}

// app/mesero/[slug]/MeseroPanel.tsx
// Shell del panel del mesero con sesión activa (docs/DESIGN.md §18 / T54).
// Es client component por el botón "Salir" (signOutWaiter → router.refresh).
// Bloques: Mis mesas (T54) · Mis pedidos (T55, Realtime Broadcast desde T62).
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOutWaiter } from '@/src/actions/waiters'
import MyTables from './MyTables'
import MyOrders from './MyOrders'

interface MeseroPanelProps {
    slug: string
    storeId: string
    storeName: string
    themeColor: string
    waiter: { id: string; name: string }
}

export default function MeseroPanel({ slug, storeId, storeName, themeColor, waiter }: MeseroPanelProps) {
    const router = useRouter()
    const [signingOut, setSigningOut] = useState(false)

    const handleSignOut = async () => {
        if (signingOut) return
        setSigningOut(true)
        try {
            await signOutWaiter()
            router.refresh() // vuelve a la pantalla de clave inline
        } finally {
            setSigningOut(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Panel del mesero</p>
                    <p className="text-sm font-black text-zinc-900 truncate leading-tight">{storeName}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <span className="hidden sm:inline text-xs font-bold text-zinc-600 truncate max-w-[140px]">
                        {waiter.name}
                    </span>
                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="text-zinc-600 hover:text-zinc-900 text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                    >
                        {signingOut ? 'Saliendo...' : 'Salir'}
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-7">
                <div>
                    <h1 className="text-xl font-black text-zinc-900 tracking-tight">Hola, {waiter.name} 👋</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Toca una mesa para abrir el menú en modo mesero y empezar a pedir.
                    </p>
                </div>

                <MyTables storeId={storeId} slug={slug} themeColor={themeColor} />

                {/* T55/T62: "Mis pedidos" (Realtime Broadcast + getWaiterOrders + "Entregar") */}
                <MyOrders waiterId={waiter.id} themeColor={themeColor} />
            </main>
        </div>
    )
}

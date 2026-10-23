// app/mesero/[slug]/MyTables.tsx
// Bloque "Mis mesas" del panel del mesero (docs/DESIGN.md §18 / T54)
// - Lista SOLO las mesas de esta sesión (asignadas por admin + tomadas por mí).
// - Actualización en vivo con Supabase Realtime de "Table" (mismo patrón que
//   TablePickerSheet) + polling de respaldo cada 10 s si el websocket no conecta.
// - Tocar una mesa → /menu/[slug]?mesa=<qrToken> en NUEVA pestaña (el panel queda abierto).
// - Botón "Liberar mesa" por cada una (releaseTable solo libera las propias).
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getMyTables, releaseTable } from '@/src/actions/waiters'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { Ban2Outlined } from '@lineiconshq/free-icons'

type MyTable = { id: string; number: string; qrToken: string }

interface MyTablesProps {
    storeId: string
    slug: string
    themeColor?: string
}

export default function MyTables({ storeId, slug, themeColor = '#FF5630' }: MyTablesProps) {
    const [tables, setTables] = useState<MyTable[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const supabase = useRef(createClient()).current

    const refresh = useCallback(async () => {
        const res = await getMyTables(storeId)
        if (res.success) setTables(res.tables)
    }, [storeId])

    // Carga inicial + realtime + polling de respaldo (patrón TablePickerSheet)
    useEffect(() => {
        let cancelled = false
        setError('')
        setLoading(true)

        getMyTables(storeId).then((res) => {
            if (cancelled) return
            if (res.success) setTables(res.tables)
            else setError(res.error || 'No se pudieron cargar tus mesas')
            setLoading(false)
        })

        const channel = supabase
            .channel(`my-tables-${storeId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Table' }, () => {
                if (!cancelled) refresh()
            })
            .subscribe()

        // Resaldo si el websocket de Supabase no conecta (10 s)
        const interval = setInterval(() => {
            if (!cancelled) refresh()
        }, 10000)

        return () => {
            cancelled = true
            clearInterval(interval)
            supabase.removeChannel(channel)
        }
    }, [storeId, supabase, refresh])

    const handleRelease = async (table: MyTable) => {
        if (busyId) return
        setBusyId(table.id)
        setError('')
        try {
            const res = await releaseTable(table.id)
            if (!res.success) setError(res.error || 'No se pudo liberar la mesa')
            await refresh()
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mis mesas</p>
                    <p className="text-[11px] text-zinc-600">Se actualiza en tiempo real</p>
                </div>
                {tables.length > 0 && (
                    <span className="text-[11px] font-black text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                        {tables.length} {tables.length === 1 ? 'mesa' : 'mesas'}
                    </span>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                    <Lineicons icon={Ban2Outlined} size={15} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="py-8 flex flex-col items-center gap-3 text-zinc-500 bg-white rounded-2xl border border-zinc-200">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs font-bold">Cargando tus mesas...</span>
                </div>
            ) : tables.length === 0 ? (
                <div className="py-8 px-4 text-center bg-white rounded-2xl border border-dashed border-zinc-300">
                    <p className="text-sm text-zinc-700 font-bold">Aún no tienes mesas</p>
                    <p className="text-xs text-zinc-600 mt-1">
                        Pide al administrador que te asigne una, o tómalas desde el menú (botón &quot;Elegir mesa&quot;).
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {tables.map((table) => {
                        const busy = busyId === table.id
                        return (
                            <div
                                key={table.id}
                                className={`rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all shadow-sm ${
                                    busy ? 'opacity-70' : 'hover:bg-zinc-50'
                                }`}
                            >
                                <a
                                    href={`/menu/${slug}?mesa=${table.qrToken}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                Mesa
                                            </p>
                                            <p className="text-xl font-black text-zinc-900 leading-tight truncate">
                                                {table.number}
                                            </p>
                                        </div>
                                        <span
                                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-black"
                                            style={{ backgroundColor: themeColor }}
                                            aria-hidden
                                        >
                                            ↗
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[11px] font-bold text-zinc-500">Abrir menú en modo mesero</p>
                                </a>

                                <div className="px-4 pb-3.5 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-emerald-600">Asignada a ti</span>
                                    <button
                                        onClick={() => handleRelease(table)}
                                        disabled={busyId !== null}
                                        className="text-[11px] font-black text-zinc-600 hover:text-zinc-900 underline underline-offset-2 disabled:opacity-50"
                                    >
                                        {busy ? '...' : 'Liberar'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

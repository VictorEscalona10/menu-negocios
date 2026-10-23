// app/menu/[slug]/components/TablePickerSheet.tsx
// Selector de mesas del MESERO (docs/DESIGN.md §13.3)
// - "Mis mesas" (asignadas por admin o tomadas por mí) primero, luego libres.
// - Actualización en vivo con Supabase Realtime de la tabla "Table"
//   (con polling de respaldo cada 10 s si el websocket no conecta).
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { claimTable, releaseTable, getTableStatuses } from '@/src/actions/waiters'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { Ban2Outlined, CheckOutlined, Locked1Outlined } from '@lineiconshq/free-icons'

type TableStatus = { id: string; number: string; waiterId: string | null; isActive: boolean }

interface TablePickerSheetProps {
    storeId: string
    waiterId: string
    currentTableId?: string | null
    isOpen: boolean
    onClose: () => void
    /** Tras reclamar: el padre cambia la URL (?mesa=<qrToken>) */
    onTableSelected: (table: { id: string; number: string; qrToken: string }) => void
    themeColor?: string
}

export default function TablePickerSheet({
    storeId,
    waiterId,
    currentTableId,
    isOpen,
    onClose,
    onTableSelected,
    themeColor = '#FF5630',
}: TablePickerSheetProps) {
    const [tables, setTables] = useState<TableStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const supabase = useRef(createClient()).current

    const refresh = useCallback(async () => {
        const res = await getTableStatuses(storeId)
        if (res.success && res.tables) setTables(res.tables)
    }, [storeId])

    // Carga inicial + realtime + polling de respaldo
    useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        setError('')
        setLoading(true)

        getTableStatuses(storeId).then((res) => {
            if (cancelled) return
            if (res.success && res.tables) setTables(res.tables)
            setLoading(false)
        })

        const channel = supabase
            .channel(`tables-${storeId}`)
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
    }, [isOpen, storeId, supabase, refresh])

    if (!isOpen) return null

    const mine = tables.filter((t) => t.waiterId === waiterId)
    const free = tables.filter((t) => t.waiterId === null)
    const taken = tables.filter((t) => t.waiterId !== null && t.waiterId !== waiterId)

    const handleSelect = async (table: TableStatus) => {
        if (busyId) return
        setBusyId(table.id)
        setError('')
        try {
            const res = await claimTable(table.id)
            if (res.success && res.table) {
                onTableSelected(res.table)
            } else {
                setError(res.error || 'No se pudo tomar la mesa')
                await refresh()
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setBusyId(null)
        }
    }

    const handleRelease = async (e: React.MouseEvent, table: TableStatus) => {
        e.stopPropagation()
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

    const renderTile = (table: TableStatus, kind: 'mine' | 'free' | 'taken') => {
        const isCurrent = table.id === currentTableId
        const busy = busyId === table.id
        return (
            <button
                key={table.id}
                type="button"
                disabled={kind === 'taken' || busyId !== null}
                onClick={() => kind !== 'taken' && handleSelect(table)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                    kind === 'taken'
                        ? 'bg-white/[0.03] border-white/5 opacity-55 cursor-not-allowed'
                        : kind === 'mine'
                            ? 'border-transparent shadow-lg ring-2 ring-white/15 hover:brightness-110 active:scale-[0.98]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-[0.98]'
                } ${busy ? 'opacity-70' : ''}`}
                style={kind === 'mine' ? { backgroundColor: `${themeColor}26` } : undefined}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mesa</p>
                        <p className="text-xl font-black text-white leading-tight truncate">{table.number}</p>
                    </div>
                    {kind === 'mine' && (
                        <span
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: themeColor }}
                        >
                            <Lineicons icon={CheckOutlined} size={14} className="text-white" />
                        </span>
                    )}
                    {kind === 'taken' && (
                        <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Lineicons icon={Locked1Outlined} size={14} className="text-zinc-400" />
                        </span>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold ${kind === 'free' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {kind === 'mine' ? (isCurrent ? 'Tu mesa actual' : 'Asignada a ti') : kind === 'free' ? 'Disponible' : 'Ocupada'}
                    </span>
                    {kind === 'mine' && !isCurrent && (
                        <span
                            onClick={(e) => handleRelease(e, table)}
                            className="text-[11px] font-black text-zinc-300 hover:text-white underline underline-offset-2"
                            role="button"
                        >
                            Liberar
                        </span>
                    )}
                    {busy && kind !== 'taken' && (
                        <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}
                </div>
            </button>
        )
    }

    return (
        <div
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex justify-end sm:justify-center sm:items-center sm:p-4 items-end"
            onClick={onClose}
        >
            <div
                className="bg-[#1c1b1b] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden border border-white/10 shadow-2xl max-h-[88vh] flex flex-col"
                style={{ animation: 'slideUpPicker 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-white/10 bg-[#131313] flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-white leading-tight">Elige una mesa</h2>
                        <p className="text-[11px] text-zinc-500">Se actualiza en tiempo real</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs font-bold">
                            <Lineicons icon={Ban2Outlined} size={15} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-10 flex flex-col items-center gap-3 text-zinc-500">
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-xs font-bold">Cargando mesas...</span>
                        </div>
                    ) : tables.length === 0 ? (
                        <p className="py-8 text-center text-sm text-zinc-500">
                            Este local todavía no tiene mesas configuradas.
                        </p>
                    ) : (
                        <>
                            {mine.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                        Mis mesas
                                    </p>
                                    <div className="grid grid-cols-3 gap-2.5">{mine.map((t) => renderTile(t, 'mine'))}</div>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                    Mesas disponibles
                                </p>
                                {free.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2.5">{free.map((t) => renderTile(t, 'free'))}</div>
                                ) : (
                                    <p className="text-xs text-zinc-600">No hay mesas libres ahora mismo.</p>
                                )}
                            </div>
                            {taken.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                        Ocupadas
                                    </p>
                                    <div className="grid grid-cols-3 gap-2.5">{taken.map((t) => renderTile(t, 'taken'))}</div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes slideUpPicker {
                        from { transform: translateY(40px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}} />
            </div>
        </div>
    )
}

// app/dashboard/mesas/TablesManager.tsx
// Alta/gestión de MESAS + QR propio por mesa (docs/DESIGN.md §15, TASKS T47)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRGenerator from '@/app/components/QRGenerator'
import {
    createTable,
    createTablesBulk,
    deleteTable,
    setTableActive,
    assignWaiter,
} from '@/src/actions/waiters'
import type { WaiterDTO } from './WaitersManager'

type TableDTO = {
    id: string
    number: string
    qrToken: string
    waiterId: string | null
    isActive: boolean
}

interface TablesManagerProps {
    storeId: string
    storeSlug: string
    storeName: string
    /** Ej: https://komy.app (del header de la request) */
    baseUrl: string
    initialTables: TableDTO[]
    waiters: WaiterDTO[]
}

export default function TablesManager({
    storeId,
    storeSlug,
    storeName,
    baseUrl,
    initialTables,
    waiters,
}: TablesManagerProps) {
    const router = useRouter()
    const [tables, setTables] = useState<TableDTO[]>(initialTables)
    const [singleNumber, setSingleNumber] = useState('')
    const [bulkFrom, setBulkFrom] = useState('')
    const [bulkTo, setBulkTo] = useState('')
    const [busy, setBusy] = useState(false)
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [qrTable, setQrTable] = useState<TableDTO | null>(null)

    useEffect(() => setTables(initialTables), [initialTables])

    // QR 1: pedido en mesa (el cliente pide desde su celular)
    const tableUrl = (t: TableDTO) => `${baseUrl}/menu/${storeSlug}?mesa=${t.qrToken}`
    // QR 2: solo ver carta (?ver=1 → modo 'view': sin pedidos, el mesero hace los pedidos)
    const viewUrl = (t: TableDTO) => `${baseUrl}/menu/${storeSlug}?mesa=${t.qrToken}&ver=1`

    const waiterNameOf = (waiterId: string | null) =>
        waiterId ? (waiters.find((w) => w.id === waiterId)?.name ?? 'Desconocido') : null

    const handleCreateSingle = async () => {
        if (busy) return
        if (!singleNumber.trim()) {
            setError('Escribe el número o nombre de la mesa.')
            return
        }
        setBusy(true)
        setError('')
        setInfo('')
        try {
            const res = await createTable(storeId, singleNumber.trim())
            if (res.success) {
                setSingleNumber('')
                setInfo(`Mesa ${res.table?.number ?? ''} creada ✅`)
                router.refresh()
            } else {
                setError(res.error || 'No se pudo crear la mesa.')
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setBusy(false)
        }
    }

    const handleCreateBulk = async () => {
        if (busy) return
        const from = parseInt(bulkFrom, 10)
        const to = parseInt(bulkTo, 10)
        if (!Number.isFinite(from) || !Number.isFinite(to)) {
            setError('Indica el rango (Ej: de 1 a 20).')
            return
        }
        setBusy(true)
        setError('')
        setInfo('')
        try {
            const res = await createTablesBulk(storeId, from, to)
            if (res.success) {
                setBulkFrom('')
                setBulkTo('')
                setInfo(`${res.created} mesa${res.created === 1 ? '' : 's'} creada${res.created === 1 ? '' : 's'}${res.skipped ? ` (${res.skipped} ya existían)` : ''} ✅`)
                router.refresh()
            } else {
                setError(res.error || 'No se pudieron crear las mesas.')
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setBusy(false)
        }
    }

    const runTableAction = async (
        table: TableDTO,
        action: () => Promise<{ success: boolean; error?: string }>,
        onSuccess?: () => void
    ) => {
        if (pendingId) return
        setPendingId(table.id)
        setError('')
        try {
            const res = await action()
            if (!res.success) setError(res.error || 'No se pudo completar la acción.')
            else onSuccess?.()
            router.refresh()
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setPendingId(null)
        }
    }

    const handleAssign = async (table: TableDTO, waiterId: string) => {
        await runTableAction(table, () => assignWaiter(table.id, waiterId || null))
    }

    const handleRelease = async (table: TableDTO) => {
        const name = waiterNameOf(table.waiterId) ?? 'otro mesero'
        if (!window.confirm(`¿Liberar la mesa ${table.number} (ahora la tiene ${name})?`)) return
        await runTableAction(table, () => assignWaiter(table.id, null))
    }

    const handleToggleActive = async (table: TableDTO) => {
        await runTableAction(table, () => setTableActive(table.id, !table.isActive))
    }

    const handleDelete = async (table: TableDTO) => {
        if (!window.confirm(`¿Eliminar la mesa ${table.number}? Su QR dejará de funcionar.`)) return
        await runTableAction(table, () => deleteTable(table.id), () => {
            if (qrTable?.id === table.id) setQrTable(null)
        })
    }

    return (
        <section>
            <div className="mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Mesas</h2>
                <p className="text-xs text-zinc-500">
                    Cada mesa tiene un QR con su propio enlace <code className="font-mono bg-zinc-100 px-1 rounded">?mesa=…</code>.
                    Las mesas ocupadas solo se liberan desde aquí o por el mesero.
                </p>
            </div>

            {/* Altas: individual + masiva */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="border border-zinc-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Mesa individual</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={singleNumber}
                            onChange={(e) => {
                                setSingleNumber(e.target.value)
                                setError('')
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateSingle()
                            }}
                            placeholder="Número o nombre (Ej: 12 / Terraza 3)"
                            maxLength={30}
                            className="flex-1 min-w-0 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleCreateSingle}
                            disabled={busy}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-60"
                        >
                            Crear
                        </button>
                    </div>
                </div>

                <div className="border border-zinc-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Alta masiva</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            value={bulkFrom}
                            onChange={(e) => setBulkFrom(e.target.value)}
                            placeholder="Desde"
                            className="w-full min-w-0 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        />
                        <span className="text-zinc-400 text-sm font-bold">–</span>
                        <input
                            type="number"
                            min={1}
                            value={bulkTo}
                            onChange={(e) => setBulkTo(e.target.value)}
                            placeholder="Hasta"
                            className="w-full min-w-0 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleCreateBulk}
                            disabled={busy}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-60 shrink-0"
                        >
                            Crear
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    {error}
                </p>
            )}
            {info && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
                    {info}
                </p>
            )}

            {/* Lista de mesas */}
            {tables.length === 0 ? (
                <div className="border border-dashed border-zinc-300 rounded-xl p-6 text-center">
                    <p className="text-sm text-zinc-500 font-medium">
                        No tienes mesas todavía. Crea un rango (ej: 1 a 20) para generar sus QR.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {tables.map((t) => {
                        const occupant = waiterNameOf(t.waiterId)
                        const isPending = pendingId === t.id
                        return (
                            <li
                                key={t.id}
                                className={`border rounded-xl px-4 py-3 bg-white ${t.isActive ? 'border-zinc-200' : 'border-zinc-200 opacity-60'}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span
                                            className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm font-black shrink-0 truncate px-1"
                                            title={`Mesa ${t.number}`}
                                        >
                                            {t.number}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
                                                        !t.isActive
                                                            ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                            : occupant
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}
                                                >
                                                    {!t.isActive ? 'Desactivada' : occupant ? `Ocupada · ${occupant}` : 'Libre'}
                                                </span>
                                                {!t.isActive && (
                                                    <span className="text-[11px] text-zinc-400 font-semibold">
                                                        QR desactivado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        {/* Asignar mesero */}
                                        <select
                                            value={t.waiterId ?? ''}
                                            onChange={(e) => handleAssign(t, e.target.value)}
                                            disabled={isPending || waiters.length === 0}
                                            className="text-[11px] font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-400 disabled:opacity-50"
                                            title={waiters.length === 0 ? 'Primero crea un mesero' : 'Asignar mesero'}
                                        >
                                            <option value="">Sin mesero</option>
                                            {waiters.map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    {w.name}
                                                    {!w.isActive ? ' (inactivo)' : ''}
                                                </option>
                                            ))}
                                        </select>

                                        {t.isActive && occupant && (
                                            <button
                                                onClick={() => handleRelease(t)}
                                                disabled={isPending}
                                                className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors disabled:opacity-50"
                                            >
                                                Liberar
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setQrTable(t)}
                                            className="text-[11px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Ver QR
                                        </button>

                                        <button
                                            onClick={() => handleToggleActive(t)}
                                            disabled={isPending}
                                            className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors disabled:opacity-50"
                                        >
                                            {isPending ? '...' : t.isActive ? 'Desactivar' : 'Activar'}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(t)}
                                            disabled={isPending}
                                            className="text-[11px] font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* ══ Modal QR por mesa ══ */}
            {qrTable && (
                <div
                    className="fixed inset-0 z-[110] bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
                    onClick={() => setQrTable(null)}
                >
                    <div
                        className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-6 max-w-3xl w-full space-y-5 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <h3 className="text-lg font-extrabold text-zinc-900">QR · Mesa {qrTable.number}</h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                {storeName} · elige el QR según cómo quieras que opere la mesa
                            </p>
                        </div>

                        {/* Los dos QRs lado a lado (apilados en pantallas angostas) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* QR 1: pedido en mesa (cliente pide desde su celular) */}
                            <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                                <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white px-2.5 py-1 rounded-full">
                                    1 · Pedido en mesa
                                </span>
                                <div className="flex justify-center">
                                    <QRGenerator
                                        menuUrl={tableUrl(qrTable)}
                                        storeName={`${storeName} Mesa ${qrTable.number} Pedido`}
                                    />
                                </div>
                                <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                                    Para que el cliente haga su pedido desde su celular estando en la mesa,
                                    sin mesero. El pedido llega directo a tu panel.
                                </p>
                            </div>

                            {/* QR 2: solo ver carta (el mesero hace los pedidos desde su panel) */}
                            <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                                <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-full">
                                    2 · Solo ver carta
                                </span>
                                <div className="flex justify-center">
                                    <QRGenerator
                                        menuUrl={viewUrl(qrTable)}
                                        storeName={`${storeName} Mesa ${qrTable.number} Carta`}
                                    />
                                </div>
                                <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                                    Muestra la carta sin pedidos: el cliente solo ve los productos y se los
                                    pide a su mesero, quien hace el pedido desde su panel.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setQrTable(null)}
                            className="w-full text-xs font-bold py-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}

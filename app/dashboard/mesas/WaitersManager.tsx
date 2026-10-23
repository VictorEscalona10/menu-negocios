// app/dashboard/mesas/WaitersManager.tsx
// Alta/gestión de MESEROS con clave de acceso hasheada (docs/DESIGN.md §11, §15)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWaiter, regenerateWaiterCode, setWaiterActive, deleteWaiter } from '@/src/actions/waiters'

export type WaiterDTO = { id: string; name: string; isActive: boolean }
type TableDTO = { id: string; number: string; waiterId: string | null; isActive: boolean }

interface WaitersManagerProps {
    storeId: string
    initialWaiters: WaiterDTO[]
    tables: TableDTO[]
}

type CodeModal = { waiterName: string; code: string; isNew: boolean }

export default function WaitersManager({ storeId, initialWaiters, tables }: WaitersManagerProps) {
    const router = useRouter()
    const [waiters, setWaiters] = useState<WaiterDTO[]>(initialWaiters)
    const [name, setName] = useState('')
    const [busy, setBusy] = useState(false)
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [codeModal, setCodeModal] = useState<CodeModal | null>(null)
    const [copied, setCopied] = useState(false)

    // El server component re-fetcha tras cada acción (router.refresh)
    useEffect(() => setWaiters(initialWaiters), [initialWaiters])

    const handleCreate = async () => {
        if (busy) return
        if (name.trim().length < 2) {
            setError('Escribe un nombre de al menos 2 caracteres.')
            return
        }
        setBusy(true)
        setError('')
        try {
            const res = await createWaiter(storeId, name.trim())
            if (res.success && res.accessCode && res.waiter) {
                setName('')
                setCodeModal({ waiterName: res.waiter.name, code: res.accessCode, isNew: true })
                router.refresh()
            } else {
                setError(res.success ? 'No se pudo crear el mesero.' : res.error || 'Error inesperado.')
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setBusy(false)
        }
    }

    const handleRegenerate = async (waiter: WaiterDTO) => {
        if (pendingId) return
        if (!window.confirm(`Se generará una clave nueva para ${waiter.name} y SE CERRARÁ su sesión actual. ¿Continuar?`)) return
        setPendingId(waiter.id)
        setError('')
        try {
            const res = await regenerateWaiterCode(waiter.id)
            if (res.success && res.accessCode) {
                setCodeModal({ waiterName: waiter.name, code: res.accessCode, isNew: false })
                router.refresh()
            } else {
                setError(res.success ? 'No se pudo regenerar la clave.' : res.error || 'Error inesperado.')
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setPendingId(null)
        }
    }

    const handleToggleActive = async (waiter: WaiterDTO) => {
        if (pendingId) return
        setPendingId(waiter.id)
        setError('')
        try {
            const res = await setWaiterActive(waiter.id, !waiter.isActive)
            if (!res.success) setError(res.error || 'No se pudo actualizar el mesero.')
            else setWaiters((prev) => prev.map((w) => (w.id === waiter.id ? { ...w, isActive: !waiter.isActive } : w)))
            router.refresh()
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setPendingId(null)
        }
    }

    const handleDelete = async (waiter: WaiterDTO) => {
        if (pendingId) return
        if (!window.confirm(`¿Eliminar a ${waiter.name}? Sus mesas quedarán libres y perderá el acceso.`)) return
        setPendingId(waiter.id)
        setError('')
        try {
            const res = await deleteWaiter(waiter.id)
            if (!res.success) setError(res.error || 'No se pudo eliminar el mesero.')
            else setWaiters((prev) => prev.filter((w) => w.id !== waiter.id))
            router.refresh()
        } catch {
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setPendingId(null)
        }
    }

    const handleCopyCode = async () => {
        if (!codeModal) return
        try {
            await navigator.clipboard.writeText(codeModal.code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // silencio
        }
    }

    return (
        <section>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900">Meseros</h2>
                    <p className="text-xs text-zinc-500">
                        Cada mesero ingresa al menú con su clave de acceso (guardada cifrada).
                    </p>
                </div>
            </div>

            {/* Crear mesero */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value)
                        setError('')
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate()
                    }}
                    placeholder="Nombre del mesero (Ej: Carlos)"
                    maxLength={40}
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                />
                <button
                    onClick={handleCreate}
                    disabled={busy}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {busy ? 'Creando...' : '+ Crear mesero'}
                </button>
            </div>

            {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    {error}
                </p>
            )}

            {/* Lista */}
            {waiters.length === 0 ? (
                <div className="border border-dashed border-zinc-300 rounded-xl p-6 text-center">
                    <p className="text-sm text-zinc-500 font-medium">
                        Aún no tienes meseros. Crea el primero para que tome mesas y envíe pedidos al panel.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {waiters.map((w) => {
                        const assigned = tables.filter((t) => t.waiterId === w.id).map((t) => t.number)
                        const isPending = pendingId === w.id
                        return (
                            <li
                                key={w.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 border border-zinc-200 rounded-xl px-4 py-3 bg-white"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${w.isActive ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                                        title={w.isActive ? 'Activo' : 'Inactivo'}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 truncate">{w.name}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">
                                            {assigned.length > 0
                                                ? `Mesas asignadas: ${assigned.join(', ')}`
                                                : 'Sin mesas asignadas'}
                                            {!w.isActive && ' · Inactivo (sin acceso)'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleRegenerate(w)}
                                        disabled={isPending}
                                        className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors disabled:opacity-50"
                                    >
                                        Regenerar clave
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(w)}
                                        disabled={isPending}
                                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                                            w.isActive
                                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                        }`}
                                    >
                                        {isPending ? '...' : w.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(w)}
                                        disabled={isPending}
                                        className="text-[11px] font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* Modal con la clave generada (se muestra UNA sola vez) */}
            {codeModal && (
                <div
                    className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4"
                    onClick={() => setCodeModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-6 max-w-sm w-full space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <h3 className="text-base font-extrabold text-zinc-900">
                                {codeModal.isNew ? 'Clave de acceso creada' : 'Nueva clave de acceso'}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                {codeModal.isNew ? 'Mesero: ' : ''}
                                <b className="text-zinc-700">{codeModal.waiterName}</b>
                            </p>
                        </div>

                        <div className="bg-zinc-100 border border-dashed border-zinc-300 rounded-xl py-4 text-center select-all font-mono text-2xl font-black tracking-[0.25em] text-zinc-900">
                            {codeModal.code}
                        </div>

                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-semibold">
                            ⚠️ Se muestra solo una vez (se guarda cifrada). Si se pierde, regenera la clave desde aquí.
                            {!codeModal.isNew && ' El mesero deberá ingresar de nuevo.'}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyCode}
                                className={`flex-1 text-sm font-bold py-2.5 rounded-xl border transition-colors ${
                                    copied
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50'
                                }`}
                            >
                                {copied ? '¡Copiada!' : 'Copiar clave'}
                            </button>
                            <button
                                onClick={() => setCodeModal(null)}
                                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

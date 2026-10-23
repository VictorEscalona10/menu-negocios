// app/mesero/[slug]/MyOrders.tsx
// Bloque "Mis pedidos" del panel del mesero (docs/DESIGN.md §18-19 / T55)
// - Lista SOLO los pedidos de HOY de esta sesión (el action filtra por
//   `waiter_id` propio: un pedido sin mesero nunca aparece aquí).
// - SIN Realtime: el RLS de orders no da SELECT a anon ⇒ polling cada 5 s con
//   getWaiterOrders() (no se abren permisos anon sobre orders).
// - Botón "Entregar" SOLO cuando status='completed' (listo) y sin sello;
//   markOrderDelivered escribe delivered_at/delivered_by (idempotente).
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getWaiterOrders, markOrderDelivered, type WaiterOrder } from '@/src/actions/waiters'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { Ban2Outlined } from '@lineiconshq/free-icons'

const POLL_MS = 5000

const STATUS_META: Record<WaiterOrder['status'], { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    cooking: { label: 'En cocina', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    completed: { label: 'Listo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val)

const formatTime = (d: Date | string) => {
    try {
        return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
        return ''
    }
}

export default function MyOrders({ themeColor = '#FF5630' }: { themeColor?: string }) {
    const [orders, setOrders] = useState<WaiterOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        const res = await getWaiterOrders()
        if (res.success) setOrders(res.orders)
    }, [])

    // Carga inicial + polling cada 5 s (sin realtime por RLS, DESIGN §18)
    useEffect(() => {
        let cancelled = false
        setError('')

        getWaiterOrders().then((res) => {
            if (cancelled) return
            if (res.success) setOrders(res.orders)
            else setError(res.error || 'No se pudieron cargar tus pedidos')
            setLoading(false)
        })

        const interval = setInterval(() => {
            if (!cancelled) refresh()
        }, POLL_MS)

        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [refresh])

    const handleDeliver = async (order: WaiterOrder) => {
        if (busyId) return
        setBusyId(order.id)
        setError('')
        try {
            const res = await markOrderDelivered(order.id)
            if (!res.success) setError(res.error || 'No se pudo marcar el pedido como entregado')
            await refresh() // refleja el sello "Entregado ✓ hora" al instante
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mis pedidos</p>
                    <p className="text-[11px] text-zinc-600">Se actualiza cada 5 s</p>
                </div>
                {orders.length > 0 && (
                    <span className="text-[11px] font-black text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                        {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
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
                    <span className="text-xs font-bold">Cargando tus pedidos...</span>
                </div>
            ) : orders.length === 0 ? (
                <div className="py-8 px-4 text-center bg-white rounded-2xl border border-dashed border-zinc-300">
                    <p className="text-sm text-zinc-700 font-bold">Aún no tienes pedidos hoy</p>
                    <p className="text-xs text-zinc-600 mt-1">
                        Cuando tomes una mesa y envíes un pedido desde el menú, aparecerá aquí.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {orders.map((order) => {
                        const meta = STATUS_META[order.status] ?? STATUS_META.pending
                        const busy = busyId === order.id
                        const delivered = Boolean(order.deliveredAt)
                        return (
                            <div
                                key={order.id}
                                className={`rounded-2xl border bg-white p-4 transition-all shadow-sm ${
                                    busy ? 'opacity-70' : ''
                                } ${delivered ? 'border-emerald-300' : 'border-zinc-200'}`}
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-[11px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                                                #{order.id.slice(0, 6).toUpperCase()}
                                            </span>
                                            {order.tableNumber && (
                                                <span className="text-[10px] font-black text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                                                    Mesa {order.tableNumber}
                                                </span>
                                            )}
                                            <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                                                🕒 {formatTime(order.createdAt)}
                                            </span>
                                        </div>
                                        {order.customerName && (
                                            <p className="text-sm font-bold text-zinc-900 mt-1.5 truncate">
                                                {order.customerName}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.className}`}
                                    >
                                        {meta.label}
                                    </span>
                                </div>

                                {/* Items resumidos */}
                                <div className="mt-2.5 space-y-1">
                                    {order.items.length > 0 ? (
                                        order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-1.5 text-xs">
                                                <span className="font-mono font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
                                                    {item.quantity ?? 1}x
                                                </span>
                                                <span className="text-zinc-700 leading-snug">
                                                    {item.name || 'Producto'}
                                                    {item.notes && (
                                                        <span className="block text-[10px] text-zinc-500 italic">
                                                            {item.notes}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[11px] text-zinc-600 italic">Sin detalle de items</p>
                                    )}
                                </div>

                                {/* Total + acción / sello de entrega */}
                                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                                    <span className="text-sm font-black text-zinc-900">
                                        {formatCurrency(order.total)}
                                    </span>

                                    {delivered ? (
                                        // Sello "Entregado ✓ hora" (sobre la tarjeta, sin mover de estado)
                                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                            Entregado ✓ {formatTime(order.deliveredAt as Date)}
                                        </span>
                                    ) : order.status === 'completed' ? (
                                        // "Entregar" SOLO para pedidos listos sin entregar
                                        <button
                                            onClick={() => handleDeliver(order)}
                                            disabled={busyId !== null}
                                            className="text-[11px] font-black text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            {busy ? 'Entregando...' : 'Entregar'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

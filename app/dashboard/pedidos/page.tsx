'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { markOrderDeliveredAdmin } from '@/src/actions/orders'
import {
    ArrowLeft,
    Clock,
    Flame,
    CheckCircle2,
    Trash2,
    ChefHat,
    ShoppingBag,
    RefreshCw,
    Volume2,
    VolumeX,
    AlertCircle,
    User,
    Check,
    UtensilsCrossed,
    UserRound,
    MessageCircle
} from 'lucide-react'

// ==============================================================================
// TIPOS Y MODELOS
// ==============================================================================

export interface OrderItem {
    id?: string
    name: string
    quantity: number
    price?: number
    notes?: string
    modifiers?: string[]
}

export type OrderStatus = 'pending' | 'cooking' | 'completed' | 'cancelled'

export interface Order {
    id: string
    restaurant_id: string
    customer_name: string
    items: OrderItem[]
    total: number
    status: OrderStatus
    created_at: string
    // --- Sistema de Tres Menús (public.orders, ver prisma/sql/orders-realtime.sql) ---
    table_number?: string | null
    waiter_name?: string | null
    source?: 'whatsapp' | 'table' | 'waiter'
    // --- Estado "Entregado" (v2.1, docs/DESIGN.md §19 / T58) ---
    delivered_at?: string | null
    delivered_by?: string | null
}

// ==============================================================================
// BADGES DE ORIGEN DEL PEDIDO (WhatsApp / Mesa / Mesero)
// ==============================================================================

function OrderBadges({ order }: { order: Order }) {
    const table = order.table_number
    const waiter = order.waiter_name
    const source = order.source ?? 'whatsapp'

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {source === 'whatsapp' && (
                <span
                    className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                    title="Pedido enviado por WhatsApp"
                >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                </span>
            )}
            {table && (
                <span
                    className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200"
                    title="Pedido hecho en la mesa (QR)"
                >
                    <UtensilsCrossed className="w-3 h-3" />
                    Mesa {table}
                </span>
            )}
            {waiter && (
                <span
                    className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200"
                    title="Enviado por el mesero"
                >
                    <UserRound className="w-3 h-3" />
                    {waiter}
                </span>
            )}
        </div>
    )
}

// ==============================================================================
// HELPERS DE AUDIO
// ==============================================================================

function playSyntheticChime() {
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()
        const now = ctx.currentTime

        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(587.33, now)
        gain1.gain.setValueAtTime(0.25, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.4)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, now + 0.08)
        gain2.gain.setValueAtTime(0.35, now + 0.08)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.08)
        osc2.stop(now + 0.8)
    } catch {
        // Silencioso en caso de bloqueo por política de navegador
    }
}

function playCampanaSound() {
    try {
        const audio = new Audio('/campana.mp3')
        const playPromise = audio.play()
        if (playPromise !== undefined) {
            playPromise.catch(() => playSyntheticChime())
        }
    } catch {
        playSyntheticChime()
    }
}

// ==============================================================================
// COMPONENTE PRINCIPAL
// ==============================================================================

export default function PedidosPage() {
    const supabase = useMemo(() => createClient(), [])

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [restaurantId, setRestaurantId] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [realtimeConnected, setRealtimeConnected] = useState(false)

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(val)
    }

    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch {
            return ''
        }
    }

    const formatElapsed = (isoString: string) => {
        try {
            const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
            if (diffMin < 1) return 'Hace un momento'
            if (diffMin === 1) return 'Hace 1 min'
            if (diffMin < 60) return `Hace ${diffMin} min`
            return `Hace ${Math.floor(diffMin / 60)}h`
        } catch {
            return ''
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CARGA INICIAL Y SUSCRIPCIÓN EN TIEMPO REAL
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true

        const initialize = async () => {
            setLoading(true)
            setErrorMsg(null)

            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError || !user) {
                    throw new Error('No se pudo verificar la sesión del restaurante.')
                }

                if (!isMounted) return
                setRestaurantId(user.id)

                const startOfToday = new Date()
                startOfToday.setHours(0, 0, 0, 0)

                const { data, error: selectError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', user.id)
                    .neq('status', 'cancelled')
                    .gte('created_at', startOfToday.toISOString())
                    .order('created_at', { ascending: false })

                if (selectError) throw selectError

                if (isMounted) {
                    setOrders((data as Order[]) || [])
                    setLoading(false)
                }

                const channel = supabase
                    .channel(`orders-live-${user.id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${user.id}`,
                        },
                        (payload) => {
                            const newOrder = payload.new as Order
                            if (newOrder.status === 'cancelled') return

                            setOrders((prev) => {
                                if (prev.some((o) => o.id === newOrder.id)) {
                                    return prev.map((o) => (o.id === newOrder.id ? newOrder : o))
                                }
                                return [newOrder, ...prev]
                            })

                            if (soundEnabled) {
                                playCampanaSound()
                            }
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${user.id}`,
                        },
                        (payload) => {
                            const updatedOrder = payload.new as Order

                            setOrders((prev) => {
                                if (updatedOrder.status === 'cancelled') {
                                    return prev.filter((o) => o.id !== updatedOrder.id)
                                }
                                const exists = prev.some((o) => o.id === updatedOrder.id)
                                if (!exists) return [updatedOrder, ...prev]
                                return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                            })
                        }
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            setRealtimeConnected(true)
                        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                            setRealtimeConnected(false)
                        }
                    })

                return () => {
                    supabase.removeChannel(channel)
                }
            } catch (err: unknown) {
                const message =
                    err instanceof Error
                        ? err.message
                        : typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string'
                        ? (err as { message: string }).message
                        : 'Error al conectar con la base de datos'
                console.error('Error al inicializar pedidos:', message, err)
                if (isMounted) {
                    setErrorMsg(message)
                    setLoading(false)
                }
            }
        }

        const cleanupPromise = initialize()

        return () => {
            isMounted = false
            cleanupPromise.then((cleanup) => {
                if (typeof cleanup === 'function') cleanup()
            })
        }
    }, [supabase, soundEnabled])

    // ──────────────────────────────────────────────────────────────────────────
    // MUTACIONES DE ESTADOS
    // ──────────────────────────────────────────────────────────────────────────

    const handleApprove = useCallback(
        async (orderId: string) => {
            try {
                setUpdatingId(orderId)
                setErrorMsg(null)

                setOrders((prev) =>
                    prev.map((o) => (o.id === orderId ? { ...o, status: 'cooking' } : o))
                )

                const { error } = await supabase
                    .from('orders')
                    .update({ status: 'cooking' })
                    .eq('id', orderId)

                if (error) throw error
            } catch (err: unknown) {
                console.error('Error al aprobar pedido:', err)
                setErrorMsg('Error al aprobar pedido.')
                refreshOrders()
            } finally {
                setUpdatingId(null)
            }
        },
        [supabase]
    )

    const handleCancel = useCallback(
        async (orderId: string) => {
            const confirmed = window.confirm('¿Estás seguro de que deseas rechazar este pedido?')
            if (!confirmed) return

            try {
                setUpdatingId(orderId)
                setErrorMsg(null)

                setOrders((prev) => prev.filter((o) => o.id !== orderId))

                const { error } = await supabase
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', orderId)

                if (error) throw error
            } catch (err: unknown) {
                console.error('Error al cancelar pedido:', err)
                setErrorMsg('Error al rechazar pedido.')
                refreshOrders()
            } finally {
                setUpdatingId(null)
            }
        },
        [supabase]
    )

    const handleComplete = useCallback(
        async (orderId: string) => {
            try {
                setUpdatingId(orderId)
                setErrorMsg(null)

                setOrders((prev) =>
                    prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
                )

                const { error } = await supabase
                    .from('orders')
                    .update({ status: 'completed' })
                    .eq('id', orderId)

                if (error) throw error
            } catch (err: unknown) {
                console.error('Error al completar pedido:', err)
                setErrorMsg('Error al marcar pedido como listo.')
                refreshOrders()
            } finally {
                setUpdatingId(null)
            }
        },
        [supabase]
    )

    // ──────────────────────────────────────────────────────────────────────────
    // ENTREGA (v2.1, T58): sello "Entregado" SOLO en la columna Listos
    // (markOrderDeliveredAdmin valida auth + restaurant_id en el servidor y es
    // idempotente: re-marcar solo sobrescribe delivered_at/delivered_by).
    // No mueve la tarjeta de columna ni crea una 4.ª columna.
    // ──────────────────────────────────────────────────────────────────────────
    const handleDeliver = useCallback(async (orderId: string) => {
        try {
            setUpdatingId(orderId)
            setErrorMsg(null)

            const res = await markOrderDeliveredAdmin(orderId)
            if (!res.success) throw new Error(res.error)

            // Optimista: la tarjeta pasa al sello "Entregado ✓ hora · por admin"
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId
                        ? { ...o, delivered_at: res.deliveredAt.toISOString(), delivered_by: 'admin' }
                        : o
                )
            )
        } catch (err: unknown) {
            console.error('Error al marcar pedido como entregado:', err)
            setErrorMsg(err instanceof Error ? err.message : 'Error al marcar el pedido como entregado.')
            refreshOrders() // el realtime UPDATE del propio update también re-sincroniza
        } finally {
            setUpdatingId(null)
        }
    }, [])

    const refreshOrders = async () => {
        if (!restaurantId) return
        setLoading(true)
        setErrorMsg(null)

        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .neq('status', 'cancelled')
            .gte('created_at', startOfToday.toISOString())
            .order('created_at', { ascending: false })

        if (!error && data) {
            setOrders(data as Order[])
        } else if (error) {
            setErrorMsg('No se pudieron recargar los pedidos.')
        }
        setLoading(false)
    }

    const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders])
    const cookingOrders = useMemo(() => orders.filter((o) => o.status === 'cooking'), [orders])
    const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders])

    return (
        <div className="h-screen max-h-screen bg-zinc-50 text-zinc-900 flex flex-col overflow-hidden font-sans p-3 sm:p-5 select-none">
            
            {/* ══════════════════════════════════════════
                1. HEADER SUPERIOR (ESTILO DASHBOARD PRINCIPAL)
               ══════════════════════════════════════════ */}
            <header className="shrink-0 bg-white border border-zinc-200 rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                
                {/* Logo idéntico + Título */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200"
                        title="Volver al panel"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform duration-200">
                            K
                        </div>
                        <span className="font-extrabold text-lg tracking-tight text-[#1D1D1F] hidden sm:inline">
                            komy<span className="text-[#FF453A]">.</span>
                        </span>
                    </Link>

                    <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                                Panel de Pedidos
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                    realtimeConnected
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                        : 'text-amber-700 bg-amber-50 border-amber-200'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        realtimeConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                                    }`}
                                />
                                {realtimeConnected ? 'EN VIVO' : 'CONECTANDO...'}
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono">
                            Comandas y flujo de cocina en tiempo real
                        </p>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={() => {
                            const next = !soundEnabled
                            setSoundEnabled(next)
                            if (next) playCampanaSound()
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            soundEnabled
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-xs'
                                : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:text-zinc-700'
                        }`}
                        title="Probar o silenciar campana de pedidos"
                    >
                        {soundEnabled ? (
                            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span>{soundEnabled ? 'Campana Activa' : 'Sin Sonido'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={refreshOrders}
                        disabled={loading}
                        className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors disabled:opacity-50"
                        title="Recargar pedidos"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Banner de error */}
            {errorMsg && (
                <div className="shrink-0 mb-3 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                    <button
                        onClick={() => setErrorMsg(null)}
                        className="text-rose-500 hover:text-rose-700 font-bold px-1"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════
                2. TABLERO KANBAN CON SCROLL INDEPENDIENTE POR COLUMNA
               ══════════════════════════════════════════ */}
            <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                
                {/* ──────────────────────────────────────────────────────────
                    COLUMNA 1: POR CONFIRMAR
                   ────────────────────────────────────────────────────────── */}
                <section className="bg-white border border-zinc-200 rounded-2xl p-3 sm:p-4 flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
                    {/* Header de columna fijo */}
                    <div className="shrink-0 pb-3 mb-3 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 uppercase">
                                Por Confirmar
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            {pendingOrders.length}
                        </span>
                    </div>

                    {/* Contenedor scrolleable independiente */}
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1.5 custom-scrollbar">
                        {loading && orders.length === 0 ? (
                            <ColumnSkeleton />
                        ) : pendingOrders.length === 0 ? (
                            <EmptyColumnState
                                icon={<Clock className="w-7 h-7 text-zinc-400 stroke-[1.5]" />}
                                title="Sin pedidos pendientes"
                                subtitle="Los pedidos enviados desde el menú aparecerán aquí."
                            />
                        ) : (
                            pendingOrders.map((order) => {
                                const isUpdating = updatingId === order.id
                                const shortId = order.id.slice(0, 6).toUpperCase()

                                return (
                                    <div
                                        key={order.id}
                                        className="bg-white border border-zinc-200 hover:border-amber-300 rounded-xl p-3.5 transition-all shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden border-l-4 border-l-amber-500"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                                                <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                                    #{shortId}
                                                </span>
                                                <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-zinc-400" />
                                                    {formatTime(order.created_at)} • {formatElapsed(order.created_at)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm mt-1.5">
                                                <User className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="truncate">{order.customer_name}</span>
                                            </div>
                                            <OrderBadges order={order} />
                                        </div>

                                        {/* Lista de productos */}
                                        <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 space-y-1.5 text-xs text-zinc-700">
                                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                                order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-1.5">
                                                            <span className="font-mono font-bold text-zinc-900 bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-[11px]">
                                                                {item.quantity}x
                                                            </span>
                                                            <div className="leading-snug">
                                                                <span className="text-zinc-800 font-medium">{item.name}</span>
                                                                {item.notes && (
                                                                    <p className="text-[10px] text-zinc-500 italic mt-0.5">
                                                                        {item.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.price !== undefined && item.price > 0 && (
                                                            <span className="text-zinc-500 font-mono text-[11px] shrink-0">
                                                                {formatCurrency(item.price * item.quantity)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-zinc-400 italic text-[11px]">Sin detalle de items</p>
                                            )}
                                        </div>

                                        {/* Total y Botones */}
                                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                                            <div>
                                                <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">
                                                    Total a Pagar
                                                </span>
                                                <span className="text-base font-black text-zinc-900 font-mono">
                                                    {formatCurrency(Number(order.total) || 0)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancel(order.id)}
                                                    disabled={isUpdating}
                                                    className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 transition-colors disabled:opacity-50"
                                                    title="Rechazar pedido"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(order.id)}
                                                    disabled={isUpdating}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 active:scale-95"
                                                >
                                                    {isUpdating ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                    )}
                                                    <span>Aprobar</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>

                {/* ──────────────────────────────────────────────────────────
                    COLUMNA 2: EN COCINA
                   ────────────────────────────────────────────────────────── */}
                <section className="bg-white border border-zinc-200 rounded-2xl p-3 sm:p-4 flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
                    {/* Header de columna fijo */}
                    <div className="shrink-0 pb-3 mb-3 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 uppercase">
                                En Cocina
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                            {cookingOrders.length}
                        </span>
                    </div>

                    {/* Contenedor scrolleable independiente */}
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1.5 custom-scrollbar">
                        {loading && orders.length === 0 ? (
                            <ColumnSkeleton />
                        ) : cookingOrders.length === 0 ? (
                            <EmptyColumnState
                                icon={<ChefHat className="w-7 h-7 text-zinc-400 stroke-[1.5]" />}
                                title="Cocina despejada"
                                subtitle="Los pedidos aprobados pasarán aquí para su preparación."
                            />
                        ) : (
                            cookingOrders.map((order) => {
                                const isUpdating = updatingId === order.id
                                const shortId = order.id.slice(0, 6).toUpperCase()

                                return (
                                    <div
                                        key={order.id}
                                        className="bg-white border border-zinc-200 hover:border-orange-300 rounded-xl p-3.5 transition-all shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden border-l-4 border-l-orange-500"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                                                <span className="font-mono font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-[11px]">
                                                    #{shortId}
                                                </span>
                                                <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-zinc-400" />
                                                    {formatTime(order.created_at)} • {formatElapsed(order.created_at)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm mt-1.5">
                                                <User className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="truncate">{order.customer_name}</span>
                                            </div>
                                            <OrderBadges order={order} />
                                        </div>

                                        {/* Items con énfasis para cocina */}
                                        <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 space-y-1.5 text-xs">
                                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                                order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <span className="font-mono font-bold text-xs text-orange-950 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">
                                                            {item.quantity}x
                                                        </span>
                                                        <div className="leading-snug">
                                                            <span className="text-zinc-900 font-semibold text-xs block">
                                                                {item.name}
                                                            </span>
                                                            {item.notes && (
                                                                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                                                                    ⚠️ {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-zinc-400 italic text-[11px]">Sin detalle de items</p>
                                            )}
                                        </div>

                                        {/* Total y Botón Completar */}
                                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                                            <div>
                                                <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">
                                                    Total
                                                </span>
                                                <span className="text-base font-black text-zinc-900 font-mono">
                                                    {formatCurrency(Number(order.total) || 0)}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleComplete(order.id)}
                                                disabled={isUpdating}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 active:scale-95"
                                            >
                                                {isUpdating ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                                )}
                                                <span>Completar</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>

                {/* ──────────────────────────────────────────────────────────
                    COLUMNA 3: LISTOS
                   ────────────────────────────────────────────────────────── */}
                <section className="bg-white border border-zinc-200 rounded-2xl p-3 sm:p-4 flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
                    {/* Header de columna fijo */}
                    <div className="shrink-0 pb-3 mb-3 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 uppercase">
                                Listos para Entrega
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {completedOrders.length}
                        </span>
                    </div>

                    {/* Contenedor scrolleable independiente */}
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1.5 custom-scrollbar">
                        {loading && orders.length === 0 ? (
                            <ColumnSkeleton />
                        ) : completedOrders.length === 0 ? (
                            <EmptyColumnState
                                icon={<CheckCircle2 className="w-7 h-7 text-zinc-400 stroke-[1.5]" />}
                                title="Sin pedidos listos"
                                subtitle="Los pedidos marcados como completados aparecerán aquí."
                            />
                        ) : (
                            completedOrders.map((order) => {
                                const shortId = order.id.slice(0, 6).toUpperCase()
                                const delivered = Boolean(order.delivered_at)
                                const isUpdating = updatingId === order.id

                                return (
                                    <div
                                        key={order.id}
                                        className={`bg-white border rounded-xl p-3.5 transition-all shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden border-l-4 border-l-emerald-500 opacity-95 hover:opacity-100 ${
                                            delivered ? 'border-emerald-200 bg-emerald-50/40' : 'border-zinc-200'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                                                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                                    #{shortId}
                                                </span>
                                                <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-zinc-400" />
                                                    {formatTime(order.created_at)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-zinc-800 font-bold text-sm mt-1.5">
                                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                                <span className="truncate">{order.customer_name}</span>
                                            </div>
                                            <OrderBadges order={order} />
                                        </div>

                                        {/* Resumen */}
                                        <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 space-y-1 text-xs text-zinc-600">
                                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                                order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between">
                                                        <span>
                                                            <strong className="text-zinc-900 font-mono">{item.quantity}x</strong>{' '}
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-zinc-400 italic text-[11px]">Sin detalle de items</p>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                                            <div>
                                                <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">
                                                    Total Cobrado
                                                </span>
                                                <span className="text-base font-black text-emerald-700 font-mono">
                                                    {formatCurrency(Number(order.total) || 0)}
                                                </span>
                                            </div>

                                            {delivered ? (
                                                // Sello "Entregado ✓ hora · por X" (T58) — la tarjeta
                                                // SIGUE en la columna Listos (sin 4.ª columna)
                                                <span
                                                    className="inline-flex items-center gap-1 text-right text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg"
                                                    title="Pedido entregado"
                                                >
                                                    <Check className="w-3 h-3 shrink-0" />
                                                    Entregado ✓ {formatTime(order.delivered_at!)} · por{' '}
                                                    {order.delivered_by || 'admin'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                                    <Check className="w-3 h-3" />
                                                    Listo
                                                </span>
                                            )}
                                        </div>

                                        {/* Botón "Entregado" (T58): SOLO en pedidos listos sin entregar */}
                                        {!delivered && (
                                            <button
                                                onClick={() => handleDeliver(order.id)}
                                                disabled={isUpdating}
                                                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-xl transition-all shadow-xs disabled:opacity-50 active:scale-95"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                {isUpdating ? 'Marcando...' : 'Entregado'}
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>

            </main>

            {/* Scrollbars delgados y sutiles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e4e4e7;
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d4d4d8;
                }
            `}} />
        </div>
    )
}

// ==============================================================================
// COMPONENTES AUXILIARES
// ==============================================================================

function ColumnSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded-xl p-3.5 animate-pulse space-y-2.5">
                    <div className="flex justify-between items-center">
                        <div className="w-14 h-4 bg-zinc-100 rounded" />
                        <div className="w-16 h-3 bg-zinc-100 rounded" />
                    </div>
                    <div className="w-28 h-4 bg-zinc-100 rounded" />
                    <div className="h-12 bg-zinc-50 rounded" />
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                        <div className="w-14 h-4 bg-zinc-100 rounded" />
                        <div className="w-16 h-6 bg-zinc-100 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function EmptyColumnState({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode
    title: string
    subtitle: string
}) {
    return (
        <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/60">
            <div className="mb-2 p-2.5 rounded-full bg-white border border-zinc-200 shadow-2xs">
                {icon}
            </div>
            <h3 className="text-xs font-bold text-zinc-700 mb-0.5">{title}</h3>
            <p className="text-[11px] text-zinc-400 max-w-[190px] leading-relaxed">
                {subtitle}
            </p>
        </div>
    )
}

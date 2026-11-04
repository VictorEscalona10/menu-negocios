'use client'

import React, { Fragment, useState, useTransition } from 'react'
import {
    AlertCircle,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    History,
    Loader2,
    MessageCircle,
    ReceiptText,
    Search,
    UserRound,
    UtensilsCrossed,
    X,
} from 'lucide-react'
import {
    getStoreOrdersHistory,
    OrderHistoryItem,
    OrderHistoryStatus,
    OrderHistoryStatusFilter,
    OrdersHistoryData,
} from '@/src/actions/order-history'
import { AnalyticsDateRange } from '@/src/actions/analytics'

interface Props {
    storeId: string
    initialData: OrdersHistoryData
    range: AnalyticsDateRange
    from?: string
    to?: string
}

const STATUS_META: Record<
    OrderHistoryStatus,
    { label: string; badge: string; dot: string }
> = {
    pending: {
        label: 'Pendiente',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
    },
    cooking: {
        label: 'En cocina',
        badge: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
    },
    completed: {
        label: 'Completada',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
    },
    cancelled: {
        label: 'Cancelada',
        badge: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
    },
}

const FILTERS: Array<{ id: OrderHistoryStatusFilter; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'cooking', label: 'En cocina' },
    { id: 'completed', label: 'Completadas' },
    { id: 'cancelled', label: 'Canceladas' },
]

function SourceBadge({ order }: { order: OrderHistoryItem }) {
    if (order.source === 'table') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 whitespace-nowrap">
                <UtensilsCrossed className="w-3 h-3" />
                Mesa {order.tableNumber || 'QR'}
            </span>
        )
    }

    if (order.source === 'waiter') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                <UserRound className="w-3 h-3" />
                {order.waiterName || 'Mesero'}
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <MessageCircle className="w-3 h-3" />
            WhatsApp
        </span>
    )
}

function StatusBadge({ order }: { order: OrderHistoryItem }) {
    const meta = STATUS_META[order.status]

    return (
        <div className="flex flex-col items-start gap-1">
            <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${meta.badge}`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
            </span>
            {order.status === 'completed' && order.deliveredAt && (
                <span className="text-[10px] font-semibold text-emerald-700">Entregado</span>
            )}
        </div>
    )
}

export default function OrdersHistoryCard({
    storeId,
    initialData,
    range,
    from,
    to,
}: Props) {
    const [data, setData] = useState<OrdersHistoryData>(initialData)
    const [status, setStatus] = useState<OrderHistoryStatusFilter>('all')
    const [allTime, setAllTime] = useState<boolean>(initialData.allTime)
    const [searchInput, setSearchInput] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const runQuery = (overrides: {
        status?: OrderHistoryStatusFilter
        search?: string
        page?: number
        allTime?: boolean
    }) => {
        const nextStatus = overrides.status ?? status
        const nextSearch = overrides.search ?? appliedSearch
        const nextPage = overrides.page ?? data.page
        const nextAllTime = overrides.allTime ?? allTime

        setError(null)

        startTransition(async () => {
            const response = await getStoreOrdersHistory({
                storeId,
                range,
                from,
                to,
                allTime: nextAllTime,
                status: nextStatus,
                search: nextSearch,
                page: nextPage,
                pageSize: data.pageSize,
            })

            if (response.success && response.data) {
                setData(response.data)
                setStatus(nextStatus)
                setAllTime(response.data.allTime)
            } else {
                setError(response.error || 'No se pudo cargar el historial de órdenes.')
            }
        })
    }

    const handleSelectStatus = (nextStatus: OrderHistoryStatusFilter) => {
        if (nextStatus === status) return
        setStatus(nextStatus)
        runQuery({ status: nextStatus, page: 1 })
    }

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault()
        const value = searchInput.trim()
        setAppliedSearch(value)
        runQuery({ search: value, page: 1 })
    }

    const handleClearSearch = () => {
        setSearchInput('')
        setAppliedSearch('')
        runQuery({ search: '', page: 1 })
    }

    const handleToggleAllTime = () => {
        const next = !allTime
        setAllTime(next)
        runQuery({ allTime: next, page: 1 })
    }

    const handlePage = (nextPage: number) => {
        if (nextPage < 1 || nextPage > data.totalPages || nextPage === data.page) return
        runQuery({ page: nextPage })
    }

    const rangeStart = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1
    const rangeEnd = Math.min(data.page * data.pageSize, data.total)

    return (
        <section
            id="ordenes"
            className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm scroll-mt-24"
        >
            {/* Cabecera */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5 pb-4 border-b border-zinc-100">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm">
                            <ReceiptText className="w-4 h-4" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                            Historial de Órdenes
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                        Todas las órdenes del período seleccionado, incluidas las canceladas. La C.I.
                        identifica al cliente que hizo el pedido.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 rounded-xl">
                        <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                        {data.allTime ? 'Todo el historial' : 'Período seleccionado'}
                    </span>
                    <button
                        type="button"
                        onClick={handleToggleAllTime}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-60 ${
                            data.allTime
                                ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        {data.allTime ? 'Volver al período' : 'Ver todo el historial'}
                    </button>
                </div>
            </div>

            {/* Filtros por estado + búsqueda */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {FILTERS.map((filter) => {
                        const isActive = status === filter.id
                        const count = data.counts[filter.id] || 0

                        return (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => handleSelectStatus(filter.id)}
                                disabled={isPending}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border transition-all disabled:opacity-60 ${
                                    isActive
                                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                }`}
                            >
                                <span>{filter.label}</span>
                                <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-zinc-100 text-zinc-600'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Buscar por C.I. o nombre..."
                            className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800"
                        />
                        {(searchInput || appliedSearch) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-60"
                    >
                        Buscar
                    </button>
                </form>
            </div>

            {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Tabla */}
            {data.orders.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                        <History className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">Sin órdenes para estos filtros</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                        Prueba cambiando el rango de fechas, el estado o el texto de búsqueda.
                    </p>
                </div>
            ) : (
                <>
                    <div
                        className={`overflow-x-auto -mx-5 sm:-mx-6 transition-opacity ${
                            isPending ? 'opacity-60' : 'opacity-100'
                        }`}
                    >
                        <table className="w-full min-w-[860px] text-left text-xs">
                            <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                                <tr>
                                    <th className="px-3 sm:px-6 py-2.5 font-bold">Fecha</th>
                                    <th className="px-3 py-2.5 font-bold">Cliente / C.I.</th>
                                    <th className="px-3 py-2.5 font-bold">Origen</th>
                                    <th className="px-3 py-2.5 font-bold">Ítems</th>
                                    <th className="px-3 py-2.5 font-bold text-right">Total</th>
                                    <th className="px-3 py-2.5 font-bold">Estado</th>
                                    <th className="px-3 sm:px-6 py-2.5 font-bold text-right">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {data.orders.map((order) => {
                                    const isExpanded = expandedId === order.id

                                    return (
                                        <Fragment key={order.id}>
                                            <tr className="hover:bg-zinc-50/70 transition-colors">
                                                <td className="px-3 sm:px-6 py-3 align-top">
                                                    <span className="text-[11px] font-medium text-zinc-600 whitespace-nowrap">
                                                        {order.createdAtLabel}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <p className="font-semibold text-zinc-900 truncate max-w-[190px]">
                                                        {order.customerName}
                                                    </p>
                                                    {order.customerCedula ? (
                                                        <span className="inline-flex items-center gap-1 mt-1 font-mono text-[10px] font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                                                            C.I. {order.customerCedula}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                            Sin C.I.
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <SourceBadge order={order} />
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <p className="text-[11px] text-zinc-600 max-w-[220px]">
                                                        {order.itemsSummary}
                                                    </p>
                                                    <span className="text-[10px] font-semibold text-zinc-400">
                                                        {order.itemsCount}{' '}
                                                        {order.itemsCount === 1 ? 'producto' : 'productos'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 align-top text-right">
                                                    <span className="font-mono text-[12px] font-bold text-zinc-900 whitespace-nowrap">
                                                        ${order.total.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <StatusBadge order={order} />
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 align-top text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedId(isExpanded ? null : order.id)
                                                        }
                                                        aria-label={
                                                            isExpanded ? 'Ocultar detalle' : 'Ver detalle'
                                                        }
                                                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="bg-zinc-50/80">
                                                    <td colSpan={7} className="px-3 sm:px-6 py-4">
                                                        <div className="max-w-3xl space-y-2">
                                                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                                                                Detalle del pedido
                                                            </p>
                                                            {order.items.length === 0 ? (
                                                                <p className="text-xs text-zinc-500">
                                                                    Sin ítems registrados.
                                                                </p>
                                                            ) : (
                                                                order.items.map((line, index) =>
                                                                    line.isInfo ? (
                                                                        <p
                                                                            key={`info-${index}`}
                                                                            className="text-[11px] text-zinc-500"
                                                                        >
                                                                            {line.name}
                                                                        </p>
                                                                    ) : (
                                                                        <div
                                                                            key={`line-${index}`}
                                                                            className="flex items-start justify-between gap-4 text-xs"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="font-semibold text-zinc-900">
                                                                                    {line.quantity}×{' '}
                                                                                    {line.name}
                                                                                </p>
                                                                                {line.notes && (
                                                                                    <p className="text-[11px] text-zinc-500 mt-0.5">
                                                                                        📝 {line.notes}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <span className="font-mono text-zinc-700 whitespace-nowrap">
                                                                                $
                                                                                {(
                                                                                    line.price *
                                                                                    line.quantity
                                                                                ).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                )
                                                            )}

                                                            <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-zinc-200">
                                                                {order.tableNumber && (
                                                                    <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                                                        Mesa {order.tableNumber}
                                                                    </span>
                                                                )}
                                                                {order.waiterName && (
                                                                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                                                                        Mesero: {order.waiterName}
                                                                    </span>
                                                                )}
                                                                {order.deliveredAt && (
                                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                                        Entregado
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] font-mono text-zinc-400">
                                                                    #{order.id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-4 border-t border-zinc-100">
                        <p className="text-[11px] text-zinc-500 font-medium">
                            Mostrando {rangeStart}–{rangeEnd} de {data.total}{' '}
                            {data.total === 1 ? 'orden' : 'órdenes'}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handlePage(data.page - 1)}
                                disabled={isPending || data.page <= 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Anterior
                            </button>
                            <span className="text-[11px] font-bold text-zinc-700 px-1">
                                {data.page} / {data.totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => handlePage(data.page + 1)}
                                disabled={isPending || data.page >= data.totalPages}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {isPending && (
                <div className="flex items-center justify-center gap-2 mt-4 text-[11px] font-semibold text-zinc-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Actualizando historial...
                </div>
            )}

            {data.ordersWithoutCedula > 0 && (
                <p className="mt-4 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <strong>{data.ordersWithoutCedula}</strong>{' '}
                    {data.ordersWithoutCedula === 1 ? 'orden no tiene' : 'órdenes no tienen'} C.I.
                    registrada (pedidos de mesa/mesero o locales con la cédula desactivada). Se
                    muestran en esta lista, pero no se pueden atribuir a un cliente en el ranking.
                </p>
            )}
        </section>
    )
}

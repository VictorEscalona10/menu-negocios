'use client'

import React, { useState, useTransition } from 'react'
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    IdCard,
    Loader2,
    Repeat2,
    Search,
    Trophy,
    Users,
    X,
} from 'lucide-react'
import {
    getStoreCustomers,
    CustomerSort,
    CustomersData,
} from '@/src/actions/order-history'
import { AnalyticsDateRange } from '@/src/actions/analytics'

interface Props {
    storeId: string
    initialData: CustomersData
    range: AnalyticsDateRange
    from?: string
    to?: string
}

const SORTS: Array<{ id: CustomerSort; label: string }> = [
    { id: 'orders', label: 'Más pedidos' },
    { id: 'spent', label: 'Mayor gasto' },
    { id: 'recent', label: 'Más reciente' },
]

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center sm:text-right min-w-[68px]">
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
            <p className="text-sm font-extrabold text-zinc-900 font-mono">{value}</p>
        </div>
    )
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
                1
            </div>
        )
    }

    if (rank === 2) {
        return (
            <div className="w-8 h-8 rounded-full bg-zinc-200/80 text-zinc-800 border border-zinc-300 flex items-center justify-center text-xs font-bold shrink-0">
                2
            </div>
        )
    }

    if (rank === 3) {
        return (
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-900 border border-orange-200 flex items-center justify-center text-xs font-bold shrink-0">
                3
            </div>
        )
    }

    return (
        <div className="w-8 h-8 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200 flex items-center justify-center text-[11px] font-bold shrink-0">
            {rank}
        </div>
    )
}

export default function CustomersRankingCard({
    storeId,
    initialData,
    range,
    from,
    to,
}: Props) {
    const [data, setData] = useState<CustomersData>(initialData)
    const [sort, setSort] = useState<CustomerSort>(initialData.sort)
    const [allTime, setAllTime] = useState<boolean>(initialData.allTime)
    const [searchInput, setSearchInput] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const runQuery = (overrides: {
        sort?: CustomerSort
        search?: string
        page?: number
        allTime?: boolean
    }) => {
        const nextSort = overrides.sort ?? sort
        const nextSearch = overrides.search ?? appliedSearch
        const nextPage = overrides.page ?? data.page
        const nextAllTime = overrides.allTime ?? allTime

        setError(null)

        startTransition(async () => {
            const response = await getStoreCustomers({
                storeId,
                range,
                from,
                to,
                allTime: nextAllTime,
                sort: nextSort,
                search: nextSearch,
                page: nextPage,
                pageSize: data.pageSize,
            })

            if (response.success && response.data) {
                setData(response.data)
                setSort(response.data.sort)
                setAllTime(response.data.allTime)
            } else {
                setError(response.error || 'No se pudo cargar el directorio de clientes.')
            }
        })
    }

    const handleSort = (nextSort: CustomerSort) => {
        if (nextSort === sort) return
        setSort(nextSort)
        runQuery({ sort: nextSort, page: 1 })
    }

    const handleAllTime = (nextAllTime: boolean) => {
        if (nextAllTime === allTime) return
        setAllTime(nextAllTime)
        runQuery({ allTime: nextAllTime, page: 1 })
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

    const handlePage = (nextPage: number) => {
        if (nextPage < 1 || nextPage > data.totalPages || nextPage === data.page) return
        runQuery({ page: nextPage })
    }

    const rangeStart = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1
    const rangeEnd = Math.min(data.page * data.pageSize, data.total)

    return (
        <section
            id="clientes"
            className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm scroll-mt-24"
        >
            {/* Cabecera */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5 pb-4 border-b border-zinc-100">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-sm">
                            <Users className="w-4 h-4" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                            Clientes del Restaurante
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                        Todos los clientes que han hecho pedidos, ordenados por quién pide más.
                        La cédula se usa como identificador único.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
                    <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/70 text-xs">
                        <button
                            type="button"
                            onClick={() => handleAllTime(true)}
                            disabled={isPending}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-60 ${
                                allTime
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                        >
                            Todo el historial
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAllTime(false)}
                            disabled={isPending}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-60 ${
                                !allTime
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                        >
                            Período actual
                        </button>
                    </div>
                </div>
            </div>

            {/* Aviso: la C.I. es el identificador único */}
            <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-3 mb-4">
                <IdCard className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-[11px] sm:text-xs text-indigo-900 leading-relaxed">
                    <strong>La C.I. es el identificador único del cliente.</strong> Dos personas
                    pueden llamarse igual, pero se consideran clientes distintos si su C.I. es
                    diferente. Por eso el ranking agrupa por cédula, no por nombre.
                </p>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            Clientes únicos
                        </p>
                        <p className="text-xl font-extrabold text-zinc-900">
                            {data.summary.totalCustomers.toLocaleString('en-US')}
                        </p>
                        <p className="text-[10px] text-zinc-400">Identificados por C.I.</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600">
                        <Users className="w-4 h-4" />
                    </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                            Recurrentes
                        </p>
                        <p className="text-xl font-extrabold text-emerald-900">
                            {data.summary.repeatCustomers.toLocaleString('en-US')}
                        </p>
                        <p className="text-[10px] text-emerald-600">Con 2+ pedidos</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <Repeat2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                            Pedidos sin C.I.
                        </p>
                        <p className="text-xl font-extrabold text-amber-900">
                            {data.summary.ordersWithoutCedula.toLocaleString('en-US')}
                        </p>
                        <p className="text-[10px] text-amber-600">No atribuibles a un cliente</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Orden + búsqueda */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
                <div className="inline-flex flex-wrap p-1 bg-zinc-100 rounded-xl border border-zinc-200/70 text-xs self-start">
                    {SORTS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSort(option.id)}
                            disabled={isPending}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-60 ${
                                sort === option.id
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
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

            {/* Listado */}
            {data.customers.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                        <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">
                        {appliedSearch
                            ? 'Sin resultados para tu búsqueda'
                            : 'No hay clientes identificados con C.I.'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                        {appliedSearch
                            ? 'Prueba con otra C.I. o nombre, o limpia la búsqueda.'
                            : data.summary.ordersWithoutCedula > 0
                            ? `Hay ${data.summary.ordersWithoutCedula} ${
                                  data.summary.ordersWithoutCedula === 1 ? 'pedido' : 'pedidos'
                              } sin C.I. registrada. Activa la cédula obligatoria en Ajustes para poder identificar a tus clientes.`
                            : 'Aún no se han registrado pedidos con cédula en este período.'}
                    </p>
                </div>
            ) : (
                <>
                    <div
                        className={`divide-y divide-zinc-100 transition-opacity ${
                            isPending ? 'opacity-60' : 'opacity-100'
                        }`}
                    >
                        {data.customers.map((customer, index) => {
                            const rank = (data.page - 1) * data.pageSize + index + 1

                            return (
                                <div
                                    key={customer.cedula}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5"
                                >
                                    <RankBadge rank={rank} />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-zinc-900 truncate">
                                                {customer.name}
                                            </p>
                                            {customer.namesCount > 1 && (
                                                <span
                                                    title={`Esta C.I. se registró con ${customer.namesCount} nombres distintos. Se muestra el más reciente.`}
                                                    className="text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full"
                                                >
                                                    {customer.namesCount} nombres
                                                </span>
                                            )}
                                            {rank === 1 && (
                                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                                                <IdCard className="w-3 h-3 text-indigo-500" />
                                                C.I. {customer.cedula}
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                                Último pedido: {customer.lastOrderAtLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-6 pl-11 sm:pl-0">
                                        <Metric label="Pedidos" value={customer.ordersCount} />
                                        <Metric
                                            label="Total"
                                            value={`$${customer.totalSpent.toFixed(2)}`}
                                        />
                                        <Metric
                                            label="Ticket prom."
                                            value={`$${customer.averageTicket.toFixed(2)}`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Paginación */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-4 border-t border-zinc-100">
                        <p className="text-[11px] text-zinc-500 font-medium">
                            Mostrando {rangeStart}–{rangeEnd} de {data.total}{' '}
                            {data.total === 1 ? 'cliente' : 'clientes'}
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
                    Actualizando clientes...
                </div>
            )}

            <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed">
                Los pedidos sin C.I. (mesa, mesero o locales con la cédula desactivada) se cuentan en
                el resumen, pero no se pueden atribuir a un cliente. Los pedidos cancelados no se
                incluyen en el ranking.
            </p>
        </section>
    )
}

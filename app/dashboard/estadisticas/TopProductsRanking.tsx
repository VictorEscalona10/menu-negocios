'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, TrendingUp, Sparkles, Flame, Utensils, Lock } from 'lucide-react'
import { AnalyticsItemMetric, AnalyticsPlanGatekeeping } from '@/src/actions/analytics'

interface Props {
    topSoldByQuantity: AnalyticsItemMetric[]
    topSoldByRevenue: AnalyticsItemMetric[]
    gatekeeping: AnalyticsPlanGatekeeping
}

export default function TopProductsRanking({
    topSoldByQuantity,
    topSoldByRevenue,
    gatekeeping,
}: Props) {
    const [viewMode, setViewMode] = useState<'quantity' | 'revenue'>('quantity')
    const [filterComboOnly, setFilterComboOnly] = useState<boolean>(false)

    const rawList = viewMode === 'quantity' ? topSoldByQuantity : topSoldByRevenue
    const currentList = filterComboOnly ? rawList.filter((item) => item.isCombo) : rawList

    // Determinar el valor máximo para calcular la barra de progreso relativa
    const maxVal = currentList.length > 0
        ? viewMode === 'quantity'
            ? Math.max(...currentList.map((i) => i.quantity))
            : Math.max(...currentList.map((i) => i.revenue))
        : 1

    return (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            {/* Cabecera y Controles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                            Ranking de Platos y Combos
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                        Descubre cuáles son los platos estrella y qué tanto aportan a tu facturación.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                    {/* Filtro: Vista por Volumen vs Facturación */}
                    <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/70 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('quantity')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                                viewMode === 'quantity'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                        >
                            Más Vendidos
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('revenue')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                                viewMode === 'revenue'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                        >
                            Mayor Facturación
                        </button>
                    </div>

                    {/* Filtro rápido: Solo Combos */}
                    <button
                        type="button"
                        onClick={() => setFilterComboOnly(!filterComboOnly)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${
                            filterComboOnly
                                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-sm'
                                : 'bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-50'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Solo Combos</span>
                    </button>
                </div>
            </div>

            {/* Listado de Ranking */}
            {currentList.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">Sin ventas en este período</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                        No se registraron pedidos para los filtros seleccionados. Prueba cambiando el rango de fechas.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {currentList.map((item, index) => {
                        const rank = index + 1
                        const percentageRelative = maxVal > 0
                            ? Math.round(((viewMode === 'quantity' ? item.quantity : item.revenue) / maxVal) * 100)
                            : 0

                        // Colores de medalla para el Top 3
                        const rankBadgeColor =
                            rank === 1
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-sm'
                                : rank === 2
                                ? 'bg-zinc-200/80 text-zinc-800 border-zinc-300 font-bold'
                                : rank === 3
                                ? 'bg-orange-100 text-orange-900 border-orange-200 font-bold'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200 font-medium'

                        return (
                            <div
                                key={`${item.name}-${index}`}
                                className="group p-3.5 sm:p-4 rounded-xl border border-zinc-100 hover:border-zinc-200 bg-zinc-50/40 hover:bg-white hover:shadow-sm transition-all duration-200"
                            >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Insignia de Ranking */}
                                        <span
                                            className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs border ${rankBadgeColor}`}
                                        >
                                            #{rank}
                                        </span>

                                        {/* Miniatura de Foto */}
                                        <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200/80 overflow-hidden relative flex items-center justify-center">
                                            {item.imageUrl ? (
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    fill
                                                    sizes="40px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                            ) : (
                                                <Utensils className="w-4 h-4 text-zinc-400" />
                                            )}
                                        </div>

                                        {/* Nombre y Badges */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-zinc-900 truncate">
                                                    {item.name}
                                                </span>
                                                {item.isCombo && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                                                        <Sparkles className="w-3 h-3 text-purple-500" />
                                                        {item.comboBadge || 'Combo'}
                                                    </span>
                                                )}
                                            </div>
                                            {item.categoryName && (
                                                <span className="text-[11px] text-zinc-400 block truncate">
                                                    {item.categoryName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Métricas Numéricas */}
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-extrabold text-zinc-900">
                                            {viewMode === 'quantity' ? (
                                                <span>{item.quantity.toLocaleString('en-US')} un.</span>
                                            ) : (
                                                <span>${item.revenue.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-zinc-500 font-medium">
                                            {viewMode === 'quantity' ? (
                                                <span>${item.revenue.toFixed(2)}</span>
                                            ) : (
                                                <span>{item.quantity.toLocaleString('en-US')} pedidos</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Progreso Relativa al #1 */}
                                <div className="w-full bg-zinc-200/60 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${
                                            item.isCombo
                                                ? 'bg-purple-600'
                                                : rank === 1
                                                ? 'bg-amber-500'
                                                : 'bg-zinc-800'
                                        }`}
                                        style={{ width: `${Math.max(4, percentageRelative)}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Aviso de Gatekeeping Plan Básico */}
            {!gatekeeping.isPro && (
                <div className="mt-5 p-3.5 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-600">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            Mostrando el <strong>Top 5</strong> del Plan Básico. Pasa al Plan Pro para ver el ranking ilimitado de todos tus platos.
                        </span>
                    </div>
                    <Link
                        href="/dashboard/settings/pago"
                        className="px-3 py-1 font-bold text-zinc-900 hover:text-black bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg shadow-2xs shrink-0 transition-colors"
                    >
                        Ver Plan Pro ↗
                    </Link>
                </div>
            )}
        </div>
    )
}

import React from 'react'
import { DollarSign, ShoppingBag, Receipt, Sparkles, Flame } from 'lucide-react'
import { ComboPerformanceMetrics } from '@/src/actions/analytics'

interface Props {
    totalRevenue: number
    totalOrders: number
    averageTicket: number
    combos: ComboPerformanceMetrics
}

export default function AnalyticsSummaryCards({
    totalRevenue,
    totalOrders,
    averageTicket,
    combos,
}: Props) {
    const topCombo = combos.topCombos && combos.topCombos.length > 0 ? combos.topCombos[0] : null

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* CARD 1: Facturación Total */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Facturación Total
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                        <DollarSign className="w-4 h-4" />
                    </div>
                </div>

                <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Ventas no canceladas</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            100% activo
                        </span>
                    </div>
                </div>
            </div>

            {/* CARD 2: Total Pedidos */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Pedidos Procesados
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                </div>

                <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                        {totalOrders.toLocaleString('en-US')}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Órdenes cerradas</span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                            {totalOrders === 1 ? '1 orden' : `${totalOrders} órdenes`}
                        </span>
                    </div>
                </div>
            </div>

            {/* CARD 3: Ticket Promedio */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Ticket Promedio
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-transform">
                        <Receipt className="w-4 h-4" />
                    </div>
                </div>

                <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                        ${averageTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Gasto medio / comanda</span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                            Promedio
                        </span>
                    </div>
                </div>
            </div>

            {/* CARD 4: Rendimiento de Combos */}
            <div className="bg-white border border-purple-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group bg-gradient-to-br from-white via-white to-purple-50/40">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                            Impacto de Combos
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight">
                            {combos.comboSharePercent}%
                        </div>
                        <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                            ${combos.comboRevenue.toFixed(2)}
                        </span>
                    </div>

                    {/* Barra de progreso de penetración */}
                    <div className="w-full bg-purple-100/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, combos.comboSharePercent))}%` }}
                        />
                    </div>

                    {/* Detalle del combo más vendido */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 truncate">
                        {topCombo ? (
                            <span className="flex items-center gap-1.5 truncate">
                                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <strong className="text-zinc-800 truncate font-semibold">{topCombo.name}</strong>
                                <span className="text-zinc-400 shrink-0">({topCombo.quantity})</span>
                            </span>
                        ) : (
                            <span className="text-zinc-400 italic">Sin combos en el período</span>
                        )}
                        {topCombo?.comboBadge && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0 ml-1">
                                {topCombo.comboBadge}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

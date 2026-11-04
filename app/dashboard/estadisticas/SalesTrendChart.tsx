'use client'

import React, { useState } from 'react'
import { TrendingUp, Flame, Calendar, DollarSign, ShoppingBag } from 'lucide-react'
import { DailySalesMetric } from '@/src/actions/analytics'

interface Props {
    dailySales: DailySalesMetric[]
    totalRevenue: number
    totalOrders: number
}

export default function SalesTrendChart({
    dailySales,
    totalRevenue,
    totalOrders,
}: Props) {
    const [hoveredDay, setHoveredDay] = useState<DailySalesMetric | null>(null)

    if (!dailySales || dailySales.length === 0) {
        return null
    }

    const maxRevenue = Math.max(...dailySales.map((d) => d.revenue), 1)
    const peakDay = dailySales.find((d) => d.isPeakDay && d.revenue > 0)
    const daysWithSales = dailySales.filter((d) => d.revenue > 0).length
    const averageDaily = dailySales.length > 0 ? totalRevenue / dailySales.length : 0

    return (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                            Evolución de Ventas por Día
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Tendencia de facturación diaria y días de mayor afluencia de pedidos.
                        </p>
                    </div>
                </div>

                {/* Badge de Día Pico */}
                {peakDay && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-800 self-stretch sm:self-auto shadow-2xs">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
                        <span>Día récord: {peakDay.dayOfWeek} ({peakDay.label}) · ${peakDay.revenue.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Contenedor del Gráfico de Barras */}
            <div className="relative pt-8 pb-4">
                {/* Tooltip Dinámico */}
                {hoveredDay && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 bg-zinc-900 text-white rounded-xl px-3.5 py-2 shadow-lg border border-zinc-800 text-xs z-20 flex items-center gap-3 animate-in fade-in duration-150">
                        <div>
                            <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-zinc-400" />
                                <span>{hoveredDay.dayOfWeek}, {hoveredDay.date}</span>
                                {hoveredDay.isPeakDay && (
                                    <span className="text-[10px] bg-amber-400 text-zinc-950 font-extrabold px-1.5 py-0.2 rounded">
                                        RÉCORD
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-zinc-300">
                                <span className="font-bold text-emerald-400 text-sm">
                                    ${hoveredDay.revenue.toFixed(2)}
                                </span>
                                <span className="text-zinc-400">
                                    {hoveredDay.ordersCount} {hoveredDay.ordersCount === 1 ? 'pedido' : 'pedidos'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Área de Barras */}
                <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 h-48 sm:h-56 pt-6 px-1 overflow-x-auto">
                    {dailySales.map((day) => {
                        const heightPercent = maxRevenue > 0
                            ? Math.round((day.revenue / maxRevenue) * 100)
                            : 0
                        const isHovered = hoveredDay?.date === day.date

                        return (
                            <div
                                key={day.date}
                                onMouseEnter={() => setHoveredDay(day)}
                                onMouseLeave={() => setHoveredDay(null)}
                                className="flex-1 min-w-[28px] max-w-[56px] h-full flex flex-col items-center justify-end group cursor-pointer relative"
                            >
                                {/* Barra */}
                                <div className="w-full flex flex-col items-center justify-end h-full">
                                    {/* Monto flotante en hover */}
                                    {day.revenue > 0 && (
                                        <span
                                            className={`text-[10px] font-bold mb-1 transition-opacity ${
                                                isHovered ? 'opacity-100 text-zinc-900 font-extrabold' : 'opacity-0 group-hover:opacity-100 text-zinc-500'
                                            }`}
                                        >
                                            ${Math.round(day.revenue)}
                                        </span>
                                    )}

                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-300 ${
                                            day.isPeakDay
                                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm'
                                                : day.revenue > 0
                                                ? day.isWeekend
                                                    ? 'bg-gradient-to-t from-purple-600 to-purple-400'
                                                    : 'bg-zinc-800 group-hover:bg-zinc-700'
                                                : 'bg-zinc-100 group-hover:bg-zinc-200'
                                        } ${isHovered ? 'ring-2 ring-zinc-900 ring-offset-1' : ''}`}
                                        style={{
                                            height: day.revenue > 0 ? `${Math.max(8, heightPercent)}%` : '4px',
                                        }}
                                    />
                                </div>

                                {/* Etiqueta del día */}
                                <div className="mt-2 text-center w-full">
                                    <span
                                        className={`block text-[10px] truncate font-medium ${
                                            day.isPeakDay
                                                ? 'text-emerald-700 font-extrabold'
                                                : day.isWeekend
                                                ? 'text-purple-700 font-bold'
                                                : 'text-zinc-500'
                                        }`}
                                    >
                                        {day.label}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Leyenda y Resumen al pie */}
            <div className="mt-4 pt-3.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800" />
                        <span>Día de semana</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                        <span>Fin de semana</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Día récord</span>
                    </span>
                </div>

                <div className="flex items-center gap-3 font-semibold text-zinc-700">
                    <span>Promedio: ${averageDaily.toFixed(2)}/día</span>
                    <span>·</span>
                    <span>{daysWithSales} de {dailySales.length} días con actividad</span>
                </div>
            </div>
        </div>
    )
}

'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AnalyticsDateRange } from '@/src/actions/analytics'

interface Props {
    currentRange: AnalyticsDateRange
    isPro: boolean
    periodStart: string
    periodEnd: string
    customFrom?: string
    customTo?: string
}

export default function AnalyticsDateSelector({
    currentRange,
    isPro,
    periodStart,
    periodEnd,
    customFrom,
    customTo,
}: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [isCustomOpen, setIsCustomOpen] = useState(currentRange === 'custom')
    const [fromDate, setFromDate] = useState(customFrom || '')
    const [toDate, setToDate] = useState(customTo || '')

    const ranges: Array<{ id: AnalyticsDateRange; label: string; proOnly?: boolean }> = [
        { id: '7d', label: 'Últimos 7 días' },
        { id: '30d', label: 'Últimos 30 días' },
        { id: 'today', label: 'Hoy', proOnly: true },
        { id: 'month', label: 'Este mes', proOnly: true },
        { id: 'custom', label: 'Personalizado', proOnly: true },
    ]

    const handleSelectRange = (rangeId: AnalyticsDateRange, proOnly?: boolean) => {
        if (proOnly && !isPro) {
            setShowUpgradeModal(true)
            return
        }

        if (rangeId === 'custom') {
            setIsCustomOpen(true)
            return
        }

        setIsCustomOpen(false)
        router.push(`/dashboard/estadisticas?range=${rangeId}`)
    }

    const handleApplyCustomDates = (e: React.FormEvent) => {
        e.preventDefault()
        if (!fromDate) return
        const params = new URLSearchParams()
        params.set('range', 'custom')
        params.set('from', fromDate)
        if (toDate) params.set('to', toDate)
        router.push(`/dashboard/estadisticas?${params.toString()}`)
    }

    // Formatear texto de rango mostrado
    const formattedStartDate = new Date(periodStart).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
    })
    const formattedEndDate = new Date(periodEnd).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

    return (
        <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 sm:p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Selector de pestañas */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {ranges.map((r) => {
                        const isSelected = currentRange === r.id
                        const isLocked = r.proOnly && !isPro

                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => handleSelectRange(r.id, r.proOnly)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : isLocked
                                        ? 'bg-zinc-100/70 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50'
                                        : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200/60'
                                }`}
                            >
                                <span>{r.label}</span>
                                {isLocked && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                                        PRO
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Resumen del período seleccionado */}
                <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 self-end sm:self-center">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                        {formattedStartDate} — {formattedEndDate}
                    </span>
                </div>
            </div>

            {/* Formulario de fechas personalizadas (Plan Pro) */}
            {isCustomOpen && isPro && (
                <form
                    onSubmit={handleApplyCustomDates}
                    className="mt-3 pt-3 border-t border-zinc-200 flex flex-wrap items-end gap-3 text-xs"
                >
                    <div>
                        <label className="block text-zinc-600 font-medium mb-1">Desde:</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            required
                            className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-600 font-medium mb-1">Hasta:</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                        Filtrar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsCustomOpen(false)
                            router.push('/dashboard/estadisticas?range=7d')
                        }}
                        className="text-zinc-500 hover:text-zinc-800 px-2 py-1.5 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                </form>
            )}

            {/* Modal de Upgrade si el usuario intenta usar filtros PRO en Plan Básico */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-1">Filtro Exclusivo de Plan Pro</h3>
                        <p className="text-xs sm:text-sm text-zinc-500 mb-5 leading-relaxed">
                            Los filtros de fecha avanzados (por día, mes y rangos personalizados ilimitados) están disponibles en el <strong>Plan Pro</strong> para auditorías profundas de tu negocio.
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                            >
                                Entendido
                            </button>
                            <Link
                                href="/dashboard/settings/pago"
                                className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-sm"
                            >
                                Ver Plan Pro ↗
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

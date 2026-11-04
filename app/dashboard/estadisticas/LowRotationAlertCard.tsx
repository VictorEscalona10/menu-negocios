'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Lightbulb, Sparkles, CheckCircle2, Lock, Utensils } from 'lucide-react'
import { LowRotationProductMetric, AnalyticsPlanGatekeeping } from '@/src/actions/analytics'

interface Props {
    lowRotationProducts: LowRotationProductMetric[]
    gatekeeping: AnalyticsPlanGatekeeping
}

export default function LowRotationAlertCard({
    lowRotationProducts,
    gatekeeping,
}: Props) {
    const hasItems = lowRotationProducts.length > 0

    return (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                            Ingeniería de Menú: Alerta de Baja Rotación
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Platos con 0 ventas o mínima salida en el período para prevenir mermas de insumos.
                        </p>
                    </div>
                </div>

                {hasItems && (
                    <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full shrink-0">
                        {lowRotationProducts.length} en alerta
                    </span>
                )}
            </div>

            {/* Listado de Platos */}
            {!hasItems ? (
                <div className="text-center py-8 px-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto mb-2.5">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-emerald-950">¡Rotación Saludable!</p>
                    <p className="text-xs text-emerald-700 mt-0.5 max-w-sm mx-auto">
                        Todos los platos activos de tu catálogo registraron ventas en el período seleccionado.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lowRotationProducts.map((item, index) => {
                        const isZero = item.status === 'zero_sales'
                        const statusBadge = isZero ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                0 ventas
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                {item.quantity} {item.quantity === 1 ? 'venta' : 'ventas'}
                            </span>
                        )

                        return (
                            <div
                                key={`${item.name}-${index}`}
                                className="p-3.5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Miniatura */}
                                            <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200/80 overflow-hidden relative flex items-center justify-center">
                                                {item.imageUrl ? (
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        fill
                                                        sizes="40px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <Utensils className="w-4 h-4 text-zinc-400" />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                                                        {item.name}
                                                    </h3>
                                                    {item.isCombo && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-full shrink-0">
                                                            <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                                            {item.comboBadge || 'Combo'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                                    <span className="font-semibold text-zinc-800">
                                                        ${item.price.toFixed(2)}
                                                    </span>
                                                    {item.categoryName && (
                                                        <>
                                                            <span className="text-zinc-300">·</span>
                                                            <span className="truncate">{item.categoryName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {statusBadge}
                                    </div>
                                </div>

                                {/* Recomendación Contextual */}
                                <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-start gap-1.5 text-[11px] text-zinc-600 bg-white/70 p-2 rounded-lg">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span className="leading-tight">{item.suggestion}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Aviso de Gatekeeping Plan Básico */}
            {!gatekeeping.isPro && (
                <div className="mt-4 p-3 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-600">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            Mostrando los primeros <strong>5 platos en riesgo</strong> del Plan Básico. En Plan Pro recibes el análisis de merma sobre todo tu catálogo.
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

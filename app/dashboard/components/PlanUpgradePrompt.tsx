// app/dashboard/components/PlanUpgradePrompt.tsx
'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, Lock, ChefHat, Palette, Users, ArrowRight, CreditCard } from 'lucide-react'
import { createVexpayCheckout } from '@/src/actions/subscription'

interface Props {
    storeId: string
    featureName: string
    featureDescription: string
    featureType?: 'customization' | 'mesas' | 'pedidos'
}

export default function PlanUpgradePrompt({
    storeId,
    featureName,
    featureDescription,
    featureType = 'customization',
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [errorMessage, setErrorMessage] = useState('')

    const handleVexpayUpgrade = () => {
        setErrorMessage('')
        startTransition(async () => {
            try {
                const res = await createVexpayCheckout(storeId, 'PRO')
                if (res.success && res.checkoutUrl) {
                    window.location.href = res.checkoutUrl
                } else {
                    setErrorMessage('No se pudo generar la sesión de pago con VEXPay.')
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error al conectar con la pasarela.'
                setErrorMessage(msg)
            }
        })
    }

    const getIcon = () => {
        switch (featureType) {
            case 'customization':
                return <Palette className="w-8 h-8 text-[#FF453A]" />
            case 'mesas':
                return <Users className="w-8 h-8 text-[#FF453A]" />
            case 'pedidos':
                return <ChefHat className="w-8 h-8 text-[#FF453A]" />
            default:
                return <Sparkles className="w-8 h-8 text-[#FF453A]" />
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 font-sans space-y-6">
            {/* Botón Volver */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Resumen del Dashboard</span>
            </Link>

            {/* Tarjeta Principal de Upgrade */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-sm relative overflow-hidden space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                            {getIcon()}
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF453A]/10 text-[#FF453A] text-[11px] font-black uppercase tracking-wider mb-1">
                                <Lock className="w-3 h-3" />
                                <span>Exclusivo del Plan Pro</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                {featureName}
                            </h1>
                        </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                        <div className="text-2xl font-black text-zinc-950 font-mono">$25 <span className="text-xs font-normal text-zinc-500">USD/mes (en Bs)</span></div>
                        <span className="text-[11px] text-zinc-500">Solo $10 más que tu plan actual</span>
                    </div>
                </div>

                {errorMessage && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-4">
                    <p className="text-sm text-zinc-600 leading-relaxed">
                        {featureDescription}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/70 space-y-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Tu Plan Actual</span>
                            <h3 className="font-bold text-sm text-zinc-800">Plan Básico ($15/mes)</h3>
                            <ul className="text-xs text-zinc-500 space-y-1.5 pt-1">
                                <li>✓ Menú con pedidos por WhatsApp</li>
                                <li>✓ Plantillas en /dashboard/settings</li>
                                <li>✕ Sin comandas en vivo en cocina</li>
                                <li>✕ Sin mesas, meseros ni QR en salón</li>
                            </ul>
                        </div>

                        <div className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 space-y-2 shadow-sm">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">Mejorar A</span>
                            <h3 className="font-bold text-sm text-white flex items-center justify-between">
                                <span>Plan Pro ($25/mes)</span>
                                <span className="bg-[#FF453A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Recomendado</span>
                            </h3>
                            <ul className="text-xs text-zinc-300 space-y-1.5 pt-1">
                                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Personalización avanzada del menú</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Gestión de mesas, meseros y QR</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Pantalla de cocina con pedidos en vivo</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Menú para clientes en mesa y mesero</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-zinc-100">
                    <button
                        disabled={isPending}
                        onClick={handleVexpayUpgrade}
                        className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <CreditCard className={`w-4 h-4 ${isPending ? 'animate-pulse' : ''}`} />
                        <span>{isPending ? 'Conectando con VEXPay...' : 'Pagar con VEXPay en Bs ($25/mes)'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto text-center px-5 py-3.5 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
                    >
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

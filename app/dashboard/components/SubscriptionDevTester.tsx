// app/dashboard/components/SubscriptionDevTester.tsx
'use client'

import React, { useState, useTransition } from 'react'
import {
    testSimulateTrialExpired,
    testSimulateGracePeriod,
    testSimulateGraceExpired,
    testResetTrial,
    processSubscriptionPayment,
    changePlanAction,
} from '@/src/actions/subscription'
import { SubscriptionInfo } from '@/lib/subscription'
import { useRouter } from 'next/navigation'
import { Sparkles, ChevronUp, ChevronDown, Check, RefreshCw } from 'lucide-react'

interface Props {
    storeId: string
    subscription: SubscriptionInfo
}

export default function SubscriptionDevTester({ storeId, subscription }: Props) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [statusNote, setStatusNote] = useState('')

    const runAction = (fn: () => Promise<{ success: boolean; message?: string }>, label: string) => {
        setStatusNote(`Ejecutando: ${label}...`)
        startTransition(async () => {
            try {
                const res = await fn()
                setStatusNote(res.message || 'Completado.')
                router.refresh()
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido'
                setStatusNote(`Error: ${msg}`)
            }
        })
    }

    return (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm font-sans">
            {/* Botón flotante para abrir/cerrar */}
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-full shadow-lg border border-zinc-700/50 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Simulador de Suscripción</span>
                    <span className="text-[10px] bg-zinc-800 text-amber-300 px-1.5 py-0.5 rounded-full font-mono uppercase">
                        {subscription.plan} · {subscription.status}
                    </span>
                </button>
            ) : (
                <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 space-y-3 w-80 text-zinc-900 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-zinc-950">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Simulador de Estados</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-full text-xs"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-[11px] bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60 space-y-1 font-mono">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Plan actual:</span>
                            <span className="font-bold text-zinc-900">{subscription.planDetails.name} (${subscription.planDetails.price})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Estado:</span>
                            <span className={`font-bold ${subscription.isBlocked ? 'text-rose-600' : subscription.isGracePeriod ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {subscription.status}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Días restantes:</span>
                            <span className="font-bold text-zinc-900">{subscription.daysRemaining}</span>
                        </div>
                    </div>

                    {statusNote && (
                        <div className="text-[10px] text-zinc-600 bg-amber-50 border border-amber-200 p-1.5 rounded-lg text-center">
                            {statusNote}
                        </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                            Pruebas de Bloqueo y Gracia:
                        </span>

                        {/* 1. Vencer prueba gratis hoy */}
                        <button
                            disabled={isPending}
                            onClick={() => runAction(() => testSimulateTrialExpired(storeId), 'Vencer prueba')}
                            className="w-full text-left text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold p-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span>1. Vencer prueba 15 días (Bloquear)</span>
                            <span>🔒</span>
                        </button>

                        {/* 2. Activar período de gracia 5 días */}
                        <button
                            disabled={isPending}
                            onClick={() => runAction(() => testSimulateGracePeriod(storeId, 4), 'Activar gracia')}
                            className="w-full text-left text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold p-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span>2. Simular alerta de gracia (5 días)</span>
                            <span>⚠️</span>
                        </button>

                        {/* 3. Vencer los 5 días de gracia */}
                        <button
                            disabled={isPending}
                            onClick={() => runAction(() => testSimulateGraceExpired(storeId), 'Vencer gracia')}
                            className="w-full text-left text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold p-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span>3. Vencer 5 días de gracia (Bloquear)</span>
                            <span>⛔</span>
                        </button>

                        {/* 4. Simular pago de 30 días */}
                        <button
                            disabled={isPending}
                            onClick={() => runAction(() => processSubscriptionPayment(storeId, subscription.plan, 30), 'Pagar suscripción')}
                            className="w-full text-left text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold p-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span>4. Simular Pago (Activar 30 días)</span>
                            <span>💳</span>
                        </button>

                        {/* 5. Restaurar 15 días de prueba */}
                        <button
                            disabled={isPending}
                            onClick={() => runAction(() => testResetTrial(storeId), 'Restaurar prueba')}
                            className="w-full text-left text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium p-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span>5. Restaurar 15 días gratis</span>
                            <span>↺</span>
                        </button>
                    </div>

                    {/* Alternar Plan */}
                    <div className="pt-2 border-t border-zinc-100 flex gap-1.5">
                        <button
                            disabled={isPending || subscription.plan === 'BASIC'}
                            onClick={() => runAction(() => changePlanAction(storeId, 'BASIC'), 'Cambiar a Plan Básico')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                subscription.plan === 'BASIC'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                        >
                            Plan $15
                        </button>
                        <button
                            disabled={isPending || subscription.plan === 'PRO'}
                            onClick={() => runAction(() => changePlanAction(storeId, 'PRO'), 'Cambiar a Plan Pro')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                subscription.plan === 'PRO'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                        >
                            Plan $25
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// app/components/SubscriptionAlertBanner.tsx
'use client'

import React, { useState, useTransition } from 'react'
import { AlertTriangle, Clock, Sparkles, Check, ArrowRight, X } from 'lucide-react'
import { SubscriptionInfo } from '@/lib/subscription'
import { processSubscriptionPayment, changePlanAction, upgradeToProPlan } from '@/src/actions/subscription'
import { useRouter } from 'next/navigation'

interface Props {
    storeId: string
    subscription: SubscriptionInfo
}

export default function SubscriptionAlertBanner({ storeId, subscription }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showModal, setShowModal] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO'>(subscription.plan)

    const handleQuickRenew = (plan: 'BASIC' | 'PRO') => {
        startTransition(async () => {
            if (plan === 'PRO' && subscription.plan === 'BASIC') {
                await upgradeToProPlan(storeId)
            } else {
                await processSubscriptionPayment(storeId, plan, 30)
            }
            setShowModal(false)
            router.refresh()
        })
    }

    // 1. Caso Período de Gracia (Alerta roja/naranja urgente durante 5 días)
    if (subscription.isGracePeriod) {
        return (
            <>
                <div className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white px-4 py-3 sm:py-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
                        </div>
                        <div>
                            <div className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                                <span>¡Tu suscripción ha vencido!</span>
                                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-mono uppercase">
                                    {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'día' : 'días'} de gracia
                                </span>
                            </div>
                            <p className="text-xs text-white/90 font-medium">
                                Si no renuevas en los próximos {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'día' : 'días'}, tu menú y panel se bloquearán automáticamente.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <span>Renovar Plan ({subscription.planDetails.price}$/mes)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {showModal && (
                    <RenewalModal
                        storeId={storeId}
                        currentPlan={subscription.plan}
                        isPending={isPending}
                        onClose={() => setShowModal(false)}
                        onRenew={handleQuickRenew}
                    />
                )}
            </>
        )
    }

    // 2. Caso Prueba Activa (Informativa y elegante)
    if (subscription.isTrial) {
        return (
            <div className="w-full bg-zinc-900 text-white px-4 py-2.5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs shadow-sm">
                <div className="flex items-center gap-2.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>
                        Estás disfrutando de los <strong className="text-white">15 días de prueba gratis</strong> del{' '}
                        <strong className="text-emerald-400">{subscription.planDetails.name}</strong>.
                    </span>
                    <span className="font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                        {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'día restante' : 'días restantes'}
                    </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-[11px] font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-all"
                    >
                        Administrar Plan
                    </button>
                </div>

                {showModal && (
                    <RenewalModal
                        storeId={storeId}
                        currentPlan={subscription.plan}
                        isPending={isPending}
                        onClose={() => setShowModal(false)}
                        onRenew={handleQuickRenew}
                    />
                )}
            </div>
        )
    }

    return null
}

function RenewalModal({
    storeId,
    currentPlan,
    isPending,
    onClose,
    onRenew,
}: {
    storeId: string
    currentPlan: 'BASIC' | 'PRO'
    isPending: boolean
    onClose: () => void
    onRenew: (plan: 'BASIC' | 'PRO') => void
}) {
    const [plan, setPlan] = useState<'BASIC' | 'PRO'>(currentPlan)

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-zinc-200 relative animate-scaleUp">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                        Renovación de Suscripción
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight pt-2">
                        Elige tu plan para continuar
                    </h2>
                    <p className="text-xs text-zinc-500">
                        Selecciona el plan que mejor se adapte al funcionamiento de tu local gastronómico.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Plan Básico 15$ */}
                    <div
                        onClick={() => setPlan('BASIC')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            plan === 'BASIC'
                                ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                                : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-extrabold text-sm text-zinc-900">Plan Básico</span>
                                <span className="text-base font-black text-zinc-900 font-mono">$15</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-snug">
                                Pedidos por WhatsApp y plantillas básicas.
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                            {plan === 'BASIC' ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-zinc-300" />}
                            <span>Seleccionado</span>
                        </div>
                    </div>

                    {/* Plan Pro 25$ */}
                    <div
                        onClick={() => setPlan('PRO')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            plan === 'PRO'
                                ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                                : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-extrabold text-sm text-zinc-900">Plan Pro</span>
                                <span className="text-base font-black text-zinc-900 font-mono">$25</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-snug">
                                Mesas, meseros, pedidos en vivo y customización.
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                            {plan === 'PRO' ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-zinc-300" />}
                            <span>Seleccionado</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <button
                        disabled={isPending}
                        onClick={() => onRenew(plan)}
                        className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>{isPending ? 'Procesando...' : `Confirmar y Activar 30 Días (${plan === 'BASIC' ? '$15' : '$25'})`}</span>
                    </button>

                    <a
                        href={`https://wa.me/584243016454?text=${encodeURIComponent(
                            `Hola, quiero realizar el pago de mi suscripción (${plan === 'BASIC' ? 'Plan Básico $15' : 'Plan Pro $25'}) para mi restaurante en Komy.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center block text-xs font-semibold text-zinc-500 hover:text-zinc-900 py-2 transition-colors"
                    >
                        O pagar vía WhatsApp con soporte ↗
                    </a>
                </div>
            </div>
        </div>
    )
}

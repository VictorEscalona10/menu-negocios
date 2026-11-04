// app/dashboard/settings/SubscriptionSettingsCard.tsx
'use client'

import React, { useState, useTransition } from 'react'
import { Sparkles, Check, ArrowRight, CreditCard } from 'lucide-react'
import { SubscriptionInfo } from '@/lib/subscription'
import { createVexpayCheckout } from '@/src/actions/subscription'

interface Props {
    storeId: string
    subscription: SubscriptionInfo
}

export default function SubscriptionSettingsCard({ storeId, subscription }: Props) {
    const [isPending, startTransition] = useTransition()
    const [note, setNote] = useState('')
    const isPro = subscription.plan === 'PRO'

    // Pago real con VEXPay (Pago Móvil / Bs)
    const handleVexpayPayment = (planCode: 'BASIC' | 'PRO') => {
        setNote('')
        startTransition(async () => {
            try {
                const res = await createVexpayCheckout(storeId, planCode)
                if (res.success && res.checkoutUrl) {
                    window.location.href = res.checkoutUrl
                } else {
                    setNote('No se pudo generar la sesión de pago con VEXPay.')
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error al iniciar el pago con VEXPay'
                setNote(msg)
            }
        })
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isPro ? 'bg-zinc-950 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-zinc-950">
                                {subscription.planDetails.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                                ${subscription.planDetails.price} USD / mes (en Bs)
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {subscription.isTrial
                                ? `Prueba gratuita activa · ${subscription.daysRemaining} días restantes`
                                : subscription.isGracePeriod
                                ? `Período de gracia · ${subscription.daysRemaining} días restantes para renovar`
                                : subscription.isActivePaid
                                ? `Suscripción activa · ${subscription.daysRemaining} días de servicio restantes`
                                : 'Estado de suscripción'}
                        </p>
                    </div>
                </div>

                {isPro ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0 self-start sm:self-auto">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Plan Pro Activo</span>
                    </div>
                ) : (
                    <button
                        disabled={isPending}
                        onClick={() => handleVexpayPayment('PRO')}
                        className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
                    >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isPending ? 'Conectando...' : 'Mejorar a Plan Pro ($25/mes en Bs)'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {note && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                    {note}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Funcionalidades Incluidas
                    </span>
                    <ul className="space-y-1.5 text-zinc-700">
                        {subscription.planDetails.features.slice(0, 4).map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/70 flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            Seguridad de tus Datos
                        </span>
                        <p className="text-zinc-600 mt-1 leading-relaxed">
                            Tus categorías, platos, fotos y pedidos se conservan siempre seguros e intactos, sin importar los cambios de estado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

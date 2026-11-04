// app/dashboard/components/SubscriptionLockedScreen.tsx
'use client'

import React, { useState, useTransition } from 'react'
import { signOut } from '@/src/actions/auth'
import { Lock, ShieldCheck, Check, CreditCard, ArrowRight } from 'lucide-react'
import { SubscriptionInfo } from '@/lib/subscription'
import { createVexpayCheckout } from '@/src/actions/subscription'
import Link from 'next/link'

interface Props {
    storeId: string
    storeName: string
    subscription: SubscriptionInfo
}

export default function SubscriptionLockedScreen({ storeId, storeName, subscription }: Props) {
    const [isPending, startTransition] = useTransition()
    const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO'>(subscription.plan)
    const [errorMessage, setErrorMessage] = useState('')

    const handleReactivateWithVexpay = (plan: 'BASIC' | 'PRO') => {
        setErrorMessage('')
        startTransition(async () => {
            try {
                const res = await createVexpayCheckout(storeId, plan)
                if (res.success && res.checkoutUrl) {
                    window.location.href = res.checkoutUrl
                } else {
                    setErrorMessage('No se pudo generar la sesión de pago. Intenta nuevamente.')
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error al conectar con la pasarela VEXPay'
                setErrorMessage(msg)
            }
        })
    }

    const isTrialExpired = subscription.blockReason === 'trial_expired'
    const isGraceExpired = subscription.blockReason === 'grace_expired'

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
            
            {/* Header de la pantalla de bloqueo */}
            <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-black text-sm shadow-sm">
                        K
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-zinc-950">
                        komy<span className="text-[#FF453A]">.</span>
                    </span>
                </Link>

                <form action={signOut}>
                    <button
                        type="submit"
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-3.5 py-2 rounded-xl border border-zinc-200 transition-all cursor-pointer shadow-xs"
                    >
                        Cerrar Sesión
                    </button>
                </form>
            </header>

            {/* Contenedor Principal */}
            <main className="max-w-3xl mx-auto w-full py-8 space-y-8">
                
                {/* Cabecera del Bloqueo */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                        <Lock className="w-8 h-8 stroke-[2.2]" />
                    </div>

                    <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                        <span>Acceso al Sistema Bloqueado</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                        {isTrialExpired
                            ? 'Tu prueba gratuita de 15 días ha finalizado'
                            : isGraceExpired
                            ? 'Período de gracia finalizado'
                            : 'El acceso a tu panel y menú se encuentra pausado'}
                    </h1>

                    <p className="text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
                        Para continuar recibiendo pedidos y administrando tu menú digital en <strong>{storeName}</strong>, selecciona y reactiva tu suscripción mediante la pasarela segura.
                    </p>

                    {/* Aviso de Seguridad de Datos */}
                    <div className="inline-flex items-center gap-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-4 py-2 rounded-2xl text-xs font-medium max-w-md mx-auto text-left shadow-xs">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <span className="font-bold">Toda tu información está protegida:</span>
                            <span className="text-emerald-700/90 ml-1">Tus productos, fotos, categorías y configuración están intactos y se reactivan al instante con tu pago.</span>
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
                        {errorMessage}
                    </div>
                )}

                {/* Selector de Planes para reactivación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* PLAN BÁSICO $15 */}
                    <div
                        onClick={() => setSelectedPlan('BASIC')}
                        className={`rounded-3xl p-6 sm:p-7 border-2 transition-all cursor-pointer flex flex-col justify-between relative bg-white ${
                            selectedPlan === 'BASIC'
                                ? 'border-zinc-950 shadow-lg ring-1 ring-zinc-950/5'
                                : 'border-zinc-200 hover:border-zinc-300 shadow-sm opacity-90'
                        }`}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                                    Emprendedores
                                </span>
                                {selectedPlan === 'BASIC' && (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Seleccionado
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight font-mono">$15</span>
                                <span className="text-xs font-medium text-zinc-500">/ mes (en Bs)</span>
                            </div>

                            <h3 className="font-extrabold text-base text-zinc-950 mb-2">Plan Básico</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                Menú con pedidos directos por WhatsApp y plantillas esenciales.
                            </p>

                            <ul className="space-y-2.5 text-xs text-zinc-700">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Menú con pedidos por WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Plantillas básicas de dashboard y settings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Catálogo ilimitado de platos y fotos</span>
                                </li>
                                <li className="flex items-start gap-2 text-zinc-400">
                                    <span className="w-4 h-4 text-zinc-300 text-center shrink-0">✕</span>
                                    <span>Sin gestión de pedidos en vivo ni mesas</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6 mt-6 border-t border-zinc-100">
                            <button
                                disabled={isPending}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleReactivateWithVexpay('BASIC')
                                }}
                                className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                                    selectedPlan === 'BASIC'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                                }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>{isPending ? 'Conectando con VEXPay...' : 'Pagar con VEXPay en Bs ($15)'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* PLAN PRO $25 */}
                    <div
                        onClick={() => setSelectedPlan('PRO')}
                        className={`rounded-3xl p-6 sm:p-7 border-2 transition-all cursor-pointer flex flex-col justify-between relative bg-white ${
                            selectedPlan === 'PRO'
                                ? 'border-zinc-950 shadow-lg ring-1 ring-zinc-950/5'
                                : 'border-zinc-200 hover:border-zinc-300 shadow-sm opacity-90'
                        }`}
                    >
                        <div className="absolute -top-3 right-6 bg-[#FF453A] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                            Restaurante Completo
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-mono font-bold text-[#FF453A] uppercase tracking-wider">
                                    Salón & Cocina
                                </span>
                                {selectedPlan === 'PRO' && (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Seleccionado
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight font-mono">$25</span>
                                <span className="text-xs font-medium text-zinc-500">/ mes (en Bs)</span>
                            </div>

                            <h3 className="font-extrabold text-base text-zinc-950 mb-2">Plan Pro</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                La solución total con mesas, meseros, comandas en vivo y diseño avanzado.
                            </p>

                            <ul className="space-y-2.5 text-xs text-zinc-700">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Menú con pedidos por WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Menú clientes (solo ver) y menú para mesero</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Menú con pedidos directos desde la mesa</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Personalización avanzada (/dashboard/customization)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Crear mesas, meseros y QR (/dashboard/mesas)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Panel de mesero en vivo (/mesero/[slug])</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Gestión de pedidos en cocina (/dashboard/pedidos)</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6 mt-6 border-t border-zinc-100">
                            <button
                                disabled={isPending}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleReactivateWithVexpay('PRO')
                                }}
                                className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                                    selectedPlan === 'PRO'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                                }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>{isPending ? 'Conectando con VEXPay...' : 'Pagar con VEXPay en Bs ($25)'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                </div>

            </main>

            <footer className="text-center text-xs text-zinc-400 py-4">
                © {new Date().getFullYear()} Komy · Plataforma de Menús Digitales
            </footer>

        </div>
    )
}

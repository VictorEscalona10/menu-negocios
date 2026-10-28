// app/components/LandingPricingSection.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { Check, Sparkles, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react'

export default function LandingPricingSection() {
    return (
        <section id="planes" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 z-10 relative">
            
            {/* Encabezado */}
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF453A]/10 text-[#FF453A] text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Planes y Suscripciones
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#1D1D1F]">
                    Elige el plan ideal para tu negocio.
                </h2>
                <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                    Comienza hoy mismo con una <strong>versión gratuita de 15 días</strong> del plan que elijas. Sin comisiones por venta y sin necesidad de tarjeta de crédito.
                </p>
            </div>

            {/* Cuadrícula de Planes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
                
                {/* ══════════════════════════════════════════
                    1. PLAN BÁSICO ($15 / MES)
                   ══════════════════════════════════════════ */}
                <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-black/[0.08] shadow-apple-subtle hover:shadow-apple-floating transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div>
                        {/* Cabecera del Plan */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#6E6E73] bg-[#F5F5F7] px-3 py-1 rounded-full">
                                Para Iniciar
                            </span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                15 días de prueba gratis
                            </span>
                        </div>

                        <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Plan Básico</h3>
                        <p className="text-xs sm:text-sm text-[#6E6E73] mt-2 mb-6 leading-relaxed">
                            Diseñado para dark kitchens, puestos y restaurantes que gestionan sus despachos por WhatsApp.
                        </p>

                        {/* Precio */}
                        <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-black/[0.06]">
                            <span className="text-5xl font-black text-[#1D1D1F] tracking-tight font-mono">$15</span>
                            <span className="text-sm font-semibold text-[#86868B]">USD / mes</span>
                        </div>

                        {/* Características */}
                        <div className="space-y-4 text-xs sm:text-sm">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#86868B] block">
                                Todo lo que incluye:
                            </span>

                            <ul className="space-y-3.5 text-[#1D1D1F]">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium">Menú digital con pedidos directos por WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium">Plantillas básicas de diseño en el dashboard/settings</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium">Catálogo ilimitado de platos, bebidas y categorías</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium">Código QR en alta definición para tu mostrador</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium">Configuración de zonas de delivery y tarifas de envío</span>
                                </li>
                                <li className="flex items-start gap-3 text-[#86868B]">
                                    <div className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs">✕</span>
                                    </div>
                                    <span>Sin gestión de pedidos en vivo en pantalla</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-black/[0.06]">
                        <Link
                            href="/register?plan=BASIC"
                            className="apple-pill-btn w-full bg-[#1D1D1F] hover:bg-[#2C2C2E] text-white py-4 rounded-full font-bold text-sm shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-transform"
                        >
                            <span>Elegir Plan Básico (15 días gratis)</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <p className="text-[11px] text-center text-[#86868B] mt-2.5">
                            Comienza hoy. Si se vence el plazo, tus datos se conservan.
                        </p>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    2. PLAN PRO ($25 / MES) - DESTACADO
                   ══════════════════════════════════════════ */}
                <div className="bg-[#111113] text-white rounded-[32px] p-8 sm:p-10 border border-white/10 shadow-apple-card hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF453A]/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        {/* Cabecera del Plan */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF453A] bg-[#FF453A]/15 px-3 py-1 rounded-full border border-[#FF453A]/30">
                                Restaurante Completo
                            </span>
                            <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/20 px-3 py-1 rounded-full">
                                15 días de prueba gratis
                            </span>
                        </div>

                        <h3 className="text-2xl font-black text-white tracking-tight">Plan Pro</h3>
                        <p className="text-xs sm:text-sm text-white/70 mt-2 mb-6 leading-relaxed">
                            Control total de salón, mesas, meseros, comandas en tiempo real y personalización avanzada.
                        </p>

                        {/* Precio */}
                        <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-white/10">
                            <span className="text-5xl font-black text-white tracking-tight font-mono">$25</span>
                            <span className="text-sm font-semibold text-white/60">USD / mes</span>
                        </div>

                        {/* Características */}
                        <div className="space-y-4 text-xs sm:text-sm">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#34C759] block">
                                Incluye todo lo del Plan Básico, más:
                            </span>

                            <ul className="space-y-3.5 text-white/90">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-semibold text-white">Menú donde el cliente puede hacer pedido desde su mesa</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-semibold text-white">Menú para clientes (solo lectura) y menú para meseros</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-semibold text-white">Crear mesas, meseros y gestionar mesas en /dashboard/mesas</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-semibold text-white">Panel de mesero en tiempo real en /mesero/[slug]</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-semibold text-white">Gestión de pedidos y comandas en cocina en /dashboard/pedidos</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-semibold text-white">Personalización avanzada sección por sección (/dashboard/customization)</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                        <Link
                            href="/register?plan=PRO"
                            className="apple-pill-btn w-full bg-[#FF453A] hover:bg-[#E0382E] text-white py-4 rounded-full font-bold text-sm shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-transform"
                        >
                            <span>Elegir Plan Pro (15 días gratis)</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <p className="text-[11px] text-center text-white/50 mt-2.5">
                            Prueba completa por 15 días. Sin tarjeta de crédito requerida.
                        </p>
                    </div>
                </div>

            </div>

            {/* Garantía de Conservación de Datos */}
            <div className="mt-12 max-w-3xl mx-auto bg-[#FBFBFD] border border-black/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left text-xs text-[#6E6E73] shadow-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <p>
                    <strong>Garantía de tus datos:</strong> Al terminar tu prueba gratuita o el período de gracia de tu suscripción, <strong>nada se elimina</strong>. Tu catálogo y fotos quedan guardados de forma segura hasta que decidas reactivar tu plan.
                </p>
            </div>

        </section>
    )
}

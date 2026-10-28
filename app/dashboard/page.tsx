// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { signOut } from '@/src/actions/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CopyMenuLinkButton, ShareWhatsappButton } from './components/DashboardActions'
import DashboardQRCard from './components/DashboardQRCard'
import { Lineicons } from '@lineiconshq/react-lineicons'
import {
    Link2AngularRightOutlined,
    Burger1Outlined,
    Gear1Outlined,
    ColourPalette3Outlined,
    UserMultiple4Outlined,
} from '@lineiconshq/free-icons'
import { ChefHat } from 'lucide-react'
import { getSubscriptionInfo } from '@/lib/subscription'
import SubscriptionLockedScreen from './components/SubscriptionLockedScreen'
import SubscriptionAlertBanner from '@/app/components/SubscriptionAlertBanner'
import SubscriptionDevTester from './components/SubscriptionDevTester'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const store = await prisma.store.findUnique({
        where: { userId: user.id },
        include: {
            plan: true,
            categories: {
                include: {
                    products: true
                }
            }
        }
    })

    // Si NO tiene local, lo redirigimos al asistente paso a paso
    if (!store) {
        return redirect('/onboarding')
    }

    // Comprobar suscripción y estado de bloqueo
    const subscription = getSubscriptionInfo(store)

    if (subscription.isBlocked) {
        return (
            <SubscriptionLockedScreen
                storeId={store.id}
                storeName={store.name}
                subscription={subscription}
            />
        )
    }

    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const menuUrl = `${proto}://${host}/menu/${store.slug}`

    const totalCategories = store.categories.length
    const totalProducts = store.categories.reduce((acc, cat) => acc + cat.products.length, 0)

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 p-3 sm:p-4.5 lg:py-5 lg:px-6">
            <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">

                {/* Banner de Suscripción (Alerta urgente en gracia o indicador de prueba activa) */}
                <SubscriptionAlertBanner storeId={store.id} subscription={subscription} />
                
                {/* ══════════════════════════════════════════
                    1. CABECERA (HEADER) CON LOGO DE LANDING
                   ══════════════════════════════════════════ */}
                <header className="bg-white border border-zinc-200 rounded-2xl p-3.5 sm:p-4.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 shadow-sm">
                    {/* Logo idéntico a la Landing + Nombre de Tienda */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <Link href="/" className="flex items-center gap-2 group shrink-0">
                            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                                K
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-[#1D1D1F]">
                                komy<span className="text-[#FF453A]">.</span>
                            </span>
                        </Link>

                        <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                <h1 className="text-base sm:text-xl font-bold text-zinc-900 tracking-tight truncate">
                                    {store.name}
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                    ONLINE
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                                WhatsApp: +{store.whatsapp}
                            </p>
                        </div>
                    </div>

                    {/* Botones de Cabecera */}
                    <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                        <Link
                            href="/dashboard/pedidos"
                            className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <span className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse shrink-0" />
                            <span>Pedidos en Vivo</span>
                        </Link>

                        <Link
                            href={`/menu/${store.slug}`}
                            target="_blank"
                            className="flex-1 sm:flex-initial bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <span>Ver Menú</span>
                            <span className="text-xs">↗</span>
                        </Link>

                        <form action={signOut} className="w-full sm:w-auto">
                            <button
                                type="submit"
                                className="w-full sm:w-auto text-xs font-medium text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-zinc-200 transition-all text-center cursor-pointer"
                            >
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </header>

                {/* ══════════════════════════════════════════
                    2. BANNER DE ENLACE RÁPIDO (LINKTREE STYLE)
                   ══════════════════════════════════════════ */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-3 sm:p-3.5 lg:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                            <Lineicons icon={Link2AngularRightOutlined} size={18} className="text-zinc-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
                                Tu Enlace de Menú Público
                            </span>
                            <a
                                href={menuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs sm:text-sm text-zinc-900 hover:text-zinc-600 font-medium flex items-center gap-1.5 transition-colors group"
                            >
                                <span className="truncate">komy.app/menu/{store.slug}</span>
                                <span className="text-zinc-400 text-xs shrink-0 group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto">
                        <CopyMenuLinkButton menuUrl={menuUrl} />
                        <ShareWhatsappButton menuUrl={menuUrl} storeName={store.name} />
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    3. CUADRÍCULA PRINCIPAL (BENTO GRID BLANCO & BORDES NEGROS/RECTOS)
                   ══════════════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                    
                    {/* TARJETA 1: CARTA & PRODUCTOS */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-4.5 lg:p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                    <Lineicons icon={Burger1Outlined} size={20} className="text-zinc-700" />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                    {totalProducts} Platos
                                </span>
                            </div>

                            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">Menú & Productos</h2>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-3 sm:mb-3.5">
                                Administra tus categorías ({totalCategories}), platos estrella, fotos, precios y opciones extra.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/products"
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between shadow-sm"
                        >
                            <span>Gestionar Menú</span>
                            <span>→</span>
                        </Link>
                    </div>

                    {/* TARJETA 2: PEDIDOS EN VIVO */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-4.5 lg:p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                                    <ChefHat className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-600" />
                                </div>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    EN VIVO
                                </span>
                            </div>

                            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">Pedidos en Vivo</h2>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-3 sm:mb-3.5">
                                Monitorea comandas en tiempo real, gestiona cocina y despacha pedidos al instante.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/pedidos"
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between shadow-sm"
                        >
                            <span>Abrir Comandas</span>
                            <span>→</span>
                        </Link>
                    </div>

                    {/* TARJETA 3: MESAS Y MESEROS (Sistema de Tres Menús) */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-4.5 lg:p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                    <Lineicons icon={UserMultiple4Outlined} size={20} className="text-zinc-700" />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200 uppercase">
                                    QR por mesa
                                </span>
                            </div>

                            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">Mesas y Meseros</h2>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-3 sm:mb-3.5">
                                Crea mesas con su QR, meseros con clave de acceso y reparte las mesas del salón.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/mesas"
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between shadow-sm"
                        >
                            <span>Gestionar Mesas</span>
                            <span>→</span>
                        </Link>
                    </div>

                    {/* TARJETA 4: CONFIGURACIÓN & AJUSTES */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-4.5 lg:p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                    <Lineicons icon={Gear1Outlined} size={20} className="text-zinc-700" />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200 uppercase">
                                    {store.menuLayout || 'LINKTREE'}
                                </span>
                            </div>

                            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">Configuración</h2>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-3 sm:mb-3.5">
                                Modifica el estilo visual de tu menú, redes sociales, horarios y opciones de entrega.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/settings"
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between shadow-sm"
                        >
                            <span>Ajustar Local</span>
                            <span>→</span>
                        </Link>
                    </div>

                    {/* TARJETA 5: PERSONALIZACIÓN AVANZADA */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-4.5 lg:p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                    <Lineicons icon={ColourPalette3Outlined} size={20} className="text-zinc-700" />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200 uppercase">
                                    {store.customizationMode === 'AVANCED' ? 'ACTIVO' : 'AVANZADO'}
                                </span>
                            </div>

                            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">Personalización Avanzada</h2>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-3 sm:mb-3.5">
                                Configura el diseño completo de tu menú con layouts personalizados.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/customization"
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between shadow-sm"
                        >
                            <span>{store.customizationMode === 'AVANCED' ? 'Editar Diseño' : 'Personalizar'}</span>
                            <span>→</span>
                        </Link>
                    </div>

                    {/* TARJETA 6: CÓDIGO QR — PEDIDOS POR WHATSAPP */}
                    <DashboardQRCard menuUrl={menuUrl} storeName={store.name} />

                </div>

                {/* Simulador para pruebas rápidas de suscripción (desarrollo/QA) */}
                <SubscriptionDevTester storeId={store.id} subscription={subscription} />

            </div>
        </div>
    )
}
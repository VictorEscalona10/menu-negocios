// app/dashboard/estadisticas/page.tsx
export const dynamic = 'force-dynamic'

import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSubscriptionInfo } from '@/lib/subscription'
import { getStoreAnalytics } from '@/src/actions/analytics'
import {
    normalizeAnalyticsRange,
    parseAnalyticsDateRange,
} from '@/lib/analytics-range'
import { getStoreCustomers, getStoreOrdersHistory } from '@/src/actions/order-history'
import AnalyticsDateSelector from './AnalyticsDateSelector'
import AnalyticsSummaryCards from './AnalyticsSummaryCards'
import TopProductsRanking from './TopProductsRanking'
import LowRotationAlertCard from './LowRotationAlertCard'
import SalesTrendChart from './SalesTrendChart'
import OrdersHistoryCard from './OrdersHistoryCard'
import CustomersRankingCard from './CustomersRankingCard'

interface Props {
    searchParams?: Promise<{
        range?: string
        from?: string
        to?: string
    }>
}

export default async function EstadisticasPage({ searchParams }: Props) {
    // 1. Validar autenticación de Supabase
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 2. Obtener la tienda del usuario
    const store = await prisma.store.findUnique({
        where: { userId: user.id },
        select: {
            id: true,
            name: true,
            slug: true,
            planId: true,
            plan: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            gracePeriodEndsAt: true,
            isActive: true,
        },
    })

    if (!store) {
        return redirect('/dashboard')
    }

    // 3. Evaluar estado de suscripción y bloqueo
    const subscription = getSubscriptionInfo(store)
    if (subscription.isBlocked) {
        return redirect('/dashboard')
    }

    // 4. Resolver parámetros de búsqueda (Next.js 16 App Router)
    const resolvedParams = searchParams ? await searchParams : {}
    const requestedRange = parseAnalyticsDateRange(resolvedParams.range)
    const customFrom = resolvedParams.from
    const customTo = resolvedParams.to
    const isPro = subscription.canAccessPro
    // Rango efectivo tras el gatekeeping del plan, para las consultas iniciales.
    const initialRange = normalizeAnalyticsRange(requestedRange, isPro)

    // 5. Consultar agregación analítica, historial de órdenes y clientes en paralelo
    const [analyticsResponse, ordersResponse, customersResponse] = await Promise.all([
        getStoreAnalytics(store.id, requestedRange, customFrom, customTo),
        getStoreOrdersHistory({
            storeId: store.id,
            range: initialRange,
            from: customFrom,
            to: customTo,
        }),
        getStoreCustomers({
            storeId: store.id,
            range: initialRange,
            from: customFrom,
            to: customTo,
            allTime: true,
        }),
    ])

    if (!analyticsResponse.success || !analyticsResponse.data) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-zinc-50/50">
                <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-zinc-200 text-center shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-900 mb-2">No se pudieron cargar las estadísticas</h2>
                    <p className="text-xs text-zinc-500 mb-4">{analyticsResponse.error || 'Ocurrió un error inesperado al procesar los datos.'}</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors"
                    >
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const data = analyticsResponse.data
    const { gatekeeping, combos } = data

    return (
        <div className="min-h-[80vh] flex flex-col items-center p-3.5 sm:p-6 lg:p-10 bg-zinc-50/50">
            <div className="w-full max-w-5xl bg-white p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm border border-zinc-200 relative">
                {/* Botón Volver al Resumen */}
                <Link
                    href="/dashboard"
                    className="inline-flex md:absolute md:top-8 md:left-8 items-center gap-2 text-zinc-500 hover:text-black transition-colors font-medium hover:-translate-x-1 duration-300 mb-4 md:mb-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Volver al Resumen</span>
                </Link>

                {/* Cabecera Principal */}
                <div className="text-center mb-6 pt-2 md:pt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200/80 text-[11px] font-bold text-zinc-600 mb-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{data.storeName}</span>
                        <span className="text-zinc-300">·</span>
                        <span className={gatekeeping.isPro ? 'text-purple-700 font-extrabold' : 'text-zinc-600 font-semibold'}>
                            {gatekeeping.isPro ? 'Plan Pro' : 'Plan Básico'}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-2 tracking-tight">
                        Estadísticas y Analítica de Ventas
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-2xl mx-auto">
                        Métricas de facturación, platos más pedidos, rendimiento de combos, alertas de
                        baja rotación, historial de órdenes y clientes identificados por C.I.
                    </p>
                </div>

                {/* Resumen rápido de Insignias */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full">
                        {data.totalOrders} {data.totalOrders === 1 ? 'pedido procesado' : 'pedidos procesados'}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                        ${data.totalRevenue.toFixed(2)} facturados
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                        ${data.averageTicket.toFixed(2)} ticket promedio
                    </span>
                    <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
                        {combos.totalCombosInCatalog} {combos.totalCombosInCatalog === 1 ? 'combo activo' : 'combos activos'}
                    </span>
                </div>

                {/* Selector de Período Temporal */}
                <AnalyticsDateSelector
                    currentRange={data.range}
                    isPro={gatekeeping.isPro}
                    periodStart={data.periodStart}
                    periodEnd={data.periodEnd}
                    customFrom={customFrom}
                    customTo={customTo}
                />

                {/* Navegación interna de la página */}
                <nav className="flex flex-wrap items-center justify-center gap-1.5 mb-6 text-xs">
                    <a
                        href="#analytics-content"
                        className="px-3 py-1.5 font-semibold text-zinc-600 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    >
                        Resumen
                    </a>
                    <a
                        href="#ordenes"
                        className="px-3 py-1.5 font-semibold text-zinc-600 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    >
                        Órdenes
                    </a>
                    <a
                        href="#clientes"
                        className="px-3 py-1.5 font-semibold text-zinc-600 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    >
                        Clientes
                    </a>
                </nav>

                {/* T82. Tarjetas de Resumen KPI */}
                <AnalyticsSummaryCards
                    totalRevenue={data.totalRevenue}
                    totalOrders={data.totalOrders}
                    averageTicket={data.averageTicket}
                    combos={combos}
                />

                {/* Espacio modular reservado para T83, T84, T85 */}
                <div id="analytics-content" className="space-y-6 scroll-mt-24">
                    {/* T84. Gráfico Visual de Evolución de Ventas */}
                    <SalesTrendChart
                        dailySales={data.dailySales}
                        totalRevenue={data.totalRevenue}
                        totalOrders={data.totalOrders}
                    />

                    {/* T83. Ranking de Platos Más Vendidos y Mayor Facturación */}
                    <TopProductsRanking
                        topSoldByQuantity={data.topSoldByQuantity}
                        topSoldByRevenue={data.topSoldByRevenue}
                        gatekeeping={gatekeeping}
                    />

                    {/* T83. Alerta de Baja Rotación (Ingeniería de Menú) */}
                    <LowRotationAlertCard
                        lowRotationProducts={data.lowRotationProducts}
                        gatekeeping={gatekeeping}
                    />

                    {/* Nota visual informativa del estado del módulo */}
                    {data.totalOrders === 0 && (
                        <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200 text-center text-xs text-zinc-500">
                            <p>No se encontraron pedidos finalizados en el período seleccionado ({data.range}). Las métricas se actualizarán automáticamente conforme se procesen nuevas órdenes.</p>
                        </div>
                    )}

                    {/* T87-T89. Historial completo de órdenes del restaurante */}
                    {ordersResponse.success && ordersResponse.data ? (
                        <OrdersHistoryCard
                            key={`orders-${data.range}-${customFrom ?? ''}-${customTo ?? ''}`}
                            storeId={store.id}
                            initialData={ordersResponse.data}
                            range={data.range}
                            from={customFrom}
                            to={customTo}
                        />
                    ) : (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-xs text-red-700">
                            <p className="font-bold mb-1">No se pudo cargar el historial de órdenes</p>
                            <p>{ordersResponse.error || 'Ocurrió un error inesperado al consultar las órdenes.'}</p>
                        </div>
                    )}

                    {/* T87-T89. Directorio de clientes agrupado por C.I. */}
                    {customersResponse.success && customersResponse.data ? (
                        <CustomersRankingCard
                            key={`customers-${data.range}-${customFrom ?? ''}-${customTo ?? ''}`}
                            storeId={store.id}
                            initialData={customersResponse.data}
                            range={data.range}
                            from={customFrom}
                            to={customTo}
                        />
                    ) : (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-xs text-red-700">
                            <p className="font-bold mb-1">No se pudo cargar el directorio de clientes</p>
                            <p>{customersResponse.error || 'Ocurrió un error inesperado al consultar los clientes.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

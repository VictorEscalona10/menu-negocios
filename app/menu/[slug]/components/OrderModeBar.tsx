// app/menu/[slug]/components/OrderModeBar.tsx
// Barra de contexto del Sistema de Tres Menús (docs/DESIGN.md §13.3)
// - Modo 'table' (cliente que escanea el QR): SOLO "Mesa N · Pedido directo al panel".
// - Modo 'view' (QR "solo ver carta", ?ver=1): "Mesa N · Carta de solo lectura ·
//   Pide a tu mesero" — sin botones ni UI de mesero (los pedidos los hace el mesero).
//   Cero UI de mesero (v2.1/T51): sin nombre de mesero, sin botones, sin picker y
//   sin login de clave (el login vive únicamente en /mesero/[slug]).
// - Modo 'waiter': "Mesa N · Mesero" + cambiar mesa / salir.
// - Sesión de mesero SIN ?mesa=: CTA "Elige una mesa" (nunca pide por WhatsApp).
// - Sesión de mesero (waiter o CTA sin mesa): botón "← Panel" a /mesero/[slug]
//   (T56). Cliente en modo 'table' (sin sesión) NO lo ve: cero UI de mesero.
// Además limpia el carrito al cambiar de modo o de mesa (no mezclar pedidos).
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/src/store/cartStore'
import { signOutWaiter } from '@/src/actions/waiters'
import type { OrderContext } from '@/src/types/order'
import TablePickerSheet from './TablePickerSheet'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { User4Outlined, KnifeFork1Outlined } from '@lineiconshq/free-icons'

interface OrderModeBarProps {
    slug: string
    storeId: string
    themeColor?: string
    /** Contexto resuelto en el servidor (page.tsx). */
    context?: OrderContext | null
}

export default function OrderModeBar({ slug, storeId, themeColor = '#FF5630', context }: OrderModeBarProps) {
    const router = useRouter()
    const [pickerOpen, setPickerOpen] = useState(false)

    // Carrito: se vacía al cambiar de modo/mesa para no mezclar pedidos (T44)
    const tableKey = context?.table ? `${context.mode}:${context.table.id}` : context?.mode ?? 'none'
    useEffect(() => {
        if (useCartStore.getState().items.length > 0) useCartStore.getState().clearCart()
    }, [tableKey])

    if (!context) return null

    const { mode, table, waiter } = context
    const needsTable = mode === 'whatsapp' && !!waiter && !table // sesión sin mesa → CTA
    const isWaiter = mode === 'waiter' && !!waiter // mesero identificado en su mesa
    const isTableClient = mode === 'table' && !!table // cliente que escaneó el QR de pedido
    const isViewClient = mode === 'view' && !!table // cliente con el QR "solo ver carta" (sin pedidos)
    const showBar = isTableClient || isWaiter || isViewClient || needsTable
    if (!showBar) return null

    const handleSignOut = async () => {
        await signOutWaiter()
        router.refresh()
    }

    const handleTableSelected = (t: { id: string; number: string; qrToken: string }) => {
        setPickerOpen(false)
        router.replace(`/menu/${slug}?mesa=${t.qrToken}`)
    }

    return (
        <>
            <div
                className="relative shrink-0 z-[80] flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10"
                style={{ backgroundColor: '#131313f2', backdropFilter: 'blur(8px)' }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <span
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${themeColor}33` }}
                        aria-hidden
                    >
                        {/* Modo table = cliente en mesa (icono de mesa/comida); sesión de mesero = icono de usuario */}
                        <Lineicons
                            icon={isWaiter || needsTable ? User4Outlined : KnifeFork1Outlined}
                            size={14}
                            style={{ color: themeColor }}
                        />
                    </span>
                    <div className="min-w-0 leading-tight">
                        {needsTable ? (
                            <>
                                <p className="text-[11px] font-black text-white truncate">Hola, {waiter!.name}</p>
                                <p className="text-[10px] text-amber-300 font-bold">Elige una mesa para empezar</p>
                            </>
                        ) : (
                            <>
                                <p className="text-[11px] font-black text-white truncate">
                                    Mesa {table!.number}
                                    {isWaiter && waiter ? ` · ${waiter.name}` : ''}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-bold">
                                    {isWaiter
                                        ? 'Modo mesero · pedido directo al panel'
                                        : isViewClient
                                            ? 'Carta de solo lectura · Pide a tu mesero'
                                            : 'Pedido directo al panel'}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* "← Panel" solo con sesión de mesero (T56): modo waiter o CTA
                        sin mesa. El cliente en modo 'table' nunca llega aquí. */}
                    {(isWaiter || needsTable) && (
                        <Link
                            href={`/mesero/${slug}`}
                            className="text-zinc-400 hover:text-white text-[11px] font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                        >
                            ← Panel
                        </Link>
                    )}

                    {needsTable && (
                        <button
                            onClick={() => setPickerOpen(true)}
                            className="text-white text-[11px] font-black px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                            style={{ backgroundColor: themeColor }}
                        >
                            Elegir mesa
                        </button>
                    )}

                    {isWaiter && (
                        <>
                            <button
                                onClick={() => setPickerOpen(true)}
                                className="text-[11px] font-black px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform"
                                style={{ backgroundColor: `${themeColor}cc` }}
                            >
                                Cambiar mesa
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="text-zinc-400 hover:text-white text-[11px] font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                            >
                                Salir
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Picker de mesas: SOLO para mesero identificado (nunca en modo table) */}
            {isWaiter && waiter && (
                <TablePickerSheet
                    storeId={storeId}
                    waiterId={waiter.id}
                    currentTableId={table?.id ?? null}
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onTableSelected={handleTableSelected}
                    themeColor={themeColor}
                />
            )}
        </>
    )
}

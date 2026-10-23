// app/components/ProductViewModal.tsx
// Modal de SOLO VISUALIZACIÓN de un producto — modo 'view' (QR "solo ver carta",
// docs/DESIGN.md §15 / §9): el cliente en mesa con carta de solo lectura toca un
// producto y aquí ve su detalle. NO agrega al carrito ni tiene modificadores
// seleccionables: las opciones se listan como informativo ("pídelas a tu mesero").
// Mismo lenguaje visual que ProductConfiguratorModal (sheet oscuro del menú).
'use client'

import Image from 'next/image'
import BsPrice from './BsPrice'

interface ModifierOption {
    id: string
    name: string
    price: number
}

interface ModifierGroup {
    id: string
    name: string
    isRequired: boolean
    maxSelect: number | null
    options: ModifierOption[]
}

interface ProductViewModalProduct {
    id: string
    name: string
    price: number
    description: string | null
    imageUrl: string | null
    modifierGroups?: ModifierGroup[]
}

interface ProductViewModalProps {
    product: ProductViewModalProduct
    themeColor: string
    /** Precio en Bs (opcional, como en las cards del menú). */
    showBsPrice?: boolean
    onClose: () => void
}

const formatUsd = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)

export default function ProductViewModal({
    product,
    themeColor,
    showBsPrice = false,
    onClose,
}: ProductViewModalProps) {
    const groups = product.modifierGroups ?? []

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-xl sm:p-4 transition-opacity duration-300">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div
                className="bg-[#0a0a0a] w-full sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col max-h-[95vh] shadow-2xl relative border-t sm:border border-white/10"
                style={{
                    animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 -20px 50px rgba(0,0,0,0.5)',
                }}
            >
                {/* Drag Indicator (Mobile) */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 sm:hidden shrink-0" />

                {/* Header (Foto) */}
                <div className="relative shrink-0">
                    {product.imageUrl ? (
                        <div className="w-full h-44 sm:h-52 relative">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, 448px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                    ) : (
                        <div className="w-full h-12" />
                    )}

                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-full text-white transition-all active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    <div className={`p-6 pb-2 ${!product.imageUrl ? 'pt-2' : 'absolute bottom-0 left-0 w-full'}`}>
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight font-epilogue drop-shadow-lg">
                            {product.name}
                        </h2>
                    </div>
                </div>

                {/* Content: detalle de solo lectura */}
                <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6 space-y-5 scroll-smooth">
                    <div>
                        <p className="text-lg font-black text-white font-manrope">{formatUsd(product.price)}</p>
                        {showBsPrice && <BsPrice usd={product.price} className="text-white" />}
                    </div>

                    {product.description && (
                        <p className="text-white/70 text-sm leading-relaxed font-manrope">{product.description}</p>
                    )}

                    {/* Opciones disponibles (informativo, no seleccionable) */}
                    {groups.map((group) => (
                        <div key={group.id} className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-wider text-white/50">
                                {group.name}
                                <span className="ml-1.5 normal-case tracking-normal text-white/40 font-bold">
                                    {group.isRequired ? '(obligatorio)' : '(opcional)'}
                                </span>
                            </p>
                            <ul className="space-y-1.5">
                                {group.options.map((opt) => (
                                    <li key={opt.id} className="flex items-center justify-between gap-3 text-sm font-manrope">
                                        <span className="text-white/80 flex items-center gap-2 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
                                            <span className="truncate">{opt.name}</span>
                                        </span>
                                        {opt.price > 0 && (
                                            <span className="text-white/50 text-xs font-semibold shrink-0">
                                                + {formatUsd(opt.price)}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer: pista de que el pedido lo hace el mesero + cerrar */}
                <div className="shrink-0 px-6 pt-4 pb-6 border-t border-white/10 space-y-3">
                    <p className="text-[11px] text-white/50 text-center font-bold font-manrope">
                        🧑‍🍳 Este producto se pide con tu mesero
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full text-white font-bold text-sm py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                        style={{ backgroundColor: themeColor }}
                    >
                        Cerrar
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes modalSlideUp {
                        from { transform: translateY(40px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}} />
            </div>
        </div>
    )
}

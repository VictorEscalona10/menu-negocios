// app/components/ComboCard.tsx
// Card destacada para productos que son COMBO: imagen arriba ocupando todo
// el ancho, información abajo y etiqueta "COMBO" (o el comboBadge del
// producto) arriba a la derecha. Compartida por el modo THEME (SharedMenuUI)
// y el modo AVANCED (AdvancedMenuUI / preview del editor).
'use client'

import type { CSSProperties } from 'react'
import AddToCartButton from '../menu/[slug]/AddToCartButton'
import BsPrice from './BsPrice'

interface ComboCardProduct {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    comboBadge?: string | null
    modifierGroups?: Array<{
        id: string
        name: string
        isRequired: boolean
        maxSelect: number | null
        options: Array<{ id: string; name: string; price: number }>
    }>
}

interface ComboCardProps {
    product: ComboCardProduct
    accent: string
    buttonTextColor: string
    textColor: string
    subtextColor: string
    /** Ocupa todo el ancho disponible en un grid (1 / -1). */
    span?: boolean
    showImages?: boolean
    showDescriptions?: boolean
    showPrices?: boolean
    /** Muestra el precio convertido a Bs debajo del precio en USD. */
    bsEnabled?: boolean
    /** Estilo de superficie (fondo/borde) según el design style. */
    surfaceStyle?: CSSProperties
    headingStyle?: CSSProperties
    bodyStyle?: CSSProperties
    isPreview?: boolean
    forceNotesModal?: boolean
    onClick?: () => void
    onConfigure?: () => void
}

export default function ComboCard({
    product,
    accent,
    buttonTextColor,
    textColor,
    subtextColor,
    span = false,
    showImages = true,
    showDescriptions = true,
    showPrices = true,
    bsEnabled = true,
    surfaceStyle,
    headingStyle,
    bodyStyle,
    isPreview = false,
    forceNotesModal,
    onClick,
    onConfigure,
}: ComboCardProps) {
    // Sombra base (minimal): anillo tenue de acento + sombra sutil que solo
    // da un leve lift del fondo + highlight interior superior discreto. Se
    // fusiona con la sombra que traiga el design style (glass/neumorphism…).
    const surfaceShadow = surfaceStyle?.boxShadow
    const baseShadow = [
        surfaceShadow,
        `0 0 0 1px ${accent}4d`,
        `0 4px 16px -6px ${accent}3d`,
        'inset 0 1px 0 rgba(255, 255, 255, 0.10)',
    ]
        .filter(Boolean)
        .join(', ')
    // Al hacer hover la sombra crece un poco (la card se levanta levemente).
    const hoverShadow = [
        surfaceShadow,
        `0 0 0 1px ${accent}73`,
        `0 8px 22px -8px ${accent}59`,
        'inset 0 1px 0 rgba(255, 255, 255, 0.16)',
    ]
        .filter(Boolean)
        .join(', ')

    return (
        <div
            onClick={onClick}
            className="combo-card group relative flex cursor-pointer flex-col rounded-2xl"
            style={
                {
                    ...surfaceStyle,
                    // El design style no debe pisar la sombra compuesta salvo su boxShadow.
                    boxShadow: undefined,
                    '--combo-shadow': baseShadow,
                    '--combo-shadow-hover': hoverShadow,
                    ...(span ? { gridColumn: '1 / -1' } : null),
                } as CSSProperties
            }
        >
            {/* Imagen arriba ocupando todo el ancho */}
            {showImages && product.imageUrl ? (
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-t-2xl bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                </div>
            ) : (
                <div
                    className="flex h-24 w-full shrink-0 items-center justify-center rounded-t-2xl text-3xl"
                    style={{ backgroundColor: `${accent}15` }}
                >
                    ✨
                </div>
            )}

            {/* Etiqueta COMBO: a la izquierda, cruzando el borde superior
                (mitad sobresale hacia arriba / fuera, mitad queda dentro sobre
                la imagen). El wrapper se encarga del offset (-translate-y-1/2)
                y el span de la animación de entrada (scale). */}
            <div className="absolute left-3 top-0 z-10 -translate-y-1/2">
                <span
                    className="combo-badge-in block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"
                    style={{ backgroundColor: accent, color: buttonTextColor }}
                >
                    ⭐ {product.comboBadge || 'COMBO'}
                </span>
            </div>

            {/* Información abajo */}
            <div className="flex flex-1 flex-col justify-between gap-2 p-3">
                <div>
                    <h3
                        className="line-clamp-2 text-sm font-bold leading-snug"
                        style={{ ...headingStyle, color: textColor }}
                    >
                        {product.name}
                    </h3>
                    {showDescriptions && product.description && (
                        <p
                            className="mt-1 line-clamp-2 text-xs leading-relaxed"
                            style={{ ...bodyStyle, color: subtextColor }}
                        >
                            {product.description}
                        </p>
                    )}
                </div>

                <div
                    className="flex items-center justify-between gap-2 pt-2"
                    style={{ borderTop: `1px solid ${accent}22` }}
                >
                    {showPrices && (
                        <div>
                            <span
                                className="text-base font-extrabold"
                                style={{ ...bodyStyle, color: accent }}
                            >
                                ${product.price.toFixed(2)}
                            </span>
                            <BsPrice
                                usd={product.price}
                                enabled={bsEnabled}
                                color={subtextColor}
                                className={bodyStyle ? 'font-normal' : ''}
                            />
                        </div>
                    )}
                    <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isPreview ? (
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                                style={{ backgroundColor: accent, color: buttonTextColor }}
                            >
                                +
                            </div>
                        ) : (
                            <AddToCartButton
                                product={product}
                                themeColor={accent}
                                buttonTextColor={buttonTextColor}
                                onConfigure={onConfigure}
                                forceNotesModal={forceNotesModal}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

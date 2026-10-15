// app/components/BsPrice.tsx
// Línea con el precio convertido a Bolívares (Bs) que aparece DEBAJO del precio
// en dólares, en un tamaño más pequeño y sutil. Se usa en las cards del menú
// público (THEME y AVANCED) y en el preview del editor. No renderiza nada si
// está desactivado o si aún no hay tasa del dólar.
'use client'

import { useDollarRate } from '@/src/hooks/useDollarRate'

interface BsPriceProps {
    /** Precio en dólares a convertir. */
    usd: number
    /** Si está activo (según settings o la sección de menu). */
    enabled?: boolean
    /** Color explícito del texto (fallback: hereda del padre). */
    color?: string
    /** Clases extra para ajustar el contexto (color hereda del padre). */
    className?: string
}

// Formato venezolano: punto para miles y coma para decimales → "1.234,56"
const bsFormatter = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export default function BsPrice({ usd, enabled = true, color, className = '' }: BsPriceProps) {
    const rate = useDollarRate(enabled)

    if (!enabled || !rate) return null

    return (
        <span
            suppressHydrationWarning
            className={`block text-[11px] font-semibold leading-tight opacity-70 ${className}`}
            style={color ? { color } : undefined}
        >
            Bs {bsFormatter.format(usd * rate)}
        </span>
    )
}

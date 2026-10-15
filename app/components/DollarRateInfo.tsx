// app/components/DollarRateInfo.tsx
// Muestra la tasa del dólar oficial vigente ("1 USD = Bs 36,50") debajo de los
// toggles de precio en Bs, tanto en settings como en el panel de /customization.
// Siempre consulta la tasa (aunque el toggle esté apagado) porque sirve de
// referencia al usuario.
'use client'

import { useDollarRate } from '@/src/hooks/useDollarRate'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { RefreshDollar1Outlined } from '@lineiconshq/free-icons'

// Formato venezolano: punto para miles y coma para decimales → "36,50"
const bsFormatter = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export default function DollarRateInfo({ className = '' }: { className?: string }) {
    const rate = useDollarRate(true)

    let text = 'Cargando tasa…'
    if (rate === null) text = 'Tasa no disponible'
    else if (typeof rate === 'number') text = `1 USD = Bs ${bsFormatter.format(rate)}`

    return (
        <p suppressHydrationWarning className={`px-1 text-xs text-zinc-400 flex items-center gap-1.5 ${className}`}>
            <Lineicons icon={RefreshDollar1Outlined} size={14} className="shrink-0 text-zinc-400" />
            <span>{text}</span>
            {rate ? (
                <span className="text-zinc-300"> · fuente: ve.dolarapi.com (oficial)</span>
            ) : null}
        </p>
    )
}

// app/dashboard/mesas/WaiterPanelBlock.tsx
// Bloque "Panel del mesero" en /dashboard/mesas (docs/DESIGN.md §15, T57)
// - Link copiable `${baseUrl}/mesero/${slug}` (uno por store) + botón "Copiar link".
// - Instrucción: compártelo con los meseros; cada uno entra con su clave de acceso.
// - Recordatorio: las claves se generan/leen en el bloque de Meseros.
'use client'

import { useState } from 'react'

interface WaiterPanelBlockProps {
    /** Ej: https://komy.app (del header de la request) */
    baseUrl: string
    storeSlug: string
    /** true si el store ya tiene al menos un mesero (ajusta el recordatorio). */
    hasWaiters: boolean
}

export default function WaiterPanelBlock({ baseUrl, storeSlug, hasWaiters }: WaiterPanelBlockProps) {
    const [copied, setCopied] = useState(false)

    const panelUrl = `${baseUrl}/mesero/${storeSlug}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(panelUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // silencio
        }
    }

    const handleOpen = () => {
        window.open(panelUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <section>
            <div className="mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Panel del mesero</h2>
                <p className="text-xs text-zinc-500">
                    Compártelo con tus meseros; cada uno entra con su clave de acceso.
                </p>
            </div>

            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/60 space-y-3">
                {/* Link copiable */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <code className="flex-1 min-w-0 truncate bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-mono text-zinc-700 select-all">
                        {panelUrl}
                    </code>
                    <button
                        onClick={handleCopy}
                        className={`text-xs font-bold px-4 py-2.5 rounded-lg border transition-colors shrink-0 ${
                            copied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900'
                        }`}
                    >
                        {copied ? '¡Link copiado!' : 'Copiar link'}
                    </button>
                    <button
                        onClick={handleOpen}
                        className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-lg transition-colors shrink-0"
                    >
                        Abrir ↗
                    </button>
                </div>

                {/* Recordatorio de claves (bloque de Meseros) */}
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {hasWaiters ? (
                        <>
                            Las claves de acceso se crean y leen en el bloque{' '}
                            <span className="font-bold text-zinc-700">Meseros</span> (se muestran una sola vez al
                            crearlas; si se pierden, regenera la clave desde ahí).
                        </>
                    ) : (
                        <>
                            Primero crea tus meseros en el bloque{' '}
                            <span className="font-bold text-zinc-700">Meseros</span>: ahí se genera cada clave de
                            acceso (se muestra una sola vez) que usarán para entrar a este panel.
                        </>
                    )}
                </p>
            </div>
        </section>
    )
}

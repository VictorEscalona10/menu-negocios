// app/dashboard/components/DashboardActions.tsx
'use client'

import { useState } from 'react'

export function CopyMenuLinkButton({ menuUrl }: { menuUrl: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Error al copiar:', err)
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${copied
                ? 'bg-zinc-900 text-white border border-zinc-900'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200'
                }`}
        >
            {copied ? (
                <>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>¡Copiado!</span>
                </>
            ) : (
                <>
                    <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copiar Enlace</span>
                </>
            )}
        </button>
    )
}

export function ShareWhatsappButton({ menuUrl, storeName }: { menuUrl: string; storeName: string }) {
    const text = encodeURIComponent(`¡Hola! Te invito a ver nuestro menú digital en: ${menuUrl}`)
    const shareUrl = `https://api.whatsapp.com/send?text=${text}`

    return (
        <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 flex items-center gap-1.5 transition-all"
        >
            <span>💬 Compartir</span>
        </a>
    )
}

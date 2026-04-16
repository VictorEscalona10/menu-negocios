'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRGeneratorProps {
    menuUrl: string
    storeName: string
}

export default function QRGenerator({ menuUrl, storeName }: QRGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [copied, setCopied] = useState(false)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!canvasRef.current) return
        QRCode.toCanvas(canvasRef.current, menuUrl, {
            width: 240,
            margin: 2,
            color: {
                dark: '#18181b',   // zinc-900
                light: '#fafafa',  // zinc-50
            },
        }).then(() => setReady(true))
    }, [menuUrl])

    function handleDownload() {
        const canvas = canvasRef.current
        if (!canvas) return
        const link = document.createElement('a')
        link.download = `qr-menu-${storeName.toLowerCase().replace(/\s+/g, '-')}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(menuUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // fallback silencioso
        }
    }

    return (
        <div className="flex flex-col items-center gap-5">
            {/* QR canvas */}
            <div
                style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: '#fafafa',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 24px 0 rgba(24,24,27,0.07)',
                    display: 'inline-flex',
                    position: 'relative',
                }}
            >
                <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '8px' }} />
                {!ready && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '16px',
                            background: '#fafafa',
                        }}
                    >
                        <span className="animate-spin" style={{ fontSize: '1.5rem' }}>⏳</span>
                    </div>
                )}
            </div>

            {/* URL del menú */}
            <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2.5 w-full min-w-0 overflow-hidden">
                <span className="text-xs text-zinc-600 overflow-hidden text-ellipsis whitespace-nowrap flex-1 font-mono">
                    {menuUrl}
                </span>
                <button
                    onClick={handleCopy}
                    title="Copiar enlace"
                    className={`shrink-0 text-white rounded-lg px-3 py-1.5 text-[0.7rem] font-semibold transition-colors ${copied ? 'bg-green-500' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                >
                    {copied ? '✓ Copiado' : 'Copiar'}
                </button>
            </div>

            {/* Botón de descarga */}
            <button
                onClick={handleDownload}
                disabled={!ready}
                className={`flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-xl py-3 px-6 text-sm font-semibold w-full transition-all ${ready ? 'cursor-pointer opacity-100 hover:-translate-y-0.5 hover:shadow-md' : 'cursor-not-allowed opacity-50'}`}
            >
                {/* Download icon */}
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v10m0 0l-3-3m3 3l3-3" />
                </svg>
                Descargar QR (PNG)
            </button>
        </div>
    )
}

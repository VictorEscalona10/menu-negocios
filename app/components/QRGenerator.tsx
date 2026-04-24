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
        const width = window.innerWidth < 640 ? 200 : 240
        QRCode.toCanvas(canvasRef.current, menuUrl, {
            width: width,
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

            {/* Botones de acción */}
            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={handleCopy}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold w-full transition-all border ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50'}`}
                >
                    {copied ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            ¡Copiado con éxito!
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
                            Copiar Enlace del Menú
                        </>
                    )}
                </button>

                <button
                    onClick={handleDownload}
                    disabled={!ready}
                    className={`flex items-center justify-center gap-2 bg-black text-white rounded-xl py-3.5 px-6 text-sm font-bold w-full transition-all ${ready ? 'cursor-pointer opacity-100 hover:bg-zinc-800' : 'cursor-not-allowed opacity-50'}`}
                >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v10m0 0l-3-3m3 3l3-3" />
                    </svg>
                    Descargar Imagen QR
                </button>
            </div>
        </div>
    )
}

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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f4f4f5',
                    border: '1px solid #e4e4e7',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    maxWidth: '100%',
                    width: '100%',
                }}
            >
                <span
                    style={{
                        fontSize: '0.78rem',
                        color: '#52525b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        fontFamily: 'monospace',
                    }}
                >
                    {menuUrl}
                </span>
                <button
                    onClick={handleCopy}
                    title="Copiar enlace"
                    style={{
                        flexShrink: 0,
                        background: copied ? '#22c55e' : '#18181b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {copied ? '✓ Copiado' : 'Copiar'}
                </button>
            </div>

            {/* Botón de descarga */}
            <button
                onClick={handleDownload}
                disabled={!ready}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#18181b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 28px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5,
                    transition: 'opacity 0.2s, transform 0.15s',
                    width: '100%',
                    justifyContent: 'center',
                }}
                onMouseEnter={e => { if (ready) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
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

'use client'

import { useEffect, useRef } from 'react'

interface ModelViewerProps {
    src: string
    alt: string
    poster?: string | null
    className?: string
}

export function ModelViewer({ src, alt, poster, className }: ModelViewerProps) {
    const hostRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let cancelled = false
        import('@google/model-viewer').then(() => {
            if (cancelled || !hostRef.current) return
            if (hostRef.current.firstElementChild) return

            const el = document.createElement('model-viewer')
            el.setAttribute('camera-controls', '')
            el.setAttribute('auto-rotate', '')
            el.setAttribute('shadow-intensity', '1')
            el.setAttribute('exposure', '0.9')
            el.setAttribute('interaction-prompt', 'none')
            el.style.width = '100%'
            el.style.height = '100%'
            el.style.backgroundColor = 'transparent'
            hostRef.current.appendChild(el)
        })
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!hostRef.current) return
        const el = hostRef.current.querySelector('model-viewer')
        el?.setAttribute('src', src)
        el?.setAttribute('alt', alt)
        if (poster) {
            el?.setAttribute('poster', poster)
        } else {
            el?.removeAttribute('poster')
        }
    }, [src, alt, poster])

    return <div ref={hostRef} className={className} />
}

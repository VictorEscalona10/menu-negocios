// app/components/WaiterLoginModal.tsx
// Login del MESERO con su clave de acceso (docs/DESIGN.md §11, §13.3, §18)
// v2.1 (T51): RETIRADO del menú público — el menú ya no tiene acceso de mesero.
// vive fuera de app/menu y se usa adaptado en /mesero/[slug] (T54):
//
// - variant='modal'  (default): overlay flotante (comportamiento original del menú, T42).
// - variant='inline' (T54):     formulario embebido en la página del panel. Como el padre
//   es un server component (no puede recibir callbacks de cliente), hace `router.refresh()`
//   por sí mismo tras un login exitoso para que el RSC relea la cookie de sesión.
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signInWaiter } from '@/src/actions/waiters'
import { Lineicons } from '@lineiconshq/react-lineicons'
import { Locked1Outlined, Ban2Outlined } from '@lineiconshq/free-icons'

interface WaiterLoginModalProps {
    slug: string
    /** Solo variante modal: controla la apertura del overlay. */
    isOpen?: boolean
    /** Solo variante modal: cierra el overlay. */
    onClose?: () => void
    /** Tras un login exitoso (en modal el padre suele hacer router.refresh()). */
    onSignedIn?: () => void
    themeColor?: string
    /** 'modal' = overlay (original) · 'inline' = formulario embebido (panel /mesero). */
    variant?: 'modal' | 'inline'
}

export default function WaiterLoginModal({
    slug,
    isOpen = true,
    onClose,
    onSignedIn,
    themeColor = '#FF5630',
    variant = 'modal',
}: WaiterLoginModalProps) {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const isInline = variant === 'inline'

    useEffect(() => {
        if (isInline || isOpen) {
            setCode('')
            setError('')
            const t = setTimeout(() => inputRef.current?.focus(), 150)
            return () => clearTimeout(t)
        }
    }, [isOpen, isInline])

    if (!isInline && !isOpen) return null

    const handleSubmit = async () => {
        if (isSubmitting) return
        if (code.trim().length < 4) {
            setError('Ingresa tu clave de acceso.')
            return
        }

        setIsSubmitting(true)
        setError('')
        try {
            const res = await signInWaiter(slug, code)
            if (res.success) {
                onSignedIn?.()
                if (isInline) {
                    // El padre (page.tsx) es server component → refrescar el RSC
                    // es lo que hace aparezca la sesión y el panel.
                    router.refresh()
                } else {
                    onClose?.()
                }
            } else {
                setError(res.error || 'Clave incorrecta.')
            }
        } catch {
            setError('No se pudo iniciar sesión. Intenta de nuevo.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const cardHeader = (
        <div className="p-5 border-b border-zinc-200 bg-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColor}22` }}>
                <Lineicons icon={Locked1Outlined} size={18} style={{ color: themeColor }} />
            </div>
            <div>
                <h2 className="text-base font-bold text-zinc-900 leading-tight">Acceso de mesero</h2>
                <p className="text-[11px] text-zinc-500">Ingresa la clave que te dio el administrador</p>
            </div>
        </div>
    )

    const formBody = (
        <div className="space-y-4">
            <input
                ref={inputRef}
                type="password"
                value={code}
                onChange={(e) => {
                    setCode(e.target.value.toUpperCase().slice(0, 16))
                    setError('')
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                }}
                placeholder="Clave de acceso"
                autoComplete="off"
                className={`w-full bg-white border rounded-xl px-4 py-3.5 text-zinc-900 text-center text-lg font-black tracking-[0.3em] uppercase placeholder:text-zinc-400 placeholder:tracking-normal placeholder:font-medium placeholder:text-sm focus:outline-none transition-all ${
                    error
                        ? 'border-red-400 ring-2 ring-red-200'
                        : 'border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
                }`}
            />

            {error && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
                    <Lineicons icon={Ban2Outlined} size={14} className="shrink-0" />
                    <span>{error}</span>
                </p>
            )}

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                style={{ backgroundColor: themeColor }}
            >
                {isSubmitting ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                ) : null}
                {isSubmitting ? 'Verificando...' : 'Entrar'}
            </button>
        </div>
    )

    // --- Variante INLINE: tarjeta embebida en /mesero/[slug] (sin overlay ni cancelar) ---
    if (isInline) {
        return (
            <div className="bg-white w-full rounded-3xl overflow-hidden border border-zinc-200 shadow-sm">
                {cardHeader}
                <div className="p-5">{formBody}</div>
            </div>
        )
    }

    // --- Variante MODAL: overlay original (comportamiento intacto) ---
    return (
        <div
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden border border-zinc-200 shadow-2xl"
                style={{ animation: 'slideUpLogin 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {cardHeader}
                <div className="p-5 space-y-4">
                    {formBody}
                    <button
                        onClick={onClose}
                        className="w-full text-zinc-500 hover:text-zinc-900 text-xs font-bold py-2 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes slideUpLogin {
                        from { transform: translateY(40px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}} />
            </div>
        </div>
    )
}

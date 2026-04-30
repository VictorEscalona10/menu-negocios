"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    onCancel: () => void
    confirmText?: string
    cancelText?: string
}

export function ConfirmationModal({ isOpen, title, description, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar" }: ConfirmationModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Bloquear scroll cuando está abierto
    useEffect(() => {
        if (!mounted) return
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen, mounted])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop con desenfoque */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            ></div>

            {/* Modal Box */}
            <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6">
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">{description}</p>
                </div>

                <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

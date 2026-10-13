'use client'

import { useEffect } from 'react'
import { useCustomizationStore } from '@/src/store/customizationStore'

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false
    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
    )
}

/**
 * Atajos de undo/redo del editor:
 * - Cmd/Ctrl + Z → deshacer
 * - Cmd/Ctrl + Shift + Z, Cmd/Ctrl + Y → rehacer
 *
 * Se ignoran cuando el foco está en un campo editable para no pisar el
 * undo nativo del navegador. Se suscribe vía getState() para no re-renderizar.
 */
export function useUndoRedoShortcuts() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.metaKey && !event.ctrlKey) return
            if (event.altKey || isEditableTarget(event.target)) return

            const key = event.key.toLowerCase()
            const store = useCustomizationStore.getState()

            if (key === 'z' && !event.shiftKey) {
                event.preventDefault()
                store.undo()
                return
            }

            if ((key === 'z' && event.shiftKey) || key === 'y') {
                event.preventDefault()
                store.redo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])
}

'use client'

import { useState } from 'react'
import {
    ChevronDown,
    ChevronUp,
    ChevronsDown,
    ChevronsUp,
    Eye,
    EyeOff,
    Loader2,
    Trash2,
} from 'lucide-react'
import { useCustomizationStore } from '@/src/store/customizationStore'
import type { Section } from '@/src/types/customization'
import { ConfirmationModal } from '../../products/ConfirmationModal'

type SectionControlsProps = {
    section: Section
}

const BTN_CLASS =
    'rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400'

/**
 * Acciones por sección: ocultar, mover (arriba/abajo/inicio/final) y borrar
 * con confirmación. Los botones quedan deshabilitados mientras `saving`.
 * Las imágenes huérfanas de la sección borrada se limpian en el server al
 * guardar (saveCustomizationLayout purga las URLs no referenciadas).
 */
export function SectionControls({ section }: SectionControlsProps) {
    const saving = useCustomizationStore((s) => s.saving)
    const sections = useCustomizationStore((s) => s.layoutJson.sections)
    const moveSection = useCustomizationStore((s) => s.moveSection)
    const setSectionVisible = useCustomizationStore((s) => s.setSectionVisible)
    const removeSection = useCustomizationStore((s) => s.removeSection)

    const [confirming, setConfirming] = useState(false)

    const index = sections.findIndex((s) => s.id === section.id)
    const isFirst = index <= 0
    const isLast = index === -1 || index === sections.length - 1

    const handleDelete = () => {
        removeSection(section.id)
        setConfirming(false)
    }

    return (
        <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
            aria-busy={saving}
        >
            {saving ? (
                <span
                    title="Guardando…"
                    className="flex items-center gap-1 rounded-md px-1.5 text-[11px] font-bold text-zinc-400"
                >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </span>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setSectionVisible(section.id, !section.visible)}
                        disabled={saving}
                        title={section.visible ? 'Ocultar sección' : 'Mostrar sección'}
                        aria-label={section.visible ? 'Ocultar sección' : 'Mostrar sección'}
                        className={BTN_CLASS}
                    >
                        {section.visible ? (
                            <Eye className="h-4 w-4" />
                        ) : (
                            <EyeOff className="h-4 w-4" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => moveSection(section.id, 'start')}
                        disabled={saving || isFirst}
                        title="Mover al inicio"
                        aria-label="Mover al inicio"
                        className={BTN_CLASS}
                    >
                        <ChevronsUp className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={saving || isFirst}
                        title="Mover arriba"
                        aria-label="Mover arriba"
                        className={BTN_CLASS}
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={saving || isLast}
                        title="Mover abajo"
                        aria-label="Mover abajo"
                        className={BTN_CLASS}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => moveSection(section.id, 'end')}
                        disabled={saving || isLast}
                        title="Mover al final"
                        aria-label="Mover al final"
                        className={BTN_CLASS}
                    >
                        <ChevronsDown className="h-4 w-4" />
                    </button>

                    <span className="mx-1 h-4 w-px bg-zinc-200" />

                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        disabled={saving}
                        title="Borrar sección"
                        aria-label="Borrar sección"
                        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </>
            )}

            <ConfirmationModal
                isOpen={confirming}
                title="¿Borrar esta sección?"
                description="Se eliminará del diseño. Sus imágenes se limpian al guardar. Puedes deshacerlo con Ctrl+Z."
                confirmText="Borrar"
                cancelText="Cancelar"
                onConfirm={handleDelete}
                onCancel={() => setConfirming(false)}
            />
        </div>
    )
}

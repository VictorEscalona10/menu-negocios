'use client'

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EyeOff, GripVertical } from 'lucide-react'
import type { Section } from '@/src/types/customization'
import { SectionControls } from '../components/SectionControls'
import { SECTION_META } from './sectionMeta'

type DraggableSectionProps = {
    section: Section
    index: number
    /** Muestra la línea de posición mientras se arrastra otra sección sobre esta */
    dropLine?: boolean
    /** Sección activa en el panel de configuración */
    selected?: boolean
    onSelect?: () => void
    children: ReactNode
}

/**
 * Wrapper dnd-kit de cada sección del canvas: handle para arrastrar,
 * cabecera con icono/tipo, selección (abre SectionConfigPanel) y feedback de drag.
 */
export function DraggableSection({
    section,
    index,
    dropLine,
    selected,
    onSelect,
    children,
}: DraggableSectionProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
    })

    const meta = SECTION_META[section.type]
    const Icon = meta.icon

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const,
    }

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {dropLine && !isDragging && (
                <span className="absolute -top-1 left-0 right-0 z-10 h-0.5 rounded-full bg-zinc-900" />
            )}

            <div
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={onSelect}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect?.()
                    }
                }}
                className={`group cursor-pointer rounded-2xl border bg-white transition-shadow ${
                    isDragging
                        ? 'border-zinc-300 opacity-70 shadow-2xl'
                        : selected
                          ? 'border-zinc-900 ring-2 ring-zinc-900/60'
                          : 'border-zinc-100 hover:border-zinc-200 hover:shadow-sm'
                }`}
            >
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-3 py-2">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        aria-label="Arrastrar para reordenar"
                        title="Arrastrar para reordenar"
                        onClick={(e) => e.stopPropagation()}
                        className="touch-none cursor-grab text-zinc-400 transition-colors hover:text-zinc-700 active:cursor-grabbing"
                    >
                        <GripVertical className="h-5 w-5" />
                    </button>

                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-bold text-zinc-800">{meta.label}</span>
                    <span className="text-[11px] font-semibold text-zinc-400">#{index + 1}</span>

                    {selected && (
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-bold text-white">
                            Editando
                        </span>
                    )}

                    {!section.visible && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500">
                            <EyeOff className="h-3 w-3" />
                            Oculta
                        </span>
                    )}

                    <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                        <SectionControls section={section} />
                    </div>
                </div>

                <div
                    className={`overflow-hidden p-3 ${
                        section.visible ? '' : 'opacity-40'
                    } ${isDragging ? 'cursor-grabbing' : ''}`}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

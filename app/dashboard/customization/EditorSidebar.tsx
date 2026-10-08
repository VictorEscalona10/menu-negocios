'use client'

import { Plus } from 'lucide-react'
import { useCustomizationStore } from '@/src/store/customizationStore'
import type { SectionType } from '@/src/types/customization'
import { SECTION_META } from './sections/sectionMeta'

// Orden según spec de T13
const ADDABLE_SECTIONS: SectionType[] = [
    'header',
    'category-nav',
    'menu',
    'text',
    'image',
    'carousel',
    'social',
]

/**
 * Paleta de secciones: al hacer click agrega la sección al final de
 * `layout.sections` en el store (addSection → historial undo/redo).
 */
export function EditorSidebar() {
    const addSection = useCustomizationStore((s) => s.addSection)
    const count = useCustomizationStore((s) => s.layoutJson.sections.length)

    return (
        <aside className="rounded-3xl border border-zinc-100 bg-white p-4">
            <div className="mb-3">
                <h2 className="text-sm font-black text-zinc-900">Agregar sección</h2>
                <p className="text-xs text-zinc-500">Se añade al final y abre su ajuste</p>
            </div>

            <div className="flex flex-col gap-2">
                {ADDABLE_SECTIONS.map((type) => {
                    const meta = SECTION_META[type]
                    const Icon = meta.icon

                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                addSection(type)
                                // La sección nueva entra al final de la lista del canvas
                                requestAnimationFrame(() => {
                                    document
                                        .getElementById('editor-canvas-list')
                                        ?.lastElementChild?.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'nearest',
                                        })
                                })
                            }}
                            title={meta.hint}
                            className="group flex w-full items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-zinc-800">
                                    {meta.label}
                                </span>
                                <span className="block truncate text-[11px] text-zinc-400">
                                    {meta.hint}
                                </span>
                            </span>
                            <Plus className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-900" />
                        </button>
                    )
                })}
            </div>

            {count > 0 && (
                <p className="mt-3 text-center text-[11px] font-semibold text-zinc-400">
                    {count} {count === 1 ? 'sección' : 'secciones'} en el diseño actual
                </p>
            )}
        </aside>
    )
}

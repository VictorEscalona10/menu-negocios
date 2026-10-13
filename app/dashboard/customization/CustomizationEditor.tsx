'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Store } from '@prisma/client'
import { useCustomizationStore } from '@/src/store/customizationStore'
import { getCustomizationLayout, toggleCustomizationMode } from '@/src/actions/customization'
import { createDefaultLayout, type AdvancedCustomization, type CustomizationMode } from '@/src/types/customization'
import { buildGoogleFontsUrl } from '@/src/styles/fonts'
import { EditorToolbar } from './EditorToolbar'
import { EditorCanvas } from './EditorCanvas'
import { EditorSidebar } from './EditorSidebar'
import { GlobalStylePanel } from './panels/GlobalStylePanel'
import { SectionConfigPanel } from './panels/SectionConfigPanel'

type CustomizationEditorProps = {
    layout: AdvancedCustomization | null
    store: Store
}

export function CustomizationEditor({ layout, store }: CustomizationEditorProps) {
    const [mode, setMode] = useState<CustomizationMode>(store.customizationMode)
    const [isPending, setIsPending] = useState(false)
    const initialLayout = useRef(layout)

    const setStoreId = useCustomizationStore((s) => s.setStoreId)
    const setLayoutJson = useCustomizationStore((s) => s.setLayoutJson)
    const fontHeading = useCustomizationStore((s) => s.layoutJson.global.fontHeading)
    const fontBody = useCustomizationStore((s) => s.layoutJson.global.fontBody)
    const fontsUrl = buildGoogleFontsUrl([fontHeading, fontBody])

    // Al montar: id del local + fetch del layout guardado → llena el store
    useEffect(() => {
        setStoreId(store.id)

        let cancelled = false
        getCustomizationLayout(store.id)
            .then((fresh) => {
                if (!cancelled) setLayoutJson(fresh ?? initialLayout.current ?? createDefaultLayout())
            })
            .catch(() => {
                if (!cancelled) setLayoutJson(initialLayout.current ?? createDefaultLayout())
            })

        return () => {
            cancelled = true
        }
    }, [store.id, setStoreId, setLayoutJson])

    const handleToggleMode = async () => {
        if (isPending) return
        const next: CustomizationMode = mode === 'THEME' ? 'AVANCED' : 'THEME'

        setIsPending(true)
        try {
            await toggleCustomizationMode(store.id, next)
            setMode(next)
        } catch {
            // Si falla la acción, el modo local queda como estaba
        } finally {
            setIsPending(false)
        }
    }

    const modeSwitch = (
        <button
            type="button"
            role="switch"
            aria-checked={mode === 'AVANCED'}
            aria-label="Modo de personalización avanzada"
            onClick={handleToggleMode}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === 'AVANCED' ? 'bg-zinc-900' : 'bg-zinc-300'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    mode === 'AVANCED' ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    )

    if (mode === 'THEME') {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center space-y-3">
                    <h2 className="text-xl font-bold text-zinc-900">Estás en modo clásico (THEME)</h2>
                    <p className="text-zinc-500 font-medium max-w-xl mx-auto">
                        Tu menú usa la personalización por defecto. Los colores, tipografías e imágenes
                        del tema se configuran en la página de Ajustes.
                    </p>
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-700 rounded-full px-6 py-3 transition-colors"
                    >
                        Ir a Ajustes
                    </Link>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-100 px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="font-bold text-zinc-900">Personalización avanzada</p>
                        <p className="text-sm text-zinc-500">Diseña tu menú sección por sección</p>
                    </div>
                    {modeSwitch}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Carga en vivo las fuentes elegidas: el preview se actualiza al cambiarlas */}
            <link rel="stylesheet" precedence="editor-fonts" href={fontsUrl} />

            <EditorToolbar storeName={store.name} />

            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    <SectionConfigPanel />
                    <EditorSidebar />
                    <GlobalStylePanel />
                </div>
                <EditorCanvas />
            </div>
        </div>
    )
}

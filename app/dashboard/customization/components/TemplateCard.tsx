'use client'

import { useState } from 'react'
import { Check, Layers, Loader2, Sparkles } from 'lucide-react'
import type { CustomizationTemplate } from '@prisma/client'
import { applyTemplate } from '@/src/actions/customization'
import { useCustomizationStore } from '@/src/store/customizationStore'
import {
    defaultAlignmentFor,
    defaultGlobalStyle,
    saveLayoutSchema,
    sectionSchema,
    type AdvancedCustomization,
    type SectionType,
} from '@/src/types/customization'
import { SECTION_META } from '../sections/sectionMeta'
import { SectionRenderer } from '../sections/SectionRenderer'

type TemplateCardProps = {
    template: CustomizationTemplate
    /** Se dispara tras aplicar (ej: cerrar el picker) */
    onApplied?: () => void
}

const SECTION_TYPES: SectionType[] = [
    'header',
    'category-nav',
    'menu',
    'social',
    'text',
    'image',
    'carousel',
]

// Convierte el configJson de la plantilla en un layout renderizable (o null si no es válido)
export function getPreviewLayout(template: CustomizationTemplate): AdvancedCustomization | null {
    const config = template.configJson as unknown

    if (template.scope === 'SECTION') {
        const type = template.sectionType as SectionType | null
        if (!type || !SECTION_TYPES.includes(type)) return null

        const parsed = sectionSchema.safeParse({
            id: 'preview',
            type,
            visible: true,
            alignment: defaultAlignmentFor(type),
            config,
        })
        if (!parsed.success) return null

        return {
            version: 1,
            global: { ...defaultGlobalStyle },
            sections: [parsed.data],
            deviceView: 'desktop',
        }
    }

    const full = saveLayoutSchema.safeParse(config)
    return full.success ? full.data : null
}

/**
 * Contenido del mini-preview: render en vivo del configJson, imagen de
 * `previewUrl` o placeholder. Va dentro de un contenedor `relative`.
 */
export function TemplatePreviewBody({
    template,
    scale = 0.7,
}: {
    template: CustomizationTemplate
    scale?: number
}) {
    const layout = getPreviewLayout(template)

    return (
        <div
            className="absolute inset-0"
            style={layout ? { backgroundColor: layout.global.backgroundColor } : undefined}
        >
            {layout ? (
                <div
                    aria-hidden
                    className="pointer-events-none select-none"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: `${100 / scale}%`,
                    }}
                >
                    {layout.sections
                        .filter((section) => section.visible)
                        .slice(0, 3)
                        .map((section) => (
                            <SectionRenderer
                                key={section.id}
                                section={section}
                                layoutJson={layout}
                                deviceView="desktop"
                            />
                        ))}
                </div>
            ) : template.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={template.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
                    <Layers className="h-8 w-8" />
                </span>
            )}
        </div>
    )
}

/**
 * Card de plantilla con mini-preview, nombre/descripción y botón "Aplicar".
 * Público: cualquiera puede aplicar; privada: solo el dueño (lo valida el server
 * en `applyTemplate`, aquí se deshabilita de forma defensiva).
 */
export function TemplateCard({ template, onApplied }: TemplateCardProps) {
    const storeId = useCustomizationStore((s) => s.storeId)
    const stageLayout = useCustomizationStore((s) => s.stageLayout)

    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isOwn = template.storeId === null || template.storeId === storeId
    const canApply = Boolean(storeId) && (template.isPublic || isOwn)

    const handleApply = async () => {
        if (!storeId || pending || !canApply) return

        setPending(true)
        setError(null)
        try {
            const layout = await applyTemplate(storeId, template.id)
            // applyTemplate persiste en el server → estado limpio (sin dirty),
            // pero el estado anterior queda en el historial: Ctrl+Z lo revierte
            // (y deja dirty=true para poder volver a guardarlo).
            stageLayout(layout)
            onApplied?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo aplicar la plantilla')
        } finally {
            setPending(false)
        }
    }

    const sectionTypeLabel =
        template.scope === 'SECTION' && template.sectionType
            ? SECTION_META[template.sectionType as SectionType]?.label
            : null

    return (
        <article className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-zinc-200 hover:shadow-lg">
            {/* Mini preview */}
            <div className="relative h-32 overflow-hidden border-b border-zinc-100">
                <TemplatePreviewBody template={template} />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
            </div>

            {/* Nombre + descripción */}
            <div className="space-y-1.5 p-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 min-w-0 text-sm font-black text-zinc-900">
                        {template.name}
                    </h3>
                    <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            template.isPublic
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-zinc-100 text-zinc-500'
                        }`}
                    >
                        {template.isPublic ? 'Pública' : 'Privada'}
                    </span>
                </div>

                <p className="line-clamp-2 min-h-[2rem] text-xs leading-snug text-zinc-500">
                    {template.description ?? 'Sin descripción'}
                </p>

                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    {template.scope === 'FULL_PAGE'
                        ? 'Página completa'
                        : `Sección · ${sectionTypeLabel ?? template.sectionType ?? ''}`}
                </p>

                {error && (
                    <p className="text-[11px] font-semibold text-red-500">{error}</p>
                )}
            </div>

            {/* Aplicar */}
            <div className="p-3 pt-0">
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={!canApply || pending}
                    title={
                        canApply
                            ? 'Aplicar esta plantilla a tu menú'
                            : 'Solo el dueño puede aplicar plantillas privadas'
                    }
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {pending ? 'Aplicando…' : 'Aplicar'}
                    {!pending && canApply && (
                        <Check className="hidden h-3.5 w-3.5 group-hover:block" />
                    )}
                </button>
            </div>
        </article>
    )
}

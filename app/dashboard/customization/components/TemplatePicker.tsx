'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    ChevronDown,
    ChevronUp,
    LayoutTemplate,
    Loader2,
    MousePointer2,
    RefreshCw,
    Search,
    X,
} from 'lucide-react'
import type { CustomizationTemplate } from '@prisma/client'
import { getTemplates } from '@/src/actions/customization'
import { designStyleOf, pageBackdrop } from '@/src/styles/designStyles'
import { SectionRenderer } from '../sections/SectionRenderer'
import { getPreviewLayout, TemplateCard } from './TemplateCard'

const normalizeText = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

type TemplateGroupProps = {
    title: string
    templates: CustomizationTemplate[]
    onApplied: () => void
    onHover: (template: CustomizationTemplate | null) => void
}

function TemplateGroup({ title, templates, onApplied, onHover }: TemplateGroupProps) {
    return (
        <div className="mb-5 last:mb-0">
            <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-zinc-400">
                    {title}
                </span>
                <span className="h-px flex-1 bg-zinc-100" />
                <span className="text-[11px] font-bold text-zinc-300">{templates.length}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        onMouseEnter={() => onHover(template)}
                        onMouseLeave={() => onHover(null)}
                    >
                        <TemplateCard template={template} onApplied={onApplied} />
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Teléfono a la derecha del modal: muestra "Pasa el cursor para ver" hasta
 * que se hace hover sobre una card, y entonces renderiza la plantilla con
 * el layout real (deviceView phone, colores/tipografías del template).
 */
function TemplatePhone({ template }: { template: CustomizationTemplate | null }) {
    const layout = template ? getPreviewLayout(template) : null
    const backdrop = layout ? pageBackdrop(designStyleOf(layout.global), layout.global) : null

    return (
        <div className="hidden w-[300px] shrink-0 flex-col items-center gap-3 border-l border-zinc-100 bg-zinc-50 px-5 py-5 lg:flex xl:w-[380px] xl:px-6">
            <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="relative h-full max-h-[580px] min-h-[300px] w-[260px] overflow-hidden rounded-[2.5rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-xl xl:w-[320px]">
                    {/* Notch */}
                    <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />

                    <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-white">
                        {!template ? (
                            <span className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs font-bold text-zinc-400">
                                <MousePointer2 className="h-5 w-5" />
                                Pasa el cursor para ver
                            </span>
                        ) : layout ? (
                            <div
                                className="pointer-events-none relative h-full overflow-hidden select-none"
                                style={{
                                    backgroundColor: layout.global.backgroundColor,
                                    color: layout.global.textColor,
                                    fontFamily: `'${layout.global.fontBody}', sans-serif`,
                                }}
                            >
                                {backdrop && (
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0"
                                        style={backdrop}
                                    />
                                )}
                                <div className="relative">
                                    {layout.sections
                                        .filter((section) => section.visible)
                                        .map((section) => (
                                            <SectionRenderer
                                                key={section.id}
                                                section={section}
                                                layoutJson={layout}
                                                deviceView="phone"
                                            />
                                        ))}
                                </div>
                            </div>
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={template.previewUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        )}
                    </div>
                </div>
            </div>

            <p className="max-w-full shrink-0 truncate text-center text-[11px] font-bold text-zinc-400">
                {template?.name ?? 'Vista previa en vivo'}
            </p>
        </div>
    )
}

/**
 * Modal de plantillas: lista las del store (privadas) + las públicas,
 * con buscador por nombre, grid scrollable y preview en un teléfono a la
 * derecha al pasar el mouse sobre una card.
 */
export function TemplatePicker() {
    const [open, setOpen] = useState(false)
    const [templates, setTemplates] = useState<CustomizationTemplate[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState('')
    const [hovered, setHovered] = useState<CustomizationTemplate | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setTemplates(await getTemplates())
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'No se pudieron cargar las plantillas',
            )
        } finally {
            setLoading(false)
        }
    }, [])

    // Refrescar la lista cada vez que se abre el modal
    useEffect(() => {
        if (open) void load()
    }, [open, load])

    // Escape + bloquear scroll del body mientras está abierto
    useEffect(() => {
        if (!open) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false)
                setHovered(null)
            }
        }
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    const close = () => {
        setOpen(false)
        setHovered(null)
    }

    const normalizedQuery = normalizeText(query.trim())
    const filtered = normalizedQuery
        ? templates.filter((template) => normalizeText(template.name).includes(normalizedQuery))
        : templates
    const mine = filtered.filter((template) => !template.isPublic)
    const publics = filtered.filter((template) => template.isPublic)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="dialog"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
                <LayoutTemplate className="h-4 w-4" />
                Plantillas
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {open &&
                createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop: clic para cerrar */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={close}
                        />

                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Plantillas"
                            className="relative flex h-[85vh] w-[95vw] max-w-[1600px] animate-[modal-in_0.2s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-3xl bg-white shadow-2xl lg:h-[70vh] lg:w-[70vw]"
                        >
                            {/* Izquierda: buscador + grid scrollable */}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-black text-zinc-900">
                                            Plantillas
                                        </h2>
                                        <p className="hidden text-xs text-zinc-500 sm:block">
                                            Pasa el cursor para verla en el teléfono
                                        </p>
                                    </div>

                                    {/* Buscador por nombre */}
                                    <div className="relative ml-auto w-full min-w-0 max-w-sm">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="search"
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Buscar plantilla por nombre…"
                                            autoFocus
                                            className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={close}
                                        aria-label="Cerrar"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Grid: Mis plantillas vs Plantillas públicas */}
                                <div
                                    className="flex-1 overflow-y-auto px-4 py-4 sm:px-5"
                                    onMouseLeave={() => setHovered(null)}
                                >
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-2 py-16 text-zinc-400">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span className="text-xs font-semibold">
                                                Cargando plantillas…
                                            </span>
                                        </div>
                                    ) : error ? (
                                        <div className="py-12 text-center">
                                            <p className="text-xs font-semibold text-red-500">
                                                {error}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => void load()}
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Reintentar
                                            </button>
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <p className="py-12 text-center text-xs font-semibold text-zinc-400">
                                            {templates.length === 0
                                                ? 'Aún no hay plantillas disponibles'
                                                : `No encontramos plantillas para “${query}”`}
                                        </p>
                                    ) : (
                                        <>
                                            {mine.length > 0 && (
                                                <TemplateGroup
                                                    title="Mis plantillas"
                                                    templates={mine}
                                                    onApplied={close}
                                                    onHover={setHovered}
                                                />
                                            )}
                                            {publics.length > 0 && (
                                                <TemplateGroup
                                                    title="Plantillas públicas"
                                                    templates={publics}
                                                    onApplied={close}
                                                    onHover={setHovered}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Derecha: teléfono con preview al hacer hover */}
                            <TemplatePhone template={hovered} />
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    )
}

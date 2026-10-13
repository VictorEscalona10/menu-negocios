'use client'

import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { useCustomizationStore } from '@/src/store/customizationStore'
import { uploadCustomizationImage } from '@/src/actions/customization'
import {
    CUSTOMIZATION_IMAGE_MIME_TYPES,
    CUSTOMIZATION_MAX_IMAGE_BYTES,
    MENU_LAYOUT_STYLES,
} from '@/src/types/customization'
import type {
    CarouselItem,
    CarouselSectionConfig,
    CategoryNavSectionConfig,
    HeaderSectionConfig,
    ImageSectionConfig,
    MenuLayout,
    MenuLayoutStyle,
    MenuSectionConfig,
    Section,
    SocialPlatform,
    SocialSectionConfig,
    TextSectionConfig,
} from '@/src/types/customization'
import { SECTION_META } from '../sections/sectionMeta'
import { ColorField, Segmented, SelectField, TextArea, TextField, Toggle } from './PanelFields'

// ---------- Upload de imágenes ----------

function useImageUpload() {
    const storeId = useCustomizationStore((s) => s.storeId)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const upload = async (file: File): Promise<string | null> => {
        if (!storeId) return null
        if (file.size > CUSTOMIZATION_MAX_IMAGE_BYTES) {
            setError('Archivo muy grande (máximo 10MB)')
            return null
        }

        setUploading(true)
        setError(null)
        try {
            return await uploadCustomizationImage(storeId, file)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo subir la imagen')
            return null
        } finally {
            setUploading(false)
        }
    }

    return { uploading, error, upload }
}

type ImagePickerProps = {
    label: string
    value: string
    onChange: (url: string) => void
}

function ImagePicker({ label, value, onChange }: ImagePickerProps) {
    const fileRef = useRef<HTMLInputElement>(null)
    const { uploading, error, upload } = useImageUpload()

    const handleFile = (file: File | undefined) => {
        if (!file) return
        void upload(file).then((url) => {
            if (url) onChange(url)
        })
    }

    return (
        <div>
            <span className="mb-1 block text-xs font-bold text-zinc-600">{label}</span>
            <div className="flex items-start gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full items-center justify-center text-[10px] font-semibold text-zinc-400">
                            Vacío
                        </span>
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1.5 self-start rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Upload className="h-3.5 w-3.5" />
                        )}
                        {uploading ? 'Subiendo…' : 'Subir imagen'}
                    </button>
                    <input
                        type="text"
                        value={value}
                        placeholder="https://…"
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1 font-mono text-[11px] text-zinc-700 focus:border-zinc-900 focus:outline-none"
                    />
                </div>
            </div>
            {error && <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>}
            <input
                ref={fileRef}
                type="file"
                accept={CUSTOMIZATION_IMAGE_MIME_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                    handleFile(e.target.files?.[0])
                    e.target.value = ''
                }}
            />
        </div>
    )
}

function OptionalColorField({
    label,
    value,
    onSet,
}: {
    label: string
    value: string | undefined
    onSet: (next: string | undefined) => void
}) {
    if (value === undefined) {
        return (
            <button
                type="button"
                onClick={() => onSet('#ffffff')}
                className="w-full rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-500 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
                + {label}
            </button>
        )
    }

    return (
        <ColorField label={label} value={value} onChange={onSet}>
            <button
                type="button"
                onClick={() => onSet(undefined)}
                className="h-9 shrink-0 rounded-lg border border-zinc-200 px-2 text-[11px] font-bold text-zinc-500 transition-colors hover:text-zinc-900"
            >
                Quitar
            </button>
        </ColorField>
    )
}

function SliderField({
    label,
    value,
    min,
    max,
    step,
    display,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    display: string
    onChange: (value: number) => void
}) {
    return (
        <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-bold text-zinc-600">
                {label}
                <span className="font-mono text-[11px] text-zinc-400">{display}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-zinc-900"
            />
        </label>
    )
}

// ---------- Formularios por tipo de sección ----------

function HeaderForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const c = section.config as HeaderSectionConfig
    const update = (partial: Partial<HeaderSectionConfig>) =>
        updateSectionConfig(section.id, partial)

    return (
        <div className="space-y-3">
            <Segmented
                label="Estilo"
                value={c.style ?? 'classic'}
                options={[
                    { value: 'classic', label: 'Clásico' },
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'editorial', label: 'Editorial' },
                ]}
                onChange={(style) => update({ style })}
            />
            <Toggle
                label="Mostrar logo"
                checked={c.showLogo}
                onChange={(showLogo) => update({ showLogo })}
            />
        </div>
    )
}

function CategoryNavForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const c = section.config as CategoryNavSectionConfig
    const update = (partial: Partial<CategoryNavSectionConfig>) =>
        updateSectionConfig(section.id, partial)

    return (
        <div className="space-y-3">
            <Segmented
                label="Estilo"
                value={c.style}
                options={[
                    { value: 'pills', label: 'Pills' },
                    { value: 'tabs', label: 'Pestañas' },
                    { value: 'minimal', label: 'Mínimo' },
                ]}
                onChange={(style) => update({ style })}
            />
            <Toggle
                label="Fijo al hacer scroll"
                hint="Sticky"
                checked={c.sticky}
                onChange={(sticky) => update({ sticky })}
            />
            <Toggle
                label="Contador de productos"
                checked={c.showCount}
                onChange={(showCount) => update({ showCount })}
            />
        </div>
    )
}

const STYLE_LABELS: Record<MenuLayoutStyle, string> = {
    CLASSIC: 'Clásico',
    CARD: 'Tarjeta',
    HORIZONTAL: 'Horizontal',
    FLAT: 'Plano',
    DIVIDER: 'Divisor',
    FEATURED: 'Destacado',
}

// Etiqueta especial para el diseño clásico de Botones
const styleLabel = (layout: MenuLayout, style: MenuLayoutStyle) =>
    layout === 'LINKTREE' && style === 'CLASSIC' ? 'Píldora' : STYLE_LABELS[style]

function MenuForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const c = section.config as MenuSectionConfig
    const update = (partial: Partial<MenuSectionConfig>) => updateSectionConfig(section.id, partial)
    const isGrid = c.layout === 'GRID'
    const hasColumns = c.layout === 'GRID' || c.layout === 'BENTO'

    const layoutStyles = MENU_LAYOUT_STYLES[c.layout] as readonly MenuLayoutStyle[]
    const currentStyle: MenuLayoutStyle = layoutStyles.includes(c.layoutStyle ?? 'CLASSIC')
        ? (c.layoutStyle ?? 'CLASSIC')
        : 'CLASSIC'
    const usesSurface =
        !(
            (c.layout === 'LIST' && currentStyle === 'DIVIDER') ||
            ((c.layout === 'GRID' || c.layout === 'BENTO') && currentStyle === 'FLAT') ||
            (c.layout === 'LINKTREE' && currentStyle === 'CLASSIC')
        )

    return (
        <div className="space-y-3">
            <Segmented
                label="Layout"
                value={c.layout}
                options={[
                    { value: 'LIST', label: 'Lista' },
                    { value: 'GRID', label: 'Grid' },
                    { value: 'BENTO', label: 'Bento' },
                    { value: 'LINKTREE', label: 'Botones' },
                ]}
                onChange={(layout) => {
                    const nextStyles = MENU_LAYOUT_STYLES[layout] as readonly MenuLayoutStyle[]
                    const keep = nextStyles.includes(c.layoutStyle ?? 'CLASSIC')
                        ? (c.layoutStyle ?? 'CLASSIC')
                        : 'CLASSIC'
                    update({ layout, layoutStyle: keep })
                }}
            />
            <Segmented
                label="Diseño"
                value={currentStyle}
                options={layoutStyles.map((style) => ({
                    value: style,
                    label: styleLabel(c.layout, style),
                }))}
                onChange={(layoutStyle) => update({ layoutStyle })}
            />
            <div className="space-y-1">
                <Segmented
                    label="Columnas"
                    hint={
                        c.layout === 'BENTO'
                            ? 'Bento usa 2+ columnas'
                            : isGrid
                              ? undefined
                              : 'solo en Grid/Bento'
                    }
                    value={String(c.columns) as '1' | '2' | '3'}
                    options={[
                        { value: '1', label: '1' },
                        { value: '2', label: '2' },
                        { value: '3', label: '3' },
                    ]}
                    disabled={!hasColumns}
                    onChange={(value) => update({ columns: Number(value) as 1 | 2 | 3 })}
                />
                {hasColumns && c.columns > 2 && (
                    <p className="text-[11px] leading-snug text-zinc-400">
                        En teléfono se limita a 2 columnas para evitar que las tarjetas se vean
                        demasiado pequeñas.
                    </p>
                )}
            </div>
            <Segmented
                label="Espaciado"
                value={c.gap}
                options={[
                    { value: 'sm', label: 'Chico' },
                    { value: 'md', label: 'Mediano' },
                    { value: 'lg', label: 'Grande' },
                ]}
                onChange={(gap) => update({ gap })}
            />
            <Segmented
                label="Estilo de tarjeta"
                hint={usesSurface ? undefined : 'no aplica en esta variante'}
                value={c.cardStyle}
                options={[
                    { value: 'default', label: 'Base' },
                    { value: 'outlined', label: 'Contorno' },
                    { value: 'filled', label: 'Tinte' },
                ]}
                onChange={(cardStyle) => update({ cardStyle })}
            />
            <Toggle
                label="Mostrar imágenes"
                checked={c.showImages}
                onChange={(showImages) => update({ showImages })}
            />
            <Toggle
                label="Mostrar precios"
                checked={c.showPrices}
                onChange={(showPrices) => update({ showPrices })}
            />
            <Toggle
                label="Mostrar descripciones"
                checked={c.showDescriptions}
                onChange={(showDescriptions) => update({ showDescriptions })}
            />
        </div>
    )
}

function TextForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const setSectionAlignment = useCustomizationStore((s) => s.setSectionAlignment)
    const c = section.config as TextSectionConfig
    const update = (partial: Partial<TextSectionConfig>) => updateSectionConfig(section.id, partial)

    return (
        <div className="space-y-3">
            <TextField
                label="Título"
                hint="opcional"
                value={c.heading ?? ''}
                onChange={(heading) => update({ heading: heading || undefined })}
                placeholder="Ej: Nuestra historia"
            />
            <TextField
                label="Subtítulo"
                hint="opcional"
                value={c.subheading ?? ''}
                onChange={(subheading) => update({ subheading: subheading || undefined })}
            />
            <TextArea
                label="Texto"
                rows={4}
                value={c.body}
                onChange={(body) => update({ body })}
                placeholder="Escribe el contenido de la sección…"
            />
            <SelectField
                label="Tamaño de texto"
                value={c.fontSize}
                options={[
                    { value: 'sm', label: 'Pequeño' },
                    { value: 'md', label: 'Mediano' },
                    { value: 'lg', label: 'Grande' },
                    { value: 'xl', label: 'Muy grande' },
                    { value: '2xl', label: 'Enorme' },
                ]}
                onChange={(fontSize) => update({ fontSize })}
            />

            <div>
                <span className="mb-1 block text-xs font-bold text-zinc-600">Alineación</span>
                <div className="flex gap-3">
                    {(
                        [
                            { value: 'left', label: 'Izquierda' },
                            { value: 'center', label: 'Centro' },
                            { value: 'right', label: 'Derecha' },
                        ] as const
                    ).map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600"
                        >
                            <input
                                type="radio"
                                name="section-text-align"
                                checked={c.textAlign === option.value}
                                onChange={() => update({ textAlign: option.value })}
                                className="accent-zinc-900"
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            </div>

            <OptionalColorField
                label="Color de texto"
                value={c.textColor}
                onSet={(textColor) => update({ textColor })}
            />
            <OptionalColorField
                label="Color de fondo"
                value={c.bgColor}
                onSet={(bgColor) => update({ bgColor })}
            />
            <TextField
                label="Relleno"
                hint="ej: 24px 16px"
                value={c.padding}
                onChange={(padding) => update({ padding })}
            />
            <Segmented
                label="Alineación de la sección"
                value={section.alignment}
                options={[
                    { value: 'left', label: 'Izquierda' },
                    { value: 'center', label: 'Centro' },
                    { value: 'full', label: 'Completa' },
                ]}
                onChange={(alignment) => setSectionAlignment(section.id, alignment)}
            />
        </div>
    )
}

function ImageForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const c = section.config as ImageSectionConfig
    const update = (partial: Partial<ImageSectionConfig>) =>
        updateSectionConfig(section.id, partial)

    return (
        <div className="space-y-3">
            <ImagePicker
                label="Imagen"
                value={c.imageUrl}
                onChange={(imageUrl) => update({ imageUrl })}
            />
            <TextField
                label="Texto alternativo"
                hint="alt"
                value={c.alt}
                onChange={(alt) => update({ alt })}
            />
            <SliderField
                label="Opacidad"
                value={c.opacity}
                min={0}
                max={1}
                step={0.05}
                display={`${Math.round(c.opacity * 100)}%`}
                onChange={(opacity) => update({ opacity })}
            />
            <TextArea
                label="Texto superpuesto"
                rows={2}
                value={c.overlayText ?? ''}
                onChange={(overlayText) => update({ overlayText: overlayText || undefined })}
                placeholder="Ej: Promoción de la semana"
            />
            <TextField
                label="Subtítulo superpuesto"
                value={c.overlaySubheading ?? ''}
                onChange={(overlaySubheading) =>
                    update({ overlaySubheading: overlaySubheading || undefined })
                }
            />
            <TextField
                label="Texto del botón"
                hint="opcional"
                value={c.ctaText ?? ''}
                onChange={(ctaText) => update({ ctaText: ctaText || undefined })}
                placeholder="Ej: Pedir ahora"
            />
            <TextField
                label="URL del botón"
                value={c.ctaUrl ?? ''}
                onChange={(ctaUrl) => update({ ctaUrl: ctaUrl || undefined })}
                placeholder="https://…"
            />
            <TextField
                label="Radio de borde"
                hint="ej: 12px"
                value={c.borderRadius}
                onChange={(borderRadius) => update({ borderRadius })}
            />
            <SelectField
                label="Altura"
                value={c.height}
                options={[
                    { value: 'auto', label: 'Automática' },
                    { value: 'sm', label: 'Baja' },
                    { value: 'md', label: 'Media' },
                    { value: 'lg', label: 'Alta' },
                ]}
                onChange={(height) => update({ height })}
            />
        </div>
    )
}

function CarouselForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const c = section.config as CarouselSectionConfig
    const update = (partial: Partial<CarouselSectionConfig>) =>
        updateSectionConfig(section.id, partial)

    const updateItem = (itemId: string, partial: Partial<CarouselItem>) =>
        update({
            items: c.items.map((item) => (item.id === itemId ? { ...item, ...partial } : item)),
        })

    const addItem = () =>
        update({
            items: [
                ...c.items,
                { id: crypto.randomUUID(), imageUrl: '', opacity: 1 },
            ],
        })

    return (
        <div className="space-y-3">
            <Segmented
                label="Imágenes en pantalla"
                hint="1 a 3"
                value={String(c.perView ?? 3) as '1' | '2' | '3'}
                options={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                ]}
                onChange={(value) => update({ perView: Number(value) as 1 | 2 | 3 })}
            />
            <SelectField
                label="Altura"
                value={c.height ?? 'sm'}
                options={[
                    { value: 'sm', label: 'Baja' },
                    { value: 'md', label: 'Media' },
                    { value: 'lg', label: 'Alta' },
                ]}
                onChange={(height) => update({ height })}
            />
            <Toggle
                label="Reproducción automática"
                checked={c.autoPlay}
                onChange={(autoPlay) => update({ autoPlay })}
            />
            <SliderField
                label="Intervalo"
                value={c.interval}
                min={500}
                max={60000}
                step={500}
                display={`${(c.interval / 1000).toFixed(1)} s`}
                onChange={(interval) => update({ interval })}
            />
            <Toggle
                label="Mostrar indicadores (dots)"
                checked={c.showDots}
                onChange={(showDots) => update({ showDots })}
            />
            <Toggle
                label="Mostrar flechas"
                checked={c.showArrows}
                onChange={(showArrows) => update({ showArrows })}
            />

            <div className="space-y-3 border-t border-zinc-100 pt-3">
                <p className="text-xs font-bold text-zinc-600">
                    Imágenes ({c.items.length})
                </p>

                {c.items.map((item, index) => (
                    <div key={item.id} className="rounded-xl border border-zinc-100 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wide text-zinc-400">
                                Slide {index + 1}
                            </span>
                            <button
                                type="button"
                                aria-label="Quitar imagen del carrusel"
                                onClick={() =>
                                    update({ items: c.items.filter((i) => i.id !== item.id) })
                                }
                                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <ImagePicker
                                label="Imagen"
                                value={item.imageUrl}
                                onChange={(imageUrl) => updateItem(item.id, { imageUrl })}
                            />
                            <SliderField
                                label="Opacidad"
                                value={item.opacity}
                                min={0}
                                max={1}
                                step={0.05}
                                display={`${Math.round(item.opacity * 100)}%`}
                                onChange={(opacity) => updateItem(item.id, { opacity })}
                            />
                            <TextField
                                label="Texto superpuesto"
                                value={item.overlayText ?? ''}
                                onChange={(overlayText) =>
                                    updateItem(item.id, { overlayText: overlayText || undefined })
                                }
                            />
                            <TextField
                                label="Texto del botón"
                                value={item.ctaText ?? ''}
                                onChange={(ctaText) =>
                                    updateItem(item.id, { ctaText: ctaText || undefined })
                                }
                            />
                            <TextField
                                label="URL del botón"
                                value={item.ctaUrl ?? ''}
                                onChange={(ctaUrl) =>
                                    updateItem(item.id, { ctaUrl: ctaUrl || undefined })
                                }
                                placeholder="https://…"
                            />
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addItem}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-500 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar imagen
                </button>
            </div>
        </div>
    )
}

const PLATFORM_OPTIONS: { type: SocialPlatform['type']; label: string }[] = [
    { type: 'instagram', label: 'Instagram' },
    { type: 'tiktok', label: 'TikTok' },
    { type: 'whatsapp', label: 'WhatsApp' },
    { type: 'maps', label: 'Google Maps' },
    { type: 'custom', label: 'Otro (enlace)' },
]

function SocialForm({ section }: { section: Section }) {
    const updateSectionConfig = useCustomizationStore((s) => s.updateSectionConfig)
    const c = section.config as SocialSectionConfig
    const update = (partial: Partial<SocialSectionConfig>) =>
        updateSectionConfig(section.id, partial)

    const togglePlatform = (type: SocialPlatform['type'], enabled: boolean) => {
        if (enabled) {
            update({
                platforms: [...c.platforms, { id: crypto.randomUUID(), type, url: 'https://' }],
            })
            return
        }
        update({ platforms: c.platforms.filter((p) => p.type !== type) })
    }

    const mapPlatform = (id: string, partial: Partial<SocialPlatform>) =>
        update({
            platforms: c.platforms.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <span className="block text-xs font-bold text-zinc-600">Plataformas</span>
                {PLATFORM_OPTIONS.map((option) => {
                    const platform = c.platforms.find((p) => p.type === option.type)
                    return (
                        <div key={option.type} className="rounded-xl border border-zinc-100 px-3 py-2">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={Boolean(platform)}
                                    onChange={(e) => togglePlatform(option.type, e.target.checked)}
                                    className="accent-zinc-900"
                                />
                                <span className="text-xs font-bold text-zinc-700">
                                    {option.label}
                                </span>
                            </label>
                            {platform && (
                                <div className="mt-2 space-y-2 pl-1">
                                    <TextField
                                        label="URL"
                                        value={platform.url}
                                        onChange={(url) => mapPlatform(platform.id, { url })}
                                        placeholder="https://…"
                                    />
                                    {option.type === 'custom' && (
                                        <TextField
                                            label="Nombre visible"
                                            value={platform.label ?? ''}
                                            onChange={(label) =>
                                                mapPlatform(platform.id, {
                                                    label: label || undefined,
                                                })
                                            }
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <Segmented
                label="Disposición"
                value={c.layout}
                options={[
                    { value: 'row', label: 'Fila' },
                    { value: 'grid', label: 'Grid' },
                ]}
                onChange={(layout) => update({ layout })}
            />
            <Segmented
                label="Tamaño de iconos"
                value={c.iconSize}
                options={[
                    { value: 'sm', label: 'Chico' },
                    { value: 'md', label: 'Mediano' },
                    { value: 'lg', label: 'Grande' },
                ]}
                onChange={(iconSize) => update({ iconSize })}
            />
            <Toggle
                label="Mostrar etiquetas"
                checked={c.showLabels}
                onChange={(showLabels) => update({ showLabels })}
            />
            <ColorField
                label="Color de fondo"
                value={c.bgColor ?? ''}
                onChange={(bgColor) => update({ bgColor })}
            />
            <TextField
                label="Relleno"
                hint="ej: 16px"
                value={c.padding ?? ''}
                onChange={(padding) => update({ padding: padding || undefined })}
            />
        </div>
    )
}

// ---------- Panel ----------

function SectionFields({ section }: { section: Section }) {
    switch (section.type) {
        case 'header':
            return <HeaderForm section={section} />
        case 'category-nav':
            return <CategoryNavForm section={section} />
        case 'menu':
            return <MenuForm section={section} />
        case 'text':
            return <TextForm section={section} />
        case 'image':
            return <ImageForm section={section} />
        case 'carousel':
            return <CarouselForm section={section} />
        case 'social':
            return <SocialForm section={section} />
    }
}

/**
 * Panel de configuración de la sección seleccionada en el canvas.
 * Cambia de formulario según `section.type`; no renderiza nada sin selección.
 */
export function SectionConfigPanel() {
    const section = useCustomizationStore((s) =>
        s.layoutJson.sections.find((x) => x.id === s.selectedSectionId),
    )
    const selectSection = useCustomizationStore((s) => s.selectSection)
    const setSectionVisible = useCustomizationStore((s) => s.setSectionVisible)
    const panelRef = useRef<HTMLElement>(null)
    const sectionId = section?.id

    // Al cambiar de sección, traer el panel a la vista si quedó fuera del viewport
    useEffect(() => {
        if (sectionId) {
            panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [sectionId])

    if (!section) return null

    const meta = SECTION_META[section.type]
    const Icon = meta.icon

    return (
        <section ref={panelRef} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-zinc-900">{meta.label}</p>
                    <p className="text-[11px] text-zinc-400">Configuración de la sección</p>
                </div>
                <button
                    type="button"
                    aria-label="Cerrar configuración"
                    title="Cerrar"
                    onClick={() => selectSection(null)}
                    className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                    {section.visible ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                        <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    Visible
                </span>
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        role="switch"
                        checked={section.visible}
                        onChange={(e) => setSectionVisible(section.id, e.target.checked)}
                        className="sr-only"
                    />
                    <span
                        aria-hidden
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors after:absolute after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] ${
                            section.visible
                                ? 'bg-zinc-900 after:translate-x-4'
                                : 'bg-zinc-300 after:translate-x-0.5'
                        }`}
                    />
                </label>
            </div>

            <SectionFields section={section} />

            <div className="mt-4 border-t border-zinc-100 pt-3">
                {section.visible ? (
                    <button
                        type="button"
                        onClick={() => setSectionVisible(section.id, false)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                        Ocultar permanentemente
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setSectionVisible(section.id, true)}
                        className="w-full rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700"
                    >
                        Mostrar sección
                    </button>
                )}
            </div>
        </section>
    )
}

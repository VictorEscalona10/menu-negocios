'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
    Camera,
    ChevronLeft,
    ChevronRight,
    Globe,
    MapPin,
    MessageCircle,
    Music2,
    Shapes,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
    AdvancedCustomization,
    CarouselSectionConfig,
    CategoryNavSectionConfig,
    DeviceView,
    GlobalStyle,
    HeaderSectionConfig,
    ImageSectionConfig,
    MenuSectionConfig,
    Section,
    SocialPlatform,
    SocialSectionConfig,
    TextSectionConfig,
} from '@/src/types/customization'
import {
    bentoSpan,
    cardSurface,
    chipStyle,
    designStyleOf,
    imageWellStyle,
    navPillStyle,
    scopedGlobalStyle,
    withAlpha,
} from '@/src/styles/designStyles'
import type { SectionColorOverrides } from '@/src/types/customization'
import { HeaderView } from './HeaderView'
import BsPrice from '../../../components/BsPrice'

type SectionRendererProps = {
    section: Section
    layoutJson: AdvancedCustomization
    deviceView?: DeviceView
    /** Habilita links CTA y autoplay (menú vivo / preview real). Las cards de
     * plantillas lo dejan en false para no anidar links dentro de cards clicables. */
    interactive?: boolean
}

const GAP_CLASS: Record<MenuSectionConfig['gap'], string> = {
    sm: 'gap-1.5',
    md: 'gap-2.5',
    lg: 'gap-4',
}

const IMAGE_HEIGHT_CLASS: Record<ImageSectionConfig['height'], string> = {
    auto: 'min-h-28',
    sm: 'h-24',
    md: 'h-36',
    lg: 'h-48',
}

const CAROUSEL_HEIGHT_CLASS: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'h-24',
    md: 'h-36',
    lg: 'h-48',
}

const TEXT_CLASS: Record<TextSectionConfig['fontSize'], string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
}

const SOCIAL_ICON_CLASS: Record<SocialSectionConfig['iconSize'], string> = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
}

const SOCIAL_ICON: Record<SocialPlatform['type'], LucideIcon> = {
    instagram: Camera,
    tiktok: Music2,
    whatsapp: MessageCircle,
    maps: MapPin,
    custom: Globe,
}

const CATEGORIES = [
    { name: 'Favoritos', count: 12 },
    { name: 'Bebidas', count: 8 },
    { name: 'Postres', count: 5 },
]

interface MenuPreviewItem {
    name: string
    price: string
    /** Precio numérico en USD para convertir a Bs en el preview. */
    priceUsd: number
    desc: string
    isCombo?: boolean
    comboBadge?: string
}

const MENU_ITEMS: MenuPreviewItem[] = [
    { name: 'Café latte', price: '$4.50', priceUsd: 4.5, desc: 'Espresso con leche vaporizada' },
    { name: 'Combo Familiar', price: '$12.90', priceUsd: 12.9, desc: 'Pizza grande + 2 bebidas', isCombo: true, comboBadge: 'COMBO' },
    { name: 'Brownie', price: '$3.20', priceUsd: 3.2, desc: 'Con helado de vainilla' },
    { name: 'Pancakes', price: '$6.00', priceUsd: 6, desc: 'Tres unidades con miel' },
    { name: 'Jugo natural', price: '$3.80', priceUsd: 3.8, desc: 'Naranja o limón' },
]

function Placeholder({
    icon: Icon,
    text,
    minHeight = 'min-h-24',
}: {
    icon: LucideIcon
    text: string
    minHeight?: string
}) {
    return (
        <div
            className={`flex w-full ${minHeight} flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-current opacity-50`}
        >
            <Icon className="h-5 w-5" />
            <span className="px-3 text-center text-[11px] font-semibold">{text}</span>
        </div>
    )
}

/**
 * Carrusel real con scroll-snap: todos los items, flechas y dots funcionales
 * y autoplay opcional (solo cuando `interactive` está activo).
 */
function CarouselView({
    c,
    g,
    perView,
    interactive,
}: {
    c: CarouselSectionConfig
    g: GlobalStyle
    perView: number
    interactive: boolean
}) {
    const design = designStyleOf(g)
    const scrollerRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const count = c.items.length
    const cols = Math.min(perView, count)
    const maxIndex = Math.max(0, count - cols)

    const stride = (): number => {
        const el = scrollerRef.current
        const first = el?.firstElementChild as HTMLElement | null
        if (!el || !first) return 0
        const style = window.getComputedStyle(el)
        const gap = parseFloat(style.columnGap || style.gap || '0') || 0
        return first.getBoundingClientRect().width + gap
    }

    const goTo = (target: number) => {
        const el = scrollerRef.current
        if (!el) return
        const s = stride()
        if (s <= 0) return
        const clamped = Math.min(Math.max(target, 0), maxIndex)
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollTo({ left: clamped * s, behavior: reduced ? 'auto' : 'smooth' })
    }

    const handleScroll = () => {
        const el = scrollerRef.current
        const s = stride()
        if (!el || s <= 0) return
        setIndex(Math.min(Math.round(el.scrollLeft / s), maxIndex))
    }

    useEffect(() => {
        if (!interactive || !c.autoPlay || count <= cols) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const id = window.setInterval(() => {
            const el = scrollerRef.current
            const s = stride()
            if (!el || s <= 0) return
            const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4
            el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + s, behavior: 'smooth' })
        }, c.interval)
        return () => window.clearInterval(id)
    }, [interactive, c.autoPlay, c.interval, count, cols])

    if (count === 0) {
        return (
            <div className="px-3 py-2">
                <Placeholder
                    icon={Shapes}
                    text="Carrusel sin imágenes: agrega items"
                    minHeight="min-h-32"
                />
            </div>
        )
    }

    return (
        <div className="relative w-full px-3 py-2">
            <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto"
            >
                {c.items.map((item) => (
                    <div
                        key={item.id}
                        className={`relative shrink-0 snap-start overflow-hidden rounded-xl ${
                            CAROUSEL_HEIGHT_CLASS[c.height ?? 'sm']
                        }`}
                        style={{
                            flexBasis: `calc((100% - ${(cols - 1) * 0.5}rem) / ${cols})`,
                            ...cardSurface(design, g, 'default'),
                        }}
                    >
                        {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={item.imageUrl}
                                alt={item.overlayText ?? ''}
                                className="h-full w-full object-cover"
                                style={{ opacity: item.opacity }}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Shapes className="h-5 w-5 opacity-50" />
                            </div>
                        )}
                        {(item.overlayText || item.ctaText) && (
                            <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-1 px-1">
                                {item.overlayText && (
                                    <span
                                        className="text-center text-[11px] font-black"
                                        style={{ color: g.textColor }}
                                    >
                                        {item.overlayText}
                                    </span>
                                )}
                                {item.ctaText &&
                                    (interactive && item.ctaUrl ? (
                                        <a
                                            href={item.ctaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="max-w-full truncate rounded-full px-2.5 py-0.5 text-[10px] font-black"
                                            style={{
                                                backgroundColor: g.accentColor,
                                                color: g.buttonTextColor,
                                            }}
                                        >
                                            {item.ctaText}
                                        </a>
                                    ) : (
                                        <span
                                            className="max-w-full truncate rounded-full px-2.5 py-0.5 text-[10px] font-black"
                                            style={{
                                                backgroundColor: g.accentColor,
                                                color: g.buttonTextColor,
                                            }}
                                        >
                                            {item.ctaText}
                                        </span>
                                    ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {c.showArrows && maxIndex > 0 && (
                <>
                    <button
                        type="button"
                        aria-label="Slide anterior"
                        onClick={() => goTo(index - 1)}
                        disabled={index <= 0}
                        className="absolute left-0 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-opacity disabled:opacity-40"
                        style={chipStyle(design, g)}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Slide siguiente"
                        onClick={() => goTo(index + 1)}
                        disabled={index >= maxIndex}
                        className="absolute right-0 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-opacity disabled:opacity-40"
                        style={chipStyle(design, g)}
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </>
            )}

            {c.showDots && maxIndex > 0 && (
                <div className="mt-2 flex justify-center gap-1.5">
                    {Array.from({ length: maxIndex + 1 }, (_, page) => (
                        <button
                            key={page}
                            type="button"
                            aria-label={`Ir al slide ${page + 1}`}
                            onClick={() => goTo(page)}
                            className="h-1.5 w-1.5 rounded-full transition-colors"
                            style={{
                                backgroundColor:
                                    page === index ? g.accentColor : g.subtextColor,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Previsualiza una sección del layout (editor + renderer público).
 * Respeta `deviceView`: en phone y tablet limita el grid a máximo 2 columnas.
 */
export function SectionRenderer({
    section,
    layoutJson,
    deviceView,
    interactive = false,
}: SectionRendererProps) {
    // Global con los overrides de color de la sección aplicados (si los tiene):
    // todo lo que pintemos dentro de la sección hereda estos colores.
    const sectionColors = section.config as SectionColorOverrides
    const g: GlobalStyle = scopedGlobalStyle(layoutJson.global, sectionColors)
    const device = deviceView ?? layoutJson.deviceView
    const isPhone = device === 'phone'
    const isTablet = device === 'tablet'
    const scale = isPhone ? 0.85 : 1

    const headingFont: CSSProperties = { fontFamily: `'${g.fontHeading}', sans-serif` }
    const bodyFont: CSSProperties = { fontFamily: `'${g.fontBody}', sans-serif` }
    const design = designStyleOf(g)

    const cardStyle = (config: MenuSectionConfig): CSSProperties =>
        cardSurface(design, g, config.cardStyle)

    const accentText = (): CSSProperties => ({ color: g.accentColor })

    const productCard = (item: (typeof MENU_ITEMS)[number], config: MenuSectionConfig) => {
        const style = config.layoutStyle ?? 'CLASSIC'

        if (style === 'HORIZONTAL') {
            return (
                <div className="flex items-center gap-2 rounded-xl p-2" style={cardStyle(config)}>
                    {config.showImages && (
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                            style={imageWellStyle(design, g, config.cardStyle)}
                        >
                            <Shapes className="h-4 w-4 opacity-50" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{item.name}</p>
                        {config.showDescriptions && (
                            <p className="truncate text-[10px] opacity-60">{item.desc}</p>
                        )}
                        <div className="mt-0.5 flex items-center justify-between gap-1">
                            {config.showPrices && (
                                <div>
                                    <p className="text-[11px] font-bold" style={accentText()}>
                                        {item.price}
                                    </p>
                                    <BsPrice usd={item.priceUsd} enabled={config.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                                </div>
                            )}
                            <span
                                className="ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black"
                                style={{ backgroundColor: g.accentColor, color: g.buttonTextColor }}
                            >
                                +
                            </span>
                        </div>
                    </div>
                </div>
            )
        }

        if (style === 'FLAT') {
            return (
                <div
                    className="rounded-xl border-[1.5px] p-2 text-center"
                    style={{
                        borderColor: withAlpha(g.textColor, 0.15),
                        backgroundColor: 'transparent',
                    }}
                >
                    {config.showImages && (
                        <div
                            className="mb-1.5 flex aspect-[16/10] items-center justify-center rounded-lg border"
                            style={{ borderColor: withAlpha(g.textColor, 0.12) }}
                        >
                            <Shapes className="h-4 w-4 opacity-50" />
                        </div>
                    )}
                    <p className="truncate text-xs font-semibold">{item.name}</p>
                    {config.showDescriptions && (
                        <p className="truncate text-[10px] opacity-60">{item.desc}</p>
                    )}
                    <div className="mt-0.5 flex items-center justify-center gap-1">
                        {config.showPrices && (
                            <div>
                                <p className="text-[11px] font-bold" style={accentText()}>
                                    {item.price}
                                </p>
                                <BsPrice usd={item.priceUsd} enabled={config.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                            </div>
                        )}
                        <span
                            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black"
                            style={{ backgroundColor: g.accentColor, color: g.buttonTextColor }}
                        >
                            +
                        </span>
                    </div>
                </div>
            )
        }

        return (
            <div className="rounded-xl p-2" style={cardStyle(config)}>
                {config.showImages && (
                    <div
                        className="mb-1.5 flex aspect-[4/3] items-center justify-center rounded-lg"
                        style={imageWellStyle(design, g, config.cardStyle)}
                    >
                        <Shapes className="h-4 w-4 opacity-50" />
                    </div>
                )}
                <p className="truncate text-xs font-semibold">{item.name}</p>
                {config.showDescriptions && (
                    <p className="truncate text-[10px] opacity-60">{item.desc}</p>
                )}
                {config.showPrices && (
                    <div className="mt-0.5">
                        <p className="text-[11px] font-bold" style={accentText()}>
                            {item.price}
                        </p>
                        <BsPrice usd={item.priceUsd} enabled={config.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                    </div>
                )}
            </div>
        )
    }

    // Card destacada de COMBO para el preview del editor: imagen/pojo arriba
    // full-width, etiqueta "COMBO" (o comboBadge) arriba a la derecha e
    // información abajo. Refleja la ComboCard del menú público.
    const comboCard = (
        item: MenuPreviewItem,
        config: MenuSectionConfig,
        fontScale?: CSSProperties,
    ) => (
        <div
            className="relative flex flex-col overflow-hidden rounded-2xl"
            style={{ ...cardStyle(config), border: `2px solid ${g.accentColor}` }}
        >
            {config.showImages && (
                <div
                    className="flex h-20 w-full shrink-0 items-center justify-center"
                    style={{ backgroundColor: `${g.accentColor}15` }}
                >
                    <Shapes className="h-5 w-5 opacity-50" />
                </div>
            )}
            <span
                className="absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: g.accentColor, color: g.buttonTextColor }}
            >
                ⭐ {item.comboBadge || 'COMBO'}
            </span>
            <div
                className="flex flex-1 flex-col justify-between gap-1 p-2"
                style={fontScale}
            >
                <div>
                    <p className="truncate text-xs font-bold">{item.name}</p>
                    {config.showDescriptions && (
                        <p className="truncate text-[10px] opacity-60">{item.desc}</p>
                    )}
                </div>
                {config.showPrices && (
                    <div>
                        <p className="text-[11px] font-extrabold" style={{ color: g.accentColor }}>
                            {item.price}
                        </p>
                        <BsPrice usd={item.priceUsd} enabled={config.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                    </div>
                )}
            </div>
        </div>
    )

    const renderByType = (): ReactNode => {
        switch (section.type) {
            case 'header': {
                const c = section.config as HeaderSectionConfig
                return (
                    <HeaderView
                        c={c}
                        g={g}
                        alignment={section.alignment}
                        name="Mi tienda"
                        subtitle={c.subtitle}
                    />
                )
            }

                        case 'category-nav': {
                const c = section.config as CategoryNavSectionConfig
                return (
                    <div
                        className={`relative z-20 shrink-0 ${c.style === 'tabs' ? 'border-b' : ''}`}
                        style={{
                            background: `${g.backgroundColor}f0`,
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <div
                            className={`flex w-full items-center gap-2 overflow-x-auto hide-scrollbar px-4 py-2.5`}
                        >
                            {CATEGORIES.map((cat, i) => {
                                const isPill = c.style === 'pills'
                                const isActive = i === 0
                                return (
                                    <button
                                        key={cat.name}
                                        type="button"
                                        className={`shrink-0 px-4 py-1.5 rounded-full font-manrope font-semibold text-xs transition-all duration-200 whitespace-nowrap active:scale-95`}
                                        style={
                                            isPill
                                                ? navPillStyle(design, g, isActive)
                                                : { color: isActive ? g.accentColor : g.subtextColor }
                                        }
                                    >
                                        {cat.name}
                                        {c.showCount && (
                                            <span className="opacity-70">{cat.count}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
)
            }

            case 'menu': {
                const c = section.config as MenuSectionConfig
                const columns = isPhone || isTablet ? Math.min(c.columns, 2) : c.columns
                const fontScale = { fontSize: `${Math.round(12 * scale)}px` }

                if (c.layout === 'LINKTREE') {
                    const style = c.layoutStyle ?? 'CLASSIC'

                    if (style === 'CARD') {
                        return (
                            <div className={`flex w-full flex-col ${GAP_CLASS[c.gap]} px-3 py-2`}>
                                {MENU_ITEMS.slice(0, 4).map((item) => (
                                    item.isCombo ? (
                                        <div key={item.name} className="py-1">
                                            {comboCard(item, c, fontScale)}
                                        </div>
                                    ) : (
                                    <div
                                        key={item.name}
                                        className="flex items-center gap-2 rounded-2xl p-2.5"
                                        style={cardStyle(c)}
                                    >
                                        <div className="min-w-0 flex-1" style={fontScale}>
                                            <p className="truncate text-xs font-black">
                                                {item.name}
                                            </p>
                                            {c.showDescriptions && (
                                                <p className="truncate text-[10px] opacity-60">
                                                    {item.desc}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            {c.showPrices && (
                                                <div>
                                                    <p
                                                        className="text-[11px] font-bold"
                                                        style={accentText()}
                                                    >
                                                        {item.price}
                                                    </p>
                                                    <BsPrice usd={item.priceUsd} enabled={c.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                                                </div>
                                            )}
                                            <span
                                                className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black"
                                                style={{
                                                    backgroundColor: g.accentColor,
                                                    color: g.buttonTextColor,
                                                }}
                                            >
                                                +
                                            </span>
                                        </div>
                                    </div>
                                    )
                                ))}
                            </div>
                        )
                    }

                    return (
                        <div className={`flex w-full flex-col ${GAP_CLASS[c.gap]} px-3 py-2`}>
                            {MENU_ITEMS.slice(0, 4).map((item) => (
                                item.isCombo ? (
                                    <div key={item.name} className="py-1">
                                        {comboCard(item, c, fontScale)}
                                    </div>
                                ) : (
                                <div
                                    key={item.name}
                                    className="rounded-full px-4 py-2 text-center text-xs font-black"
                                    style={navPillStyle(design, g, true)}
                                >
                                    {item.name}
                                </div>
                                )
                            ))}
                        </div>
                    )
                }

                if (c.layout === 'LIST') {
                    const style = c.layoutStyle ?? 'CLASSIC'

                    if (style === 'DIVIDER') {
                        return (
                            <div className={`flex w-full flex-col ${GAP_CLASS[c.gap]} px-3 py-2`}>
                                {MENU_ITEMS.map((item, index) => (
                                    item.isCombo ? (
                                        <div key={item.name} className="py-1">
                                            {comboCard(item, c, fontScale)}
                                        </div>
                                    ) : (
                                    <div
                                        key={item.name}
                                        className={`flex items-center gap-2 py-2 ${
                                            index === MENU_ITEMS.length - 1 ? '' : 'border-b'
                                        }`}
                                        style={{ borderColor: withAlpha(g.textColor, 0.12) }}
                                    >
                                        {c.showImages && (
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                                <Shapes className="h-3.5 w-3.5 opacity-50" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1" style={fontScale}>
                                            <p className="truncate text-xs font-semibold">
                                                {item.name}
                                            </p>
                                            {c.showDescriptions && (
                                                <p className="truncate text-[10px] opacity-60">
                                                    {item.desc}
                                                </p>
                                            )}
                                        </div>
                                        {c.showPrices && (
                                            <div className="shrink-0">
                                                <p
                                                    className="text-xs font-bold"
                                                    style={accentText()}
                                                >
                                                    {item.price}
                                                </p>
                                                <BsPrice usd={item.priceUsd} enabled={c.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                                            </div>
                                        )}
                                    </div>
                                    )
                                ))}
                            </div>
                        )
                    }

                    if (style === 'FEATURED') {
                        return (
                            <div className={`flex w-full flex-col ${GAP_CLASS[c.gap]} px-3 py-2`}>
                                {MENU_ITEMS.map((item) => (
                                    item.isCombo ? (
                                        <div key={item.name} className="py-1">
                                            {comboCard(item, c, fontScale)}
                                        </div>
                                    ) : (
                                    <div
                                        key={item.name}
                                        className="flex items-center gap-2 rounded-xl p-2"
                                        style={{
                                            ...cardStyle(c),
                                            backgroundColor: withAlpha(
                                                g.accentColor,
                                                0.12,
                                            ),
                                        }}
                                    >
                                        {c.showImages && (
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                                style={imageWellStyle(design, g, c.cardStyle)}
                                            >
                                                <Shapes className="h-4 w-4 opacity-50" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1" style={fontScale}>
                                            <p className="truncate text-xs font-semibold">
                                                {item.name}
                                            </p>
                                            {c.showDescriptions && (
                                                <p className="truncate text-[10px] opacity-60">
                                                    {item.desc}
                                                </p>
                                            )}
                                        </div>
                                        {c.showPrices && (
                                            <div className="shrink-0">
                                                <p
                                                    className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                                    style={{
                                                        backgroundColor: g.accentColor,
                                                        color: g.buttonTextColor,
                                                    }}
                                                >
                                                    {item.price}
                                                </p>
                                                <BsPrice usd={item.priceUsd} enabled={c.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                                            </div>
                                        )}
                                    </div>
                                    )
                                ))}
                            </div>
                        )
                    }

                    return (
                        <div className={`flex w-full flex-col ${GAP_CLASS[c.gap]} px-3 py-2`}>
                            {MENU_ITEMS.map((item) => (
                                item.isCombo ? (
                                    <div key={item.name} className="py-1">
                                        {comboCard(item, c, fontScale)}
                                    </div>
                                ) : (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-2 rounded-xl p-2"
                                    style={cardStyle(c)}
                                >
                                    {c.showImages && (
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                            style={imageWellStyle(design, g, c.cardStyle)}
                                        >
                                            <Shapes className="h-4 w-4 opacity-50" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1" style={fontScale}>
                                        <p className="truncate text-xs font-semibold">
                                            {item.name}
                                        </p>
                                        {c.showDescriptions && (
                                            <p className="truncate text-[10px] opacity-60">
                                                {item.desc}
                                            </p>
                                        )}
                                    </div>
                                    {c.showPrices && (
                                        <div className="shrink-0">
                                            <p
                                                className="text-xs font-bold"
                                                style={accentText()}
                                            >
                                                {item.price}
                                            </p>
                                            <BsPrice usd={item.priceUsd} enabled={c.showBsPrice ?? true} color={g.subtextColor} className="text-[9px]" />
                                        </div>
                                    )}
                                </div>
                                )
                            ))}
                        </div>
                    )
                }

                const isBento = c.layout === 'BENTO' && columns > 1

                return (
                    <div
                        className={`grid w-full ${GAP_CLASS[c.gap]} px-3 py-2`}
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {MENU_ITEMS.map((item, index) => (
                            <div
                                key={item.name}
                                style={{
                                    ...fontScale,
                                    ...(item.isCombo
                                        ? { gridColumn: '1 / -1' }
                                        : isBento && bentoSpan(index)
                                          ? { gridColumn: 'span 2' }
                                          : null),
                                }}
                            >
                                {item.isCombo ? comboCard(item, c) : productCard(item, c)}
                            </div>
                        ))}
                    </div>
                )
            }

            case 'text': {
                const c = section.config as TextSectionConfig
                if (!c.body && !c.heading) {
                    return (
                        <div className="w-full px-3 py-2">
                            <Placeholder icon={Shapes} text="Sección de texto vacía" />
                        </div>
                    )
                }
                return (
                    <div
                        className="w-full"
                        style={{
                            padding: c.padding,
                            backgroundColor: c.bgColor,
                            color: c.textColor ?? g.textColor,
                            textAlign: c.textAlign,
                        }}
                    >
                        {c.heading && (
                            <p
                                className={`font-black ${TEXT_CLASS[c.fontSize]}`}
                                style={headingFont}
                            >
                                {c.heading}
                            </p>
                        )}
                        {c.subheading && (
                            <p className={`mt-1 font-semibold opacity-70 ${TEXT_CLASS[c.fontSize]}`}>
                                {c.subheading}
                            </p>
                        )}
                        <p className={`mt-1 leading-snug ${TEXT_CLASS[c.fontSize]}`}>{c.body}</p>
                    </div>
                )
            }

            case 'image': {
                const c = section.config as ImageSectionConfig
                return (
                    <div
                        className={`relative flex w-full ${IMAGE_HEIGHT_CLASS[c.height]} items-center justify-center overflow-hidden`}
                        style={{ borderRadius: c.borderRadius }}
                    >
                        {c.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={c.imageUrl}
                                alt={c.alt}
                                className="h-full w-full object-cover"
                                style={{ opacity: c.opacity }}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-current opacity-60"
                                style={{ opacity: c.opacity }}
                            >
                                <Shapes className="h-5 w-5" />
                                <span className="text-[11px] font-semibold">
                                    Imagen sin asignar
                                </span>
                            </div>
                        )}

                        {(c.overlayText || c.overlaySubheading || c.ctaText) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-4 text-center">
                                {c.overlayText && (
                                    <span
                                        className="text-base font-black"
                                        style={{ ...headingFont, color: g.textColor }}
                                    >
                                        {c.overlayText}
                                    </span>
                                )}
                                {c.overlaySubheading && (
                                    <span
                                        className="text-xs"
                                        style={{
                                            color: c.overlaySubheadingColor ?? g.subtextColor,
                                        }}
                                    >
                                        {c.overlaySubheading}
                                    </span>
                                )}
                                {c.ctaText &&
                                    (interactive && c.ctaUrl ? (
                                        <a
                                            href={c.ctaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1.5 max-w-[calc(100%-2rem)] truncate rounded-full px-4 py-1.5 text-xs font-black"
                                            style={{
                                                backgroundColor: g.accentColor,
                                                color: g.buttonTextColor,
                                            }}
                                        >
                                            {c.ctaText}
                                        </a>
                                    ) : (
                                        <span
                                            className="mt-1.5 max-w-[calc(100%-2rem)] truncate rounded-full px-4 py-1.5 text-xs font-black"
                                            style={{
                                                backgroundColor: g.accentColor,
                                                color: g.buttonTextColor,
                                            }}
                                        >
                                            {c.ctaText}
                                        </span>
                                    ))}
                            </div>
                        )}
                    </div>
                )
            }

            case 'carousel': {
                const c = section.config as CarouselSectionConfig
                const perView = Math.min(3, Math.max(1, c.perView ?? 3))
                return (
                    <CarouselView
                        c={c}
                        g={g}
                        perView={perView}
                        interactive={interactive}
                    />
                )
            }

            case 'social': {
                const c = section.config as SocialSectionConfig
                if (c.platforms.length === 0) {
                    return (
                        <div className="px-3 py-2">
                            <Placeholder
                                icon={Shapes}
                                text="Sin redes conectadas: agrega plataformas"
                            />
                        </div>
                    )
                }

                const align = c.align ?? 'center'
                const justifyClass =
                    c.layout === 'grid'
                        ? align === 'left'
                            ? 'justify-items-start'
                            : align === 'right'
                              ? 'justify-items-end'
                              : 'justify-items-center'
                        : align === 'left'
                          ? 'justify-start'
                          : align === 'right'
                            ? 'justify-end'
                            : 'justify-center'

                return (
                    <div
                        className={`flex w-full px-3 py-2 ${
                            c.layout === 'grid'
                                ? `grid grid-cols-2 gap-2 ${justifyClass}`
                                : `flex-row flex-wrap items-center gap-3 ${justifyClass}`
                        }`}
                        style={{
                            backgroundColor: c.bgColor,
                            padding: c.padding ?? undefined,
                        }}
                    >
                        {c.platforms.map((platform) => {
                            const Icon = SOCIAL_ICON[platform.type] ?? Globe
                            return (
                                <span
                                    key={platform.id}
                                    className="flex items-center gap-2"
                                    style={{ color: g.subtextColor }}
                                >
                                    <span
                                        className={`flex ${SOCIAL_ICON_CLASS[c.iconSize]} items-center justify-center rounded-full`}
                                        style={chipStyle(design, g)}
                                    >
                                        <Icon className="h-1/2 w-1/2" />
                                    </span>
                                    {c.showLabels && (
                                        <span className="text-[11px] font-semibold">
                                            {platform.label ?? platform.type}
                                        </span>
                                    )}
                                </span>
                            )
                        })}
                    </div>
                )
            }
        }
    }

    const alignClass =
        section.alignment === 'center'
            ? 'items-center text-center'
            : section.alignment === 'left'
              ? 'items-start text-left'
              : ''

    // Nav de categorías "fijo al hacer scroll": el sticky va en el wrapper
    // raíz para que su recorrido sea todo el contenedor scroll del preview.
    const stickyNav =
        section.type === 'category-nav' &&
        (section.config as CategoryNavSectionConfig).sticky

    // Título/subtítulo opcionales sobre el contenido (menú y categorías)
    const headingCfg = section.config as { heading?: string; subheading?: string }
    const showHeading =
        (section.type === 'menu' || section.type === 'category-nav') &&
        Boolean(headingCfg.heading || headingCfg.subheading)

    return (
        <div
            className={`flex w-full flex-col ${alignClass}${stickyNav ? ' sticky top-0 z-20' : ''}`}
            style={{
                ...bodyFont,
                color: g.textColor,
                backgroundColor: sectionColors.bgColor,
            }}
        >
            {showHeading && (
                <div className="px-4 pb-1 pt-2">
                    {headingCfg.heading && (
                        <p
                            className="text-sm font-black"
                            style={{ ...headingFont, color: g.textColor }}
                        >
                            {headingCfg.heading}
                        </p>
                    )}
                    {headingCfg.subheading && (
                        <p className="mt-0.5 text-xs" style={{ color: g.subtextColor }}>
                            {headingCfg.subheading}
                        </p>
                    )}
                </div>
            )}
            {renderByType()}
        </div>
    )
}

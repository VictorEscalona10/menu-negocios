// app/components/AdvancedMenuUI.tsx
'use client'

import { Fragment, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'
import { Camera, Globe, MapPin, MessageCircle, Music2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'
import AddToCartButton from '../menu/[slug]/AddToCartButton'
import BsPrice from './BsPrice'
import ComboCard from './ComboCard'
import FloatingCart from '../menu/[slug]/components/FloatingCart'
import OrderModeBar from '../menu/[slug]/components/OrderModeBar'
import type { OrderContext } from '@/src/types/order'
import ProductConfiguratorModal from '../menu/[slug]/components/ProductConfiguratorModal'
import ProductViewModal from './ProductViewModal'
import SharedMenuUI from './SharedMenuUI'
import { SectionRenderer } from '../dashboard/customization/sections/SectionRenderer'
import { HeaderView } from '../dashboard/customization/sections/HeaderView'
import {
    defaultGlobalStyle,
    type AdvancedCustomization,
    type CategoryNavSectionConfig,
    type DeviceView,
    type GlobalStyle,
    type HeaderSectionConfig,
    type MenuSectionConfig,
    type Section,
    type SocialPlatform,
    type SocialSectionConfig,
} from '@/src/types/customization'
import {
    bentoSpan,
    cardSurface,
    chipStyle,
    designStyleOf,
    isDarkColor,
    navPillStyle,
    pageBackdrop,
    scopedGlobalStyle,
    withAlpha,
} from '@/src/styles/designStyles'

type BaseStore = Parameters<typeof SharedMenuUI>[0]['store']
type BaseCategory = BaseStore['categories'][number]
type BaseProduct = BaseCategory['products'][number]

type StoreProduct = Omit<BaseProduct, 'modifierGroups'> & {
    modifierGroups?: Array<{
        id: string
        name: string
        isRequired: boolean
        maxSelect: number | null
        options: Array<{ id: string; name: string; price: number; isAvailable: boolean }>
    }>
}

type StoreCategory = Omit<BaseCategory, 'products'> & { products: StoreProduct[] }

export type AdvancedStore = Omit<BaseStore, 'categories'> & {
    customizationMode?: string | null
    categories: StoreCategory[]
}

export interface AdvancedMenuUIProps {
    store: AdvancedStore
    layoutJson: AdvancedCustomization | null
    isPreview?: boolean
    /** Sistema de Tres Menús: contexto resuelto en page.tsx (undefined = modo WhatsApp actual) */
    orderContext?: OrderContext | null
    /** Slug del local (necesario para cambiar de mesa / login de mesero) */
    orderSlug?: string
}

const GAP_CLASS: Record<MenuSectionConfig['gap'], string> = {
    sm: 'gap-1.5',
    md: 'gap-2.5',
    lg: 'gap-4',
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

function socialHref(platform: SocialPlatform): string {
    const raw = platform.url.trim()
    if (/^https?:\/\//i.test(raw)) return raw
    switch (platform.type) {
        case 'instagram':
            return `https://instagram.com/${raw.replace('@', '')}`
        case 'tiktok':
            return `https://tiktok.com/@${raw.replace('@', '')}`
        case 'maps':
            return `https://maps.google.com/?q=${encodeURIComponent(raw)}`
        case 'whatsapp':
            return `https://wa.me/${raw.replace(/[^\d]/g, '')}`
        default:
            return raw
    }
}

export default function AdvancedMenuUI({
    store,
    layoutJson,
    isPreview = false,
    orderContext,
    orderSlug,
}: AdvancedMenuUIProps) {
    if (store.customizationMode === 'AVANCED' && layoutJson) {
        return (
            <AdvancedLayout
                store={store}
                layout={layoutJson}
                isPreview={isPreview}
                orderContext={orderContext}
                orderSlug={orderSlug}
            />
        )
    }
    return <SharedMenuUI store={store} isPreview={isPreview} orderContext={orderContext} orderSlug={orderSlug} />
}

function AdvancedLayout({
    store,
    layout,
    isPreview = false,
    orderContext,
    orderSlug,
}: {
    store: AdvancedMenuUIProps['store']
    layout: AdvancedCustomization
    isPreview?: boolean
    orderContext?: OrderContext | null
    orderSlug?: string
}) {
    const g: GlobalStyle = layout.global ?? defaultGlobalStyle
    const device: DeviceView = isPreview ? 'phone' : layout.deviceView ?? 'desktop'
    const isPhone = device === 'phone'
    const isTablet = device === 'tablet'

    const accent = g.accentColor
    const buttonTextColor = g.buttonTextColor
    const design = designStyleOf(g)
    const backdrop = pageBackdrop(design, g)

    const headingFont: CSSProperties = { fontFamily: `'${g.fontHeading}', sans-serif` }
    const bodyFont: CSSProperties = { fontFamily: `'${g.fontBody}', sans-serif` }

    const sections = Array.isArray(layout.sections) ? layout.sections : []
    const visibleSections = sections.filter((s) => s && s.visible !== false)
    const hasNavSection = visibleSections.some((s) => s.type === 'category-nav')

    const activeCategories = store.categories.filter((c) => c.products.length > 0)
    const upsellCategory = store.upsellCategoryId
        ? store.categories.find((c) => c.id === store.upsellCategoryId) ?? null
        : null

    const [activeIndex, setActiveIndex] = useState(0)
    const [activeConfigProduct, setActiveConfigProduct] = useState<StoreProduct | null>(null)
    // Modo 'view' (QR "solo ver carta"): tocar un producto abre este modal de
    // solo visualización (sin carrito ni configurador).
    const [viewProduct, setViewProduct] = useState<StoreProduct | null>(null)
    const addItem = useCartStore((state) => state.addItem)
    const menuRef = useRef<HTMLDivElement>(null)

    // Modo vista: resuelto del servidor (?mesa=…&ver=1 sin sesión de mesero)
    const isViewMode = orderContext?.mode === 'view'

    const safeIndex = activeIndex < activeCategories.length ? activeIndex : 0
    const currentCategory = activeCategories[safeIndex]

    const handleProductAction = (product: StoreProduct) => {
        if (isPreview) return
        // Solo lectura: nunca agrega al carrito ni abre el configurador
        if (isViewMode) {
            setViewProduct(product)
            return
        }
        const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0
        if (store.forceNotesModal || hasModifiers) {
            setActiveConfigProduct(product)
        } else {
            addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
            })
        }
    }

    const handleSelectCategory = (index: number) => {
        if (isPreview) return
        setActiveIndex(index)
        menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const cleanFont = (f: string) => (f || '').replace(/[^a-zA-Z0-9\s\-]/g, '').trim() || 'sans-serif'
    const safeHeading = cleanFont(g.fontHeading)
    const safeBody = cleanFont(g.fontBody)

    const uniqueFonts = [...new Set([safeHeading, safeBody])]
    const googleFontsUrl = `https://fonts.googleapis.com/css2?${uniqueFonts
        .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;900`)
        .join('&')}&display=swap`

    const fontsCss = `
        @import url('${googleFontsUrl}');
        .adv-heading { font-family: '${safeHeading}', sans-serif; }
        .adv-body { font-family: '${safeBody}', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `

    const cardStyle = (c: MenuSectionConfig, gs: GlobalStyle = g): CSSProperties =>
        cardSurface(design, gs, c.cardStyle)

    const renderHeader = (section: Section): ReactNode => {
        const c = section.config as HeaderSectionConfig
        const gs = scopedGlobalStyle(g, c)

        return (
            <HeaderView
                c={c}
                g={gs}
                alignment={section.alignment}
                name={c.title || store.name || 'Tu Negocio'}
                logoUrl={store.logoUrl}
                subtitle={c.subtitle}
            />
        )
    }

    const renderCategoryNav = (section: Section): ReactNode => {
        const c = section.config as CategoryNavSectionConfig
        if (activeCategories.length === 0) return null

        const gs = scopedGlobalStyle(g, c)

        return (
            <div
                className={`z-30 shrink-0 ${c.sticky ? 'sticky top-0' : ''}`}
                style={{ backgroundColor: `${gs.backgroundColor}f0`, backdropFilter: 'blur(16px)' }}
            >
                {c.heading && (
                    <p
                        className="px-4 pt-2 text-sm font-black"
                        style={{ ...headingFont, color: gs.textColor }}
                    >
                        {c.heading}
                    </p>
                )}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2.5">
                    {activeCategories.map((cat, idx) => {
                        const isActive = idx === safeIndex
                        const isPill = c.style === 'pills'
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(idx)}
                                className={`shrink-0 whitespace-nowrap text-xs font-semibold transition-all duration-200 active:scale-95 ${
                                    isPill
                                        ? 'rounded-full px-4 py-1.5'
                                        : `px-2 py-1.5 ${
                                              c.style === 'tabs' && isActive
                                                  ? 'border-b-2'
                                                  : ''
                                          }`
                                }`}
                                style={{
                                    ...(isPill
                                        ? navPillStyle(design, gs, isActive)
                                        : {
                                              color: isActive
                                                  ? gs.accentColor
                                                  : gs.subtextColor,
                                              borderBottomColor:
                                                  c.style === 'tabs' && isActive
                                                      ? gs.accentColor
                                                      : undefined,
                                          }),
                                    ...bodyFont,
                                }}
                            >
                                {cat.name}
                                {c.showCount && <span className="ml-1 opacity-70">{cat.products.length}</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderProductCard = (
        product: StoreProduct,
        c: MenuSectionConfig,
        span = false,
        isLast = false,
        gs: GlobalStyle = g,
    ): ReactNode => {
        // Colores con alcance de sección: overrides opcionales vs globales
        const accent = gs.accentColor
        const textColor = gs.textColor
        const subtextColor = gs.subtextColor
        const buttonTextColor = gs.buttonTextColor
        const isFilled = c.cardStyle === 'filled'
        const descColor = isFilled ? textColor : subtextColor
        const priceColor = accent
        const style = c.layoutStyle ?? 'CLASSIC'

        // ── Combo: card destacada (imagen arriba full-width, info abajo,
        //    etiqueta "COMBO" arriba a la derecha). En GRID/BENTO ocupa
        //    todo el ancho de la cuadrícula (1 / -1). ──
        if (product.isCombo) {
            return (
                <ComboCard
                    key={product.id}
                    product={product}
                    accent={accent}
                    buttonTextColor={buttonTextColor}
                    textColor={textColor}
                    subtextColor={subtextColor}
                    span={c.layout === 'GRID' || c.layout === 'BENTO'}
                    showImages={c.showImages}
                    showDescriptions={c.showDescriptions}
                    showPrices={c.showPrices}
                    bsEnabled={c.showBsPrice ?? true}
                    surfaceStyle={cardStyle(c, gs)}
                    headingStyle={headingFont}
                    bodyStyle={bodyFont}
                    isPreview={isPreview}
                    forceNotesModal={store.forceNotesModal}
                    onClick={() => handleProductAction(product)}
                    onConfigure={() => setActiveConfigProduct(product)}
                />
            )
        }

        if (c.layout === 'LIST') {
            if (style === 'DIVIDER') {
                return (
                    <div
                        key={product.id}
                        onClick={() => handleProductAction(product)}
                        className={`relative flex cursor-pointer items-center gap-3 py-3 transition-all duration-200 active:scale-[0.98] ${
                            isLast ? '' : 'border-b'
                        }`}
                        style={{
                            borderColor: withAlpha(textColor, 0.12),
                            ...(product.isCombo
                                ? { boxShadow: `0 0 0 2px ${accent}` }
                                : null),
                        }}
                    >
                        {product.isCombo && (
                            <span
                                className="absolute -top-1 left-0 z-10 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
                                style={{ backgroundColor: accent, color: buttonTextColor }}
                            >
                                ⭐ {product.comboBadge || 'Combo'}
                            </span>
                        )}

                        {c.showImages && product.imageUrl && (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <h3
                                className="truncate text-sm font-bold leading-tight"
                                style={{ ...headingFont, color: textColor }}
                            >
                                {product.name}
                            </h3>
                            {c.showDescriptions && product.description && (
                                <p
                                    className="mt-0.5 line-clamp-2 text-xs leading-relaxed"
                                    style={{ color: subtextColor }}
                                >
                                    {product.description}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {c.showPrices && (
                                <div className="flex flex-col">
                                    <span
                                        className="text-sm font-extrabold"
                                        style={{ color: priceColor }}
                                    >
                                        ${product.price.toFixed(2)}
                                    </span>
                                    <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} />
                                </div>
                            )}
                            {!isViewMode && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <AddToCartButton
                                        product={product}
                                        themeColor={accent}
                                        buttonTextColor={buttonTextColor}
                                        onConfigure={() => setActiveConfigProduct(product)}
                                        forceNotesModal={store.forceNotesModal}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            if (style === 'FEATURED') {
                return (
                    <div
                        key={product.id}
                        onClick={() => handleProductAction(product)}
                        className="relative flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all duration-200 active:scale-[0.98]"
                        style={{
                            ...cardStyle(c, gs),
                            backgroundColor: withAlpha(
                                accent,
                                isDarkColor(gs.backgroundColor) ? 0.18 : 0.12,
                            ),
                            ...(product.isCombo
                                ? { boxShadow: `0 0 0 2px ${accent}` }
                                : null),
                        }}
                    >
                        {product.isCombo && (
                            <span
                                className="absolute -top-2.5 left-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm"
                                style={{ backgroundColor: accent, color: buttonTextColor }}
                            >
                                ⭐ {product.comboBadge || 'Combo'}
                            </span>
                        )}

                        {c.showImages && product.imageUrl && (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <h3
                                className="truncate text-sm font-bold leading-tight"
                                style={{ ...headingFont, color: textColor }}
                            >
                                {product.name}
                            </h3>
                            {c.showDescriptions && product.description && (
                                <p
                                    className="mt-0.5 line-clamp-2 text-xs leading-relaxed"
                                    style={{ color: subtextColor }}
                                >
                                    {product.description}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {c.showPrices && (
                                <div className="flex flex-col items-end">
                                    <span
                                        className="rounded-full px-2.5 py-1 text-xs font-black"
                                        style={{ backgroundColor: accent, color: buttonTextColor }}
                                    >
                                        ${product.price.toFixed(2)}
                                    </span>
                                    <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} className="text-right" />
                                </div>
                            )}
                            {!isViewMode && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <AddToCartButton
                                        product={product}
                                        themeColor={accent}
                                        buttonTextColor={buttonTextColor}
                                        onConfigure={() => setActiveConfigProduct(product)}
                                        forceNotesModal={store.forceNotesModal}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            return (
                <div
                    key={product.id}
                    onClick={() => handleProductAction(product)}
                    className="relative flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all duration-200 active:scale-[0.98]"
                    style={{
                        ...cardStyle(c, gs),
                        ...(product.isCombo ? { boxShadow: `0 0 0 2px ${accent}` } : null),
                    }}
                >
                    {product.isCombo && (
                        <span
                            className="absolute -top-2.5 left-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm"
                            style={{ backgroundColor: accent, color: buttonTextColor }}
                        >
                            ⭐ {product.comboBadge || 'Combo'}
                        </span>
                    )}

                    {c.showImages && product.imageUrl && (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <h3
                            className="truncate text-sm font-bold leading-tight"
                            style={{ ...headingFont, color: isFilled ? undefined : textColor }}
                        >
                            {product.name}
                        </h3>
                        {c.showDescriptions && product.description && (
                            <p
                                className="mt-0.5 line-clamp-2 text-xs leading-relaxed"
                                style={{ color: descColor, opacity: isFilled ? 0.85 : 1 }}
                            >
                                {product.description}
                            </p>
                        )}
                        {c.showPrices && (
                            <div className="mt-1">
                                <p className="text-sm font-extrabold" style={{ color: priceColor }}>
                                    ${product.price.toFixed(2)}
                                </p>
                                <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} />
                            </div>
                        )}
                    </div>

                    {!isViewMode && (
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            <AddToCartButton
                                product={product}
                                themeColor={accent}
                                buttonTextColor={buttonTextColor}
                                onConfigure={() => setActiveConfigProduct(product)}
                                forceNotesModal={store.forceNotesModal}
                            />
                        </div>
                    )}
                </div>
            )
        }

        if (c.layout === 'GRID' || c.layout === 'BENTO') {
            if (style === 'HORIZONTAL') {
                return (
                    <div
                        key={product.id}
                        className="@container min-w-0"
                        style={span ? { gridColumn: 'span 2' } : undefined}
                    >
                        <div
                            onClick={() => handleProductAction(product)}
                            className="relative flex h-full cursor-pointer items-center gap-2 overflow-hidden rounded-2xl p-2.5 transition-all duration-200 active:scale-[0.98] @max-[150px]:gap-1 @max-[150px]:p-2 @min-[210px]:gap-3"
                            style={{
                                ...cardStyle(c, gs),
                                ...(product.isCombo
                                    ? { boxShadow: `0 0 0 2px ${accent}` }
                                    : null),
                            }}
                        >
                            {c.showImages && product.imageUrl && (
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm @max-[150px]:h-10 @max-[150px]:w-10 @min-[210px]:h-20 @min-[210px]:w-20">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 56px, 80px"
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <h3
                                    className="line-clamp-2 break-words text-sm font-bold leading-snug"
                                    style={{ ...headingFont, color: isFilled ? undefined : textColor }}
                                >
                                    {product.name}
                                </h3>
                                {c.showDescriptions && product.description && (
                                    <p
                                        className="mt-0.5 line-clamp-2 break-words text-xs leading-relaxed"
                                        style={{ color: descColor, opacity: isFilled ? 0.85 : 1 }}
                                    >
                                        {product.description}
                                    </p>
                                )}
                                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                    {c.showPrices && (
                                        <div className="flex flex-col">
                                            <span
                                                className="min-w-0 truncate text-sm font-extrabold"
                                                style={{ color: priceColor }}
                                            >
                                                ${product.price.toFixed(2)}
                                            </span>
                                            <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} />
                                        </div>
                                    )}
                                    {!isViewMode && (
                                        <div
                                            className="ml-auto shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <AddToCartButton
                                                product={product}
                                                themeColor={accent}
                                                buttonTextColor={buttonTextColor}
                                                onConfigure={() => setActiveConfigProduct(product)}
                                                forceNotesModal={store.forceNotesModal}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            if (style === 'FLAT') {
                return (
                    <div
                        key={product.id}
                        onClick={() => handleProductAction(product)}
                        className="relative flex cursor-pointer flex-col rounded-2xl border-[1.5px] p-2 transition-all duration-200 active:scale-[0.98]"
                        style={{
                            borderColor: withAlpha(textColor, 0.15),
                            backgroundColor: 'transparent',
                            ...(span ? { gridColumn: 'span 2' } : null),
                            ...(product.isCombo
                                ? { boxShadow: `0 0 0 2px ${accent}` }
                                : null),
                        }}
                    >
                        {product.isCombo && (
                            <span
                                className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
                                style={{ backgroundColor: accent, color: buttonTextColor }}
                            >
                                ⭐ {product.comboBadge || 'Combo'}
                            </span>
                        )}

                        {c.showImages && product.imageUrl && (
                            <div className="relative mb-2 mt-1 aspect-[16/10] overflow-hidden rounded-xl">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 240px"
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div className="flex flex-1 flex-col items-center justify-between gap-1 px-1 text-center">
                            <div className="w-full">
                                <h3
                                    className="line-clamp-2 text-xs font-bold leading-snug"
                                    style={{ ...headingFont, color: textColor }}
                                >
                                    {product.name}
                                </h3>
                                {c.showDescriptions && product.description && (
                                    <p
                                        className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed"
                                        style={{ color: subtextColor }}
                                    >
                                        {product.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex w-full items-center justify-center gap-2 pt-1">
                                {c.showPrices && (
                                    <div className="flex flex-col items-center">
                                        <span
                                            className="text-sm font-extrabold"
                                            style={{ color: priceColor }}
                                        >
                                            ${product.price.toFixed(2)}
                                        </span>
                                        <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} />
                                    </div>
                                )}
                                {!isViewMode && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <AddToCartButton
                                            product={product}
                                            themeColor={accent}
                                            buttonTextColor={buttonTextColor}
                                            onConfigure={() => setActiveConfigProduct(product)}
                                            forceNotesModal={store.forceNotesModal}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            return (
                <div
                    key={product.id}
                    onClick={() => handleProductAction(product)}
                    className="relative flex cursor-pointer flex-col overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.98]"
                    style={{
                        ...cardStyle(c, gs),
                        ...(span ? { gridColumn: 'span 2' } : null),
                        ...(product.isCombo ? { boxShadow: `0 0 0 2px ${accent}` } : null),
                    }}
                >
                    {product.isCombo && (
                        <span
                            className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
                            style={{ backgroundColor: accent, color: buttonTextColor }}
                        >
                            ⭐ {product.comboBadge || 'Combo'}
                        </span>
                    )}

                    {c.showImages && product.imageUrl && (
                        <div className="relative h-28 w-full overflow-hidden">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, 220px"
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div className="flex flex-1 flex-col justify-between p-3">
                        <div>
                            <h3
                                className="line-clamp-2 text-xs font-bold leading-snug"
                                style={{ ...headingFont, color: isFilled ? undefined : textColor }}
                            >
                                {product.name}
                            </h3>
                            {c.showDescriptions && product.description && (
                                <p
                                    className="mt-1 line-clamp-2 text-[10px] leading-relaxed"
                                    style={{ color: descColor, opacity: isFilled ? 0.85 : 1 }}
                                >
                                    {product.description}
                                </p>
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 pt-2">
                            {c.showPrices && (
                                <div className="flex flex-col">
                                    <span
                                        className="text-sm font-extrabold"
                                        style={{ color: priceColor }}
                                    >
                                        ${product.price.toFixed(2)}
                                    </span>
                                    <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} />
                                </div>
                            )}
                            {!isViewMode && (
                                <div
                                    className="ml-auto shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <AddToCartButton
                                        product={product}
                                        themeColor={accent}
                                        buttonTextColor={buttonTextColor}
                                        onConfigure={() => setActiveConfigProduct(product)}
                                        forceNotesModal={store.forceNotesModal}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        if (style === 'CARD') {
            return (
                <div
                    key={product.id}
                    onClick={() => handleProductAction(product)}
                    className="relative flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all duration-200 active:scale-[0.98]"
                    style={{
                        ...cardStyle(c, gs),
                        ...(product.isCombo ? { boxShadow: `0 0 0 2px ${accent}` } : null),
                    }}
                >
                    {product.isCombo && (
                        <span
                            className="absolute -top-2.5 left-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm"
                            style={{ backgroundColor: accent, color: buttonTextColor }}
                        >
                            ⭐ {product.comboBadge || 'Combo'}
                        </span>
                    )}

                    {c.showImages && product.imageUrl && (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <h3
                            className="truncate text-sm font-black leading-tight"
                            style={{ ...headingFont, color: isFilled ? undefined : textColor }}
                        >
                            {product.name}
                        </h3>
                        {c.showDescriptions && product.description && (
                            <p
                                className="mt-0.5 line-clamp-2 text-xs leading-relaxed"
                                style={{ color: descColor, opacity: isFilled ? 0.85 : 1 }}
                            >
                                {product.description}
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {c.showPrices && (
                            <div className="flex flex-col items-end">
                                <span
                                    className="text-sm font-extrabold"
                                    style={{ color: priceColor }}
                                >
                                    ${product.price.toFixed(2)}
                                </span>
                                <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} className="text-right" />
                            </div>
                        )}
                        {!isViewMode && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <AddToCartButton
                                    product={product}
                                    themeColor={accent}
                                    buttonTextColor={buttonTextColor}
                                    onConfigure={() => setActiveConfigProduct(product)}
                                    forceNotesModal={store.forceNotesModal}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <button
                key={product.id}
                type="button"
                onClick={() => handleProductAction(product)}
                className="flex items-center justify-between gap-3 rounded-full px-5 py-3 text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                    ...headingFont,
                    ...navPillStyle(design, gs, true),
                }}
            >
                <span className="truncate text-sm font-black">{product.name}</span>
                {c.showPrices && (
                    <div className="flex shrink-0 flex-col items-end">
                        <span className="text-sm font-bold opacity-90">
                            ${product.price.toFixed(2)}
                        </span>
                        <BsPrice usd={product.price} enabled={c.showBsPrice ?? true} color={subtextColor} className="text-right" />
                    </div>
                )}
            </button>
        )
    }

    const renderMenu = (section: Section): ReactNode => {
        const c = section.config as MenuSectionConfig
        const gs = scopedGlobalStyle(g, c)

        if (activeCategories.length === 0) {
            return (
                <div
                    className="px-4 py-12 text-center text-sm"
                    style={{ ...bodyFont, color: gs.subtextColor }}
                >
                    No hay productos disponibles por el momento.
                </div>
            )
        }

        const columns = isPhone || isTablet ? Math.min(c.columns, 2) : c.columns
        const categoriesToShow = hasNavSection
            ? currentCategory
                ? [currentCategory]
                : []
            : activeCategories

        return (
            <div
                ref={menuRef}
                className={`scroll-mt-20 px-4 pb-4 ${isPreview ? '' : 'sm:px-6'}`}
                style={{ backgroundColor: c.bgColor }}
            >
                {(c.heading || c.subheading) && (
                    <div className="pb-1 pt-3">
                        {c.heading && (
                            <h2
                                className="text-base font-black"
                                style={{ ...headingFont, color: gs.textColor }}
                            >
                                {c.heading}
                            </h2>
                        )}
                        {c.subheading && (
                            <p
                                className="mt-0.5 text-xs"
                                style={{ ...bodyFont, color: gs.subtextColor }}
                            >
                                {c.subheading}
                            </p>
                        )}
                    </div>
                )}
                <div className="space-y-5">
                    {categoriesToShow.map((cat) => (
                        <div key={cat.id} className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h2
                                    className="text-base font-black uppercase tracking-wider"
                                    style={{ ...headingFont, color: gs.textColor }}
                                >
                                    {cat.name}
                                </h2>
                                <span
                                    className="text-xs font-semibold opacity-70"
                                    style={{ ...bodyFont, color: gs.subtextColor }}
                                >
                                    {cat.products.length}{' '}
                                    {cat.products.length === 1 ? 'ítem' : 'ítems'}
                                </span>
                            </div>

                            {c.layout === 'GRID' || c.layout === 'BENTO' ? (
                                <div
                                    className={`menu-grid grid ${GAP_CLASS[c.gap]}`}
                                    style={
                                        {
                                            '--menu-cols': String(columns),
                                            '--menu-cols-narrow': String(
                                                Math.min(c.columns, 2),
                                            ),
                                        } as CSSProperties
                                    }
                                >
                                    {cat.products.map((product, index) =>
                                        renderProductCard(
                                            product,
                                            c,
                                            c.layout === 'BENTO' && columns > 1 && bentoSpan(index),
                                            false,
                                            gs,
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className={`flex flex-col ${GAP_CLASS[c.gap]}`}>
                                    {cat.products.map((product, index) =>
                                        renderProductCard(
                                            product,
                                            c,
                                            false,
                                            index === cat.products.length - 1,
                                            gs,
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderSocial = (section: Section): ReactNode => {
        const c = section.config as SocialSectionConfig
        if (c.platforms.length === 0) return null

        const gs = scopedGlobalStyle(g, c)

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
                className={`px-4 py-3 ${isPreview ? '' : 'sm:px-6'} ${
                    c.layout === 'grid'
                        ? `grid grid-cols-2 gap-2 ${justifyClass}`
                        : `flex flex-wrap items-center gap-3 ${justifyClass}`
                }`}
                style={{
                    backgroundColor: c.bgColor,
                    padding: c.padding ?? undefined,
                }}
            >
                {c.platforms.map((platform) => {
                    const Icon = SOCIAL_ICON[platform.type] ?? Globe
                    return (
                        <a
                            key={platform.id}
                            href={socialHref(platform)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 transition-transform hover:scale-105"
                            style={{ color: c.textColor ?? gs.subtextColor, ...bodyFont }}
                        >
                            <span
                                className={`flex ${SOCIAL_ICON_CLASS[c.iconSize]} items-center justify-center rounded-full`}
                                style={chipStyle(design, gs)}
                            >
                                <Icon className="h-1/2 w-1/2" />
                            </span>
                            {c.showLabels && (
                                <span className="text-xs font-semibold">
                                    {platform.label ?? platform.type}
                                </span>
                            )}
                        </a>
                    )
                })}
            </div>
        )
    }

    const renderSection = (section: Section): ReactNode => {
        switch (section.type) {
            case 'header':
                return renderHeader(section)
            case 'category-nav':
                return renderCategoryNav(section)
            case 'menu':
                return renderMenu(section)
            case 'social':
                return renderSocial(section)
            default:
                return (
                    <SectionRenderer
                        section={section}
                        layoutJson={layout}
                        deviceView={device}
                        interactive={!isPreview}
                    />
                )
        }
    }

    return (
        <div
            className={`adv-body relative flex flex-col font-sans selection:bg-white/20 ${
                isPreview ? 'h-full overflow-hidden' : 'min-h-screen'
            }`}
            style={{ backgroundColor: g.backgroundColor, color: g.textColor }}
        >
            <style dangerouslySetInnerHTML={{ __html: fontsCss }} />

            {/* BARRA DE CONTEXTO: SISTEMA DE TRES MENÚS (mesa / mesero) */}
            {!isPreview && orderSlug && (
                <OrderModeBar slug={orderSlug} storeId={store.id} themeColor={accent} context={orderContext} />
            )}

            {backdrop && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={backdrop}
                />
            )}

            <div
                className={`relative z-10 mx-auto flex w-full flex-col max-w-none ${
                    isPreview ? '' : 'lg:max-w-[50%]'
                }`}
            >
                {visibleSections.map((section) => {
                    // El nav sticky va sin wrapper: su contenedor de recorrido
                    // es el contenedor principal (todo el menú), no un div de
                    // la altura de la propia sección.
                    const node = renderSection(section)
                    const isStickyNav =
                        section.type === 'category-nav' &&
                        (section.config as CategoryNavSectionConfig).sticky
                    return isStickyNav ? (
                        <Fragment key={section.id}>{node}</Fragment>
                    ) : (
                        <div key={section.id} className="flex w-full flex-col">
                            {node}
                        </div>
                    )
                })}
                {!isPreview && <div className="h-32 shrink-0" />}
            </div>

            {!isPreview && activeConfigProduct && (
                <ProductConfiguratorModal
                    product={activeConfigProduct}
                    themeColor={accent}
                    buttonTextColor={buttonTextColor}
                    isOpen={!!activeConfigProduct}
                    onClose={() => setActiveConfigProduct(null)}
                />
            )}

            {/* Product View Modal (modo 'view': QR "solo ver carta", sin pedidos) */}
            {!isPreview && viewProduct && (
                <ProductViewModal
                    product={viewProduct}
                    themeColor={accent}
                    onClose={() => setViewProduct(null)}
                />
            )}

            {/* Floating Cart (oculta en modo vista: ahí no se pide) */}
            {!isPreview && !isViewMode && (
                <FloatingCart
                    storeId={store.id}
                    storeName={store.name}
                    whatsapp={store.whatsapp}
                    themeColor={accent}
                    buttonTextColor={buttonTextColor}
                    whatsappHeader={store.whatsappHeader}
                    whatsappFooter={store.whatsappFooter}
                    enableDelivery={store.enableDelivery ?? true}
                    enablePickup={store.enablePickup ?? true}
                    enableDineIn={store.enableDineIn ?? false}
                    requireCedula={store.requireCedula ?? true}
                    upsellCategory={upsellCategory}
                    onConfigureUpsellProduct={(product) => setActiveConfigProduct(product)}
                    deliveryZones={store.deliveryZones ?? []}
                    orderContext={orderContext}
                />
            )}
        </div>
    )
}

import type { CSSProperties } from 'react'
import type {
    Alignment,
    GlobalStyle,
    HeaderSectionConfig,
    HeaderStyle,
} from '@/src/types/customization'

type HeaderViewProps = {
    c: HeaderSectionConfig
    g: GlobalStyle
    alignment: Alignment
    /** Nombre del negocio (la preview pasa un mock). */
    name: string
    logoUrl?: string | null
}

const SUBTITLE = 'Menú Digital · Pedido Online'

const logoBox = (style: HeaderStyle) => {
    if (style === 'minimal')
        return 'h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-black/30 shadow-md sm:h-12 sm:w-12'
    if (style === 'editorial')
        return 'h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/30 shadow-lg sm:h-14 sm:w-14'
    return 'h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-xl ring-4 ring-black/40 transition-transform duration-300 hover:scale-105 sm:h-20 sm:w-20'
}

const logoFallbackBox = (style: HeaderStyle) => {
    if (style === 'minimal')
        return 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ring-2 ring-black/30 shadow-md sm:h-12 sm:w-12'
    if (style === 'editorial')
        return 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ring-1 ring-black/30 shadow-lg sm:h-14 sm:w-14'
    return 'flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl shadow-lg ring-4 ring-black/30 transition-transform duration-300 hover:scale-105 sm:h-20 sm:w-20'
}

/**
 * Encabezado compartido: lo usan la preview del editor (SectionRenderer) y el
 * menú público (AdvancedMenuUI) para que se vean idénticos.
 */
export function HeaderView({ c, g, alignment, name, logoUrl }: HeaderViewProps) {
    const style: HeaderStyle = c.style ?? 'classic'
    const editorial = style === 'editorial'
    const centered = editorial ? false : c.layout === 'centered' || alignment === 'center'

    const headingFont: CSSProperties = { fontFamily: `'${g.fontHeading}', sans-serif` }
    const bodyFont: CSSProperties = { fontFamily: `'${g.fontBody}', sans-serif` }

    const logo = c.showLogo ? (
        logoUrl ? (
            <div className={logoBox(style)} style={{ boxShadow: `0 8px 24px ${g.accentColor}44` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
            </div>
        ) : (
            <div
                className={logoFallbackBox(style)}
                style={{
                    backgroundColor: `${g.accentColor}25`,
                    boxShadow: `0 8px 24px ${g.accentColor}44`,
                }}
            >
                🍽️
            </div>
        )
    ) : null

    const titleClass =
        style === 'minimal'
            ? 'text-lg font-bold leading-tight sm:text-xl'
            : editorial
              ? 'text-3xl font-black leading-[0.95] tracking-tight sm:text-4xl'
              : 'text-2xl font-black leading-tight tracking-tight sm:text-3xl'

    const subtitleClass =
        style === 'minimal'
            ? 'text-[10px] font-medium uppercase tracking-widest'
            : editorial
              ? 'mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em]'
              : 'mt-1 text-[11px] font-medium uppercase tracking-widest'

    const block = (
        <div className={centered ? 'text-center' : 'text-left'}>
            <h1 className={titleClass} style={{ ...headingFont, color: g.textColor }}>
                {name}
            </h1>
            <p className={subtitleClass} style={{ ...bodyFont, color: g.subtextColor }}>
                {SUBTITLE}
            </p>
        </div>
    )

    if (editorial) {
        return (
            <header className="relative z-20 flex w-full shrink-0 flex-col items-start px-4 pb-4 pt-5 text-left sm:px-6">
                <div className="flex w-full items-center gap-3">
                    {logo}
                    <div className="min-w-0">{block}</div>
                </div>
                <div
                    className="mt-3 h-0.5 w-12 rounded-full"
                    style={{ backgroundColor: g.accentColor }}
                />
            </header>
        )
    }

    if (style === 'minimal') {
        return (
            <header
                className={`relative z-20 flex w-full shrink-0 flex-col border-b px-4 pb-3 pt-4 sm:px-6 ${
                    centered ? 'items-center text-center' : 'items-start text-left'
                }`}
                style={{ borderColor: `${g.subtextColor}22` }}
            >
                <div
                    className={`flex w-full gap-2.5 ${centered ? 'justify-center' : 'justify-start'}`}
                >
                    {logo}
                    {block}
                </div>
            </header>
        )
    }

    return (
        <header
            className={`relative z-20 flex w-full shrink-0 flex-col px-4 pb-4 pt-6 sm:px-6 ${
                centered ? 'items-center text-center' : 'items-start text-left'
            }`}
        >
            <div className={`flex w-full gap-3 ${centered ? 'flex-col items-center' : 'items-center'}`}>
                {logo}
                {block}
            </div>
            <div
                className="mt-3 h-1 w-10 rounded-full"
                style={{ backgroundColor: g.accentColor }}
            />
        </header>
    )
}

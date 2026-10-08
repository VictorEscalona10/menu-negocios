'use client'

import { useCustomizationStore } from '@/src/store/customizationStore'
import type { GlobalStyle } from '@/src/types/customization'
import { cardSurface, designStyleOf } from '@/src/styles/designStyles'
import { ColorField } from './PanelFields'
import { DesignStylePicker } from './DesignStylePicker'

// Mismas listas que SettingsForm (consistencia con el sistema THEME)
const HEADING_FONTS = [
    'Epilogue',
    'Playfair Display',
    'Oswald',
    'Montserrat',
    'Raleway',
    'Bebas Neue',
    'Cinzel',
    'Cormorant Garamond',
    'Abril Fatface',
    'Josefin Sans',
]

const BODY_FONTS = [
    'Manrope',
    'Inter',
    'Poppins',
    'Roboto',
    'Lato',
    'DM Sans',
    'Nunito',
    'Outfit',
    'Source Sans 3',
    'Work Sans',
]

const COLOR_FIELDS: { key: keyof GlobalStyle; label: string }[] = [
    { key: 'backgroundColor', label: 'Fondo de página' },
    { key: 'textColor', label: 'Texto principal' },
    { key: 'subtextColor', label: 'Texto secundario' },
    { key: 'accentColor', label: 'Acento (tema)' },
    { key: 'buttonTextColor', label: 'Texto de botones' },
    { key: 'cardBackgroundColor', label: 'Fondo de tarjetas' },
]

/**
 * Colores + tipografías globales. Cada cambio escribe en `layoutJson.global`
 * del store en caliente (se refleja al instante en el preview del canvas).
 */
export function GlobalStylePanel() {
    const global = useCustomizationStore((s) => s.layoutJson.global)
    const setGlobalStyle = useCustomizationStore((s) => s.setGlobalStyle)

    return (
        <section className="rounded-3xl border border-zinc-100 bg-white p-4">
            <div className="mb-3">
                <h2 className="text-sm font-black text-zinc-900">Estilo global</h2>
                <p className="text-xs text-zinc-500">Colores y fuentes de todo el menú</p>
            </div>

            {/* Preview en vivo de los colores + fuentes aplicados */}
            <div
                className="mb-4 rounded-2xl p-4"
                style={{
                    backgroundColor: global.backgroundColor,
                    color: global.textColor,
                    fontFamily: `'${global.fontBody}', sans-serif`,
                }}
            >
                <p className="text-base font-black" style={{ fontFamily: `'${global.fontHeading}', sans-serif` }}>
                    Título de ejemplo
                </p>
                <p className="mt-1 text-xs" style={{ color: global.subtextColor }}>
                    Texto secundario del menú
                </p>
                <div className="mt-3 flex items-end gap-2">
                    <div
                        className="min-w-0 flex-1 rounded-xl p-3"
                        style={cardSurface(designStyleOf(global), global, 'default')}
                    >
                        <p className="text-xs font-bold">Café latte</p>
                        <p className="text-[11px]" style={{ color: global.subtextColor }}>
                            Espresso con leche vaporizada
                        </p>
                        <p className="mt-1 text-xs font-black" style={{ color: global.accentColor }}>
                            $4.50
                        </p>
                    </div>
                    <div
                        className="min-w-0 flex-1 rounded-xl p-3"
                        style={cardSurface(designStyleOf(global), global, 'filled')}
                    >
                        <p className="text-xs font-bold">Brownie</p>
                        <p className="mt-1 text-xs font-black" style={{ color: global.accentColor }}>
                            $3.20
                        </p>
                    </div>
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-black shadow-sm"
                        style={{ backgroundColor: global.accentColor, color: global.buttonTextColor }}
                    >
                        +
                    </span>
                </div>
                <button
                    type="button"
                    className="mt-3 rounded-full px-4 py-1.5 text-xs font-black"
                    style={{ backgroundColor: global.accentColor, color: global.buttonTextColor }}
                >
                    Botón de ejemplo
                </button>
            </div>

            <div className="mb-4">
                <DesignStylePicker />
            </div>

            <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-wide text-zinc-400">
                    Colores
                </p>
                <div className="grid gap-3">
                    {COLOR_FIELDS.map((field) => (
                        <ColorField
                            key={field.key}
                            label={field.label}
                            value={global[field.key]}
                            onChange={(next) => setGlobalStyle(field.key, next)}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-zinc-400">
                    Fuentes
                </p>

                <label className="block">
                    <span className="block text-xs font-bold text-zinc-600">Títulos</span>
                    <select
                        value={global.fontHeading}
                        onChange={(e) => setGlobalStyle('fontHeading', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 focus:border-zinc-900 focus:outline-none"
                    >
                        {HEADING_FONTS.map((font) => (
                            <option key={font} value={font}>
                                {font}
                            </option>
                        ))}
                    </select>
                    <span
                        className="mt-1.5 block rounded-lg bg-zinc-50 px-2 py-1.5 text-sm"
                        style={{ fontFamily: `'${global.fontHeading}', sans-serif` }}
                    >
                        Hamburguesa Trufada — $14.50
                    </span>
                </label>

                <label className="block">
                    <span className="block text-xs font-bold text-zinc-600">Texto / descripción</span>
                    <select
                        value={global.fontBody}
                        onChange={(e) => setGlobalStyle('fontBody', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 focus:border-zinc-900 focus:outline-none"
                    >
                        {BODY_FONTS.map((font) => (
                            <option key={font} value={font}>
                                {font}
                            </option>
                        ))}
                    </select>
                    <span
                        className="mt-1.5 block rounded-lg bg-zinc-50 px-2 py-1.5 text-sm"
                        style={{ fontFamily: `'${global.fontBody}', sans-serif` }}
                    >
                        Carne Angus 200g con mayonesa de trufa negra.
                    </span>
                </label>
            </div>
        </section>
    )
}

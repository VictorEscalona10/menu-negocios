'use client'

import { useCustomizationStore } from '@/src/store/customizationStore'
import { DESIGN_STYLE_META, cardSurface, designStyleOf } from '@/src/styles/designStyles'

/**
 * Selector de estilo global: cada swatch previsualiza la superficie de card
 * y el botón "+" con los colores actuales del usuario (contraste en vivo).
 */
export function DesignStylePicker() {
    const global = useCustomizationStore((s) => s.layoutJson.global)
    const setGlobalStyle = useCustomizationStore((s) => s.setGlobalStyle)
    const design = designStyleOf(global)

    return (
        <div>
            <span className="mb-1 block text-xs font-bold text-zinc-600">Estilo de diseño</span>
            <div className="grid grid-cols-3 gap-1.5">
                {DESIGN_STYLE_META.map((option) => {
                    const active = design === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setGlobalStyle('designStyle', option.value)}
                            className={`rounded-xl border p-1.5 text-left transition-all ${
                                active
                                    ? 'border-zinc-900 shadow-md ring-1 ring-zinc-900'
                                    : 'border-zinc-100 hover:border-zinc-300'
                            }`}
                        >
                            <span
                                className="mb-1.5 flex h-9 items-center justify-center gap-1 rounded-lg"
                                style={{ backgroundColor: global.backgroundColor }}
                            >
                                <span
                                    className="h-5 w-9 rounded-md"
                                    style={cardSurface(option.value, global, 'default')}
                                />
                                <span
                                    className="h-4 w-4 rounded-full"
                                    style={{
                                        backgroundColor: global.accentColor,
                                        color: global.buttonTextColor,
                                    }}
                                />
                            </span>
                            <span className="block truncate text-[11px] font-black text-zinc-700">
                                {option.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

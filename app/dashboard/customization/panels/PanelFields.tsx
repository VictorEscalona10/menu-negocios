'use client'

import type { ReactNode } from 'react'

// ---------- Toggle ----------

type ToggleProps = {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    hint?: string
}

export function Toggle({ label, checked, onChange, hint }: ToggleProps) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-100 px-3 py-2">
            <span className="min-w-0">
                <span className="block text-xs font-bold text-zinc-700">{label}</span>
                {hint && <span className="block text-[11px] text-zinc-400">{hint}</span>}
            </span>
            <input
                type="checkbox"
                role="switch"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
            />
            <span
                aria-hidden
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors after:absolute after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] ${
                    checked ? 'bg-zinc-900 after:translate-x-4' : 'bg-zinc-300 after:translate-x-0.5'
                }`}
            />
        </label>
    )
}

// ---------- Control segmentado (tabs de opciones) ----------

type SegmentedProps<T extends string> = {
    label?: string
    value: T
    options: { value: T; label: string }[]
    onChange: (value: T) => void
    disabled?: boolean
    hint?: string
}

export function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
    hint,
}: SegmentedProps<T>) {
    return (
        <div className={disabled ? 'opacity-50' : ''}>
            {label && (
                <span className="mb-1 block text-xs font-bold text-zinc-600">
                    {label}
                    {hint && <span className="ml-1 font-normal text-zinc-400">· {hint}</span>}
                </span>
            )}
            <div
                className="grid gap-1 rounded-xl bg-zinc-100 p-1"
                style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
            >
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        aria-pressed={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={`rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
                            value === option.value
                                ? 'bg-white text-zinc-900 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ---------- Inputs básicos ----------

type TextFieldProps = {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    hint?: string
}

export function TextField({ label, value, onChange, placeholder, hint }: TextFieldProps) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-bold text-zinc-600">
                {label}
                {hint && <span className="ml-1 font-normal text-zinc-400">· {hint}</span>}
            </span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:outline-none"
            />
        </label>
    )
}

type TextAreaProps = {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    rows?: number
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }: TextAreaProps) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-bold text-zinc-600">{label}</span>
            <textarea
                value={value}
                rows={rows}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:outline-none"
            />
        </label>
    )
}

type SelectFieldProps<T extends string> = {
    label: string
    value: T
    options: { value: T; label: string }[]
    onChange: (value: T) => void
}

export function SelectField<T extends string>({
    label,
    value,
    options,
    onChange,
}: SelectFieldProps<T>) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-bold text-zinc-600">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 focus:border-zinc-900 focus:outline-none"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}

// ---------- Color (picker + texto hex/rgba) ----------

const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))$/

// `input[type=color]` solo acepta #rrggbb: convierte hex/rgba del layout a hex para el swatch
const toHexColor = (value: string): string => {
    const hex = value.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
    if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
        return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    }
    if (/^#[0-9a-fA-F]{8}$/.test(hex)) return hex.slice(0, 7)

    const rgb = hex.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
    if (rgb) {
        const to2 = (n: string) => Number(n).toString(16).padStart(2, '0')
        return `#${to2(rgb[1])}${to2(rgb[2])}${to2(rgb[3])}`
    }
    return '#000000'
}

type ColorFieldProps = {
    label: string
    value: string
    onChange: (next: string) => void
    children?: ReactNode
}

/**
 * Fila de color: picker nativo (cambio en vivo) + campo de texto para hex/rgba.
 * El texto solo se aplica si es válido; si no, revierte al último valor del store.
 */
export function ColorField({ label, value, onChange, children }: ColorFieldProps) {
    return (
        <div>
            <span className="mb-1 block text-xs font-bold text-zinc-600">{label}</span>
            <div className="flex items-center gap-2">
                <input
                    // key: al cambiar el valor (picker/undo/template) se reinicia el defaultValue
                    key={value}
                    type="text"
                    defaultValue={value}
                    spellCheck={false}
                    aria-label={`${label} (hex o rgba)`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                    }}
                    onBlur={(e) => {
                        const next = e.currentTarget.value.trim()
                        if (CSS_COLOR_RE.test(next)) onChange(next)
                        else e.currentTarget.value = value
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 font-mono text-xs text-zinc-700 focus:border-zinc-900 focus:outline-none"
                />
                <input
                    type="color"
                    title={label}
                    aria-label={`${label} (selector de color)`}
                    value={toHexColor(value)}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1"
                />
                {children}
            </div>
        </div>
    )
}

// src/hooks/useDollarRate.ts
// Hook que obtiene la tasa del dólar oficial en Venezuela desde ve.dolarapi.com
// y la cachea en localStorage para no golpear la API en cada carga de página.
// Usa el campo `promedio` de la respuesta. Devuelve:
//   - `undefined` mientras carga (sin cache aún),
//   - `null` si no hay tasa (falló la petición y no hay cache),
//   - el número cuando ya hay tasa.
'use client'

import { useEffect, useState } from 'react'

const API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const STORAGE_KEY = 've_dollar_rate'
const TTL_MS = 30 * 60 * 1000 // 30 minutos

interface CachedRate {
    rate: number
    fetchedAt: number
}

function readCache(): CachedRate | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as CachedRate
        if (typeof parsed?.rate !== 'number' || !Number.isFinite(parsed.rate)) return null
        return parsed
    } catch {
        return null
    }
}

function writeCache(rate: number) {
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ rate, fetchedAt: Date.now() } satisfies CachedRate),
        )
    } catch {
        // localStorage lleno / deshabilitado: ignorar, se reintentará en la próxima carga
    }
}

// Promesa en vuelo compartida a nivel de módulo: si muchas tarjetas montan a
// la vez (un menú con 20 productos), solo se lanza UNA petición a la API.
let inflight: Promise<number | null> | null = null

function fetchRate(): Promise<number | null> {
    if (inflight) return inflight

    inflight = fetch(API_URL)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data: { promedio?: number }) => {
            const value = typeof data?.promedio === 'number' ? data.promedio : null
            if (value && Number.isFinite(value) && value > 0) {
                writeCache(value)
                return value
            }
            return null
        })
        .catch(() => {
            // Sin red o la API falló: al menos devuelve el cache vencido si existe.
            return readCache()?.rate ?? null
        })
        .finally(() => {
            inflight = null
        })

    return inflight
}

export function useDollarRate(enabled = true): number | null | undefined {
    const [rate, setRate] = useState<number | null | undefined>(
        () => readCache()?.rate ?? undefined,
    )

    useEffect(() => {
        if (!enabled) return

        // Si el cache sigue vigente, úsalo sin salir de la red. El estado inicial
        // ya lo cargó, así que no hace falta (ni se debe) hacer setState aquí.
        const cached = readCache()
        if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
            return
        }

        let cancelled = false

        fetchRate().then((value) => {
            // `value` es null si la petición falló: lo marcamos como no disponible.
            if (!cancelled) setRate(value)
        })

        return () => {
            cancelled = true
        }
    }, [enabled])

    return rate
}

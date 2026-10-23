// lib/waiterAuth.ts
// Autenticación del MESERO (Sistema de Tres Menús — docs/DESIGN.md §11)
//
// - La clave de acceso NUNCA se guarda en claro: solo su hash scrypt.
// - La sesión del mesero vive en una cookie httpOnly; en DB solo se guarda
//   el SHA-256 del token (si roban la DB no pueden robar sesiones).
//
// NOTA: este módulo es solo-servidor (usa cookies de Next y Prisma). No es un
// archivo 'use server' para poder exportar helpers sincrónicos.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const WAITER_SESSION_COOKIE = 'komy_waiter'
export const WAITER_SESSION_TTL_SECONDS = 60 * 60 * 24 // 24 h

// scrypt: coste alto a propósito (la clave se valida en el login del mesero)
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 } as const
const SALT_BYTES = 16

// Sin caracteres ambiguos (0/O, 1/I). 32 símbolos = 2^5 → uniforme con un byte
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

export type WaiterSessionInfo = {
    id: string
    name: string
    storeId: string
    sessionId: string
}

// --- Clave de acceso --------------------------------------------------------

/** Genera una clave de 8 caracteres (ej: "K7MPX2QF") */
export function generateAccessCode(): string {
    const bytes = randomBytes(CODE_LENGTH)
    let code = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
    }
    return code
}

/**
 * Salt derivada de (store + clave): el hash completo es determinista, lo que
 * permite buscar al mesero con UNA consulta por igualdad, pero seguir usando
 * scrypt (muy costoso de adivinar) y sin columnas extra en la tabla Waiter.
 */
function deriveSalt(storeId: string, code: string): Buffer {
    return createHash('sha256')
        .update(`komy-access:${storeId}:${code}`)
        .digest()
        .subarray(0, SALT_BYTES)
}

/** Hashea la clave de acceso con scrypt → "s2:<salt_hex>:<hash_hex>" */
export function hashAccessCode(storeId: string, rawCode: string): string {
    const code = normalizeAccessCode(rawCode)
    const salt = deriveSalt(storeId, code)
    const hash = scryptSync(code, salt, SCRYPT_PARAMS.keylen, {
        N: SCRYPT_PARAMS.N,
        r: SCRYPT_PARAMS.r,
        p: SCRYPT_PARAMS.p,
    })
    return `s2:${salt.toString('hex')}:${hash.toString('hex')}`
}

/** Verificación defensiva (compara contra un hash ya almacenado) */
export function verifyAccessCode(storeId: string, rawCode: string, stored: string): boolean {
    try {
        const candidate = Buffer.from(hashAccessCode(storeId, rawCode).slice(3), 'hex')
        const expected = Buffer.from(stored.slice(3), 'hex')
        if (candidate.length !== expected.length) return false
        return timingSafeEqual(candidate, expected)
    } catch {
        return false
    }
}

export function normalizeAccessCode(rawCode: string): string {
    return (rawCode || '').trim().toUpperCase()
}

// --- Sesión -----------------------------------------------------------------

function sha256hex(value: string): string {
    return createHash('sha256').update(value).digest('hex')
}

/**
 * Resuelve la sesión del mesero desde la cookie. Devuelve null si no hay
 * sesión, está expirada o el mesero fue desactivado/eliminado.
 * (En server components solo se puede leer: limpiar la cookie se hace en actions)
 */
export async function getSessionWaiter(): Promise<WaiterSessionInfo | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(WAITER_SESSION_COOKIE)?.value
    if (!token) return null

    const session = await prisma.waiterSession.findUnique({
        where: { tokenHash: sha256hex(token) },
        include: { waiter: true },
    })

    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) return null
    if (!session.waiter.isActive) return null

    return {
        id: session.waiter.id,
        name: session.waiter.name,
        storeId: session.waiter.storeId,
        sessionId: session.id,
    }
}

/** Escribe la cookie httpOnly de sesión (solo desde server actions) */
export async function setWaiterSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(WAITER_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: WAITER_SESSION_TTL_SECONDS,
        secure: process.env.NODE_ENV === 'production',
    })
}

/** Elimina la cookie de sesión (solo desde server actions) */
export async function clearWaiterSessionCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(WAITER_SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        secure: process.env.NODE_ENV === 'production',
    })
}

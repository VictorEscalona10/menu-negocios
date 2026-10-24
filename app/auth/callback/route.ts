// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const rawNext = searchParams.get('next') ?? '/dashboard'
    // Evitar Open Redirect: asegurar que sea una ruta relativa válida que empiece con un solo '/'
    const safeNext = (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\'))
        ? rawNext
        : '/dashboard'

    const supabase = await createClient()

    // 1. Manejar flujo PKCE con code (enlace de confirmación)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(new URL(safeNext, origin))
        }
    }

    // 2. Manejar flujo con token_hash y type
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
        })
        if (!error) {
            return NextResponse.redirect(new URL(safeNext, origin))
        }
    }

    // En caso de enlace inválido o expirado
    return NextResponse.redirect(`${origin}/login?message=El enlace de verificación no es válido o ha expirado.`)
}

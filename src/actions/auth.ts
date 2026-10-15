// src/actions/auth.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signOut() {
    const supabase = await createClient();

    await supabase.auth.signOut();

    redirect('/login');
}

export async function signInAction(formData: FormData) {
    const email = (formData.get('email') as string || '').trim().toLowerCase()
    const password = (formData.get('password') as string || '')
    
    if (!email || !password) return { error: "Por favor, completa todos los campos." }
    
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: "Credenciales incorrectas. Revisa tu correo o contraseña." }
    }

    redirect('/dashboard')
}

export async function signUpAction(formData: FormData) {
    const email = (formData.get('email') as string || '').trim().toLowerCase()
    const password = (formData.get('password') as string || '')
    
    if (!email || !password) {
        return { error: "Por favor, completa todos los campos requeridos." }
    }

    // Validación estricta de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { error: "Por favor, ingresa un formato de correo electrónico válido (ej: nombre@correo.com)." }
    }

    // Validación de longitud de contraseña
    if (password.length < 6) {
        return { error: "La contraseña debe tener al menos 6 caracteres." }
    }

    const supabase = await createClient()

    // Obtener la URL de origen para redireccionar al callback tras verificar
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = headersList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    const origin = `${proto}://${host}`

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        }
    })

    if (error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('already registered') || errorMsg.includes('user already exists')) {
            return { error: "Este correo electrónico ya está registrado. Por favor, inicia sesión." }
        }
        return { error: error.message || "No se pudo completar el registro. Inténtalo de nuevo." }
    }

    // Si el usuario ya existe en Supabase y tiene confirmación previa, identities viene vacío
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: "Este correo ya se encuentra registrado. Por favor, inicia sesión con tu contraseña." }
    }

    // Si Supabase tiene autoconfirmación activa y generó sesión directamente
    if (data.session) {
        redirect('/dashboard')
    }

    return { 
        success: true, 
        email,
        message: "Código de verificación enviado a tu correo." 
    }
}

export async function verifyOtpAction({ email, token }: { email: string; token: string }) {
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanToken = (token || '').trim().replace(/\s+/g, '')

    if (!cleanEmail) {
        return { error: "Correo electrónico no válido." }
    }

    if (!cleanToken || cleanToken.length < 6) {
        return { error: "Por favor, ingresa el código de 6 dígitos que llegó a tu correo." }
    }

    const supabase = await createClient()

    // 1. Intentar verificación con tipo 'signup'
    let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
    })

    // 2. Si falla como signup, intentar con tipo 'email' (compatibilidad con diferentes configuraciones de Supabase)
    if (error) {
        const fallback = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: 'email',
        })
        if (!fallback.error) {
            data = fallback.data
            error = null
        }
    }

    if (error) {
        return { 
            error: "El código es incorrecto o ha expirado. Por favor, verifica el código recibido o solicita uno nuevo." 
        }
    }

    // Redirigir al dashboard (si el usuario no tiene tienda, el dashboard lo enviará a /onboarding para configurar)
    redirect('/dashboard')
}

export async function resendOtpAction({ email }: { email: string }) {
    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail) {
        return { error: "Correo electrónico no proporcionado." }
    }

    const supabase = await createClient()

    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = headersList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    const origin = `${proto}://${host}`

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        }
    })

    if (error) {
        return { error: error.message || "No se pudo reenviar el código. Inténtalo en unos instantes." }
    }

    return { success: true, message: "Hemos reenviado el código a tu correo." }
}
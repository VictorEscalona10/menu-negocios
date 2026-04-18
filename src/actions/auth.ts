// src/actions/auth.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
    const supabase = await createClient();

    await supabase.auth.signOut();

    redirect('/login');
}

export async function signInAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
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
// app/login/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {

    // Este es el Server Action que procesa el formulario
    const signIn = async (formData: FormData) => {
        'use server'
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const supabase = await createClient()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return redirect('/login?message=Credenciales incorrectas')
        }

        return redirect('/dashboard')
    }

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
            <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={signIn}>
                <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>

                <label className="text-md font-medium" htmlFor="email">Correo electrónico</label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border border-zinc-300 mb-6"
                    name="email"
                    placeholder="tu@correo.com"
                    required
                />

                <label className="text-md font-medium" htmlFor="password">Contraseña</label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border border-zinc-300 mb-6"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />

                <button className="bg-black text-white rounded-md px-4 py-2 text-foreground mb-2">
                    Entrar
                </button>

                {searchParams?.message && (
                    <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md">
                        {searchParams.message}
                    </p>
                )}
            </form>
        </div>
    )
}
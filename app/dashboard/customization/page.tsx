// app/dashboard/customization/page.tsx
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCustomizationLayout } from '@/src/actions/customization'
import { CustomizationEditor } from './CustomizationEditor'

export default async function CustomizationPage() {
    // 1. Verificamos la sesión
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 2. Buscamos el local asociado a este usuario
    const store = await prisma.store.findUnique({
        where: { userId: user.id },
    })

    if (!store) {
        return redirect('/dashboard')
    }

    // 3. Layout guardado (null si nunca ha usado el modo avanzado)
    const storeId = store.id
    const layout = await getCustomizationLayout(storeId)

    return (
        <div className="max-w-[2000px] mx-auto space-y-6 sm:space-y-8 p-3.5 sm:p-6 lg:p-10">
            {/* Botón Volver al dashboard */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-black transition-colors font-medium hover:-translate-x-1 duration-300 mb-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver al Resumen</span>
            </Link>

            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Personalización Avanzada</h1>
                <p className="text-sm sm:text-base text-zinc-500 font-medium mt-1">Diseña el menú de tu local sección por sección</p>
            </div>

            {/* El editor monta siempre: en THEME muestra la tarjeta de activación
                y en AVANCED sin layout arranca con el layout por defecto
                (el primer "Guardar" crea la fila CustomizationLayout). */}
            <CustomizationEditor layout={layout} store={store} />
        </div>
    )
}
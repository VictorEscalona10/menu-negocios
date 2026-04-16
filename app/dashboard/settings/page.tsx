// app/dashboard/settings/page.tsx
import { createClient } from '@/utils/supabase/server'
import { prisma } from "@/lib/prisma"
import { updateStoreSettings } from "@/src/actions/store"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
    // 1. Validamos al usuario actual
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 2. Buscamos el local asociado a este usuario exacto
    const store = await prisma.store.findUnique({
        where: { userId: user.id }
    })

    if (!store) {
        return redirect('/dashboard') // Si de casualidad entró aquí sin local, lo regresamos al form inicial
    }

    // 3. Preparamos la Server Action (que ya tienes creada) inyectando el ID del local
    const updateStoreWithId = updateStoreSettings.bind(null, store.id);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 lg:p-10 bg-zinc-50/50">
            <div className="w-full max-w-5xl bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-zinc-200 relative">
                
                {/* Botón Volver */}
                <Link 
                    href="/dashboard"
                    className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-zinc-500 hover:text-black transition-colors font-medium hover:-translate-x-1 duration-300"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden md:inline">Volver</span>
                </Link>

                <div className="text-center mb-8 pt-10 md:pt-4">
                    <h1 className="text-3xl font-extrabold text-zinc-900 mb-2 tracking-tight">Personalización del Menú</h1>
                    <p className="text-zinc-500 font-medium">Ajusta los detalles de tu tienda</p>
                </div>

                <SettingsForm 
                    store={{
                        name: store.name,
                        whatsapp: store.whatsapp,
                        backgroundColor: store.backgroundColor || '#ffffff',
                        themeColor: store.themeColor || '#000000',
                        logoUrl: store.logoUrl || '',
                        whatsappHeader: store.whatsappHeader || '',
                        whatsappFooter: store.whatsappFooter || '',
                        enableDelivery:    store.enableDelivery,
                        enablePickup:      store.enablePickup,
                        enableDineIn:      store.enableDineIn,
                        showProductImages: store.showProductImages,
                        textColor:    store.textColor    || '#e5e2e1',
                        subtextColor: store.subtextColor || '#e4beb5',
                        fontHeading:  store.fontHeading  || 'Epilogue',
                        fontBody:     store.fontBody     || 'Manrope',
                    }} 
                    updateAction={updateStoreWithId} 
                />
            </div>
        </div>
    );
}
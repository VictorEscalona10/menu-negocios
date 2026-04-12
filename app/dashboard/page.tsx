// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/src/actions/auth'
import { headers } from 'next/headers'
import QRGenerator from '@/app/components/QRGenerator'

// 1. Movemos el Server Action FUERA del componente para evitar el bug de Turbopack
async function createStoreAction(userId: string, formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const whatsapp = formData.get('whatsapp') as string

    // Generamos un slug automático para su URL (Ej: "Burgers Carlos" -> "burgers-carlos")
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    await prisma.store.create({
        data: {
            name,
            whatsapp,
            slug,
            userId, // Usamos el parámetro que recibimos por el bind
        }
    })

    // Recargamos la página para que ahora muestre el panel
    revalidatePath('/dashboard')
}

export default async function DashboardPage() {
    // Obtenemos el usuario autenticado
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login') // Agregamos 'return' por buenas prácticas
    }

    const store = await prisma.store.findUnique({
        where: { userId: user.id }
    })

    // NUEVO: BLOQUEO DEL DASHBOARD SI NO ESTÁ ACTIVO (El escudo anti-morosos)
    if (store && !store.isActive) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-zinc-50/50">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center space-y-4 relative">

                    {/* BOTÓN DE CERRAR SESIÓN (Para usuarios bloqueados) */}
                    <div className="absolute top-4 right-4">
                        <form action={signOut}>
                            <button type="submit" className="text-zinc-400 hover:text-red-500 transition-colors p-2" title="Cerrar Sesión">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </form>
                    </div>

                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full mx-auto flex items-center justify-center mb-4 mt-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Servicio Pausado</h1>
                    <p className="text-zinc-600">
                        El acceso a tu menú público y a tu panel de administración ha sido suspendido. Por favor, regulariza tu pago para reactivar el servicio.
                    </p>
                    <a href="https://wa.me/584243016454" target="_blank" className="block w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors mt-4">
                        Contactar Soporte
                    </a>
                </div>
            </div>
        )
    }

    // 2. Preparamos el Server Action inyectándole el ID del usuario actual
    const createStoreWithUser = createStoreAction.bind(null, user.id)

    // INTERFAZ A: Si NO tiene local, le pedimos que lo cree
    if (!store) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-sm border border-zinc-200 relative">

                {/* BOTÓN DE CERRAR SESIÓN */}
                <div className="absolute top-6 right-6">
                    <form action={signOut}>
                        <button type="submit" className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-red-600 transition-colors bg-zinc-50 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-red-200">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Salir
                        </button>
                    </form>
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 mb-2 mt-2">¡Bienvenido a tu Menú!</h1>
                <p className="text-zinc-600 mb-6">Para empezar, necesitamos los datos básicos de tu negocio.</p>

                {/* Pasamos el action ya vinculado con el ID */}
                <form action={createStoreWithUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Local</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                            placeholder="Ej: Burgers Carlos"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">WhatsApp (con código de país)</label>
                        <input
                            name="whatsapp"
                            type="text"
                            required
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                            placeholder="Ej: 584141234567"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors mt-4"
                    >
                        Crear mi menú
                    </button>
                </form>
            </div>
        )
    }

    // INTERFAZ B: Si YA tiene local, le mostramos sus estadísticas
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const menuUrl = `${proto}://${host}/menu/${store.slug}`

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-zinc-50/50">
            <div className="w-full max-w-4xl bg-white p-10 rounded-3xl shadow-sm border border-zinc-200 relative">

                {/* BOTÓN DE CERRAR SESIÓN */}
                <div className="absolute top-6 right-6">
                    <form action={signOut}>
                        <button type="submit" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-red-600 transition-colors bg-zinc-50 hover:bg-red-50 px-4 py-2 rounded-xl border border-zinc-200 hover:border-red-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Cerrar Sesión
                        </button>
                    </form>
                </div>

                <div className="text-center mb-12 mt-4">
                    <h1 className="text-4xl font-extrabold text-zinc-900 mb-3 tracking-tight">Resumen de {store.name}</h1>
                    <p className="text-zinc-500 font-medium tracking-wide border-b border-zinc-100 pb-8 inline-block px-12">
                        Panel de Administración
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-zinc-50 hover:bg-zinc-100 transition-colors p-8 rounded-2xl border border-zinc-200 flex flex-col items-center text-center">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">Enlace del menú</h3>
                        <a href={`/menu/${store.slug}`} className="text-lg font-bold text-zinc-900 truncate w-full hover:text-black transition-colors">
                            /menu/{store.slug}
                        </a>
                    </div>
                    <div className="bg-zinc-50 hover:bg-zinc-100 transition-colors p-8 rounded-2xl border border-zinc-200 flex flex-col items-center text-center">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">WhatsApp</h3>
                        <p className="text-xl font-bold text-zinc-900">{store.whatsapp}</p>
                    </div>
                    <div className="bg-zinc-50 hover:bg-zinc-100 transition-colors p-8 rounded-2xl border border-zinc-200 flex flex-col items-center text-center relative overflow-hidden">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">Estado</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xl font-bold text-green-600">Activo</p>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN QR */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 mb-8 flex flex-col items-center gap-2">
                    <h2 className="text-sm uppercase tracking-widest font-bold text-zinc-400 mb-4">Código QR del Menú</h2>
                    <QRGenerator menuUrl={menuUrl} storeName={store.name} />
                    <p className="text-xs text-zinc-400 mt-3 text-center">Imprime este QR y colócalo en tu local para que los clientes accedan al menú desde su celular.</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 border-t border-zinc-100 pt-8">
                    <a
                        href="/dashboard/products"
                        className="group flex justify-center items-center gap-3 bg-white border border-zinc-200 text-zinc-800 px-8 py-4 rounded-xl font-medium hover:bg-zinc-50 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-200"
                    >
                        <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Categorías y Productos
                    </a>

                    <a
                        href="/dashboard/settings"
                        className="group flex justify-center items-center gap-3 bg-black text-white px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                        <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:rotate-45 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configuración de la Tienda
                    </a>
                </div>
            </div>
        </div>
    )
}
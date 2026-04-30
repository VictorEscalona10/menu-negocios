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
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-zinc-50">
                <div className="max-w-md w-full bg-white p-8 md:p-12 shadow-sm ring-1 ring-zinc-950/5 rounded-2xl relative">
                    <div className="absolute top-6 right-6">
                        <form action={signOut}>
                            <button type="submit" className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-50" title="Cerrar Sesión">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </form>
                    </div>

                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl ring-1 ring-rose-100 flex items-center justify-center mb-6 mt-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div className="space-y-2 border-b border-zinc-100 pb-6 mb-6">
                        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Servicio Suspendido</h1>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            El acceso a tu menú público y a tu panel de administración ha sido pausado.
                        </p>
                    </div>

                    <div className="bg-zinc-50/50 rounded-xl p-4 font-mono text-xs text-zinc-600 mb-6 flex justify-between items-center ring-1 ring-zinc-950/5">
                        <span className="uppercase tracking-widest text-[10px]">Estado</span>
                        <span className="text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-md">86'D (BLOQUEADO)</span>
                    </div>

                    <a href="https://wa.me/584243016454" target="_blank" className="flex items-center justify-center w-full bg-zinc-900 text-white text-sm font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm">
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
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-zinc-50">
                <div className="max-w-xl w-full bg-white p-8 md:p-12 shadow-sm ring-1 ring-zinc-950/5 rounded-2xl relative">
                    <div className="absolute top-6 right-6">
                        <form action={signOut}>
                            <button type="submit" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-zinc-50">
                                Salir
                            </button>
                        </form>
                    </div>

                    <div className="border-b border-zinc-100 pb-8 mb-8 mt-2">
                        <div className="font-mono text-xs text-zinc-400 mb-4 uppercase tracking-widest">Nuevo Registro</div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-2">Apertura de Local</h1>
                        <p className="text-zinc-500 text-sm">Ingresa los datos iniciales para tu menú digital.</p>
                    </div>

                    <form action={createStoreWithUser} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500">Nombre del Local</label>
                            <input
                                name="name"
                                type="text"
                                required
                                className="w-full bg-white ring-1 ring-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-sm"
                                placeholder="Ej: Burgers Carlos"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500">WhatsApp</label>
                            <input
                                name="whatsapp"
                                type="text"
                                required
                                className="w-full bg-white ring-1 ring-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-sm"
                                placeholder="Ej: 584141234567"
                            />
                            <p className="text-[11px] text-zinc-400 font-mono mt-1">Incluir código de país sin el +</p>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-zinc-900 text-white text-sm font-medium py-3.5 mt-8 rounded-xl hover:bg-zinc-800 transition-all shadow-sm flex justify-between items-center px-6 group"
                        >
                            <span>Registrar Local</span>
                            <span className="font-mono opacity-50 text-xs group-hover:opacity-100 transition-opacity">↵</span>
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // INTERFAZ B: Si YA tiene local, le mostramos sus estadísticas
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const menuUrl = `${proto}://${host}/menu/${store.slug}`

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end border-b border-zinc-200 pb-6 mb-8 mt-4 md:mt-8">
                    <div>
                        <div className="font-mono text-[10px] text-zinc-400 mb-2 uppercase tracking-widest">
                            Panel Principal
                        </div>
                        <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">{store.name}</h1>
                    </div>
                    <form action={signOut}>
                        <button type="submit" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-200/50">
                            Cerrar Sesión
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
                    {/* Left Column: Ledger / Metrics */}
                    <div className="space-y-6">
                        <div className="bg-white shadow-sm ring-1 ring-zinc-950/5 p-6 md:p-8 rounded-2xl relative">
                            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-6">Detalles del Local</h2>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline border-b border-zinc-100 pb-4">
                                    <span className="text-sm text-zinc-500 mb-1 sm:mb-0">Enlace Público</span>
                                    <a href={`/menu/${store.slug}`} className="font-mono text-sm text-zinc-900 hover:text-zinc-500 transition-colors truncate px-2 py-1 bg-zinc-50 rounded-md ring-1 ring-zinc-200/50">
                                        {host}/menu/{store.slug}
                                    </a>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-4">
                                    <span className="text-sm text-zinc-500">WhatsApp</span>
                                    <span className="font-mono text-sm text-zinc-900">{store.whatsapp}</span>
                                </div>
                                <div className="flex justify-between items-baseline pb-2">
                                    <span className="text-sm text-zinc-500">Estado de Operación</span>
                                    <span className="font-mono text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md ring-1 ring-emerald-600/10">ONLINE</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a
                                href="/dashboard/products"
                                className="group bg-white shadow-sm ring-1 ring-zinc-950/5 p-6 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[140px]"
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-100 transition-colors mb-4 ring-1 ring-zinc-900/5">
                                    <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-900 mb-1">Menú & Productos</h3>
                                    <p className="text-xs text-zinc-500 font-mono">Editar carta y categorías</p>
                                </div>
                            </a>

                            <a
                                href="/dashboard/settings"
                                className="group bg-white shadow-sm ring-1 ring-zinc-950/5 p-6 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[140px]"
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-100 transition-colors mb-4 ring-1 ring-zinc-900/5">
                                    <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-900 mb-1">Configuración</h3>
                                    <p className="text-xs text-zinc-500 font-mono">Ajustes del local</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Right Column: QR Code */}
                    <div>
                        <div className="bg-white shadow-sm ring-1 ring-zinc-950/5 p-6 rounded-2xl text-center sticky top-8 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="inline-block p-3 bg-white ring-1 ring-zinc-200/50 rounded-xl mb-6 shadow-sm">
                                <QRGenerator menuUrl={menuUrl} storeName={store.name} />
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed font-mono px-4">
                                Escanear para acceder al menú de {store.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
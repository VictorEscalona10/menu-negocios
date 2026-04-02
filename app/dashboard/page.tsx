// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function DashboardPage() {
    // 1. Obtenemos el usuario autenticado
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 2. Buscamos si este usuario ya tiene un local creado en Prisma
    const store = await prisma.store.findUnique({
        where: { userId: user.id }
    })

    // 3. Server Action para crear el local si no existe
    const createStore = async (formData: FormData) => {
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
                userId: user.id, // Vinculamos este negocio al usuario que inició sesión
            }
        })

        // Recargamos la página para que ahora muestre el panel
        revalidatePath('/dashboard')
    }

    // INTERFAZ A: Si NO tiene local, le pedimos que lo cree
    if (!store) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-sm border border-zinc-200">
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">¡Bienvenido a tu Menú!</h1>
                <p className="text-zinc-600 mb-6">Para empezar, necesitamos los datos básicos de tu negocio.</p>

                <form action={createStore} className="space-y-4">
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
    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">Resumen de {store.name}</h1>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-medium text-zinc-500 mb-2">Enlace de tu menú</h3>
                    <p className="text-lg font-bold text-zinc-900 truncate">
                        /menu/{store.slug}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-medium text-zinc-500 mb-2">WhatsApp Vinculado</h3>
                    <p className="text-xl font-bold text-zinc-900">+{store.whatsapp}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-medium text-zinc-500 mb-2">Estado</h3>
                    <p className="text-xl font-bold text-green-600">Activo</p>
                </div>
            </div>
        </div>
    )
}
// app/dashboard/products/page.tsx
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { createCategory, createProduct } from '@/src/actions/menu'

export default async function ProductsPage() {
    // 1. Verificamos la sesión
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 2. Buscamos el local, trayendo también sus categorías y los productos dentro de ellas
    const store = await prisma.store.findUnique({
        where: { userId: user.id },
        include: {
            categories: {
                include: {
                    products: true
                }
            }
        }
    })

    if (!store) {
        return redirect('/dashboard')
    }

    // 3. Preparamos el Server Action de la categoría
    const createCategoryAction = createCategory.bind(null, store.id)

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-zinc-900">Gestión del Menú</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Formulario de Categorías */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 h-fit">
                    <h2 className="text-xl font-semibold text-zinc-800 mb-4">Nueva Categoría</h2>
                    <form action={createCategoryAction} className="flex gap-2">
                        <input
                            type="text"
                            name="name"
                            placeholder="Ej: Hamburguesas, Bebidas..."
                            className="flex-1 border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                        <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800">
                            Crear
                        </button>
                    </form>
                </div>

                {/* Formulario de Productos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h2 className="text-xl font-semibold text-zinc-800 mb-4">Nuevo Producto</h2>

                    {store.categories.length === 0 ? (
                        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            Debes crear al menos una categoría primero para poder agregar productos.
                        </p>
                    ) : (
                        <form action={createProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Categoría</label>
                                <select name="categoryId" className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black" required>
                                    {store.categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del producto</label>
                                <input type="text" name="name" placeholder="Ej: Hamburguesa Clásica" className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
                                <textarea name="description" placeholder="Ingredientes o detalles..." className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none resize-none" rows={2}></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Precio ($)</label>
                                <input type="number" step="0.01" name="price" placeholder="5.50" className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none" required />
                            </div>

                            <button type="submit" className="w-full bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-zinc-800">
                                Agregar Producto
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Vista Previa del Menú Actual */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-zinc-900 mb-6 border-b pb-2">Tu Menú Actual</h2>

                {store.categories.length === 0 ? (
                    <p className="text-zinc-500">Tu menú está vacío.</p>
                ) : (
                    <div className="space-y-8">
                        {store.categories.map((category) => (
                            <div key={category.id}>
                                <h3 className="text-xl font-semibold text-zinc-800 mb-4 bg-zinc-100 p-2 rounded-lg inline-block px-4">
                                    {category.name}
                                </h3>

                                {category.products.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic ml-4">No hay productos en esta categoría.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                                        {category.products.map((product) => (
                                            <div key={product.id} className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-zinc-900">{product.name}</h4>
                                                        <span className="font-medium text-green-600">${product.price.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-500 line-clamp-2">{product.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
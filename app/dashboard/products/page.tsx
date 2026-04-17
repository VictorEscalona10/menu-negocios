import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createCategory, createProduct, deleteCategory, deleteProduct } from '@/src/actions/menu'
import { CategoryForm } from './CategoryForm'
import { ProductForm } from './ProductForm'
import { DeleteButton } from './DeleteButton'
import { SortableProductList } from './SortableProductList'

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
                    products: {
                        include: {
                            modifierGroups: {
                                include: {
                                    options: true
                                },
                                orderBy: {
                                    name: 'asc'
                                }
                            }
                        },
                        orderBy: [
                            { order: 'asc' },
                            { name: 'asc' }
                        ]
                    }
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
        <div className="max-w-7xl mx-auto space-y-8 p-6 lg:p-10 relative">
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
                <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Gestión del Menú</h1>
                <p className="text-zinc-500 font-medium mt-1">Añade y organiza los items de tu tienda</p>
            </div>

            {/* Inicia la Cuadrícula Responsiva */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mt-8">
                
                {/* Panel Izquierdo: Formularios de Creación (Sticky en Desktop) */}
                <div className="lg:col-span-5 flex flex-col gap-10 lg:sticky lg:top-8">
                    {/* Formulario de Categorías - Inline Simple */}
                    <div className="bg-white rounded-3xl h-fit">
                        <CategoryForm createAction={createCategoryAction} />
                    </div>

                    {/* Formulario de Productos - Highlighted */}
                    <div className="bg-white px-6 py-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
                        <h2 className="text-2xl font-black text-zinc-900 mb-8 tracking-tight">Agregar Producto Nuevo</h2>
                        <ProductForm categories={store.categories} action={createProduct} />
                    </div>
                </div>

                {/* Panel Derecho: Lista del Menú Actual */}
                <div className="lg:col-span-7">
                    <h2 className="text-2xl font-black text-zinc-900 mb-8 pb-4 border-b border-zinc-100">Menú Actual</h2>

                    {store.categories.length === 0 ? (
                        <p className="text-zinc-500 bg-zinc-50 p-6 rounded-2xl text-center border border-zinc-100">Tu menú está limpio. Comienza agregando categorías en el panel.</p>
                    ) : (
                        <div className="space-y-10">
                            {store.categories.map((category: any) => {
                                const boundDeleteCategory = deleteCategory.bind(null, category.id);
                                
                                return (
                                    <div key={category.id}>
                                        <div className="flex items-center gap-3 mb-6 bg-zinc-50/50 p-2 pl-4 rounded-xl inline-flex group border border-transparent hover:border-zinc-100 transition-colors">
                                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">
                                                {category.name}
                                            </h3>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DeleteButton 
                                                    deleteAction={boundDeleteCategory} 
                                                    itemName={category.name} 
                                                    isCategory={true} 
                                                />
                                            </div>
                                        </div>

                                        {category.products.length === 0 ? (
                                            <p className="text-sm text-zinc-400 italic ml-4">Categoría vacía.</p>
                                        ) : (
                                            <SortableProductList 
                                                categoryId={category.id}
                                                initialProducts={category.products}
                                                categories={store.categories}
                                                deleteProductAction={deleteProduct}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { ProductForm } from "./ProductForm"
import { updateProduct } from "@/src/actions/menu"

interface Category {
    id: string
    name: string
}

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    categoryId: string
    imageUrl: string | null
    isCombo?: boolean
    comboBadge?: string | null
}

export function EditProductModal({
    product,
    categories
}: {
    product: Product,
    categories: Category[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // El Server Action necesita el ID del producto, así que lo bindeamos
    const boundUpdateAction = updateProduct.bind(null, product.id)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                title="Editar Producto"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Editar Producto</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Actualiza los detalles de tu platillo</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                <ProductForm
                                    categories={categories}
                                    action={boundUpdateAction}
                                    initialData={product}
                                    onSuccess={() => setIsOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

"use client"

import { useState } from "react"
import { ConfirmationModal } from "./ConfirmationModal"

interface Category {
    id: string
    name: string
}

export function ProductForm({ categories, createProductAction }: { categories: Category[], createProductAction: (formData: FormData) => Promise<any> }) {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [isPending, setIsPending] = useState(false)
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
    const [productName, setProductName] = useState("")

    // 1. Evitamos el submit por defecto y mostramos el modal
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        
        if (!formData.get("name") || !formData.get("price") || !formData.get("categoryId")) return
        
        setPendingFormData(formData)
        setProductName(formData.get("name") as string)
        setIsModalOpen(true)
    }

    // 2. Al confirmar el Modal, lanzamos la acción del servidor
    const executeAction = async () => {
        setIsModalOpen(false)
        if (!pendingFormData) return

        setIsPending(true)
        try {
            await createProductAction(pendingFormData)
            setStatus("success")
            setTimeout(() => setStatus("idle"), 4000)
            
            // Reseteamos el formulario
            const formElement = document.getElementById("product-form") as HTMLFormElement
            if (formElement) formElement.reset()
            setPendingFormData(null)
        } catch (error) {
            console.error(error)
            setStatus("error")
            setTimeout(() => setStatus("idle"), 4000)
        } finally {
            setIsPending(false)
        }
    }

    if (categories.length === 0) {
        return (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Debes crear al menos una categoría primero para poder agregar productos.
            </p>
        )
    }

    return (
        <div className="relative">
            <ConfirmationModal 
                isOpen={isModalOpen}
                title="Añadir Producto"
                description={`¿Deseas guardar el producto "${productName}" en tu menú?`}
                onConfirm={executeAction}
                onCancel={() => setIsModalOpen(false)}
                confirmText="Guardar Producto"
            />

            {status === "success" && (
                <div className="absolute top-0 left-0 right-0 -m-4 mb-4 bg-green-50 text-green-800 p-3 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 z-10 shadow-sm">
                    <div className="bg-green-100 p-1.5 rounded-full shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <span className="font-medium text-sm text-center">¡Producto guardado correctamente!</span>
                </div>
            )}

            <form id="product-form" onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Categoría</label>
                    <div className="relative">
                        <select name="categoryId" className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium" required>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Nombre del producto</label>
                    <input type="text" name="name" placeholder="Ej: Hamburguesa Clásica" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400" required />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Descripción</label>
                    <textarea name="description" placeholder="Ingredientes o detalles..." className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium resize-none placeholder-zinc-400" rows={3}></textarea>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Precio ($)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <span className="text-zinc-500 font-bold">$</span>
                        </div>
                        <input type="number" step="0.01" name="price" placeholder="5.50" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-9 pr-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-bold placeholder-zinc-400" required />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isPending}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all shadow-sm ${
                        isPending ? "bg-zinc-400 text-white cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800 hover:-translate-y-0.5 active:scale-95"
                    }`}
                >
                    {isPending && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isPending ? "Agregando Producto..." : "Agregar Producto"}
                </button>
            </form>
        </div>
    )
}

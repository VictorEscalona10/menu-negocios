"use client"

import { useState } from "react"
import { ConfirmationModal } from "./ConfirmationModal"

interface Category {
    id: string
    name: string
}

export function ProductForm({
    categories,
    action,
    initialData,
    onSuccess
}: {
    categories: Category[],
    action: (formData: FormData) => Promise<any>,
    initialData?: {
        id: string
        name: string
        description: string | null
        price: number
        categoryId: string
        imageUrl: string | null
        isCombo?: boolean
        comboBadge?: string | null
    },
    onSuccess?: () => void
}) {
    const isEditing = !!initialData
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const [isPending, setIsPending] = useState(false)

    // Combo state
    const [isCombo, setIsCombo] = useState(initialData?.isCombo ?? false)
    const [comboBadge, setComboBadge] = useState(initialData?.comboBadge ?? "")

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
        setErrorMessage("")
        try {
            const res = await action(pendingFormData)
            
            // Si la acción devuelve explícitamente un objeto con { error: string }
            if (res && res.error) {
                setErrorMessage(res.error)
                setStatus("error")
                setTimeout(() => setStatus("idle"), 6000)
                return
            }

            setStatus("success")

            if (onSuccess) {
                // Pequeño delay para que se vea el mensaje de éxito antes de cerrar modal si aplica
                setTimeout(() => onSuccess(), 1500)
            }

            setTimeout(() => setStatus("idle"), 4000)

            // Reseteamos el formulario solo si no estamos editando (en modal de edición se cerrará)
            if (!isEditing) {
                const formElement = document.getElementById("product-form") as HTMLFormElement
                if (formElement) formElement.reset()
            }
            setPendingFormData(null)
        } catch (error: any) {
            console.error(error)
            setErrorMessage(error.message || "Ocurrió un error inesperado.")
            setStatus("error")
            setTimeout(() => setStatus("idle"), 6000)
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
                title={isEditing ? "Actualizar Producto" : "Añadir Producto"}
                description={isEditing
                    ? `¿Deseas guardar los cambios en "${productName}"?`
                    : `¿Deseas guardar el producto "${productName}" en tu menú?`
                }
                onConfirm={executeAction}
                onCancel={() => setIsModalOpen(false)}
                confirmText={isEditing ? "Actualizar" : "Guardar Producto"}
            />

            {status === "success" && (
                <div className="absolute top-0 left-0 right-0 -m-4 mb-4 bg-green-50 text-green-800 p-3 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 z-10 shadow-sm">
                    <div className="bg-green-100 p-1.5 rounded-full shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <span className="font-medium text-sm text-center">
                        {isEditing ? "¡Producto actualizado correctamente!" : "¡Producto guardado correctamente!"}
                    </span>
                </div>
            )}

            {status === "error" && errorMessage && (
                <div className="absolute top-0 left-0 right-0 -m-4 mb-4 bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 z-10 shadow-sm">
                    <div className="bg-red-100 p-1.5 rounded-full shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-medium text-sm max-w-full truncate text-wrap">
                        {errorMessage}
                    </span>
                </div>
            )}

            <form id={isEditing ? `product-form-${initialData.id}` : "product-form"} onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Categoría</label>
                    <div className="relative">
                        <select
                            name="categoryId"
                            defaultValue={initialData?.categoryId}
                            className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium"
                            required
                        >
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
                    <input
                        type="text"
                        name="name"
                        defaultValue={initialData?.name}
                        placeholder="Ej: Hamburguesa Clásica"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Imagen del Producto {isEditing && <span className="text-zinc-400 font-normal">(Opcional, deja vacío para conservar)</span>}
                    </label>
                    {initialData?.imageUrl && (
                        <div className="mb-3 relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-100 shadow-sm">
                            <img src={initialData.imageUrl} alt={initialData.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none bg-zinc-50"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Descripción</label>
                    <textarea
                        name="description"
                        defaultValue={initialData?.description || ""}
                        placeholder="Ingredientes o detalles..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium resize-none placeholder-zinc-400"
                        rows={3}
                    ></textarea>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-zinc-800 ml-1">Precio ($)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <span className="text-zinc-500 font-bold">$</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            name="price"
                            defaultValue={initialData?.price}
                            placeholder="5.50"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-9 pr-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-bold placeholder-zinc-400"
                            required
                        />
                    </div>
                </div>

                {/* ── Sección Combo ── */}
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <input type="hidden" name="isCombo" value={isCombo ? 'on' : 'off'} />
                    <button
                        type="button"
                        onClick={() => setIsCombo(!isCombo)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            isCombo
                                ? 'border-amber-400 bg-amber-50'
                                : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }`}
                    >
                        <span className="text-2xl shrink-0">🌟</span>
                        <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${isCombo ? 'text-amber-900' : 'text-zinc-500'}`}>
                                Este producto es un Combo
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                                {isCombo ? 'Se mostrará con estilo destacado en el menú' : 'Se mostrará como producto regular'}
                            </p>
                        </div>
                        <div className={`shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 ${isCombo ? 'bg-amber-500' : 'bg-zinc-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isCombo ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    {isCombo && (
                        <div className="space-y-1.5" style={{ animation: 'fadeIn 0.2s ease' }}>
                            <label className="block text-sm font-bold text-zinc-800 ml-1">Etiqueta del Combo</label>
                            <input
                                type="text"
                                name="comboBadge"
                                value={comboBadge}
                                onChange={(e) => setComboBadge(e.target.value)}
                                placeholder='Ej: Ahorra $2, Familiar, 2x1'
                                maxLength={30}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all font-medium placeholder-zinc-400"
                            />
                            <p className="text-[10px] text-zinc-400 ml-1">Opcional. Aparece como badge destacado en el menú público.</p>
                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }` }} />

                <button
                    type="submit"
                    disabled={isPending}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all shadow-sm ${isPending ? "bg-zinc-400 text-white cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800 hover:-translate-y-0.5 active:scale-95"
                        }`}
                >
                    {isPending && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isPending
                        ? (isEditing ? "Actualizando..." : "Agregando Producto...")
                        : (isEditing ? "Actualizar Producto" : "Agregar Producto")
                    }
                </button>
            </form>
        </div>
    )
}

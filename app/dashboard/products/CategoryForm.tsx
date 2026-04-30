"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { ConfirmationModal } from "./ConfirmationModal"

function CategorySubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${pending ? "bg-zinc-400 text-white cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800"
                }`}
        >
            {pending && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {pending ? "Creando..." : "Crear"}
        </button>
    )
}

export function CategoryForm({ createAction }: { createAction: (formData: FormData) => Promise<any> }) {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
    const [categoryName, setCategoryName] = useState("")

    // Interceptamos el evento normal de form onSubmit
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        // Verificamos si tiene datos
        if (!formData.get("name")) return

        setPendingFormData(formData)
        setCategoryName(formData.get("name") as string)
        setIsModalOpen(true) // Abrimos el modal
    }

    // El usuario presionó "Confirmar" en el modal
    const executeAction = async () => {
        setIsModalOpen(false)
        if (!pendingFormData) return

        try {
            await createAction(pendingFormData)
            setStatus("success")
            setTimeout(() => setStatus("idle"), 3000)

            // Limpiamos el input si queremos resetear visualmente
            const formElement = document.getElementById("category-form") as HTMLFormElement
            if (formElement) formElement.reset()
            setPendingFormData(null)
        } catch (error) {
            console.error(error)
            setStatus("error")
            setTimeout(() => setStatus("idle"), 3000)
        }
    }

    return (
        <div className="relative mb-8">
            <ConfirmationModal
                isOpen={isModalOpen}
                title="Nueva Categoría"
                description={`¿Estás seguro que deseas crear la categoría "${categoryName}"? Podrás agregar productos dentro de ella luego.`}
                onConfirm={executeAction}
                onCancel={() => setIsModalOpen(false)}
                confirmText="Crear Categoría"
            />

            {status === "success" && (
                <div className="absolute -top-14 left-0 right-0 bg-green-50 text-green-800 p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 z-10 shadow-sm">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="font-medium text-sm">Categoría creada con éxito</span>
                </div>
            )}

            <form id="category-form" onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 items-center bg-zinc-50/80 p-2 pl-4 rounded-2xl border border-zinc-200 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
                <input
                    type="text"
                    name="name"
                    placeholder="Ej: Hamburguesas, Ensaladas..."
                    className="flex-1 bg-transparent border-none outline-none py-3 text-zinc-800 w-full font-medium placeholder-zinc-400"
                    required
                />
                <button
                    type="submit"
                    className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-zinc-800 shadow-sm transition-transform active:scale-95"
                >
                    + Añadir
                </button>
            </form>
        </div>
    )
}

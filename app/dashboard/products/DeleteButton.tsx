"use client"

import { useState } from "react"
import { ConfirmationModal } from "./ConfirmationModal"

interface DeleteButtonProps {
    deleteAction: () => Promise<any>
    itemName: string
    isCategory?: boolean
}

export function DeleteButton({ deleteAction, itemName, isCategory = false }: DeleteButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Detenemos la propagación solo por seguridad visual si está en un contenedor clickable
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsModalOpen(true)
    }

    const confirmDelete = async () => {
        setIsModalOpen(false)
        setIsDeleting(true)
        try {
            await deleteAction()
            // Next.js (Server Action + revalidatePath) se encargará 
            // de refrescar la página silenciosamente casi al instante.
        } catch (error) {
            console.error(error)
            setIsDeleting(false) // Solo paramos el loading si falla
        }
    }

    // Modal Strings
    const title = isCategory ? "Eliminar Categoría" : "Eliminar Producto"
    const desc = isCategory 
        ? `¿Estás completamente seguro de borrar la categoría "${itemName}"? ¡Se eliminarán permanentemente todos los productos dentro de ella!`
        : `¿Eliminar permanentemente el producto "${itemName}" del menú?`

    return (
        <>
            <ConfirmationModal 
                isOpen={isModalOpen}
                title={title}
                description={desc}
                onConfirm={confirmDelete}
                onCancel={() => setIsModalOpen(false)}
                confirmText={isCategory ? "Sí, eliminar todo" : "Sí, eliminar"}
            />

            <button
                onClick={handleClick}
                disabled={isDeleting}
                className="group relative p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                title={title}
            >
                {isDeleting ? (
                    <svg className="animate-spin w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                )}
            </button>
        </>
    )
}

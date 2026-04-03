"use client"

import { useState } from "react"
import { 
    createModifierGroup, 
    createModifierOption, 
    deleteModifierGroup, 
    deleteModifierOption 
} from "@/src/actions/modifiers"

interface ModifierOption {
    id: string;
    name: string;
    price: number;
}

interface ModifierGroup {
    id: string;
    name: string;
    isRequired: boolean;
    maxSelect: number | null;
    options: ModifierOption[];
}

interface Product {
    id: string;
    name: string;
    modifierGroups: ModifierGroup[];
}

export function ModifiersManager({ product }: { product: Product }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    // Form states
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

    const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setIsPending(true)
        try {
            await createModifierGroup(product.id, formData)
            e.currentTarget.reset()
        } finally {
            setIsPending(false)
        }
    }

    const handleCreateOption = async (e: React.FormEvent<HTMLFormElement>, groupId: string) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setIsPending(true)
        try {
            await createModifierOption(groupId, formData)
            e.currentTarget.reset()
            setActiveGroupId(null)
        } finally {
            setIsPending(false)
        }
    }

    const handleDeleteGroup = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este grupo de opciones y todas sus opciones?")) return;
        setIsPending(true)
        try {
            await deleteModifierGroup(id)
        } finally {
            setIsPending(false)
        }
    }

    const handleDeleteOption = async (id: string) => {
        setIsPending(true)
        try {
            await deleteModifierOption(id)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100/80 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-zinc-300"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Configurar Extras
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 leading-tight">Extras y Modificadores</h3>
                                <p className="text-zinc-500 text-sm font-medium">Configurando para: <span className="font-bold text-zinc-800">{product.name}</span></p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-500 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto bg-zinc-50 flex-1 space-y-8">

                            {/* Section: Grupo Nuevo */}
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                                <h4 className="font-bold text-zinc-900 mb-4">Añadir Nuevo Grupo (Ej. Salsas Extra)</h4>
                                <form onSubmit={handleCreateGroup} className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">Nombre del grupo</label>
                                        <input type="text" name="name" placeholder="Ej: Elige 2 carnes" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors" />
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">Límite (Opcional)</label>
                                        <input type="number" name="maxSelect" placeholder="Ej: 2" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 mr-2">
                                        <input type="checkbox" id="isRequired" name="isRequired" value="true" className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black" />
                                        <label htmlFor="isRequired" className="text-sm font-bold text-zinc-700 cursor-pointer">Requerido</label>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isPending}
                                        className="bg-black hover:bg-zinc-800 text-white font-medium px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 h-[42px]"
                                    >
                                        Crear Grupo
                                    </button>
                                </form>
                            </div>

                            {/* Section: Grupos Existentes */}
                            <div className="space-y-6">
                                {product.modifierGroups.length === 0 ? (
                                    <div className="text-center py-10 bg-white border border-dashed border-zinc-300 rounded-2xl">
                                        <p className="text-zinc-500 font-medium">Aún no hay grupos para este producto.</p>
                                    </div>
                                ) : (
                                    product.modifierGroups.map((group) => (
                                        <div key={group.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                            {/* Group Header */}
                                            <div className="bg-zinc-100/50 p-4 border-b border-zinc-200 flex justify-between items-center">
                                                <div>
                                                    <h5 className="font-black text-lg text-zinc-900">{group.name}</h5>
                                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                                                        {group.isRequired ? 'Obligatorio' : 'Opcional'} 
                                                        {group.maxSelect ? ` • Max: ${group.maxSelect}` : ''}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                    disabled={isPending}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Eliminar Grupo"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>

                                            {/* Group Options List */}
                                            <div className="p-4 space-y-3">
                                                {group.options.length === 0 ? (
                                                    <p className="text-sm text-zinc-400 italic">No hay opciones agregadas.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {group.options.map((option) => (
                                                            <div key={option.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 group-hover:border-zinc-200">
                                                                <span className="font-bold text-zinc-800">{option.name}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-black text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                                        {option.price > 0 ? `+$${option.price.toFixed(2)}` : 'Gratis'}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => handleDeleteOption(option.id)}
                                                                        disabled={isPending}
                                                                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Form Add Option */}
                                                {activeGroupId === group.id ? (
                                                    <form onSubmit={(e) => handleCreateOption(e, group.id)} className="flex gap-2 items-end pt-3 mt-3 border-t border-zinc-100">
                                                        <div className="flex-1 space-y-1">
                                                            <input type="text" name="name" placeholder="Nueva opción (Ej. Tocino)" required className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-black outline-none transition-colors" />
                                                        </div>
                                                        <div className="w-24 space-y-1">
                                                            <input type="number" step="0.01" name="price" placeholder="Precio ($)" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-black outline-none transition-colors" />
                                                        </div>
                                                        <button 
                                                            type="submit" 
                                                            disabled={isPending}
                                                            className="bg-black text-white hover:bg-zinc-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setActiveGroupId(null)}
                                                            className="bg-zinc-200 text-zinc-600 hover:bg-zinc-300 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <button 
                                                        onClick={() => setActiveGroupId(group.id)}
                                                        className="mt-3 flex items-center justify-center w-full gap-2 p-2 border border-dashed border-zinc-300 rounded-xl text-zinc-500 font-bold text-sm hover:bg-zinc-50 hover:text-black hover:border-black transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                        Agregar Opción
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

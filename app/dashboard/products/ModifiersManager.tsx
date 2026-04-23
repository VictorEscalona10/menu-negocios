"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
    createModifierGroup, 
    createModifierOption, 
    deleteModifierGroup, 
    deleteModifierOption,
    toggleModifierOptionAvailability
} from "@/src/actions/modifiers"
import { ConfirmationModal } from "./ConfirmationModal"

interface ModifierOption {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
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
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // UI states
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [deletingItem, setDeletingItem] = useState<{ id: string, name: string, type: 'group' | 'option' } | null>(null)
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

    // Helper to show status and clear it
    const showStatus = (type: 'success' | 'error', message: string) => {
        setStatus({ type, message })
        setTimeout(() => setStatus(null), 5000)
    }

    const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        setIsPending(true)
        setStatus(null)
        try {
            await createModifierGroup(product.id, formData)
            form.reset()
            showStatus('success', 'Grupo de extras creado correctamente.')
        } catch (error: any) {
            showStatus('error', error.message || 'Error al crear el grupo.')
        } finally {
            setIsPending(false)
        }
    }

    const handleCreateOption = async (e: React.FormEvent<HTMLFormElement>, groupId: string) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        setIsPending(true)
        setStatus(null)
        try {
            await createModifierOption(groupId, formData)
            form.reset()
            setActiveGroupId(null)
            showStatus('success', 'Opción añadida correctamente.')
        } catch (error: any) {
            showStatus('error', error.message || 'Error al añadir la opción.')
        } finally {
            setIsPending(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!deletingItem) return
        
        const { id, type } = deletingItem
        setDeletingItem(null)
        setIsPending(true)
        setStatus(null)
        
        try {
            if (type === 'group') {
                await deleteModifierGroup(id)
                showStatus('success', 'Grupo eliminado correctamente.')
            } else {
                await deleteModifierOption(id)
                showStatus('success', 'Opción eliminada correctamente.')
            }
        } catch (error: any) {
            showStatus('error', error.message || 'Error al eliminar el elemento.')
        } finally {
            setIsPending(false)
        }
    }

    const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
        setIsPending(true)
        setStatus(null)
        try {
            await toggleModifierOptionAvailability(id, !currentStatus)
            showStatus('success', `Opción ${!currentStatus ? 'activada' : 'desactivada'} correctamente.`)
        } catch (error: any) {
            showStatus('error', error.message || 'Error al cambiar el estado.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-sm font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition-all border border-zinc-200 active:scale-95 shadow-sm"
            >
                <div className="bg-white p-1 rounded-md shadow-sm">
                    <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
                <span>Extras</span>
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 px-0 sm:p-4">
                    {/* Background click to close */}
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                    <div 
                        className="bg-white w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative animate-in slide-in-from-bottom duration-300 ease-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Indicator (Mobile) */}
                        <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto my-3 sm:hidden shadow-inner" />

                        {/* Header */}
                        <div className="px-6 py-4 sm:p-8 border-b border-zinc-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 leading-tight tracking-tight">Extras y Agregados</h3>
                                <p className="text-zinc-500 text-sm font-medium mt-1">Configurando: <span className="font-bold text-black border-b border-zinc-200">{product.name}</span></p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-black rounded-full transition-all active:scale-90"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 sm:p-8 overflow-y-auto bg-zinc-50/30 flex-1 space-y-10 custom-scrollbar pb-10 sm:pb-8">
                            
                            {/* Inline Feedback */}
                            {status && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                                    status.type === 'success' 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                        : 'bg-red-50 text-red-800 border-red-100'
                                }`}>
                                    <div className={`p-1.5 rounded-full shrink-0 ${status.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                        {status.type === 'success' ? (
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold tracking-tight">{status.message}</span>
                                </div>
                            )}

                            {/* Section: Grupo Nuevo */}
                            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <h4 className="font-bold text-zinc-900 mb-6 text-lg">Añadir Categoría de Extras</h4>
                                <form onSubmit={handleCreateGroup} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre del grupo</label>
                                            <input type="text" name="name" placeholder="Ej: Proteínas, Salsas..." required className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all text-black" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Límite (Opcional)</label>
                                            <input type="number" name="maxSelect" placeholder="Ej: Máximo 2" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all text-black" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" id="isRequired" name="isRequired" value="true" className="peer sr-only" />
                                                <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-checked:bg-black transition-all"></div>
                                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-5 shadow-sm"></div>
                                            </div>
                                            <span className="text-sm font-black text-zinc-700 group-hover:text-black transition-colors">Es obligatorio seleccionar</span>
                                        </label>
                                        <button 
                                            type="submit" 
                                            disabled={isPending}
                                            className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-2xl transition-all disabled:opacity-50 shadow-md active:scale-95"
                                        >
                                            Crear Grupo
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Section: Grupos Existentes */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-0.5 flex-1 bg-zinc-100"></div>
                                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tus Grupos Actuales</span>
                                    <div className="h-0.5 flex-1 bg-zinc-100"></div>
                                </div>

                                {product.modifierGroups.length === 0 ? (
                                    <div className="text-center py-14 bg-white border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                                        <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🧩</div>
                                        <p className="text-zinc-500 font-bold">No has configurado extras para este producto.</p>
                                        <p className="text-zinc-400 text-sm mt-1 font-medium">Empieza creando un grupo arriba.</p>
                                    </div>
                                ) : (
                                    product.modifierGroups.map((group) => (
                                        <div key={group.id} className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            {/* Group Header */}
                                            <div className="bg-zinc-50/50 p-6 border-b border-zinc-100 flex justify-between items-center">
                                                <div>
                                                    <h5 className="font-black text-xl text-zinc-900 tracking-tight">{group.name}</h5>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${group.isRequired ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                                            {group.isRequired ? 'Requerido' : 'Opcional'}
                                                        </span>
                                                        {group.maxSelect && (
                                                            <span className="text-[10px] font-black bg-zinc-800 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                                Máx: {group.maxSelect}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setDeletingItem({ id: group.id, name: group.name, type: 'group' })}
                                                    disabled={isPending}
                                                    className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50 active:scale-90"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>

                                            {/* Group Options List */}
                                            <div className="p-6 space-y-4">
                                                {group.options.length === 0 ? (
                                                    <div className="py-6 px-4 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200 text-center">
                                                        <p className="text-sm font-bold text-zinc-500 italic">No hay opciones agregadas.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {group.options.map((option) => (
                                                            <div key={option.id} className={`flex justify-between items-center bg-zinc-50/30 p-4 rounded-2xl border border-zinc-100 group transition-all hover:bg-zinc-50 ${!option.isAvailable ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                                                <div className="flex flex-col">
                                                                    <span className={`font-bold ${!option.isAvailable ? 'text-zinc-500' : 'text-zinc-800'}`}>
                                                                        {option.name}
                                                                        {!option.isAvailable && <span className="ml-2 text-[10px] bg-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">Agotado</span>}
                                                                    </span>
                                                                    {option.price > 0 && (
                                                                        <span className="font-black text-xs text-emerald-600 mt-0.5">
                                                                            +${option.price.toFixed(2)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-2 sm:gap-4">
                                                                    {/* Switch de Disponibilidad */}
                                                                    <label className="relative inline-flex items-center cursor-pointer group/switch scale-90" title={option.isAvailable ? "Desactivar opción" : "Activar opción"}>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="sr-only peer" 
                                                                            checked={option.isAvailable}
                                                                            onChange={() => handleToggleAvailability(option.id, option.isAvailable)}
                                                                            disabled={isPending}
                                                                        />
                                                                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                                                    </label>

                                                                    <button 
                                                                        onClick={() => setDeletingItem({ id: option.id, name: option.name, type: 'option' })}
                                                                        disabled={isPending}
                                                                        className="text-zinc-300 hover:text-red-500 transition-all p-1.5 active:scale-90"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Form Add Option */}
                                                {activeGroupId === group.id ? (
                                                    <form 
                                                        onSubmit={(e) => handleCreateOption(e, group.id)} 
                                                        className="flex flex-col gap-4 p-5 mt-4 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in zoom-in-95 duration-200"
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre de la opción</label>
                                                                <input type="text" name="name" placeholder="Ej: Bacon, Sin cebolla..." required className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-black outline-none transition-all text-black" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Precio Adicional ($)</label>
                                                                <input type="number" step="0.01" name="price" placeholder="0.00" className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-1 focus:ring-black outline-none transition-all text-black" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <button 
                                                                type="submit" 
                                                                disabled={isPending}
                                                                className="flex-1 bg-black text-white hover:bg-zinc-800 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 active:scale-[0.98]"
                                                            >
                                                                Guardar Opción
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setActiveGroupId(null)}
                                                                className="px-5 py-3 bg-zinc-200 text-zinc-600 hover:bg-zinc-300 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <button 
                                                        onClick={() => setActiveGroupId(group.id)}
                                                        className="mt-2 flex items-center justify-center w-full gap-2 p-4 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 font-bold text-sm hover:bg-zinc-50 hover:text-black hover:border-zinc-300 transition-all active:scale-[0.98]"
                                                    >
                                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
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
                </div>,
                document.body
            )}

            <ConfirmationModal 
                isOpen={!!deletingItem}
                title={`¿Eliminar ${deletingItem?.type === 'group' ? 'grupo' : 'opción'}?`}
                description={`¿Estás seguro que deseas eliminar "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeletingItem(null)}
            />
        </>
    )
}

"use client"

import { useOptimistic, useTransition, useActionState } from "react"
import { toggleProductAvailability } from "@/src/actions/menu"
import { EditProductModal } from "./EditProductModal"
import { DeleteButton } from "./DeleteButton"
import { ModifiersManager } from "./ModifiersManager"

interface ProductCardProps {
    product: any;
    categories: any[];
    deleteAction: any;
}

export function ProductCard({ product, categories, deleteAction }: ProductCardProps) {
    const [isPending, startTransition] = useTransition()
    
    // Optimistic state for visual feedback
    const [optimisticAvailable, setOptimisticAvailable] = useOptimistic(
        product.isAvailable,
        (current, newValue: boolean) => newValue
    )

    const handleToggle = async () => {
        const nextValue = !optimisticAvailable
        
        startTransition(async () => {
            // 1. Update UI immediately
            setOptimisticAvailable(nextValue)
            
            try {
                // 2. Call server action
                await toggleProductAvailability(product.id, optimisticAvailable)
            } catch (error) {
                // 3. If failed, rollback is automatic when transition ends, 
                // but we show the alert first
                alert(`Error: No se pudo cambiar la disponibilidad de "${product.name}".`)
            }
        })
    }

    return (
        <div className={`group bg-white border p-3 sm:p-4 md:p-6 rounded-[1.5rem] sm:rounded-[2rem] transition-all shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden ${
            optimisticAvailable
                 ? 'border-zinc-100 hover:border-zinc-200'
                 : 'border-zinc-200 bg-zinc-50/60 opacity-60'
        }`}>
            <div className="flex flex-col gap-3 sm:gap-5 min-w-0">
                {/* Top Section: Info and Quick Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 min-w-0">
                    <div className="flex-1 min-w-0 w-full sm:w-auto sm:pr-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5 min-w-0">
                            <h4 className="font-black text-base sm:text-lg text-zinc-900 leading-tight break-words min-w-0">
                                {product.name}
                            </h4>
                            {product.modifierGroups.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-tighter shrink-0 whitespace-nowrap">
                                    + Extras
                                </span>
                            )}
                        </div>
                        
                        {!optimisticAvailable ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-500 uppercase tracking-wider border border-red-100/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Agotado
                            </span>
                        ) : (
                            <p className="text-zinc-500 text-xs sm:text-sm font-medium line-clamp-2 leading-relaxed">
                                {product.description || "Sin descripción"}
                            </p>
                        )}
                    </div>
                    
                    {/* Action Row: Price & Tools */}
                    <div className="flex items-center justify-between w-full sm:justify-end sm:w-auto gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Optimistic Switch Button */}
                            <button
                                onClick={handleToggle}
                                disabled={isPending}
                                title={optimisticAvailable ? `Desactivar "${product.name}"` : `Activar "${product.name}"`}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none shrink-0 ${
                                    optimisticAvailable ? 'bg-emerald-500' : 'bg-zinc-200'
                                }`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                        optimisticAvailable ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>

                            <span className="font-black text-zinc-900 bg-zinc-50 border border-zinc-100 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm whitespace-nowrap">
                                ${product.price.toFixed(2)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-zinc-50 border border-zinc-100 rounded-xl flex gap-1">
                                <EditProductModal product={product} categories={categories} />
                                <DeleteButton 
                                    deleteAction={deleteAction} 
                                    itemName={product.name} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Advanced Configs */}
                <div className="flex items-center justify-between sm:justify-start gap-4 pt-1">
                    <ModifiersManager product={product} />
                </div>
            </div>
        </div>
    )
}

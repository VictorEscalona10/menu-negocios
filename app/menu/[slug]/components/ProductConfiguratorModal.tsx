"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/src/store/cartStore"

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
    price: number;
    description: string | null;
    imageUrl: string | null;
    modifierGroups: ModifierGroup[];
}

interface ProductConfiguratorModalProps {
    product: Product;
    themeColor: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductConfiguratorModal({ product, themeColor, isOpen, onClose }: ProductConfiguratorModalProps) {
    const addItem = useCartStore((state) => state.addItem)

    // El estado guarda un map de groupId -> array de option IDs seleccionados
    const [selections, setSelections] = useState<Record<string, string[]>>({})
    const [notes, setNotes] = useState("")
    const [showValidation, setShowValidation] = useState(false)

    // Reset validation when selections change
    useEffect(() => {
        setShowValidation(false)
    }, [selections])

    if (!isOpen) return null;

    const handleOptionToggle = (groupId: string, optionId: string, isRadio: boolean) => {
        setSelections(prev => {
            const currentSelected = prev[groupId] || [];

            if (isRadio) {
                // Si es radio (o limit=1)
                return { ...prev, [groupId]: [optionId] };
            }

            // Si es checkbox (multiple)
            const isCurrentlySelected = currentSelected.includes(optionId)

            // Check limits si aplica
            const groupInfo = product.modifierGroups.find(g => g.id === groupId);

            if (isCurrentlySelected) {
                return {
                    ...prev,
                    [groupId]: currentSelected.filter(id => id !== optionId)
                }
            } else {
                // Verificar si se pasó el límite
                if (groupInfo?.maxSelect && currentSelected.length >= groupInfo.maxSelect) {
                    return prev; // Ignorar el click
                }

                return {
                    ...prev,
                    [groupId]: [...currentSelected, optionId]
                }
            }
        })
    }

    const calculateTotal = () => {
        let total = product.price;
        Object.entries(selections).forEach(([groupId, optionIds]) => {
            const group = product.modifierGroups.find(g => g.id === groupId);
            if (group) {
                optionIds.forEach(id => {
                    const option = group.options.find(o => o.id === id);
                    if (option) total += option.price;
                })
            }
        });
        return total;
    }

    const validateRequired = () => {
        const requiredGroups = product.modifierGroups.filter(g => g.isRequired);
        for (const rg of requiredGroups) {
            const selected = selections[rg.id];
            if (!selected || selected.length === 0) {
                return false;
            }
        }
        return true;
    }

    const handleAddToCart = () => {
        if (!validateRequired()) {
            setShowValidation(true);
            // Hacer scroll al primer grupo faltante si es posible
            return;
        }

        // Construir el array de options para el store
        const selectedOptionsFormatted: any[] = [];

        Object.entries(selections).forEach(([groupId, optionIds]) => {
            const group = product.modifierGroups.find(g => g.id === groupId);
            if (group) {
                optionIds.forEach(id => {
                    const option = group.options.find(o => o.id === id);
                    if (option) {
                        selectedOptionsFormatted.push({
                            id: option.id,
                            name: option.name,
                            price: option.price,
                            groupName: group.name
                        });
                    }
                })
            }
        });

        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            selectedOptions: selectedOptionsFormatted,
            notes: notes.trim() || undefined
        });

        onClose();
        setSelections({});
        setNotes("");
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-xl sm:p-4 transition-opacity duration-300">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />
            
            <div
                className="bg-[#0a0a0a] w-full sm:max-w-xl sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col max-h-[95vh] shadow-2xl relative border-t sm:border border-white/10"
                style={{ 
                    animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 -20px 50px rgba(0,0,0,0.5)'
                }}
            >
                {/* Drag Indicator (Mobile) */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 sm:hidden shrink-0" />

                {/* Header (Foto) */}
                <div className="relative shrink-0">
                    {product.imageUrl ? (
                        <div className="w-full h-44 sm:h-52 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                    ) : (
                        <div className="w-full h-12" />
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-full text-white transition-all active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    <div className={`p-6 pb-2 ${!product.imageUrl ? 'pt-2' : 'absolute bottom-0 left-0 w-full'}`}>
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight font-epilogue drop-shadow-lg">{product.name}</h2>
                        {product.description && (
                            <p className="text-white/70 text-sm mt-1 line-clamp-2 font-manrope">{product.description}</p>
                        )}
                    </div>
                </div>

                {/* Content: Modificadores */}
                <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6 space-y-8 scroll-smooth">
                    {product.modifierGroups.map((group) => {
                        const isRadio = group.maxSelect === 1;
                        const selectedInGroup = selections[group.id] || [];
                        const isMissing = showValidation && group.isRequired && selectedInGroup.length === 0;

                        return (
                            <div key={group.id} className={`space-y-4 transition-all duration-300 ${isMissing ? 'p-3 rounded-2xl bg-red-500/5 ring-1 ring-red-500/20' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-white font-bold text-lg font-epilogue">{group.name}</h3>
                                            {group.isRequired && (
                                                <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Obligatorio</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/40 font-manrope mt-0.5">
                                            {isRadio ? 'Selecciona una opción' : `Selecciona hasta ${group.maxSelect || 'todos los que quieras'}`}
                                        </p>
                                    </div>
                                    {isMissing && (
                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">Por favor selecciona</span>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    {group.options.map((option) => {
                                        const isSelected = selectedInGroup.includes(option.id);
                                        const isDisabled = !isSelected && !isRadio && group.maxSelect && selectedInGroup.length >= group.maxSelect;

                                        return (
                                            <label
                                                key={option.id}
                                                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${isSelected 
                                                    ? 'bg-white/10 border-white/20' 
                                                    : 'bg-white/[0.03] border-transparent hover:border-white/10'} 
                                                    ${isDisabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Custom Input Visual */}
                                                    <div
                                                        className={`w-6 h-6 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isRadio ? 'rounded-full' : 'rounded-lg'} border-2 ${isSelected ? 'scale-110 shadow-lg' : 'border-white/10 group-hover:border-white/20'}`}
                                                        style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                                                    >
                                                        {isSelected && (
                                                            <div className="animate-in fade-in zoom-in duration-200">
                                                                {isRadio ? (
                                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                                ) : (
                                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7"></path></svg>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold transition-colors ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{option.name}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {option.price > 0 && (
                                                        <span className={`text-sm font-bold font-manrope transition-all ${isSelected ? 'text-white' : 'text-white/40'}`}>
                                                            +${option.price.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                <input
                                                    type={isRadio ? "radio" : "checkbox"}
                                                    className="hidden"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        if (!isDisabled) handleOptionToggle(group.id, option.id, isRadio)
                                                    }}
                                                />
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {/* Notas Adicionales */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg font-epilogue">¿Alguna nota adicional?</h3>
                        </div>
                        <p className="text-xs text-white/40 font-manrope">Ej: Sin cebolla, término medio, etc.</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Escribe aquí tus preferencias..."
                            rows={3}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all font-manrope resize-none text-sm"
                        ></textarea>
                    </div>
                </div>

                {/* Footer Fixeado */}
                <div className="shrink-0 p-6 bg-[#0a0a0a] border-t border-white/5 pb-10 sm:pb-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Precio Total</span>
                            <div className="text-2xl font-black text-white font-epilogue">${calculateTotal().toFixed(2)}</div>
                        </div>
                        {!validateRequired() && showValidation && (
                            <div className="text-[10px] text-red-400 font-bold max-w-[120px] text-right leading-tight">Completa los campos requeridos</div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleAddToCart}
                        className="w-full text-white font-black text-lg py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.96] hover:brightness-110 shadow-xl disabled:grayscale disabled:opacity-50"
                        style={{ backgroundColor: themeColor || '#FF5630', color: '#fff' }}
                    >
                        <span>Añadir a la Orden</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes modalSlideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}} />
        </div>
    )
}

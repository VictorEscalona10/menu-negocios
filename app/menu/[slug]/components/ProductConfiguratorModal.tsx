"use client"

import { useState } from "react"
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
            alert("Por favor selecciona todas las opciones obligatorias.");
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
            selectedOptions: selectedOptionsFormatted
        });

        onClose();
        // Reset local state if needed (aunque al cerrar se suele destruir si unmounts o podemos limpiarlo manualmente)
        setSelections({});
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
            <div
                className="bg-[#1c1b1b] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative border border-white/10"
                style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {/* Header visual (Foto y títutlo) */}
                <div className="relative">
                    {product.imageUrl ? (
                        <div className="w-full h-48 sm:h-56 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent" />
                        </div>
                    ) : (
                        <div className="w-full h-24 bg-gradient-to-b from-[#131313] to-[#1c1b1b]" />
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    <div className={`absolute bottom-0 left-0 w-full p-5 lg:p-6 pb-2 ${!product.imageUrl && 'top-4'}`}>
                        <h2 className="text-3xl font-black text-white leading-tight">{product.name}</h2>
                        {product.description && (
                            <p className="text-[#a3aac4] text-sm mt-1 line-clamp-2">{product.description}</p>
                        )}
                        <p className="text-xl font-bold mt-2" style={{ color: themeColor }}>${product.price.toFixed(2)}</p>
                    </div>
                </div>

                {/* Content: Modificadores */}
                <div className="flex-1 overflow-y-auto px-5 lg:px-6 pb-24 pt-4 space-y-6">
                    {product.modifierGroups.map((group) => {
                        const isRadio = group.maxSelect === 1;
                        const selectedInGroup = selections[group.id] || [];

                        return (
                            <div key={group.id} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{group.name}</h3>
                                        <p className="text-xs text-[#a3aac4]">
                                            {group.isRequired ? 'Requerido' : 'Opcional'}
                                            {group.maxSelect && !isRadio ? ` • Elige hasta ${group.maxSelect}` : ''}
                                        </p>
                                    </div>
                                    {group.isRequired && selectedInGroup.length === 0 && (
                                        <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">Obligatorio</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {group.options.map((option) => {
                                        const isSelected = selectedInGroup.includes(option.id);
                                        const isDisabled = !isSelected && !isRadio && group.maxSelect && selectedInGroup.length >= group.maxSelect;

                                        return (
                                            <label
                                                key={option.id}
                                                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${isSelected ? 'bg-white/10 border-white/20' : 'bg-[#131313] border-transparent hover:border-white/10'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors ${isRadio ? 'rounded-full' : 'rounded'} border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-[#4a4a4a]'}`}
                                                        style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                                                    >
                                                        {isSelected && !isRadio && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                        )}
                                                        {isSelected && isRadio && (
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-white">{option.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-[#a3aac4]">
                                                    {option.price > 0 ? `+$${option.price.toFixed(2)}` : ''}
                                                </span>
                                                {/* Hidden input to make it accessible */}
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
                </div>

                {/* Footer Flotante Modal */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#1c1b1b] via-[#1c1b1b]/95 to-transparent pt-12">
                    <button
                        onClick={handleAddToCart}
                        disabled={!validateRequired()}
                        className="w-full text-white font-bold text-lg py-4 px-6 md:px-8 rounded-[2rem] flex items-center justify-between transition-transform duration-300 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        style={{ background: validateRequired() ? `linear-gradient(135deg, ${themeColor || '#FF5630'}, #131313)` : '#333' }}
                    >
                        <span>Añadir Orden</span>
                        <span className="font-black text-xl">${calculateTotal().toFixed(2)}</span>
                    </button>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes slideUp {
                            from { transform: translateY(100%); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    `}} />
                </div>
            </div>
        </div>
    )
}

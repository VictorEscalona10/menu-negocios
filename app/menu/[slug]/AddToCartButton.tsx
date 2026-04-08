// app/menu/[slug]/AddToCartButton.tsx
'use client'

import { useCartStore } from '@/src/store/cartStore'

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

interface AddToCartButtonProps {
    product: {
        id: string;
        name: string;
        price: number;
        description: string | null;
        imageUrl: string | null;
        modifierGroups?: ModifierGroup[];
    };
    themeColor: string;
    onConfigure?: () => void;
}

export default function AddToCartButton({ product, themeColor, onConfigure }: AddToCartButtonProps) {
    const addItem = useCartStore((state) => state.addItem);
    const items = useCartStore((state) => state.items);

    // Sumar cuántos items existen con el mismo productId (independiente de los extras)
    const quantityInCart = items.filter(i => i.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product.modifierGroups && product.modifierGroups.length > 0) {
            onConfigure?.();
        } else {
            addItem({ productId: product.id, name: product.name, price: product.price });
        }
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            <button
                onClick={handleButtonClick}
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-medium text-xl shadow-sm transition-transform active:scale-90 hover:brightness-110"
                style={{ backgroundColor: themeColor || '#FF5630' }}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {quantityInCart > 0 && (
                <span className="absolute -bottom-6 text-[10px] uppercase font-bold tracking-widest text-[#a3aac4] whitespace-nowrap">
                    En Cesta x{quantityInCart}
                </span>
            )}
        </div>
    )
}
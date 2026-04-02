// app/menu/[slug]/components/AddToCartButton.tsx
'use client'

import { useCartStore } from '@/src/store/cartStore'

interface AddToCartButtonProps {
    product: {
        id: string;
        name: string;
        price: number;
    };
    themeColor: string;
}

export default function AddToCartButton({ product, themeColor }: AddToCartButtonProps) {
    const addItem = useCartStore((state) => state.addItem);
    const items = useCartStore((state) => state.items);

    // Buscamos si este producto ya está en el carrito para mostrar la cantidad
    const currentItem = items.find(i => i.id === product.id);

    return (
        <div className="flex flex-col items-center justify-center relative">
            <button
                onClick={() => addItem(product)}
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-medium text-xl shadow-sm transition-transform active:scale-90 hover:brightness-110"
                style={{ backgroundColor: themeColor || '#FF5630' }}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {currentItem && currentItem.quantity > 0 && (
                <span className="absolute -bottom-6 text-[10px] uppercase font-bold tracking-widest text-[#a3aac4] whitespace-nowrap">
                    En Cesta x{currentItem.quantity}
                </span>
            )}
        </div>
    )
}
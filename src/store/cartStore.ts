// src/store/cartStore.ts
import { create } from 'zustand'

export type CartItemOption = {
    id: string;
    name: string;
    price: number;
    groupName: string;
};

export type CartItem = {
    id: string; // Unique ID (product.id + selectedOptions hashed)
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedOptions?: CartItemOption[];
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { id?: string }) => void;
    removeItem: (id: string) => void;
    getTotal: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    // Agrega un producto o suma 1 a la cantidad si ya existe
    addItem: (newItem) => set((state) => {
        // Create a unique ID if not provided, based on product ID and selected options
        let uniqueId = newItem.id || newItem.productId;
        
        if (newItem.selectedOptions && newItem.selectedOptions.length > 0) {
            const optionsHash = newItem.selectedOptions.map(o => o.id).sort().join('-');
            uniqueId = `${newItem.productId}-${optionsHash}`;
        }

        const existingItem = state.items.find(i => i.id === uniqueId);
        
        if (existingItem) {
            return {
                items: state.items.map(i =>
                    i.id === uniqueId ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        
        return { items: [...state.items, { ...newItem, id: uniqueId, quantity: 1 }] };
    }),

    // Resta 1 a la cantidad, y si llega a 0, lo elimina del carrito
    removeItem: (id) => set((state) => ({
        items: state.items.map(i =>
            i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        ).filter(i => i.quantity > 0)
    })),

    // Calculates base price + option prices
    getTotal: () => get().items.reduce((total, item) => {
        const optionsTotal = item.selectedOptions?.reduce((sum, opt) => sum + opt.price, 0) || 0;
        return total + ((item.price + optionsTotal) * item.quantity);
    }, 0),

    // Calcula cuántos artículos hay en total (para la burbuja del carrito)
    getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0)
}))
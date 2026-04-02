// src/store/cartStore.ts
import { create } from 'zustand'

export type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: string) => void;
    getTotal: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    // Agrega un producto o suma 1 a la cantidad si ya existe
    addItem: (newItem) => set((state) => {
        const existingItem = state.items.find(i => i.id === newItem.id);
        if (existingItem) {
            return {
                items: state.items.map(i =>
                    i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        return { items: [...state.items, { ...newItem, quantity: 1 }] };
    }),

    // Resta 1 a la cantidad, y si llega a 0, lo elimina del carrito
    removeItem: (id) => set((state) => ({
        items: state.items.map(i =>
            i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        ).filter(i => i.quantity > 0)
    })),

    // Calcula el precio total a pagar
    getTotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),

    // Calcula cuántos artículos hay en total (para la burbuja del carrito)
    getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0)
}))
// src/store/cartStore.ts
import { create } from 'zustand'

export type CartItemOption = {
    id: string;
    name: string;
    price: number;
    groupName: string;
};

export type CartItem = {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedOptions?: CartItemOption[];
    notes?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { id?: string }) => void;
    removeItem: (id: string) => void;
    deleteItem: (id: string) => void;
    getTotal: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (newItem) => set((state) => {
        let uniqueId = newItem.id || newItem.productId;

        // Si hay opciones, las incluimos en el ID para diferenciar variantes
        if (newItem.selectedOptions && newItem.selectedOptions.length > 0) {
            const optionsHash = newItem.selectedOptions.map(o => o.id).sort().join('-');
            uniqueId = `${uniqueId}-${optionsHash}`;
        }

        // Si hay notas, las incluimos en el ID para que items con notas distintas no se agrupen
        if (newItem.notes && newItem.notes.trim()) {
            const notesHash = Buffer.from(newItem.notes.trim()).toString('base64').substring(0, 8);
            uniqueId = `${uniqueId}-note-${notesHash}`;
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

    // Resta 1 a la cantidad
    removeItem: (id) => set((state) => ({
        items: state.items.map(i =>
            i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        ).filter(i => i.quantity > 0)
    })),

    // NUEVO: Elimina el ítem por completo
    deleteItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
    })),

    getTotal: () => get().items.reduce((total, item) => {
        const optionsTotal = item.selectedOptions?.reduce((sum, opt) => sum + opt.price, 0) || 0;
        return total + ((item.price + optionsTotal) * item.quantity);
    }, 0),

    getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0)
}))
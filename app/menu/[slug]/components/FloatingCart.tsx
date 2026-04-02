// app/menu/[slug]/components/FloatingCart.tsx
'use client'

import { useCartStore } from '@/src/store/cartStore'

interface FloatingCartProps {
    storeName: string;
    whatsapp: string;
    themeColor: string;
}

export default function FloatingCart({ storeName, whatsapp, themeColor }: FloatingCartProps) {
    const items = useCartStore((state) => state.items);
    const getTotal = useCartStore((state) => state.getTotal);
    const getTotalItems = useCartStore((state) => state.getTotalItems);

    const totalItems = getTotalItems();
    const totalPrice = getTotal();

    // Si no hay productos en el carrito, no mostramos la barra
    if (totalItems === 0) return null;

    const handleWhatsAppOrder = () => {
        let mensaje = `🍔 *NUEVO PEDIDO - ${storeName}* 🍔\n\n`;

        items.forEach((item) => {
            mensaje += `*${item.quantity}x ${item.name}* - $${(item.price * item.quantity).toFixed(2)}\n`;
        });

        mensaje += `\n💰 *TOTAL A PAGAR:* $${totalPrice.toFixed(2)}\n\n`;
        mensaje += `¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación.`;

        // Codificamos el texto para la URL
        const textoCodificado = encodeURIComponent(mensaje);

        // Redirigimos al usuario a WhatsApp
        window.open(`https://wa.me/${whatsapp}?text=${textoCodificado}`, '_blank');
    };

    return (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:bottom-8 md:w-[420px] md:translate-x-[-50%] md:ml-[50%] z-50">
            <div className="bg-[#201f1f]/80 backdrop-blur-2xl rounded-[2.5rem] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/5">
                <button
                    onClick={handleWhatsAppOrder}
                    className="w-full text-white font-bold text-lg py-4 px-6 md:px-8 rounded-[2rem] flex items-center justify-between transition-transform duration-300 active:scale-[0.98] group"
                    style={{ background: `linear-gradient(135deg, ${themeColor || '#FF5630'}, #131313)` }}
                >
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold">
                            Tu Orden ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                        </span>
                        <div className="font-serif text-3xl tracking-tight font-black">${totalPrice.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-black/40 group-hover:bg-black/50 transition-colors px-5 py-3 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                        <span className="text-sm font-medium">Pedir</span>
                        {/* Ícono de enviar o WhatsApp estilizado */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );
}
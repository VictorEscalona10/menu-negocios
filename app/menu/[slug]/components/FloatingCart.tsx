'use client'

import { useCartStore } from '@/src/store/cartStore'

interface FloatingCartProps {
    storeName: string;
    whatsapp: string;
    themeColor: string;
    whatsappHeader?: string; // NUEVO
    whatsappFooter?: string; // NUEVO
    isPreview?: boolean;
}

export default function FloatingCart({ storeName, whatsapp, themeColor, whatsappHeader, whatsappFooter, isPreview = false }: FloatingCartProps) {
    const items = useCartStore((state) => state.items);
    const getTotal = useCartStore((state) => state.getTotal);
    const getTotalItems = useCartStore((state) => state.getTotalItems);

    const totalItems = getTotalItems();
    const totalPrice = getTotal();

    if (totalItems === 0) return null;

    const handleWhatsAppOrder = () => {
        if (isPreview) {
            alert("🔒 Modo Previsualización: Las órdenes a WhatsApp están desactivadas para no molestar a tus clientes.");
            return;
        }

        // 1. Encabezado Personalizado (o por defecto si no hay uno)
        const header = whatsappHeader || `🍔 *NUEVO PEDIDO - ${storeName}* 🍔`;
        let mensaje = `${header}\n\n`;

        items.forEach((item) => {
            // Aseguramos matemáticamente que todo sea número
            const basePrice = Number(item.price);
            const extraPrice = item.selectedOptions?.reduce((sum, opt) => sum + Number(opt.price), 0) || 0;
            const itemTotal = (basePrice + extraPrice) * Number(item.quantity);

            mensaje += `*${item.quantity}x ${item.name}* - $${itemTotal.toFixed(2)}\n`;

            if (item.selectedOptions && item.selectedOptions.length > 0) {
                item.selectedOptions.forEach(opt => {
                    const optPrice = Number(opt.price);
                    const priceText = optPrice > 0 ? ` (+$${optPrice.toFixed(2)})` : '';
                    mensaje += `  └ ${opt.name}${priceText}\n`;
                });
            }
        });

        // 2. Total con formato
        mensaje += `\n💰 *TOTAL A PAGAR:* $${Number(totalPrice).toFixed(2)}\n\n`;

        // 3. Pie de Mensaje Personalizado (o por defecto)
        const footer = whatsappFooter || "¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación.";
        mensaje += `${footer}`;

        const textoCodificado = encodeURIComponent(mensaje);
        window.open(`https://wa.me/${whatsapp}?text=${textoCodificado}`, '_blank');
    };

    return (
        <div className={`${isPreview ? 'absolute' : 'fixed'} bottom-6 left-4 right-4 md:left-auto md:right-auto md:bottom-8 md:w-[420px] md:translate-x-[-50%] md:ml-[50%] z-50`}>
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
                        <div className="font-serif text-3xl tracking-tight font-black">${Number(totalPrice).toFixed(2)}</div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 group-hover:bg-black/50 transition-colors px-5 py-3 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                        <span className="text-sm font-medium">Pedir</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );
}
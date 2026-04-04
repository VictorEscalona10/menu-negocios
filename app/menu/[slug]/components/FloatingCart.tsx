// app/menu/[slug]/components/FloatingCart.tsx
'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/src/store/cartStore'

interface FloatingCartProps {
    storeName: string;
    whatsapp: string;
    themeColor: string;
    whatsappHeader?: string;
    whatsappFooter?: string;
    isPreview?: boolean;
}

export default function FloatingCart({ storeName, whatsapp, themeColor, whatsappHeader, whatsappFooter, isPreview = false }: FloatingCartProps) {
    // NUEVO: Controla si el modal de resumen está abierto
    const [isOpen, setIsOpen] = useState(false);

    // Obtenemos deleteItem del store
    const { items, getTotal, getTotalItems, deleteItem } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotal();

    // Si el carrito se vacía, cerramos el modal automáticamente
    useEffect(() => {
        if (totalItems === 0) {
            setIsOpen(false);
        }
    }, [totalItems]);

    if (totalItems === 0) return null;

    const handleWhatsAppOrder = () => {
        if (isPreview) {
            alert("🔒 Modo Previsualización: Las órdenes a WhatsApp están desactivadas para no molestar a tus clientes.");
            return;
        }

        const header = whatsappHeader || `🍔 *NUEVO PEDIDO - ${storeName}* 🍔`;
        let mensaje = `${header}\n\n`;

        items.forEach((item) => {
            const basePriceTotal = Number(item.price) * Number(item.quantity);
            mensaje += `*${item.quantity}x ${item.name}* - $${basePriceTotal.toFixed(2)}\n`;

            if (item.selectedOptions && item.selectedOptions.length > 0) {
                item.selectedOptions.forEach(opt => {
                    const optPriceTotal = Number(opt.price) * Number(item.quantity);
                    const priceText = optPriceTotal > 0 ? ` (+$${optPriceTotal.toFixed(2)})` : '';
                    mensaje += `  └ ${opt.name}${priceText}\n`;
                });
            }
        });

        mensaje += `\n💰 *TOTAL A PAGAR:* $${Number(totalPrice).toFixed(2)}\n\n`;

        const footer = whatsappFooter || "¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación.";
        mensaje += `${footer}`;

        const textoCodificado = encodeURIComponent(mensaje);
        window.open(`https://wa.me/${whatsapp}?text=${textoCodificado}`, '_blank');

        // Opcional: Cerrar el modal después de pedir
        setIsOpen(false);
    };

    return (
        <>
            {/* 1. EL MODAL DE RESUMEN (Se abre al tocar el carrito) */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4">
                    <div
                        className="bg-[#1c1b1b] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl relative border border-white/10"
                        style={{ animation: 'slideUpCart 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                        {/* Cabecera del Modal */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#131313]">
                            <h2 className="text-xl font-bold text-white">Resumen de tu pedido</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Lista de Productos con opción de eliminar */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {items.map(item => {
                                // Calculamos el precio total de esta fila (base + opciones)
                                const itemOptionsPrice = item.selectedOptions?.reduce((sum, opt) => sum + Number(opt.price), 0) || 0;
                                const itemRowTotal = (Number(item.price) + itemOptionsPrice) * Number(item.quantity);

                                return (
                                    <div key={item.id} className="flex justify-between items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-sm mt-0.5">
                                                    {item.quantity}x
                                                </span>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg leading-tight">{item.name}</h3>
                                                    {/* Mostrar los modificadores debajo del producto */}
                                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                        <ul className="mt-1 space-y-0.5 mb-1">
                                                            {item.selectedOptions.map(opt => (
                                                                <li key={opt.id} className="text-sm text-zinc-400 flex items-center justify-between">
                                                                    <span>└ {opt.name}</span>
                                                                    {opt.price > 0 && <span className="text-xs">+${opt.price.toFixed(2)}</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    <p className="text-white/90 font-bold mt-1" style={{ color: themeColor }}>
                                                        ${itemRowTotal.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón de Papelera */}
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="shrink-0 bg-red-500/10 text-red-400 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                            title="Eliminar producto"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pie del Modal (Total y botón final) */}
                        <div className="p-5 border-t border-white/10 bg-[#131313]">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <span className="text-zinc-400 font-medium">Total a pagar</span>
                                <span className="text-2xl font-black text-white">${Number(totalPrice).toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleWhatsAppOrder}
                                className="w-full text-white font-bold text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                style={{ background: `linear-gradient(135deg, ${themeColor || '#FF5630'}, #131313)` }}
                            >
                                <span>Enviar pedido a WhatsApp</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>

                        {/* Animación local */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes slideUpCart {
                                from { transform: translateY(100%); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                        `}} />
                    </div>
                </div>
            )}

            {/* 2. EL BOTÓN FLOTANTE (Solo se ve si el modal está cerrado) */}
            {!isOpen && (
                <div className={`${isPreview ? 'absolute' : 'fixed'} bottom-6 left-4 right-4 md:left-auto md:right-auto md:bottom-8 md:w-[420px] md:translate-x-[-50%] md:ml-[50%] z-50`}>
                    <div className="bg-[#201f1f]/80 backdrop-blur-2xl rounded-[2.5rem] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/5">
                        <button
                            onClick={() => setIsOpen(true)} // AHORA ESTE BOTÓN ABRE EL MODAL EN LUGAR DE ENVIAR DIRECTO
                            className="w-full text-white font-bold text-lg py-4 px-6 md:px-8 rounded-[2rem] flex items-center justify-between transition-transform duration-300 active:scale-[0.98] group"
                            style={{ background: `linear-gradient(135deg, ${themeColor || '#FF5630'}, #131313)` }}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold">
                                    Ver Orden ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                                </span>
                                <div className="font-serif text-3xl tracking-tight font-black">${Number(totalPrice).toFixed(2)}</div>
                            </div>

                            <div className="flex items-center gap-2 bg-black/40 group-hover:bg-black/50 transition-colors px-5 py-3 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                                <span className="text-sm font-medium">Revisar</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
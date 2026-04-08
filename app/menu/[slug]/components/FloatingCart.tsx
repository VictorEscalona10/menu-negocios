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

type DeliveryType = 'delivery' | 'pickup';

export default function FloatingCart({ storeName, whatsapp, themeColor, whatsappHeader, whatsappFooter, isPreview = false }: FloatingCartProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Datos del cliente
    const [customerName, setCustomerName] = useState('');
    const [customerCedula, setCustomerCedula] = useState('');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
    const [orderNotes, setOrderNotes] = useState('');
    const [formError, setFormError] = useState('');

    // Estado de la geolocalización
    type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
    const [locationUrl, setLocationUrl] = useState('');

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                setLocationUrl(url);
                setLocationStatus('success');
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationStatus('denied');
                } else {
                    setLocationStatus('error');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const { items, getTotal, getTotalItems, deleteItem } = useCartStore();
    const totalItems = getTotalItems();
    const totalPrice = getTotal();

    useEffect(() => {
        if (totalItems === 0) {
            setIsOpen(false);
        }
    }, [totalItems]);

    // Reset error cuando el usuario tipea
    useEffect(() => {
        setFormError('');
    }, [customerName, customerCedula]);

    if (totalItems === 0) return null;

    const handleWhatsAppOrder = () => {
        if (isPreview) {
            alert("🔒 Modo Previsualización: Las órdenes a WhatsApp están desactivadas para no molestar a tus clientes.");
            return;
        }

        // Validar campos requeridos
        if (!customerName.trim()) {
            setFormError('⚠️ El nombre del cliente es obligatorio.');
            return;
        }
        if (!customerCedula.trim()) {
            setFormError('⚠️ La cédula de identidad es obligatoria.');
            return;
        }

        const header = whatsappHeader || `🍔 *NUEVO PEDIDO - ${storeName}* 🍔`;
        let mensaje = `${header}\n\n`;

        // Datos del cliente
        mensaje += `👤 *DATOS DEL CLIENTE*\n`;
        mensaje += `• Nombre: *${customerName.trim()}*\n`;
        mensaje += `• Cédula: *${customerCedula.trim()}*\n`;

        // Tipo de entrega
        if (deliveryType === 'delivery') {
            mensaje += `• Tipo: *🚗 Delivery*\n`;
            if (locationUrl) {
                mensaje += `• Ubicación: ${locationUrl}\n`;
            }
        } else {
            mensaje += `• Tipo: *🏃 Pick-Up (Paso a buscar)*\n`;
        }

        mensaje += `\n`;

        // Productos
        mensaje += `🛒 *PRODUCTOS:*\n`;
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

        mensaje += `\n💰 *TOTAL A PAGAR:* $${Number(totalPrice).toFixed(2)}\n`;

        // Notas adicionales
        if (orderNotes.trim()) {
            mensaje += `\n📝 *Notas:* ${orderNotes.trim()}\n`;
        }

        mensaje += `\n`;
        const footer = whatsappFooter || "¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación.";
        mensaje += footer;

        const textoCodificado = encodeURIComponent(mensaje);
        window.open(`https://wa.me/${whatsapp}?text=${textoCodificado}`, '_blank');

        setIsOpen(false);
    };

    return (
        <>
            {/* MODAL PRINCIPAL */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4">
                    <div
                        className="bg-[#1c1b1b] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl relative border border-white/10"
                        style={{ animation: 'slideUpCart 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                        {/* Cabecera */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#131313] shrink-0">
                            <h2 className="text-xl font-bold text-white">Resumen de tu pedido</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Contenido scrolleable */}
                        <div className="flex-1 overflow-y-auto">

                            {/* ── Sección 1: Productos ── */}
                            <div className="p-5 space-y-4 border-b border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">🛒 Productos</p>
                                {items.map(item => {
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
                                                        <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                                                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                            <ul className="mt-1 space-y-0.5 mb-1">
                                                                {item.selectedOptions.map(opt => (
                                                                    <li key={opt.id} className="text-sm text-zinc-400 flex items-center justify-between">
                                                                        <span>└ {opt.name}</span>
                                                                        {opt.price > 0 && <span className="text-xs ml-2">+${opt.price.toFixed(2)}</span>}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        <p className="font-bold mt-1 text-sm" style={{ color: themeColor }}>
                                                            ${itemRowTotal.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="shrink-0 bg-red-500/10 text-red-400 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                                title="Eliminar producto"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* ── Sección 2: Datos del Cliente ── */}
                            <div className="p-5 space-y-3 border-b border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">👤 Datos del cliente</p>

                                {/* Nombre */}
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                                        Nombre completo <span style={{ color: themeColor }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    />
                                </div>

                                {/* Cédula */}
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                                        Cédula de identidad <span style={{ color: themeColor }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerCedula}
                                        onChange={e => setCustomerCedula(e.target.value)}
                                        placeholder="Ej: V-12.345.678"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    />
                                </div>

                                {/* Error de validación */}
                                {formError && (
                                    <p className="text-sm font-medium px-1" style={{ color: '#ef4444' }}>{formError}</p>
                                )}
                            </div>

                            {/* ── Sección 3: Tipo de Entrega ── */}
                            <div className="p-5 space-y-3 border-b border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">📦 Tipo de entrega</p>

                                {/* Toggle Delivery / Pick-Up */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setDeliveryType('delivery')}
                                        className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border font-bold text-sm transition-all ${deliveryType === 'delivery'
                                            ? 'border-transparent text-white'
                                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                                        }`}
                                        style={deliveryType === 'delivery' ? { backgroundColor: themeColor, borderColor: 'transparent' } : {}}
                                    >
                                        <span className="text-2xl">🚗</span>
                                        <span>Delivery</span>
                                        <span className="text-[10px] opacity-70 font-normal">Te lo llevamos</span>
                                    </button>

                                    <button
                                        onClick={() => setDeliveryType('pickup')}
                                        className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border font-bold text-sm transition-all ${deliveryType === 'pickup'
                                            ? 'border-transparent text-white'
                                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                                        }`}
                                        style={deliveryType === 'pickup' ? { backgroundColor: themeColor, borderColor: 'transparent' } : {}}
                                    >
                                        <span className="text-2xl">🏃</span>
                                        <span>Pick-Up</span>
                                        <span className="text-[10px] opacity-70 font-normal">Paso a buscar</span>
                                    </button>
                                </div>

                                {/* Campo de ubicación GPS (solo si delivery) */}
                                {deliveryType === 'delivery' && (
                                    <div style={{ animation: 'fadeIn 0.25s ease' }}>
                                        <label className="block text-xs text-zinc-400 mb-2 font-medium">
                                            Tu ubicación actual
                                        </label>

                                        {/* Botón principal de detección */}
                                        {locationStatus !== 'success' && (
                                            <button
                                                onClick={handleDetectLocation}
                                                disabled={locationStatus === 'loading'}
                                                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium text-sm text-white"
                                            >
                                                {locationStatus === 'loading' ? (
                                                    <>
                                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                        <span>Detectando ubicación...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Pin GPS icon */}
                                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="3" />
                                                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                                                            <circle cx="12" cy="12" r="8" strokeDasharray="3 2" />
                                                        </svg>
                                                        <span>
                                                            {locationStatus === 'idle' ? 'Detectar mi ubicación' : 'Reintentar'}
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {/* Ubicación detectada con éxito */}
                                        {locationStatus === 'success' && (
                                            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-emerald-400">¡Ubicación detectada!</p>
                                                    <p className="text-xs text-zinc-500 truncate">{locationUrl}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setLocationStatus('idle'); setLocationUrl(''); }}
                                                    className="text-zinc-500 hover:text-white transition-colors shrink-0"
                                                    title="Cambiar ubicación"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {/* Permiso denegado */}
                                        {locationStatus === 'denied' && (
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                                                <p className="text-sm font-bold text-amber-400 mb-1">Permiso denegado</p>
                                                <p className="text-xs text-zinc-400">Ve a los ajustes de tu navegador → permite el acceso a la ubicación para este sitio, y luego intenta de nuevo.</p>
                                                <button onClick={() => setLocationStatus('idle')} className="mt-2 text-xs text-amber-400 underline">Reintentar</button>
                                            </div>
                                        )}

                                        {/* Error genérico */}
                                        {locationStatus === 'error' && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                                                <p className="text-sm font-bold text-red-400 mb-1">No se pudo detectar la ubicación</p>
                                                <p className="text-xs text-zinc-400">Asegúrate de tener el GPS activo e intenta de nuevo.</p>
                                                <button onClick={() => setLocationStatus('idle')} className="mt-2 text-xs text-red-400 underline">Reintentar</button>
                                            </div>
                                        )}

                                        {locationStatus === 'idle' && (
                                            <p className="text-[11px] text-zinc-500 mt-1.5 px-1">
                                                💡 El navegador pedirá permiso para acceder a tu GPS. Tu ubicación solo se usa para enviársela al local.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Sección 4: Notas adicionales ── */}
                            <div className="p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">📝 Notas adicionales</p>
                                <textarea
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                    placeholder="Ej: Sin cebolla, timbre 3B, piso 2..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-colors resize-none"
                                />
                            </div>

                        </div>

                        {/* Pie: Total + Botón de envío */}
                        <div className="p-5 border-t border-white/10 bg-[#131313] shrink-0">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <span className="text-zinc-400 font-medium">Total a pagar</span>
                                <span className="text-2xl font-black text-white">${Number(totalPrice).toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleWhatsAppOrder}
                                className="w-full text-white font-bold text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110"
                                style={{ backgroundColor: themeColor || '#FF5630' }}
                            >
                                {/* WhatsApp icon */}
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                <span>Enviar pedido por WhatsApp</span>
                            </button>
                        </div>

                        {/* Animaciones */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes slideUpCart {
                                from { transform: translateY(100%); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(-8px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}} />
                    </div>
                </div>
            )}

            {/* BOTÓN FLOTANTE */}
            {!isOpen && (
                <div className={`${isPreview ? 'absolute' : 'fixed'} bottom-6 left-4 right-4 md:left-auto md:right-auto md:bottom-8 md:w-[420px] md:translate-x-[-50%] md:ml-[50%] z-50`}>
                    <div className="bg-[#201f1f]/80 backdrop-blur-2xl rounded-[2.5rem] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/5">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-full text-white font-bold text-lg py-4 px-6 md:px-8 rounded-[2rem] flex items-center justify-between transition-transform duration-300 active:scale-[0.98] group"
                            style={{ backgroundColor: themeColor || '#FF5630' }}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold">
                                    Ver Orden ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                                </span>
                                <div className="font-serif text-3xl tracking-tight font-black">${Number(totalPrice).toFixed(2)}</div>
                            </div>

                            <div className="flex items-center gap-2 bg-black/40 group-hover:bg-black/50 transition-colors px-5 py-3 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                                <span className="text-sm font-medium">Revisar</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
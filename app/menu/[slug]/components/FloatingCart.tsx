// app/menu/[slug]/components/FloatingCart.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/src/store/cartStore'
import { logOrderIntent } from '@/src/actions/analytics'
import { createPublicOrder } from '@/src/actions/orders'
import type { OrderContext } from '@/src/types/order'
import { Lineicons } from '@lineiconshq/react-lineicons'
import {
    TruckDelivery1Outlined,
    BasketShopping3Outlined,
    KnifeFork1Outlined,
    MapPin5Outlined,
    MapMarker1Outlined,
    Cart1Outlined,
    StarFatSolid,
    Notebook1Outlined,
    Ban2Outlined,
} from '@lineiconshq/free-icons'

interface UpsellProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    modifierGroups?: any;
}

interface UpsellCategory {
    id: string;
    name: string;
    products: UpsellProduct[];
}

interface DeliveryZone {
    id: string;
    name: string;
    price: number;
}

interface FloatingCartProps {
    storeId: string;
    storeName: string;
    whatsapp: string;
    themeColor: string;
    whatsappHeader?: string;
    whatsappFooter?: string;
    isPreview?: boolean;
    enableDelivery?: boolean;
    enablePickup?: boolean;
    enableDineIn?: boolean;
    requireCedula?: boolean;
    buttonTextColor?: string;
    upsellCategory?: UpsellCategory | null;
    onConfigureUpsellProduct?: (product: any) => void;
    deliveryZones?: DeliveryZone[];
    /**
     * Sistema de Tres Menús (docs/DESIGN.md §13.2). undefined/null = modo
     * WhatsApp actual (sin cambios funcionales).
     * - 'table':  pedido solo al panel, con número de mesa (sin WhatsApp)
     * - 'waiter': igual + nombre del mesero (sesión del mesero en cookie)
     */
    orderContext?: OrderContext | null;
}

type DeliveryType = 'delivery' | 'pickup' | 'dinein';

export default function FloatingCart({
    storeId,
    storeName,
    whatsapp,
    themeColor,
    whatsappHeader,
    whatsappFooter,
    isPreview = false,
    enableDelivery = true,
    enablePickup = true,
    enableDineIn = false,
    requireCedula = true,
    buttonTextColor = '#ffffff',
    upsellCategory = null,
    onConfigureUpsellProduct,
    deliveryZones = [],
    orderContext = null,
}: FloatingCartProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProductsExpanded, setIsProductsExpanded] = useState(false);
    const [addedUpsellProductId, setAddedUpsellProductId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Modos mesa/mesero: confirmación en pantalla (no hay redirect a WhatsApp)
    const [orderSent, setOrderSent] = useState(false);

    // Datos del cliente
    const [customerName, setCustomerName] = useState('');
    const [customerCedula, setCustomerCedula] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [formError, setFormError] = useState('');
    const [errorField, setErrorField] = useState<'name' | 'cedula' | 'zone' | 'location' | null>(null);
    const [shakeError, setShakeError] = useState(false);

    // Refs para auto-scroll inmediato hacia los campos con error
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const cedulaInputRef = useRef<HTMLInputElement>(null);
    const zoneSelectRef = useRef<HTMLDivElement>(null);
    const locationSectionRef = useRef<HTMLDivElement>(null);

    const scrollToField = (element: HTMLElement | null, focusInput = true) => {
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (focusInput && ('focus' in element && typeof element.focus === 'function')) {
            setTimeout(() => {
                element.focus({ preventScroll: true });
            }, 120);
        }
    };

    // Zona de delivery seleccionada
    const [selectedZoneId, setSelectedZoneId] = useState<string>('');
    const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);

    const selectedZone = deliveryZones.find(z => z.id === selectedZoneId) ?? null;

    // Handlers con sanitización en tiempo real
    const handleNameChange = (value: string) => {
        // Solo letras, espacios, acentos y ñ — máximo 50 caracteres
        const sanitized = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 50);
        setCustomerName(sanitized);
    };

    const handleCedulaChange = (value: string) => {
        // Permitir V, E, J, P al inicio + números, puntos y guiones — máximo 15 chars
        const sanitized = value
            .toUpperCase()
            .replace(/[^0-9.\-]/g, '')
            .slice(0, 15);
        setCustomerCedula(sanitized);
    };

    // Determinar el modo inicial: el primero activo
    const getDefaultMode = (): DeliveryType => {
        if (enableDelivery) return 'delivery';
        if (enablePickup) return 'pickup';
        return 'dinein';
    };

    const [deliveryType, setDeliveryType] = useState<DeliveryType>(getDefaultMode);

    // ═══ SISTEMA DE TRES MENÚS: estado derivado del contexto de servidor ═══
    const orderMode = orderContext?.mode ?? 'whatsapp';
    const isTableOrder = orderMode === 'table' || orderMode === 'waiter';
    const tableNumber = isTableOrder ? (orderContext?.table?.number ?? null) : null;
    const tableToken = isTableOrder ? (orderContext?.table?.qrToken ?? null) : null;
    const waiterName = orderMode === 'waiter' ? (orderContext?.waiter?.name ?? null) : null;
    // Sesión de mesero activa pero sin ?mesa= → pedido bloqueado hasta elegir mesa
    const isBlockedWaiter = orderMode === 'whatsapp' && !!orderContext?.waiter && !orderContext?.table;
    // En modos mesa solo aplica "En el Local" (sin cédula/zonas/GPS)
    const effectiveRequireCedula = requireCedula && !isTableOrder;

    // Modos mesa: siempre "En el Local"
    useEffect(() => {
        if (isTableOrder) setDeliveryType('dinein');
    }, [isTableOrder]);

    // Si el admin cambia los modos disponibles, reajustar la selección
    useEffect(() => {
        if (isTableOrder) return; // en modos mesa está fijado a 'dinein'
        const active: DeliveryType[] = [];
        if (enableDelivery) active.push('delivery');
        if (enablePickup) active.push('pickup');
        if (enableDineIn) active.push('dinein');
        if (active.length > 0 && !active.includes(deliveryType)) {
            setDeliveryType(active[0]);
        }
    }, [enableDelivery, enablePickup, enableDineIn]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const { items, getTotal, getTotalItems, deleteItem, addItem, clearCart } = useCartStore();
    const totalItems = getTotalItems();
    const productTotal = getTotal();

    // Total final = productos + precio de la zona de delivery (si aplica)
    const deliveryFee = (deliveryType === 'delivery' && selectedZone) ? selectedZone.price : 0;
    const totalPrice = productTotal + deliveryFee;

    useEffect(() => {
        // No cerrar si acabamos de confirmar un pedido en los modos mesa/mesero
        if (totalItems === 0 && !orderSent) {
            setIsOpen(false);
        }
        // Al agregar un producto tras un envío, volvemos al formulario
        if (totalItems > 0 && orderSent) {
            setOrderSent(false);
        }
    }, [totalItems, orderSent]);

    // Reset error cuando el usuario tipea o cambia selección
    useEffect(() => {
        setFormError('');
        setErrorField(null);
    }, [customerName, customerCedula, selectedZoneId, deliveryType]);

    if (totalItems === 0) return null;

    // Modos activos disponibles
    const activeModes: { id: DeliveryType; label: string; icon: any }[] = [];
    if (enableDelivery) activeModes.push({ id: 'delivery', label: 'Delivery', icon: TruckDelivery1Outlined });
    if (enablePickup) activeModes.push({ id: 'pickup', label: 'Pick-Up', icon: BasketShopping3Outlined });
    if (enableDineIn) activeModes.push({ id: 'dinein', label: 'En el Local', icon: KnifeFork1Outlined });

    const hasMultipleModes = activeModes.length > 1;
    const hasZones = deliveryZones.length > 0;

    const handleWhatsAppOrder = async () => {
        if (isSubmitting) return;
        if (isPreview) {
            alert("Modo Previsualización: Las órdenes a WhatsApp están desactivadas para no molestar a tus clientes.");
            return;
        }

        // Validar campos requeridos con auto-scroll al lugar exacto
        // (en modos mesa/mesero el nombre es opcional)
        if (isBlockedWaiter) {
            setFormError('Elige una mesa desde la barra superior para poder enviar tu pedido.');
            setErrorField(null);
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
            return;
        }
        if (!isTableOrder && !customerName.trim()) {
            setFormError('El nombre del cliente es obligatorio.');
            setErrorField('name');
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
            scrollToField(nameInputRef.current);
            return;
        }
        if (!isTableOrder && customerName.trim().length < 3) {
            setFormError('El nombre debe tener al menos 3 caracteres.');
            setErrorField('name');
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
            scrollToField(nameInputRef.current);
            return;
        }

        if (effectiveRequireCedula) {
            if (!customerCedula.trim()) {
                setFormError('La cédula de identidad es obligatoria.');
                setErrorField('cedula');
                setShakeError(true);
                setTimeout(() => setShakeError(false), 500);
                scrollToField(cedulaInputRef.current);
                return;
            }
            // Verificar que la cédula tenga al menos algunos dígitos
            const cedulaDigits = customerCedula.replace(/[^0-9]/g, '');
            if (cedulaDigits.length < 6 || cedulaDigits.length > 9) {
                setFormError('La cédula debe tener entre 6 y 9 dígitos numéricos.');
                setErrorField('cedula');
                setShakeError(true);
                setTimeout(() => setShakeError(false), 500);
                scrollToField(cedulaInputRef.current);
                return;
            }
        }

        // Validar zona de delivery
        if (deliveryType === 'delivery') {
            if (hasZones && !selectedZoneId) {
                setFormError('Por favor selecciona tu zona de delivery.');
                setErrorField('zone');
                setIsZoneDropdownOpen(true);
                setShakeError(true);
                setTimeout(() => setShakeError(false), 500);
                scrollToField(zoneSelectRef.current, false);
                return;
            }
            if (!locationUrl && !selectedZoneId && !hasZones) {
                setFormError('Comparte tu ubicación GPS para el delivery.');
                setErrorField('location');
                setShakeError(true);
                setTimeout(() => setShakeError(false), 500);
                scrollToField(locationSectionRef.current, false);
                return;
            }
        }

        const header = whatsappHeader || `🍔 *NUEVO PEDIDO - ${storeName}* 🍔`;
        let mensaje = `${header}\n\n`;

        // Datos del cliente
        mensaje += `👤 *DATOS DEL CLIENTE*\n`;
        mensaje += `• Nombre: *${customerName.trim()}*\n`;
        if (requireCedula) {
            mensaje += `• Cédula: *${customerCedula.trim()}*\n`;
        }

        // Tipo de entrega
        if (deliveryType === 'delivery') {
            mensaje += `• Tipo: *🚗 Delivery*\n`;
            if (selectedZone) {
                mensaje += `• Zona: *${selectedZone.name}*\n`;
                mensaje += `• Precio delivery: *$${selectedZone.price.toFixed(2)}*\n`;
            }
            if (locationUrl) {
                mensaje += `• Link GPS: ${locationUrl}\n`;
            }
        } else if (deliveryType === 'pickup') {
            mensaje += `• Tipo: *🏃 Pick-Up (Paso a buscar)*\n`;
        } else {
            mensaje += `• Tipo: *🍽️ En el Local*\n`;
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

            if (item.notes) {
                mensaje += `  📝 *Nota:* ${item.notes}\n`;
            }
        });

        // Desglose del total
        if (deliveryFee > 0) {
            mensaje += `\n🛒 Subtotal productos: $${Number(productTotal).toFixed(2)}\n`;
            mensaje += `🚗 Delivery (${selectedZone?.name}): $${deliveryFee.toFixed(2)}\n`;
        }
        mensaje += `\n💰 *TOTAL A PAGAR:* $${Number(totalPrice).toFixed(2)}\n`;

        // Notas adicionales
        if (orderNotes.trim()) {
            mensaje += `\n📝 *Notas:* ${orderNotes.trim()}\n`;
        }

        mensaje += `\n`;
        const footer = whatsappFooter || "¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación.";
        mensaje += footer;

        const textoCodificado = encodeURIComponent(mensaje);

        setIsSubmitting(true);

        try {
            // Guardar el pedido en tiempo real para el panel Kanban del cajero
            // (en modos mesa/mesero: mesa y mesero se resuelven en el servidor
            //  a partir del qrToken + cookie de sesión — ver src/actions/orders.ts)
            const res = await createPublicOrder({
                storeId,
                customerName: customerName.trim() || undefined,
                customerCedula: effectiveRequireCedula ? customerCedula.trim() : undefined,
                items: items.map((item) => ({
                    name: item.name,
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0,
                    notes: item.notes,
                    selectedOptions: item.selectedOptions,
                })),
                total: Number(totalPrice) || 0,
                deliveryType: isTableOrder ? 'dinein' : deliveryType,
                notes: orderNotes.trim(),
                tableToken: tableToken ?? undefined,
                source: isTableOrder ? (orderMode === 'waiter' ? 'waiter' : 'table') : 'whatsapp',
            });

            // En modos mesa/mesero el pedido es solo al panel: si falla, lo
            // mostramos y NO limpiamos nada (el menú WhatsApp ya lo manejaba
            // como siempre: registra igual y redirige).
            if (isTableOrder && !res.success) {
                setFormError(res.error || 'No se pudo enviar el pedido. Intenta de nuevo.');
                setIsSubmitting(false);
                return;
            }
        } catch (err) {
            console.error('Error al registrar pedido en panel:', err);
            if (isTableOrder) {
                setFormError('Error de conexión. No se pudo enviar el pedido.');
                setIsSubmitting(false);
                return;
            }
        }

        // Registrar analítica
        logOrderIntent(storeId, totalPrice, isTableOrder ? 'dinein' : deliveryType);

        // ── Modos mesa/mesero: confirmación en pantalla (sin WhatsApp) ──
        if (isTableOrder) {
            clearCart();
            setOrderSent(true);
            setIsSubmitting(false);
            return;
        }

        // Usar location.href para redirigir a WhatsApp
        window.location.href = `https://wa.me/${whatsapp}?text=${textoCodificado}`;

        setIsSubmitting(false);
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
                        {/* ══ Confirmación de pedido (modos mesa/mesero) ══ */}
                        {orderSent ? (
                            <div className="p-8 text-center space-y-4">
                                <div
                                    className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${themeColor}22` }}
                                >
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: themeColor }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-black text-white">¡Pedido enviado!</h2>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {tableNumber ? (
                                        <>
                                            Tu pedido de la <b className="text-white">Mesa {tableNumber}</b> llegó al
                                            panel del local.
                                        </>
                                    ) : (
                                        'Tu pedido llegó al panel del local.'
                                    )}
                                    {waiterName && (
                                        <>
                                            {' '}
                                            Lo envió <b className="text-white">{waiterName}</b>.
                                        </>
                                    )}
                                </p>
                                <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
                                    Atención en el local · sin WhatsApp
                                </p>
                                <button
                                    onClick={() => {
                                        setOrderSent(false);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-white font-bold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    Seguir viendo el menú
                                </button>
                            </div>
                        ) : (
                            <>
                        {/* Cabecera */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#131313] shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-white">Resumen de tu pedido</h2>
                                {tableNumber && (
                                    <p className="text-[11px] font-bold text-zinc-400 mt-0.5">
                                        🍽️ Mesa {tableNumber}
                                        {waiterName ? ` · Mesero: ${waiterName}` : ''}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Contenido scrolleable */}
                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth">

                            {/* ── Sección 1: Datos del Cliente ── */}
                            <div className="p-5 space-y-4 border-b border-white/10 bg-white/[0.02]">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-[10px] font-bold text-white">1</span>
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tus Datos</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">
                                            {isTableOrder ? (
                                                <>Nombre completo <span className="text-zinc-600">(opcional)</span></>
                                            ) : (
                                                <>Nombre completo <span style={{ color: themeColor }}>*</span></>
                                            )}
                                        </label>
                                        <input
                                            ref={nameInputRef}
                                            type="text"
                                            value={customerName}
                                            onChange={e => handleNameChange(e.target.value)}
                                            placeholder="Ej: Juan Pérez"
                                            maxLength={50}
                                            className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none transition-all ${
                                                errorField === 'name'
                                                    ? 'border-red-500/80 ring-2 ring-red-500/30 bg-red-500/[0.07]'
                                                    : 'border-white/10 focus:border-white/30 focus:bg-white/[0.08]'
                                            } ${errorField === 'name' && shakeError ? 'animate-shake' : ''}`}
                                        />
                                        {errorField === 'name' && formError && (
                                            <p className="text-xs text-red-400 font-semibold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                                                <Lineicons icon={Ban2Outlined} size={14} className="shrink-0" />
                                                <span>{formError}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Cédula (no aplica en los modos mesa/mesero) */}
                                    {effectiveRequireCedula && (
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">
                                                Cédula de identidad <span style={{ color: themeColor }}>*</span>
                                            </label>
                                            <input
                                                ref={cedulaInputRef}
                                                type="text"
                                                value={customerCedula}
                                                onChange={e => handleCedulaChange(e.target.value)}
                                                placeholder="Ej: 12345678"
                                                maxLength={15}
                                                inputMode="text"
                                                className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none transition-all ${
                                                    errorField === 'cedula'
                                                        ? 'border-red-500/80 ring-2 ring-red-500/30 bg-red-500/[0.07]'
                                                    : 'border-white/10 focus:border-white/30 focus:bg-white/[0.08]'
                                                } ${errorField === 'cedula' && shakeError ? 'animate-shake' : ''}`}
                                            />
                                            {errorField === 'cedula' && formError && (
                                                <p className="text-xs text-red-400 font-semibold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                                                    <Lineicons icon={Ban2Outlined} size={14} className="shrink-0" />
                                                    <span>{formError}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Sección 2: Tipo de Entrega ── */}
                            <div className="p-5 space-y-4 border-b border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-[10px] font-bold text-white">2</span>
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Entrega</p>
                                </div>

                                {/* ══ Modos mesa/mesero: solo "En el Local" (sin delivery/pickup) ══ */}
                                {isTableOrder ? (
                                    <div
                                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-white/10"
                                        style={{ backgroundColor: `${themeColor}22` }}
                                    >
                                        <Lineicons icon={KnifeFork1Outlined} size={24} className="text-white shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-sm">🍽️ En el Local</p>
                                            <p className="text-zinc-500 text-[10px] truncate">
                                                {tableNumber ? `Mesa ${tableNumber}` : 'Atención en el local'}
                                                {waiterName ? ` · Mesero: ${waiterName}` : ''}
                                            </p>
                                        </div>
                                        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor }}>
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    </div>
                                ) : !hasMultipleModes ? (
                                    <div
                                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-white/10"
                                        style={{ backgroundColor: `${themeColor}22` }}
                                    >
                                        {activeModes[0] && <Lineicons icon={activeModes[0].icon} size={24} className="text-white shrink-0" />}
                                        <div>
                                            <p className="text-white font-bold text-sm">{activeModes[0]?.label}</p>
                                            <p className="text-zinc-500 text-[10px]">Único modo de entrega disponible</p>
                                        </div>
                                        {/* Checkmark */}
                                        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`grid gap-3 ${activeModes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                        {activeModes.map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setDeliveryType(mode.id)}
                                                className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border font-bold text-sm transition-all shadow-lg ${deliveryType === mode.id
                                                    ? 'border-transparent text-white ring-2 ring-white/20'
                                                    : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10'
                                                    }`}
                                                style={deliveryType === mode.id ? { backgroundColor: themeColor } : {}}
                                            >
                                                <Lineicons icon={mode.icon} size={24} className="shrink-0" />
                                                <span className="text-xs leading-tight text-center">{mode.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Selector de zona + GPS solo para delivery (nunca en modos mesa/mesero) */}
                                {!isTableOrder && deliveryType === 'delivery' && (
                                    <div className="mt-4 space-y-4" style={{ animation: 'fadeIn 0.25s ease' }}>

                                        {/* Selector de zona desplegable */}
                                        {hasZones && (
                                            <div ref={zoneSelectRef}>
                                                <label className="block text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">
                                                    Zona de delivery <span style={{ color: themeColor }}>*</span>
                                                </label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                                                        className={`w-full flex items-center justify-between gap-3 bg-white/5 border rounded-xl px-4 py-3.5 text-sm text-left transition-all focus:outline-none ${
                                                            errorField === 'zone'
                                                                ? 'border-red-500/80 ring-2 ring-red-500/30 bg-red-500/[0.07]'
                                                                : isZoneDropdownOpen
                                                                    ? 'border-white/30 bg-white/[0.08]'
                                                                    : 'border-white/10 hover:border-white/20'
                                                        } ${errorField === 'zone' && shakeError ? 'animate-shake' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <Lineicons icon={MapPin5Outlined} size={18} className="text-zinc-400 shrink-0" />
                                                            {selectedZone ? (
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-white font-bold text-sm truncate">{selectedZone.name}</p>
                                                                    <p className="text-xs font-bold" style={{ color: themeColor }}>
                                                                        +${selectedZone.price.toFixed(2)} delivery
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-zinc-500 text-sm">Selecciona tu zona...</p>
                                                            )}
                                                        </div>
                                                        <svg
                                                            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${isZoneDropdownOpen ? 'rotate-180' : ''}`}
                                                            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {errorField === 'zone' && formError && (
                                                        <p className="text-xs text-red-400 font-semibold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                                                            <Lineicons icon={Ban2Outlined} size={14} className="shrink-0" />
                                                            <span>{formError}</span>
                                                        </p>
                                                    )}

                                                    {/* Lista desplegable */}
                                                    {isZoneDropdownOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#232222] border border-white/15 rounded-2xl overflow-hidden shadow-2xl z-20">
                                                            {deliveryZones.map((zone, idx) => (
                                                                <button
                                                                    key={zone.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedZoneId(zone.id);
                                                                        setIsZoneDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${idx > 0 ? 'border-t border-white/5' : ''} ${selectedZoneId === zone.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Lineicons icon={MapPin5Outlined} size={16} className="text-zinc-400 shrink-0" />
                                                                        <span className="text-white font-medium text-sm">{zone.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-black" style={{ color: themeColor }}>
                                                                            {zone.price === 0 ? 'Gratis' : `+$${zone.price.toFixed(2)}`}
                                                                        </span>
                                                                        {selectedZoneId === zone.id && (
                                                                            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                                                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Botón GPS */}
                                        <div ref={locationSectionRef}>
                                            <label className="block text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">
                                                {hasZones ? 'Opcional: Ubicación GPS exacta' : 'Ubicación GPS'}
                                            </label>
                                            {locationStatus !== 'success' ? (
                                                <>
                                                    <button
                                                        onClick={handleDetectLocation}
                                                        disabled={locationStatus === 'loading'}
                                                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60 transition-all font-medium text-xs text-white"
                                                    >
                                                        {locationStatus === 'loading' ? (
                                                            <span className="flex items-center gap-2">
                                                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                                                Detectando...
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <Lineicons icon={MapMarker1Outlined} size={16} />
                                                                Detectar ubicación GPS
                                                            </span>
                                                        )}
                                                    </button>
                                                    {(locationStatus === 'denied' || locationStatus === 'error') && (
                                                        <p className="text-[10px] text-red-500 font-bold mt-1.5 text-center">
                                                            No se pudo obtener el GPS. Asegúrate de tener la zona seleccionada.
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                    <p className="text-xs font-bold text-emerald-400 flex-1 truncate">Ubicación capturada</p>
                                                    <button onClick={() => { setLocationStatus('idle'); setLocationUrl(''); }} className="text-zinc-500 hover:text-white transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Sección 3: Productos (Colapsable) ── */}
                            <div className="border-b border-white/10">
                                <button
                                    onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                                    className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                                            <Lineicons icon={Cart1Outlined} size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Detalle del Pedido</p>
                                            <p className="text-sm font-bold text-white">
                                                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                                            {isProductsExpanded ? 'Cerrar' : 'Revisar'}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isProductsExpanded ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {isProductsExpanded && (
                                    <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        {items.map(item => {
                                            const itemOptionsPrice = item.selectedOptions?.reduce((sum, opt) => sum + Number(opt.price), 0) || 0;
                                            const itemRowTotal = (Number(item.price) + itemOptionsPrice) * Number(item.quantity);

                                            return (
                                                <div key={item.id} className="flex justify-between items-start bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                                    <div className="flex-1 pr-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-black text-white bg-white/10 px-2 py-1 rounded-lg text-xs">
                                                                {item.quantity}x
                                                            </span>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-white text-sm leading-tight mb-1">{item.name}</h3>
                                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                                    <div className="space-y-1 mb-2">
                                                                        {item.selectedOptions.map(opt => (
                                                                            <div key={opt.id} className="text-[11px] text-zinc-500 flex items-center justify-between bg-white/5 px-2 py-0.5 rounded">
                                                                                <span>• {opt.name}</span>
                                                                                {opt.price > 0 && <span className="font-bold text-zinc-400">+${opt.price.toFixed(2)}</span>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {item.notes && (
                                                                    <div className="text-[11px] bg-amber-500/5 text-amber-500/80 px-2.5 py-1.5 rounded-lg border border-amber-500/10 italic">
                                                                        "{item.notes}"
                                                                    </div>
                                                                )}
                                                                <p className="font-black text-xs mt-2" style={{ color: themeColor }}>
                                                                    Subtotal: ${itemRowTotal.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                                        className="shrink-0 bg-red-500/10 text-red-500/60 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all transform active:scale-90"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ── Sección 4: Upsell Carrusel ── */}
                            {upsellCategory && upsellCategory.products.length > 0 && (
                                <div className="border-b border-white/10">
                                    {/* Header */}
                                    <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                                        <Lineicons icon={StarFatSolid} size={18} className="text-amber-500 shrink-0" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: themeColor }}>
                                                Completa tu orden
                                            </p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">
                                                {upsellCategory.name}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Carrusel horizontal */}
                                    <div className="flex gap-3 overflow-x-auto px-5 pb-5 scrollbar-none"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {upsellCategory.products.map((prod) => {
                                            return (
                                                <div
                                                    key={prod.id}
                                                    className="shrink-0 w-[140px] bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
                                                >
                                                    {/* Imagen o placeholder */}
                                                    {prod.imageUrl ? (
                                                        <div className="w-full h-[80px] relative overflow-hidden">
                                                            <Image
                                                                src={prod.imageUrl}
                                                                alt={prod.name}
                                                                fill
                                                                sizes="140px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="w-full h-[80px] flex items-center justify-center"
                                                            style={{ backgroundColor: `${themeColor}15` }}
                                                        >
                                                            <Lineicons icon={KnifeFork1Outlined} size={28} className="opacity-50" style={{ color: themeColor }} />
                                                        </div>
                                                    )}

                                                    {/* Info */}
                                                    <div className="p-2.5 flex flex-col flex-1 gap-1.5">
                                                        <p className="text-white font-bold text-xs leading-tight line-clamp-2">
                                                            {prod.name}
                                                        </p>
                                                        <p className="text-xs font-black" style={{ color: themeColor }}>
                                                            ${prod.price.toFixed(2)}
                                                        </p>
                                                        {addedUpsellProductId === prod.id ? (
                                                            <button
                                                                disabled
                                                                className="mt-auto w-full flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition-all text-white bg-emerald-500 cursor-not-allowed"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                Agregado
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (prod.modifierGroups && prod.modifierGroups.length > 0) {
                                                                        // Tiene modificadores: abrir modal
                                                                        if (onConfigureUpsellProduct) {
                                                                            onConfigureUpsellProduct(prod);
                                                                        }
                                                                    } else {
                                                                        // Sin modificadores: agregar directo
                                                                        addItem({
                                                                            id: prod.id,
                                                                            productId: prod.id,
                                                                            name: prod.name,
                                                                            price: prod.price,
                                                                            notes: '',
                                                                            selectedOptions: [],
                                                                        });
                                                                        setAddedUpsellProductId(prod.id);
                                                                        setTimeout(() => setAddedUpsellProductId(null), 1500);
                                                                    }
                                                                }}
                                                                className="mt-auto w-full flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition-all text-white hover:brightness-110 active:scale-95"
                                                                style={{ backgroundColor: themeColor }}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                                Agregar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Sección 5: Notas adicionales ── */}
                            <div className="p-5 pb-8">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 ml-1 flex items-center gap-1.5">
                                    <Lineicons icon={Notebook1Outlined} size={15} />
                                    <span>Notas para el local</span>
                                </p>
                                <textarea
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                    placeholder="Ej: El timbre no suena, llamar al llegar..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-white/30 transition-all resize-none focus:bg-white/[0.08]"
                                />
                            </div>

                        </div>

                        {/* Pie: Total + Botón de envío */}
                        <div className="p-5 border-t border-white/10 bg-[#131313] shrink-0">
                            {/* Desglose del precio */}
                            {deliveryType === 'delivery' && selectedZone && (
                                <div className="mb-3 space-y-1.5 px-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500">Productos</span>
                                        <span className="text-zinc-300 font-medium">${Number(productTotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500">Delivery — {selectedZone.name}</span>
                                        <span className="font-bold" style={{ color: themeColor }}>
                                            {selectedZone.price === 0 ? 'Gratis' : `+$${selectedZone.price.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/10 mt-2" />
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-4 px-1">
                                <span className="text-zinc-400 font-medium">Total a pagar</span>
                                <span className="text-2xl font-black text-white">${Number(totalPrice).toFixed(2)}</span>
                            </div>

                            {/* Alerta de error interactiva junto al botón de envío */}
                            {formError && !isBlockedWaiter && (
                                <div
                                    onClick={() => {
                                        if (errorField === 'name') scrollToField(nameInputRef.current);
                                        else if (errorField === 'cedula') scrollToField(cedulaInputRef.current);
                                        else if (errorField === 'zone') scrollToField(zoneSelectRef.current, false);
                                        else if (errorField === 'location') scrollToField(locationSectionRef.current, false);
                                        else scrollToField(nameInputRef.current);
                                    }}
                                    className="cursor-pointer mb-3 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-between text-red-300 text-xs font-bold hover:bg-red-500/20 transition-all animate-shake"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Lineicons icon={Ban2Outlined} size={16} className="text-red-400 shrink-0" />
                                        <span className="truncate">{formError}</span>
                                    </div>
                                    <span className="text-[11px] underline text-red-200 hover:text-white shrink-0 ml-2 font-black">
                                        Completar ↑
                                    </span>
                                </div>
                            )}

                            {/* Mesero sin mesa elegida: en vez de enviar, avisamos */}
                            {isBlockedWaiter ? (
                                <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-center space-y-1">
                                    <p className="text-amber-300 font-black text-sm">🔒 Elige una mesa para pedir</p>
                                    <p className="text-amber-200/70 text-xs font-semibold leading-relaxed">
                                        Toca <b>“Elige una mesa”</b> en la barra superior para que tu pedido llegue a la mesa correcta.
                                    </p>
                                </div>
                            ) : (
                            <button
                                onClick={handleWhatsAppOrder}
                                disabled={isSubmitting}
                                className="w-full text-white font-bold text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-75 disabled:cursor-not-allowed"
                                style={{ backgroundColor: themeColor || '#FF5630' }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Enviando pedido...</span>
                                    </>
                                ) : (
                                    <>
                                        {isTableOrder ? (
                                            <Lineicons icon={KnifeFork1Outlined} size={20} />
                                        ) : (
                                        /* WhatsApp icon */
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        )}
                                        <span>{isTableOrder ? 'Enviar pedido a cocina' : 'Enviar pedido por WhatsApp'}</span>
                                    </>
                                )}
                            </button>
                            )}
                        </div>

                            </>
                        )}

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
                            @keyframes shakeCartError {
                                0%, 100% { transform: translateX(0); }
                                20%, 60% { transform: translateX(-6px); }
                                40%, 80% { transform: translateX(6px); }
                            }
                            .animate-shake {
                                animation: shakeCartError 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
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
"use client"

import { useFormStatus } from "react-dom"
import { useState } from "react"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full text-white font-medium py-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 mt-6 ${pending
                ? 'bg-zinc-400 cursor-not-allowed'
                : 'bg-black hover:bg-zinc-800 hover:shadow-md'
                }`}
        >
            {pending ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando configuración...
                </>
            ) : "Guardar Cambios"}
        </button>
    )
}

interface Store {
    name: string;
    whatsapp: string;
    backgroundColor: string;
    themeColor: string;
    logoUrl?: string;
    whatsappHeader?: string;
    whatsappFooter?: string;
    enableDelivery?: boolean;
    enablePickup?: boolean;
    enableDineIn?: boolean;
    showProductImages?: boolean;
    textColor?: string;
    subtextColor?: string;
    fontHeading?: string;
    fontBody?: string;
    upsellCategoryId?: string;
}

const HEADING_FONTS = [
    'Epilogue', 'Playfair Display', 'Oswald', 'Montserrat', 'Raleway',
    'Bebas Neue', 'Cinzel', 'Cormorant Garamond', 'Abril Fatface', 'Josefin Sans',
];

const BODY_FONTS = [
    'Manrope', 'Inter', 'Poppins', 'Roboto', 'Lato',
    'DM Sans', 'Nunito', 'Outfit', 'Source Sans 3', 'Work Sans',
];

function buildGoogleFontsUrl(fonts: string[]) {
    const unique = [...new Set(fonts.filter(Boolean))];
    const params = unique.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800;900`).join('&');
    return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

import SharedMenuUI from '../../components/SharedMenuUI';

// COMPONENTE WHATSAPP PREVIEW (Simula un chat de WhatsApp)
function WhatsAppPreview({ localStore }: { localStore: any }) {
    const header = localStore.whatsappHeader || `🍔 *NUEVO PEDIDO - ${localStore.name}* 🍔`;
    const footer = localStore.whatsappFooter || "¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación.";

    // Función simple para formatear *negrita* de WhatsApp en HTML
    const formatWhatsAppText = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Reemplazar *texto* con <strong>texto</strong>
            const formatted = line.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
            return <div key={i}>{formatted ? <span dangerouslySetInnerHTML={{ __html: formatted }} /> : <br />}</div>;
        });
    };

    return (
        <div className="relative mx-auto w-[320px] h-[640px] bg-[#efe7de] rounded-[3rem] border-[8px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col shrink-0">
            {/* Cabecera de WhatsApp */}
            <div className="bg-[#075e54] pt-8 pb-3 px-4 flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-full bg-zinc-200/20 flex items-center justify-center overflow-hidden">
                    {localStore.logoUrl ? (
                        <img src={localStore.logoUrl} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs">🏪</span>
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold leading-none">{localStore.name || 'Tu Negocio'}</p>
                    <p className="text-[10px] opacity-80">en línea</p>
                </div>
            </div>

            {/* Cuerpo del Chat */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain' }}>
                <div className="bg-white rounded-lg rounded-tr-none p-3 shadow-sm relative ml-auto max-w-[85%] text-zinc-800 text-[13px] leading-relaxed">
                    {/* Triángulo del mensaje */}
                    <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-white border-r-[10px] border-r-transparent"></div>

                    <div className="space-y-1">
                        {formatWhatsAppText(header)}

                        <div className="py-2">
                            <p><strong>1x Hamburguesa Trufada</strong> - $14.50</p>
                            <p className="pl-3 opacity-70 text-[11px]">└ Extra Tocino (+$2.00)</p>
                            <p><strong>2x Papas Fritas</strong> - $8.00</p>
                        </div>

                        <p><strong>💰 TOTAL A PAGAR:</strong> $24.50</p>

                        <div className="mt-2 text-zinc-600 italic">
                            {formatWhatsAppText(footer)}
                        </div>
                    </div>

                    <div className="flex justify-end mt-1">
                        <span className="text-[9px] opacity-40">12:00 PM ✓✓</span>
                    </div>
                </div>
            </div>

            {/* Barra de Entrada (Simulada) */}
            <div className="bg-[#f0f0f0] p-2 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-zinc-400">Escribe un mensaje</div>
                <div className="w-10 h-10 rounded-full bg-[#075e54] flex items-center justify-center text-white">
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                </div>
            </div>
        </div>
    )
}

// COMPONENTE WRAPPER DEL TELÉFONO (Inyecta la UI única con datos de demostración)
function MenuPreviewWrapper({ localStore }: { localStore: any }) {
    // Creamos un dataset de demostración fusionado con los colores vivos del administrador
    const mockStore = {
        name: localStore.name,
        backgroundColor: localStore.backgroundColor,
        themeColor: localStore.themeColor,
        logoUrl: localStore.logoUrl,
        whatsapp: localStore.whatsapp || "",
        whatsappHeader: localStore.whatsappHeader,
        whatsappFooter: localStore.whatsappFooter,
        // Tipografía y colores de texto
        textColor: localStore.textColor,
        subtextColor: localStore.subtextColor,
        fontHeading: localStore.fontHeading,
        fontBody: localStore.fontBody,
        showProductImages: localStore.showProductImages,
        categories: [
            {
                id: "demo-cat",
                name: "Platos Estrella",
                products: [
                    {
                        id: "demo-prod-1",
                        name: "Hamburguesa Trufada",
                        description: "Carne Angus 200g, mayonesa de trufa negra y papas fritas artesanales.",
                        price: 14.50,
                        imageUrl: null
                    },
                    {
                        id: "demo-prod-2",
                        name: "Papas Gourmet",
                        description: "Papas fritas con cheddar, tocineta y salsa especial.",
                        price: 6.00,
                        imageUrl: null
                    }
                ]
            }
        ]
    };

    return (
        <div className="relative mx-auto w-[320px] h-[640px] bg-black rounded-[3rem] border-[8px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col shrink-0">
            {/* Notch del Teléfono simulado */}
            <div className="absolute top-0 inset-x-0 w-32 h-6 bg-zinc-900 mx-auto rounded-b-3xl z-50 pointer-events-none"></div>

            {/* Invocación del Single Source of Truth */}
            <div className="w-full h-full relative">
                <SharedMenuUI store={mockStore} isPreview={true} />
            </div>
        </div>
    )
}

export function SettingsForm({
    store,
    categories = [],
    updateAction,
}: {
    store: Store;
    categories?: { id: string; name: string }[];
    updateAction: (formData: FormData) => Promise<{ success: boolean; message: string } | any>;
}) {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

    // ESTADO CONTROLADO LOCALMENTE (Para la Vista Previa)
    const [localStore, setLocalStore] = useState({
        name: store.name || "",
        whatsapp: store.whatsapp || "",
        backgroundColor: store.backgroundColor || "#131313",
        themeColor: store.themeColor || "#FF5630",
        logoUrl: store.logoUrl || "",
        whatsappHeader: store.whatsappHeader || "",
        whatsappFooter: store.whatsappFooter || "",
        enableDelivery: store.enableDelivery ?? true,
        enablePickup: store.enablePickup ?? true,
        enableDineIn: store.enableDineIn ?? false,
        showProductImages: store.showProductImages ?? true,
        textColor: store.textColor || '#e5e2e1',
        subtextColor: store.subtextColor || '#e4beb5',
        fontHeading: store.fontHeading || 'Epilogue',
        fontBody: store.fontBody || 'Manrope',
        upsellCategoryId: store.upsellCategoryId || '',
    })

    // Cargar las fuentes seleccionadas en el panel de administración para vista previa
    const fontsUrl = buildGoogleFontsUrl([localStore.fontHeading, localStore.fontBody]);

    // Guard: at least one delivery mode must remain active
    const handleDeliveryToggle = (mode: 'enableDelivery' | 'enablePickup' | 'enableDineIn') => {
        const next = { ...localStore, [mode]: !localStore[mode] };
        const anyActive = next.enableDelivery || next.enablePickup || next.enableDineIn;
        if (!anyActive) return; // silently prevent disabling the last one
        setLocalStore(next);
    };

    const [previewMode, setPreviewMode] = useState<"menu" | "whatsapp">("menu")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLocalStore({ ...localStore, logoUrl: URL.createObjectURL(file) });
        }
    };

    const handleAction = async (formData: FormData) => {
        try {
            await updateAction(formData)
            setStatus("success")
            setTimeout(() => setStatus("idle"), 4000)
        } catch (error) {
            console.error(error)
            setStatus("error")
            setTimeout(() => setStatus("idle"), 4000)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 xl:gap-16 items-start">

            {/* Formulario (Columna 1) */}
            <div className="order-2 lg:order-1 flex flex-col pt-2 w-full">
                <form action={handleAction} className="space-y-6">

                    {status === "success" && (
                        <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-green-100 p-1.5 rounded-full shrink-0">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span className="font-medium text-sm">¡Configuración guardada! Se visualizarán los cambios al visitar tu menú.</span>
                        </div>
                    )}

                    {/* Datos Básicos */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-zinc-800 border-b pb-2">Información del Negocio</h2>

                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Nombre del Local</label>
                            <input
                                type="text"
                                name="name"
                                value={localStore.name}
                                onChange={(e) => setLocalStore({ ...localStore, name: e.target.value })}
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-shadow"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-zinc-100">
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Logo del Local</label>
                            <input
                                type="file"
                                name="logo"
                                accept="image/*" // Solo permite seleccionar imágenes
                                onChange={handleFileChange}
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none bg-zinc-50"
                            />
                            {localStore.logoUrl && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-zinc-500 mb-2">Logo actual (o vista previa):</p>
                                    <div className="w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden shadow-sm bg-zinc-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={localStore.logoUrl} alt="Logo actual" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">WhatsApp de Recepción</label>
                            <input
                                type="text"
                                name="whatsapp"
                                value={localStore.whatsapp}
                                onChange={(e) => setLocalStore({ ...localStore, whatsapp: e.target.value })}
                                placeholder="Ej: 584141234567"
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-shadow"
                                required
                            />
                        </div>
                    </div>

                    {/* Configuración de WhatsApp */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h2 className="text-lg font-semibold text-zinc-800">Mensajes de WhatsApp</h2>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Encabezado (Antes de los productos)</label>
                            <textarea
                                name="whatsappHeader"
                                value={localStore.whatsappHeader}
                                onChange={(e) => {
                                    setLocalStore({ ...localStore, whatsappHeader: e.target.value })
                                    setPreviewMode("whatsapp") // Cambiar a vista previa de WhatsApp automáticamente
                                }}
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none bg-zinc-50 resize-none font-mono text-xs"
                                rows={2}
                                placeholder="Ej: *NUEVO PEDIDO*"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Pie de mensaje (Después del total)</label>
                            <textarea
                                name="whatsappFooter"
                                value={localStore.whatsappFooter}
                                onChange={(e) => {
                                    setLocalStore({ ...localStore, whatsappFooter: e.target.value })
                                    setPreviewMode("whatsapp") // Cambiar a vista previa de WhatsApp automáticamente
                                }}
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none bg-zinc-50 resize-none font-mono text-xs"
                                rows={3}
                                placeholder="Ej: Gracias por su compra."
                            />
                        </div>
                    </div>

                    {/* Opciones de Entrega */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-800">Opciones de Entrega</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Activa los modos que ofrece tu negocio. Debe haber al menos uno activo.</p>
                        </div>

                        {/* Hidden inputs para enviar false cuando el checkbox está desmarcado */}
                        {/* Los checkboxes HTML solo envían valor cuando están marcados, así que usamos el estado local */}
                        <input type="hidden" name="enableDelivery" value={localStore.enableDelivery ? 'on' : 'off'} />
                        <input type="hidden" name="enablePickup" value={localStore.enablePickup ? 'on' : 'off'} />
                        <input type="hidden" name="enableDineIn" value={localStore.enableDineIn ? 'on' : 'off'} />

                        <div className="space-y-3">
                            {([
                                { key: 'enableDelivery' as const, label: 'Delivery', sub: 'El negocio hace entregas a domicilio', emoji: '🚗' },
                                { key: 'enablePickup' as const, label: 'Pick-Up', sub: 'El cliente pasa a retirar su pedido', emoji: '🏃' },
                                { key: 'enableDineIn' as const, label: 'En el Local', sub: 'El cliente consume en el restaurante', emoji: '🍽️' },
                            ]).map(({ key, label, sub, emoji }) => {
                                const isOn = localStore[key];
                                const activeCount = [localStore.enableDelivery, localStore.enablePickup, localStore.enableDineIn].filter(Boolean).length;
                                const isLast = isOn && activeCount === 1;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleDeliveryToggle(key)}
                                        disabled={isLast}
                                        title={isLast ? 'Debe haber al menos un modo activo' : undefined}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isOn
                                            ? 'border-black bg-black/5'
                                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                                            } ${isLast ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span className="text-2xl shrink-0">{emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-sm ${isOn ? 'text-zinc-900' : 'text-zinc-500'}`}>{label}</p>
                                            <p className="text-xs text-zinc-400 truncate">{sub}</p>
                                        </div>
                                        {/* Toggle pill */}
                                        <div className={`shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-black' : 'bg-zinc-200'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* ─── Categoría Estrella del Carrito ─── */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-800">🔥 Categoría Estrella del Carrito</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Elige una categoría para recomendarla al cliente en el carrito. Ideal para bebidas, postres o extras.
                            </p>
                        </div>

                        <input type="hidden" name="upsellCategoryId" value={localStore.upsellCategoryId} />

                        {/* Opción: Ninguna */}
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setLocalStore({ ...localStore, upsellCategoryId: '' })}
                                className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${localStore.upsellCategoryId === ''
                                    ? 'border-black bg-black/5'
                                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                                    }`}
                            >
                                <span className="text-xl shrink-0">🚫</span>
                                <p className={`font-semibold text-sm ${localStore.upsellCategoryId === '' ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                    No mostrar recomendaciones
                                </p>
                                {localStore.upsellCategoryId === '' && (
                                    <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {categories.length === 0 ? (
                                <p className="text-xs text-zinc-400 px-1 py-2">
                                    Aún no tienes categorías creadas. Crea algunas desde el panel principal.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {categories.map((cat) => {
                                        const isSelected = localStore.upsellCategoryId === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setLocalStore({ ...localStore, upsellCategoryId: cat.id })}
                                                className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${isSelected
                                                    ? 'border-black bg-black/5'
                                                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                    }`}
                                            >
                                                <span className="text-xl shrink-0">📂</span>
                                                <p className={`font-semibold text-sm ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                                    {cat.name}
                                                </p>
                                                {isSelected && (
                                                    <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Imágenes de Productos */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-800">Apariencia del Menú</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Personaliza cómo se muestran los productos a tus clientes.</p>
                        </div>

                        {/* Hidden input para enviar el estado del toggle */}
                        <input type="hidden" name="showProductImages" value={localStore.showProductImages ? 'on' : 'off'} />

                        <button
                            type="button"
                            onClick={() => setLocalStore({ ...localStore, showProductImages: !localStore.showProductImages })}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${localStore.showProductImages
                                ? 'border-black bg-black/5'
                                : 'border-zinc-200 bg-white hover:border-zinc-300'
                                }`}
                        >
                            <span className="text-2xl shrink-0">🖼️</span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${localStore.showProductImages ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                    Mostrar imágenes de productos
                                </p>
                                <p className="text-xs text-zinc-400 truncate">
                                    {localStore.showProductImages ? 'Las fotos de cada producto son visibles en el menú' : 'El menú se muestra solo con texto, sin imágenes'}
                                </p>
                            </div>
                            {/* Toggle pill */}
                            <div className={`shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 ${localStore.showProductImages ? 'bg-black' : 'bg-zinc-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${localStore.showProductImages ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Tipografía y Texto */}
                    <div className="space-y-5 pt-4 border-t border-zinc-100">
                        {/* Inyectar fuentes para previsualizar en el panel */}
                        <link rel="stylesheet" href={fontsUrl} />

                        <div>
                            <h2 className="text-lg font-semibold text-zinc-800">Tipografía y Texto</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Personaliza las fuentes y colores del texto del menú.</p>
                        </div>

                        {/* Colores de texto */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 mb-2">Color Principal</label>
                                <p className="text-[10px] text-zinc-400 mb-2">Títulos de productos</p>
                                <div className="flex gap-3 items-center border border-zinc-200 p-2 rounded-lg bg-zinc-50">
                                    <input
                                        type="color"
                                        name="textColor"
                                        value={localStore.textColor}
                                        onChange={(e) => setLocalStore({ ...localStore, textColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-0 p-0 shadow-sm"
                                    />
                                    <span className="text-xs text-zinc-600 font-mono font-medium">{localStore.textColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 mb-2">Color Secundario</label>
                                <p className="text-[10px] text-zinc-400 mb-2">Descripciones y etiquetas</p>
                                <div className="flex gap-3 items-center border border-zinc-200 p-2 rounded-lg bg-zinc-50">
                                    <input
                                        type="color"
                                        name="subtextColor"
                                        value={localStore.subtextColor}
                                        onChange={(e) => setLocalStore({ ...localStore, subtextColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-0 p-0 shadow-sm"
                                    />
                                    <span className="text-xs text-zinc-600 font-mono font-medium">{localStore.subtextColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Fuente de Títulos */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1">Fuente de Títulos</label>
                            <input type="hidden" name="fontHeading" value={localStore.fontHeading} />
                            <select
                                value={localStore.fontHeading}
                                onChange={(e) => setLocalStore({ ...localStore, fontHeading: e.target.value })}
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black outline-none bg-zinc-50 text-sm"
                            >
                                {HEADING_FONTS.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <p
                                className="mt-2 px-3 py-2 bg-zinc-100 rounded-lg text-base"
                                style={{ fontFamily: `'${localStore.fontHeading}', sans-serif` }}
                            >
                                Hamburguesa Trufada — $14.50
                            </p>
                        </div>

                        {/* Fuente de Cuerpo */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 mb-1">Fuente de Texto / Descripción</label>
                            <input type="hidden" name="fontBody" value={localStore.fontBody} />
                            <select
                                value={localStore.fontBody}
                                onChange={(e) => setLocalStore({ ...localStore, fontBody: e.target.value })}
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black outline-none bg-zinc-50 text-sm"
                            >
                                {BODY_FONTS.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <p
                                className="mt-2 px-3 py-2 bg-zinc-100 rounded-lg text-sm"
                                style={{ fontFamily: `'${localStore.fontBody}', sans-serif` }}
                            >
                                Carne Angus 200g, mayonesa de trufa negra, papas fritas artesanales.
                            </p>
                        </div>
                    </div>

                    {/* Identidad Visual (colores de fondo) */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-bold text-zinc-800 border-b pb-2">Identidad Visual</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 mb-2">Color de Fondo</label>
                                <div className="flex gap-3 items-center border border-zinc-200 p-2 rounded-lg bg-zinc-50">
                                    <input
                                        type="color"
                                        name="backgroundColor"
                                        value={localStore.backgroundColor}
                                        onChange={(e) => setLocalStore({ ...localStore, backgroundColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-0 p-0 shadow-sm"
                                    />
                                    <span className="text-xs text-zinc-600 font-mono font-medium">{localStore.backgroundColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 mb-2">Acento Texturas</label>
                                <div className="flex gap-3 items-center border border-zinc-200 p-2 rounded-lg bg-zinc-50">
                                    <input
                                        type="color"
                                        name="themeColor"
                                        value={localStore.themeColor}
                                        onChange={(e) => setLocalStore({ ...localStore, themeColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-0 p-0 shadow-sm"
                                    />
                                    <span className="text-xs text-zinc-600 font-mono font-medium">{localStore.themeColor}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SubmitButton />
                </form>
            </div>

            {/* Vista Previa Móvil (Columna 2) */}
            <div className="order-1 lg:order-2 flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-l border-zinc-100 pb-8 lg:pb-0 lg:pl-10 lg:sticky lg:top-8 lg:h-max">
                <div className="flex flex-col items-center mb-6 w-full">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4 text-center shrink-0">Vista Previa en Vivo</h3>

                    {/* Toggles de Vista Previa */}
                    <div className="flex p-1 bg-zinc-100 rounded-xl w-full max-w-[280px]">
                        <button
                            onClick={() => setPreviewMode("menu")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${previewMode === "menu" ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Menú Digital
                        </button>
                        <button
                            onClick={() => setPreviewMode("whatsapp")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${previewMode === "whatsapp" ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Mensaje WhatsApp
                        </button>
                    </div>
                </div>

                <div className="relative animate-in fade-in zoom-in duration-500">
                    {previewMode === "menu" ? (
                        <MenuPreviewWrapper localStore={localStore} />
                    ) : (
                        <WhatsAppPreview localStore={localStore} />
                    )}
                </div>
            </div>

        </div>
    )
}

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
}

import SharedMenuUI from '../../components/SharedMenuUI';

// COMPONENTE WRAPPER DEL TELÉFONO (Inyecta la UI única con datos de demostración)
function MenuPreviewWrapper({ localStore }: { localStore: any }) {
    // Creamos un dataset de demostración fusionado con los colores vivos del administrador
    const mockStore = {
        name: localStore.name,
        backgroundColor: localStore.backgroundColor,
        themeColor: localStore.themeColor,
        logoUrl: localStore.logoUrl,
        whatsapp: localStore.whatsapp || "",
        categories: [
            {
                id: "demo-cat",
                name: "Platos Estrella",
                products: [
                    {
                        id: "demo-prod-1",
                        name: "Hamburguesa Trufada",
                        description: "Carne Angus 200g, mayonesa de trufa negra...",
                        price: 14.50,
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

export function SettingsForm({ store, updateAction }: { store: Store, updateAction: (formData: FormData) => Promise<{ success: boolean; message: string } | any> }) {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

    // ESTADO CONTROLADO LOCALMENTE (Para la Vista Previa)
    const [localStore, setLocalStore] = useState({
        name: store.name || "",
        whatsapp: store.whatsapp || "",
        backgroundColor: store.backgroundColor || "#131313",
        themeColor: store.themeColor || "#FF5630",
        logoUrl: store.logoUrl || ""
    })

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

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Mensaje por defecto en WhatsApp
                        </label>
                        <p className="text-xs text-zinc-500 mb-2">
                            La lista de productos y el total a pagar se generarán automáticamente. Este es solo el mensaje que acompañará la orden.
                        </p>
                        <textarea
                            name="whatsappMessage"
                            defaultValue={store.whatsappMessage || "¡Hola! Quisiera realizar este pedido, quedo atento a su confirmación."}
                            placeholder="Ej: ¡Hola! Quiero hacer este pedido para comer en el local."
                            rows={3}
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none bg-zinc-50 resize-none"
                            required
                        />
                    </div>

                    {/* Colores */}
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
            <div className="order-1 lg:order-2 flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-l border-zinc-100 pb-8 lg:pb-0 lg:pl-10">
                <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-6 text-center shrink-0">Vista Previa en Vivo</h3>
                <MenuPreviewWrapper localStore={localStore} />
            </div>

        </div>
    )
}

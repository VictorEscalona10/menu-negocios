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

// COMPONENTE DE VISTA PREVIA (Miniatura de la UI del Menú)
function MenuPreview({ name, backgroundColor, themeColor, logoUrl }: { name: string, backgroundColor: string, themeColor: string, logoUrl?: string }) {
    return (
        <div className="relative mx-auto w-[320px] h-[640px] bg-black rounded-[3rem] border-[8px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col shrink-0">
            {/* Notch del Teléfono simulado */}
            <div className="absolute top-0 inset-x-0 w-32 h-6 bg-zinc-900 mx-auto rounded-b-3xl z-50"></div>

            {/* Contenido Renderizado de la App */}
            <div
                className="w-full h-full overflow-y-auto no-scrollbar font-sans text-[#e5e2e1] pb-24 relative"
                style={{ backgroundColor: backgroundColor || '#131313' }}
            >
                {/* Cabecera Clónica */}
                <header className="pt-16 pb-8 px-5 relative overflow-hidden">
                    <div
                        className="absolute top-0 right-0 opacity-10 blur-[50px] rounded-full w-48 h-48 -translate-y-1/2 translate-x-1/4 pointer-events-none"
                        style={{ backgroundColor: themeColor || '#FF5630' }}
                    ></div>

                    <div className="flex items-end justify-between mb-6 relative z-10">
                        {logoUrl ? (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border-4 border-white shadow-xl overflow-hidden bg-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-xl">
                                <span className="text-2xl">🏪</span>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 w-full pr-4">
                        <h1 className="text-3xl font-serif tracking-tighter font-extrabold mb-2 leading-none text-white truncate">
                            {name || 'Tu Negocio'}
                        </h1>
                        <p className="opacity-60 font-medium text-[10px] tracking-widest uppercase">
                            Selección Premium • Retira en local
                        </p>
                    </div>
                </header>

                {/* Lista de Demo */}
                <main className="px-5 space-y-6 relative z-10">
                    <section className="space-y-4">
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-xl font-serif tracking-tight text-white font-bold">
                                Platos Estrella
                            </h2>
                            <div className="h-[1px] flex-1 bg-white/10"></div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Producto de Prueba */}
                            <article className="group relative bg-transparent rounded-2xl flex gap-3 items-center p-1">
                                <div className="flex-1 pr-2">
                                    <h3 className="font-bold text-white text-base mb-1 tracking-tight">Hamburguesa Trufada</h3>
                                    <p className="text-zinc-500 text-xs leading-relaxed mb-2 line-clamp-2">Carne Angus 200g, mayonesa de trufa negra, champiñones y queso suizo brillante.</p>
                                    <p className="font-serif font-black text-lg tracking-tighter" style={{ color: themeColor }}>
                                        $14.50
                                    </p>
                                </div>
                                <div className="shrink-0 bg-[#201f1f] p-1.5 rounded-full border border-white/5 flex items-center justify-center w-8 h-8 pointer-events-none" style={{ backgroundColor: themeColor || '#FF5630' }}>
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                </div>
                            </article>
                        </div>
                    </section>
                </main>

                {/* Floating Cart Clónico */}
                <div className="absolute bottom-4 inset-x-4 z-50">
                    <div className="bg-[#201f1f]/80 backdrop-blur-md rounded-[1.5rem] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/5">
                        <div
                            className="w-full text-white font-bold py-3 px-4 rounded-[1.2rem] flex items-center justify-between"
                            style={{ background: `linear-gradient(135deg, ${themeColor || '#FF5630'}, #131313)` }}
                        >
                            <div className="flex flex-col items-start gap-px">
                                <span className="text-[8px] uppercase tracking-widest opacity-80 font-bold">
                                    Tu Orden (1 item)
                                </span>
                                <div className="font-serif text-lg tracking-tight font-black">$14.50</div>
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                                <span className="text-[10px] font-medium">Pedir</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
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
                <MenuPreview
                    name={localStore.name}
                    backgroundColor={localStore.backgroundColor}
                    themeColor={localStore.themeColor}
                    logoUrl={localStore.logoUrl}
                />
            </div>

        </div>
    )
}

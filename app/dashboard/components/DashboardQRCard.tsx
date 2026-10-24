'use client'

import { useState } from 'react'
import { QrCode } from 'lucide-react'
import QRGenerator from '@/app/components/QRGenerator'

interface DashboardQRCardProps {
    menuUrl: string
    storeName: string
}

export default function DashboardQRCard({ menuUrl, storeName }: DashboardQRCardProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Tarjeta con tamaño y estilo idéntico a las demás */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-4.5 lg:p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-colors">
                <div>
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                            <QrCode className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-zinc-700" />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200 uppercase">
                            QR OFICIAL
                        </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">Código QR del Menú</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-3 sm:mb-3.5">
                        Descarga o imprime el código QR oficial de tu local para que tus clientes escaneen y pidan.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between shadow-sm cursor-pointer"
                >
                    <span>Ver y Descargar QR</span>
                    <span>→</span>
                </button>
            </div>

            {/* Modal para ver y descargar el QR */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-5 sm:p-8 max-w-md w-full relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón cerrar */}
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100 cursor-pointer"
                            title="Cerrar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-3">
                                <QrCode className="w-6 h-6 text-zinc-800" />
                            </div>
                            <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">Código QR del Menú</h3>
                            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                                {storeName} · Pedidos por WhatsApp
                            </p>
                        </div>

                        <div className="flex justify-center mb-2">
                            <QRGenerator menuUrl={menuUrl} storeName={storeName} />
                        </div>

                        <p className="text-[11px] text-zinc-400 font-mono text-center mb-4">
                            Escanear para acceder a la carta en vivo
                        </p>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="w-full text-center text-xs font-semibold py-2.5 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

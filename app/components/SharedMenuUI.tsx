// app/components/SharedMenuUI.tsx
import AddToCartButton from '../menu/[slug]/AddToCartButton'
import FloatingCart from '../menu/[slug]/components/FloatingCart'

interface SharedMenuUIProps {
    store: {
        name: string;
        whatsapp: string;
        backgroundColor: string;
        themeColor: string;
        logoUrl?: string | null;
        categories: Array<{
            id: string;
            name: string;
            products: Array<{
                id: string;
                name: string;
                description: string | null;
                price: number;
                imageUrl: string | null;
            }>;
        }>;
    };
    isPreview?: boolean;
}

export default function SharedMenuUI({ store, isPreview = false }: SharedMenuUIProps) {
    return (
        <div
            className={`font-sans relative selection:bg-white/20 overflow-hidden ${isPreview ? 'w-full h-full overflow-y-auto no-scrollbar pb-24' : 'min-h-screen pb-40'}`}
            style={{ backgroundColor: store.backgroundColor || '#131313' }}
        >
            {/* Aura Dinámica del ThemeColor */}
            <div
                className={`absolute top-0 left-0 w-full opacity-30 blur-[100px] pointer-events-none transform -translate-y-1/2 ${isPreview ? 'h-48' : 'h-[60vh]'}`}
                style={{ background: `radial-gradient(circle, ${store.themeColor} 0%, transparent 70%)` }}
            />

            {/* Cabecera Editorial */}
            <header className={`relative px-6 z-10 flex flex-col items-center justify-center text-center ${isPreview ? 'pt-16 pb-8' : 'pt-20 pb-16'}`}>
                {store.logoUrl ? (
                    <div className={`${isPreview ? 'w-16 h-16 mb-4 border-[3px]' : 'w-28 h-28 mb-8 border-[1px]'} mx-auto rounded-full border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden bg-[#131313] relative z-20`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className={`${isPreview ? 'w-16 h-16 mb-4 text-2xl border-[3px]' : 'w-28 h-28 mb-8 text-4xl border-[1px]'} mx-auto rounded-full border-white/10 shadow-2xl flex flex-col items-center justify-center bg-[#1c1b1b] relative z-20`}>
                        <span style={{ color: store.themeColor }}>✦</span>
                    </div>
                )}

                <h1 className={`${isPreview ? 'text-2xl' : 'text-4xl md:text-5xl'} font-black mb-2 tracking-tighter text-[#e5e2e1] drop-shadow-md leading-tight`}>
                    {store.name || 'Tu Negocio'}
                </h1>
                <p className={`font-serif text-[#d1c5b4] italic opacity-80 ${isPreview ? 'text-xs' : 'text-lg'}`}>
                    Obras culinarias · Pedido Digital
                </p>
            </header>

            {/* Colección / Catálogo */}
            <main className={`mx-auto px-4 sm:px-6 relative z-10 ${isPreview ? 'max-w-full space-y-10' : 'max-w-3xl space-y-24'}`}>
                {store.categories.length === 0 ? (
                    <div className="bg-[#1c1b1b]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] text-center shadow-2xl">
                        <p className="text-[#d1c5b4] font-serif italic text-base">La vista previa usa datos falsos en Settings...</p>
                    </div>
                ) : (
                    store.categories.map((category) => {
                        if (category.products.length === 0) return null;

                        return (
                            <section key={category.id} className={`${isPreview ? 'space-y-6' : 'space-y-10'}`}>
                                <div className="flex flex-col gap-2">
                                    <h2 className={`${isPreview ? 'text-2xl' : 'text-4xl'} font-serif text-[#e5e2e1] tracking-tight`}>
                                        {category.name}
                                    </h2>
                                    <div
                                        className={`${isPreview ? 'h-[2px] w-8' : 'h-1 w-12'} rounded-full`}
                                        style={{ backgroundColor: store.themeColor }}
                                    />
                                </div>

                                <div className={`${isPreview ? 'flex flex-col gap-4' : 'flex flex-col gap-8'}`}>
                                    {category.products.map((product) => (
                                        <article
                                            key={product.id}
                                            className={`group relative bg-[#1c1b1b]/60 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-[2rem] p-3 md:p-4 flex flex-row gap-3 md:gap-5 items-center shadow-2xl transition-all duration-500 hover:bg-[#201f1f]/80`}
                                        >
                                            {/* Imagen del Producto */}
                                            {product.imageUrl ? (
                                                <div className={`${isPreview ? 'w-16 h-16 rounded-xl' : 'w-24 h-24 sm:w-36 sm:h-36 rounded-[1.5rem]'} shrink-0 overflow-hidden bg-[#0e0e0e] shadow-inner relative`}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                                </div>
                                            ) : (
                                                <div className={`${isPreview ? 'w-12 h-12 rounded-lg' : 'w-20 h-20 sm:w-36 sm:h-36 rounded-[1.5rem]'} shrink-0  bg-[#0e0e0e] border border-white/5 flex items-center justify-center`}>
                                                    <span className={`opacity-20 ${isPreview ? 'text-xl' : 'text-3xl'}`}>🍽️</span>
                                                </div>
                                            )}

                                            {/* Información */}
                                            <div className="flex-1 min-w-0 pr-1">
                                                <h3 className={`font-bold text-[#e5e2e1] tracking-tight leading-tight truncate ${isPreview ? 'text-base mb-1' : 'text-xl sm:text-2xl mb-2'}`}>
                                                    {product.name}
                                                </h3>
                                                {product.description && (
                                                    <p className={`text-[#d1c5b4] leading-snug line-clamp-2 ${isPreview ? 'text-[10px] mb-1.5' : 'text-sm mb-4'}`}>
                                                        {product.description}
                                                    </p>
                                                )}
                                                {/* Precios responsivos */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p
                                                        className={`font-serif font-black tracking-tighter ${isPreview ? 'text-lg' : 'text-xl sm:text-2xl'}`}
                                                        style={{ color: store.themeColor }}
                                                    >
                                                        ${product.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Botón Acción Oculto o Pequeño en Preview  */}
                                            <div className="shrink-0 bg-[#0e0e0e] p-1 md:p-1.5 rounded-full shadow-xl border border-white/5 hover:border-white/20 transition-colors pointer-events-auto">
                                                {isPreview ? (
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: store.themeColor || '#FF5630' }}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <AddToCartButton
                                                        product={{ id: product.id, name: product.name, price: product.price }}
                                                        themeColor={store.themeColor}
                                                    />
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )
                    })
                )}
            </main>

            <FloatingCart
                storeName={store.name || 'Local'}
                whatsapp={store.whatsapp}
                themeColor={store.themeColor}
                isPreview={isPreview}
            />
        </div>
    )
}

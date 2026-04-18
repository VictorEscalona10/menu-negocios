// app/components/SharedMenuUI.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AddToCartButton from '../menu/[slug]/AddToCartButton'
import FloatingCart from '../menu/[slug]/components/FloatingCart'
import ProductConfiguratorModal from '../menu/[slug]/components/ProductConfiguratorModal'

interface SharedMenuUIProps {
    store: {
        name: string;
        whatsapp: string;
        whatsappHeader?: string;
        whatsappFooter?: string;
        backgroundColor: string;
        themeColor: string;
        logoUrl?: string | null;
        enableDelivery?: boolean;
        enablePickup?: boolean;
        enableDineIn?: boolean;
        showProductImages?: boolean;
        forceNotesModal?: boolean;
        textColor?: string;
        subtextColor?: string;
        fontHeading?: string;
        fontBody?: string;
        upsellCategoryId?: string | null;
        categories: Array<{
            id: string;
            name: string;
            products: Array<{
                id: string;
                name: string;
                description: string | null;
                price: number;
                imageUrl: string | null;
                modifierGroups?: Array<{
                    id: string;
                    name: string;
                    isRequired: boolean;
                    maxSelect: number | null;
                    options: Array<{
                        id: string;
                        name: string;
                        price: number;
                    }>;
                }>;
            }>;
        }>;
    };
    isPreview?: boolean;
}

export default function SharedMenuUI({ store, isPreview = false }: SharedMenuUIProps) {
    const bg = store.backgroundColor || '#131313';
    const accent = store.themeColor || '#FF5630';
    const showImages = store.showProductImages ?? true;
    const textColor = store.textColor || '#e5e2e1';
    const subtextColor = store.subtextColor || '#e4beb5';
    const fontHeading = store.fontHeading || 'Epilogue';
    const fontBody = store.fontBody || 'Manrope';

    // Build Google Fonts URL for selected fonts
    const uniqueFonts = [...new Set([fontHeading, fontBody])];
    const googleFontsUrl = `https://fonts.googleapis.com/css2?${uniqueFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;900`).join('&')}&display=swap`;

    // Sólo categorías con productos
    const activeCategories = store.categories.filter(c => c.products.length > 0);

    // Categoría para el carrusel upsell del carrito
    const upsellCategory = store.upsellCategoryId
        ? store.categories.find(c => c.id === store.upsellCategoryId) ?? null
        : null;
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeConfigProduct, setActiveConfigProduct] = useState<any>(null);

    // Refs para el slider y el nav
    const sliderRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]); // Referencia a cada slide
    const isScrollingProgrammatically = useRef(false);

    // ── Scroll el slider al índice ──
    const goToIndex = useCallback((index: number) => {
        isScrollingProgrammatically.current = true;
        setActiveIndex(index);

        // 1. Mover el slider principal hacia el slide correspondiente
        const slide = slideRefs.current[index];
        if (slide) {
            slide.scrollIntoView({ inline: 'start', behavior: 'smooth', block: 'nearest' });
        }

        // 2. Scroll el pill nav (menú de arriba) para que sea visible
        const navBtn = navItemRefs.current[index];
        if (navBtn && navRef.current) {
            navBtn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
        }

        setTimeout(() => { isScrollingProgrammatically.current = false; }, 500);
    }, []);

    // ── Detecta el slide activo al deslizar manualmente con IntersectionObserver ──
    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider || isPreview) return;

        const observer = new IntersectionObserver((entries) => {
            if (isScrollingProgrammatically.current) return;

            entries.forEach(entry => {
                // Si el slide actual está visible en más de un 60%
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.getAttribute('data-index'));
                    if (!isNaN(idx) && idx !== activeIndex) {
                        setActiveIndex(idx);

                        // Centramos el botón del menú de navegación de arriba
                        const navBtn = navItemRefs.current[idx];
                        if (navBtn && navRef.current) {
                            navBtn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
                        }
                    }
                }
            });
        }, {
            root: slider,
            threshold: 0.6 // Se activa cuando al menos el 60% del slide es visible
        });

        // Observar todos los slides
        const currentSlides = slideRefs.current;
        currentSlides.forEach(slide => {
            if (slide) observer.observe(slide);
        });

        return () => {
            currentSlides.forEach(slide => {
                if (slide) observer.unobserve(slide);
            });
        };
    }, [activeIndex, isPreview, activeCategories.length]);

    return (
        <div
            className={`relative font-sans selection:bg-white/20 flex flex-col ${isPreview ? 'w-full h-full' : 'h-screen'}`}
            style={{ backgroundColor: bg }}
        >
            {/* Google Fonts */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('${googleFontsUrl}');
                .font-epilogue { font-family: '${fontHeading}', sans-serif; }
                .font-manrope  { font-family: '${fontBody}', sans-serif; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .snap-slider {
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                }
                .snap-slide {
                    scroll-snap-align: start;
                    scroll-snap-stop: always;
                }
            `}} />



            {/* ═══════════════════════════════════
                HEADER (fijo arriba, no scrollea)
            ═══════════════════════════════════ */}
            <header
                className={`relative z-20 shrink-0 flex flex-col items-center text-center ${isPreview ? 'pt-6 pb-4 px-4' : 'pt-10 pb-6 px-6'}`}
                style={{ backgroundColor: bg }}
            >
                {/* Logo */}
                {store.logoUrl ? (
                    <div
                        className={`${isPreview ? 'w-12 h-12 mb-2' : 'w-16 h-16 mb-3'} rounded-full overflow-hidden ring-2 ring-white/10 shrink-0`}
                        style={{ boxShadow: `0 0 28px ${accent}44` }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div
                        className={`${isPreview ? 'w-12 h-12 mb-2 text-xl' : 'w-16 h-16 mb-3 text-2xl'} rounded-full ring-2 ring-white/10 flex items-center justify-center shrink-0`}
                        style={{ backgroundColor: `${accent}22`, boxShadow: `0 0 28px ${accent}44` }}
                    >
                        🍽️
                    </div>
                )}

                {/* Store name */}
                <h1
                    className={`font-epilogue font-black tracking-tight ${isPreview ? 'text-lg' : 'text-2xl md:text-3xl'} leading-none mb-0.5`}
                    style={{ color: textColor }}
                >
                    {store.name || 'Tu Negocio'}
                </h1>
                <p className="font-manrope text-[10px] tracking-widest uppercase" style={{ color: subtextColor }}>
                    Menú Digital · Pedido Online
                </p>
                <div className="w-8 h-0.5 rounded-full mt-2.5" style={{ backgroundColor: accent }} />
            </header>

            {/* ═══════════════════════════════════
                CATEGORY NAV (sticky bajo el header)
            ═══════════════════════════════════ */}
            {activeCategories.length > 0 && (
                <div
                    className="relative z-20 shrink-0"
                    style={{ background: `${bg}f5`, backdropFilter: 'blur(16px)' }}
                >
                    <div
                        ref={navRef}
                        className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2.5"
                    >
                        {activeCategories.map((cat, idx) => {
                            const isActive = activeIndex === idx;
                            return (
                                <button
                                    key={cat.id}
                                    ref={el => { navItemRefs.current[idx] = el; }}
                                    onClick={() => goToIndex(idx)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full font-manrope font-semibold text-sm transition-all duration-200 whitespace-nowrap`}
                                    style={isActive
                                        ? { backgroundColor: accent, color: '#fff', boxShadow: `0 4px 14px ${accent}55` }
                                        : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(228,190,181,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
                                    }
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Dot indicators */}
                    {activeCategories.length > 1 && (
                        <div className="flex justify-center gap-1.5 pb-2.5">
                            {activeCategories.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToIndex(idx)}
                                    className="rounded-full transition-all duration-300"
                                    style={{
                                        width: activeIndex === idx ? '20px' : '6px',
                                        height: '6px',
                                        backgroundColor: activeIndex === idx ? accent : 'rgba(255,255,255,0.2)',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════
                SLIDER HORIZONTAL DE CATEGORÍAS
            ═══════════════════════════════════ */}
            <div
                ref={sliderRef}
                className="relative z-10 flex-1 flex overflow-x-auto hide-scrollbar snap-slider"
                style={{ minHeight: 0 }}
            >
                {activeCategories.length === 0 ? (
                    <div className="w-full flex items-center justify-center text-[#e4beb5]/40 font-manrope text-sm p-8 text-center snap-slide shrink-0">
                        Agrega categorías y productos desde el panel de administración.
                    </div>
                ) : (
                    activeCategories.map((category, catIndex) => (
                        /* ── Slide: una categoría ── */
                        <div
                            key={category.id}
                            ref={el => { slideRefs.current[catIndex] = el; }} // Vinculamos la referencia
                            data-index={catIndex}                             // Asignamos el índice para el Observer
                            className="snap-slide shrink-0 w-full overflow-y-auto hide-scrollbar"
                            style={{ minHeight: 0 }}
                        >
                            <div className={`px-4 py-4 space-y-3 ${isPreview ? 'max-w-full' : 'max-w-2xl mx-auto'} pb-36`}>

                                {/* Contador de items */}
                                <p className="font-manrope text-[10px] uppercase tracking-widest px-1" style={{ color: subtextColor }}>
                                    {category.products.length} {category.products.length === 1 ? 'producto' : 'productos'}
                                </p>

                                {/* Productos */}
                                {category.products.map((product, prodIndex) => {
                                    const isHero = catIndex === 0 && prodIndex === 0 && !isPreview && showImages && !!product.imageUrl;

                                    if (isHero) {
                                        // ── HERO CARD (primer producto de primera categoría) ──
                                        return (
                                            <article
                                                key={product.id}
                                                className="relative rounded-2xl overflow-hidden mb-2"
                                                style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 4px 20px ${accent}22` }}
                                            >
                                                {showImages && product.imageUrl ? (
                                                    <div className="relative h-52 overflow-hidden">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={product.imageUrl!}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/60" />
                                                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                                                            <div>
                                                                <h3 className="font-epilogue font-black text-white text-xl leading-tight">
                                                                    {product.name}
                                                                </h3>
                                                                <p className="font-manrope font-bold text-lg mt-0.5" style={{ color: accent }}>
                                                                    ${product.price.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0">
                                                                <AddToCartButton
                                                                    product={product}
                                                                    themeColor={accent}
                                                                    onConfigure={() => setActiveConfigProduct(product)}
                                                                    forceNotesModal={store.forceNotesModal}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 flex items-center justify-between gap-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-epilogue font-black text-xl leading-tight" style={{ color: textColor }}>{product.name}</h3>
                                                            <p className="font-manrope font-bold text-lg mt-0.5" style={{ color: accent }}>${product.price.toFixed(2)}</p>
                                                        </div>
                                                        <div className="shrink-0">
                                                            <AddToCartButton
                                                                product={product}
                                                                themeColor={accent}
                                                                onConfigure={() => setActiveConfigProduct(product)}
                                                                forceNotesModal={store.forceNotesModal}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {product.description && (
                                                    <div className="px-4 py-3 bg-white/[0.03]">
                                                        <p className="font-manrope text-xs leading-relaxed line-clamp-2" style={{ color: subtextColor }}>
                                                            {product.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    }

                                    // ── COMPACT CARD ──
                                    return (
                                        <article
                                            key={product.id}
                                            className="flex items-center gap-3 rounded-2xl p-3 transition-all duration-200"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                        >
                                            {/* Imagen */}
                                            {showImages && (
                                                product.imageUrl ? (
                                                    <div className="w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-[72px] h-[72px] shrink-0 rounded-xl flex items-center justify-center text-2xl"
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                                                    >
                                                        🍽️
                                                    </div>
                                                )
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-epilogue font-bold text-sm leading-tight" style={{ color: textColor }}>
                                                    {product.name}
                                                </h3>
                                                {product.description && (
                                                    <p className="font-manrope text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: subtextColor }}>
                                                        {product.description}
                                                    </p>
                                                )}
                                                <p className="font-manrope font-bold text-sm mt-1.5" style={{ color: accent }}>
                                                    ${product.price.toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Botón + */}
                                            <div className="shrink-0">
                                                {isPreview ? (
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: accent }}
                                                    >
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <AddToCartButton
                                                        product={product}
                                                        themeColor={accent}
                                                        onConfigure={() => setActiveConfigProduct(product)}
                                                        forceNotesModal={store.forceNotesModal}
                                                    />
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}

                                {/* Flechas de navegación entre categorías (solo si hay más de 1) */}
                                {activeCategories.length > 1 && !isPreview && (
                                    <div className="flex gap-3 pt-4 justify-center">
                                        {catIndex > 0 && (
                                            <button
                                                onClick={() => goToIndex(catIndex - 1)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-manrope text-sm font-semibold hover:text-white transition-colors"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: subtextColor }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                {activeCategories[catIndex - 1].name}
                                            </button>
                                        )}
                                        {catIndex < activeCategories.length - 1 && (
                                            <button
                                                onClick={() => goToIndex(catIndex + 1)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-manrope text-sm font-semibold text-white transition-colors ml-auto"
                                                style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
                                            >
                                                {activeCategories[catIndex + 1].name}
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Product Configurator Modal (Global) */}
            {activeConfigProduct && (
                <ProductConfiguratorModal
                    product={activeConfigProduct}
                    themeColor={accent}
                    isOpen={!!activeConfigProduct}
                    onClose={() => setActiveConfigProduct(null)}
                />
            )}

            {/* Floating Cart */}
            {!isPreview && (
                <FloatingCart
                    storeName={store.name}
                    whatsapp={store.whatsapp}
                    themeColor={accent}
                    whatsappHeader={store.whatsappHeader}
                    whatsappFooter={store.whatsappFooter}
                    enableDelivery={store.enableDelivery ?? true}
                    enablePickup={store.enablePickup ?? true}
                    enableDineIn={store.enableDineIn ?? false}
                    upsellCategory={upsellCategory}
                    onConfigureUpsellProduct={(product) => setActiveConfigProduct(product)}
                />
            )}

        </div>
    );
}
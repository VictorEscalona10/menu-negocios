// app/components/SharedMenuUI.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore } from '@/src/store/cartStore'
import AddToCartButton from '../menu/[slug]/AddToCartButton'
import FloatingCart from '../menu/[slug]/components/FloatingCart'
import ProductConfiguratorModal from '../menu/[slug]/components/ProductConfiguratorModal'

interface SharedMenuUIProps {
    store: {
        id: string;
        name: string;
        whatsapp: string;
        whatsappHeader?: string;
        whatsappFooter?: string;
        backgroundColor: string;
        themeColor: string;
        logoUrl?: string | null;
        bannerUrl?: string | null;
        menuLayout?: string;
        buttonTextColor?: string;
        instagramUrl?: string | null;
        tiktokUrl?: string | null;
        googleMapsUrl?: string | null;
        enableDelivery?: boolean;
        enablePickup?: boolean;
        enableDineIn?: boolean;
        showProductImages?: boolean;
        forceNotesModal?: boolean;
        requireCedula?: boolean;
        textColor?: string;
        subtextColor?: string;
        fontHeading?: string;
        fontBody?: string;
        upsellCategoryId?: string | null;
        cardBackgroundColor?: string;
        deliveryZones?: Array<{ id: string; name: string; price: number }>;
        categories: Array<{
            id: string;
            name: string;
            products: Array<{
                id: string;
                name: string;
                description: string | null;
                price: number;
                imageUrl: string | null;
                isCombo?: boolean;
                comboBadge?: string | null;
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
    const buttonTextColor = store.buttonTextColor || '#ffffff';
    const showImages = store.showProductImages ?? true;
    const textColor = store.textColor || '#e5e2e1';
    const subtextColor = store.subtextColor || '#e4beb5';
    const fontHeading = store.fontHeading || 'Epilogue';
    const fontBody = store.fontBody || 'Manrope';
    const cardBg = store.cardBackgroundColor || 'rgba(255,255,255,0.05)';
    const layout = (store.menuLayout || 'LIST').toUpperCase();

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
    const addItem = useCartStore((state) => state.addItem);

    // ── Acción al tocar un producto (contenedor o botón) ──
    const handleProductAction = useCallback((product: any) => {
        if (isPreview) return;

        const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
        if (store.forceNotesModal || hasModifiers) {
            setActiveConfigProduct(product);
        } else {
            addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
            });
        }
    }, [isPreview, store.forceNotesModal, addItem]);

    // Refs para el slider y el nav (Modo LIST)
    const sliderRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrollingProgrammatically = useRef(false);

    // ── Scroll el slider al índice en modo LIST o cambio de filtro ──
    const goToIndex = useCallback((index: number) => {
        setActiveIndex(index);

        if (layout === 'LIST') {
            isScrollingProgrammatically.current = true;
            const slide = slideRefs.current[index];
            if (slide) {
                slide.scrollIntoView({ inline: 'start', behavior: 'smooth', block: 'nearest' });
            }
            const navBtn = navItemRefs.current[index];
            if (navBtn && navRef.current) {
                navBtn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
            }
            setTimeout(() => { isScrollingProgrammatically.current = false; }, 500);
        } else {
            // En LINKTREE o GRID, centramos el nav pill
            const navBtn = navItemRefs.current[index];
            if (navBtn && navRef.current) {
                navBtn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [layout]);

    // ── IntersectionObserver para el slider horizontal (solo en layout LIST) ──
    useEffect(() => {
        if (layout !== 'LIST') return;
        const slider = sliderRef.current;
        if (!slider || isPreview) return;

        const observer = new IntersectionObserver((entries) => {
            if (isScrollingProgrammatically.current) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.getAttribute('data-index'));
                    if (!isNaN(idx) && idx !== activeIndex) {
                        setActiveIndex(idx);
                        const navBtn = navItemRefs.current[idx];
                        if (navBtn && navRef.current) {
                            navBtn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
                        }
                    }
                }
            });
        }, {
            root: slider,
            threshold: 0.6
        });

        const currentSlides = slideRefs.current;
        currentSlides.forEach(slide => {
            if (slide) observer.observe(slide);
        });

        return () => {
            currentSlides.forEach(slide => {
                if (slide) observer.unobserve(slide);
            });
        };
    }, [activeIndex, isPreview, activeCategories.length, layout]);

    const currentCategory = activeCategories[activeIndex] || activeCategories[0];

    return (
        <div
            className={`relative font-sans selection:bg-white/20 flex flex-col ${isPreview ? 'w-full h-full overflow-y-auto' : 'h-screen overflow-hidden'}`}
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
                BANNER SUPERIOR (Si existe)
            ═══════════════════════════════════ */}
            {store.bannerUrl && (
                <div className={`relative w-full shrink-0 overflow-hidden ${isPreview ? 'h-24' : 'h-36 md:h-44'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={store.bannerUrl}
                        alt="Portada"
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(to bottom, transparent 40%, ${bg} 100%)`
                        }}
                    />
                </div>
            )}

            {/* ═══════════════════════════════════
                HEADER (Perfil estilo Linktree / Logo / Redes)
            ═══════════════════════════════════ */}
            <header
                className={`relative z-20 shrink-0 flex flex-col items-center text-center ${store.bannerUrl ? (isPreview ? '-mt-8 pb-3 px-4' : '-mt-12 pb-5 px-6') : (isPreview ? 'pt-6 pb-3 px-4' : 'pt-8 pb-5 px-6')}`}
            >
                {/* Logo */}
                {store.logoUrl ? (
                    <div
                        className={`${isPreview ? 'w-14 h-14 mb-2' : 'w-20 h-20 mb-3'} rounded-full overflow-hidden ring-4 ring-black/40 shadow-xl shrink-0 transition-transform duration-300 hover:scale-105`}
                        style={{ boxShadow: `0 8px 24px ${accent}44` }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div
                        className={`${isPreview ? 'w-14 h-14 mb-2 text-2xl' : 'w-20 h-20 mb-3 text-3xl'} rounded-full ring-4 ring-black/30 flex items-center justify-center shrink-0 shadow-lg`}
                        style={{ backgroundColor: `${accent}25`, boxShadow: `0 8px 24px ${accent}44` }}
                    >
                        🍽️
                    </div>
                )}

                {/* Store name */}
                <h1
                    className={`font-epilogue font-black tracking-tight ${isPreview ? 'text-lg' : 'text-2xl md:text-3xl'} leading-tight mb-1`}
                    style={{ color: textColor }}
                >
                    {store.name || 'Tu Negocio'}
                </h1>
                <p className="font-manrope text-[11px] tracking-widest uppercase font-medium" style={{ color: subtextColor }}>
                    Menú Digital · Pedido Online
                </p>

                {/* Redes Sociales y Ubicación (Estilo Linktree) */}
                {(store.instagramUrl || store.tiktokUrl || store.googleMapsUrl) && (
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {store.instagramUrl && (
                            <a
                                href={store.instagramUrl.startsWith('http') ? store.instagramUrl : `https://instagram.com/${store.instagramUrl.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-transform hover:scale-105 active:scale-95 shadow-sm"
                                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: textColor, border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                <span>Instagram</span>
                            </a>
                        )}
                        {store.tiktokUrl && (
                            <a
                                href={store.tiktokUrl.startsWith('http') ? store.tiktokUrl : `https://tiktok.com/@${store.tiktokUrl.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-transform hover:scale-105 active:scale-95 shadow-sm"
                                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: textColor, border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                                <span>TikTok</span>
                            </a>
                        )}
                        {store.googleMapsUrl && (
                            <a
                                href={store.googleMapsUrl.startsWith('http') ? store.googleMapsUrl : `https://maps.google.com/?q=${encodeURIComponent(store.googleMapsUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-transform hover:scale-105 active:scale-95 shadow-sm"
                                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: textColor, border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2 shrink-0" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Ubicación</span>
                            </a>
                        )}
                    </div>
                )}

                <div className="w-10 h-1 rounded-full mt-3" style={{ backgroundColor: accent }} />
            </header>

            {/* ═══════════════════════════════════
                CATEGORY NAV (Pills de categorías)
            ═══════════════════════════════════ */}
            {activeCategories.length > 0 && (
                <div
                    className="relative z-20 shrink-0"
                    style={{ background: `${bg}f0`, backdropFilter: 'blur(16px)' }}
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
                                    className={`shrink-0 px-4 py-1.5 rounded-full font-manrope font-semibold text-xs transition-all duration-200 whitespace-nowrap active:scale-95`}
                                    style={isActive
                                        ? { backgroundColor: accent, color: buttonTextColor, boxShadow: `0 4px 14px ${accent}55` }
                                        : { backgroundColor: 'rgba(255,255,255,0.06)', color: subtextColor, border: '1px solid rgba(255,255,255,0.08)' }
                                    }
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════
                LAYOUT 1: LINKTREE (Estilo botones anchos tipo Linktree)
            ═══════════════════════════════════ */}
            {layout === 'LINKTREE' && (
                <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 max-w-lg mx-auto w-full pb-32">
                    {activeCategories.length === 0 ? (
                        <div className="text-center py-12 text-sm font-manrope opacity-60" style={{ color: subtextColor }}>
                            No hay productos disponibles por el momento.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Mostramos la categoría activa seleccionada */}
                            <div className="flex items-center justify-between px-1">
                                <h2 className="font-epilogue font-black text-base uppercase tracking-wider" style={{ color: textColor }}>
                                    {currentCategory.name}
                                </h2>
                                <span className="font-manrope text-xs font-semibold opacity-70" style={{ color: subtextColor }}>
                                    {currentCategory.products.length} {currentCategory.products.length === 1 ? 'ítem' : 'ítems'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {currentCategory.products.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductAction(product)}
                                        className={`group relative w-full p-3 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer active:scale-[0.98] hover:shadow-lg ${product.isCombo ? 'ring-2' : 'border'}`}
                                        style={{
                                            backgroundColor: cardBg,
                                            borderColor: product.isCombo ? accent : 'rgba(255,255,255,0.08)',
                                            boxShadow: product.isCombo ? `0 8px 24px ${accent}25` : undefined
                                        }}
                                    >
                                        {/* Combo Badge */}
                                        {product.isCombo && (
                                            <span
                                                className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm z-10"
                                                style={{ backgroundColor: accent, color: buttonTextColor }}
                                            >
                                                ⭐ {product.comboBadge || 'Combo'}
                                            </span>
                                        )}

                                        {/* Miniatura / Icono */}
                                        {showImages && product.imageUrl ? (
                                            <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-sm bg-black/20">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                        ) : (
                                            <div
                                                className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: `${accent}15`, color: accent }}
                                            >
                                                ✨
                                            </div>
                                        )}

                                        {/* Contenido principal */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <h3 className="font-epilogue font-bold text-sm leading-snug line-clamp-1" style={{ color: textColor }}>
                                                {product.name}
                                            </h3>
                                            {product.description && (
                                                <p className="font-manrope text-xs mt-0.5 line-clamp-1 leading-normal" style={{ color: subtextColor }}>
                                                    {product.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-manrope font-extrabold text-sm" style={{ color: accent }}>
                                                    ${product.price.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Botón de acción rápida */}
                                        <div className="shrink-0">
                                            {isPreview ? (
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                                                    style={{ backgroundColor: accent, color: buttonTextColor }}
                                                >
                                                    +
                                                </div>
                                            ) : (
                                                <AddToCartButton
                                                    product={product}
                                                    themeColor={accent}
                                                    buttonTextColor={buttonTextColor}
                                                    onConfigure={() => setActiveConfigProduct(product)}
                                                    forceNotesModal={store.forceNotesModal}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════
                LAYOUT 2: GRID (Cuadrícula de 2 columnas)
            ═══════════════════════════════════ */}
            {layout === 'GRID' && (
                <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 max-w-xl mx-auto w-full pb-32">
                    {activeCategories.length === 0 ? (
                        <div className="text-center py-12 text-sm font-manrope opacity-60" style={{ color: subtextColor }}>
                            No hay productos disponibles por el momento.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="font-epilogue font-black text-base uppercase tracking-wider" style={{ color: textColor }}>
                                    {currentCategory.name}
                                </h2>
                                <span className="font-manrope text-xs font-semibold opacity-70" style={{ color: subtextColor }}>
                                    {currentCategory.products.length} {currentCategory.products.length === 1 ? 'ítem' : 'ítems'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {currentCategory.products.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductAction(product)}
                                        className="group rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer hover:shadow-lg relative"
                                        style={{
                                            backgroundColor: cardBg,
                                            borderColor: product.isCombo ? accent : 'rgba(255,255,255,0.08)',
                                            boxShadow: product.isCombo ? `0 6px 20px ${accent}22` : undefined
                                        }}
                                    >
                                        {/* Combo Badge */}
                                        {product.isCombo && (
                                            <span
                                                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm z-10"
                                                style={{ backgroundColor: accent, color: buttonTextColor }}
                                            >
                                                ⭐ {product.comboBadge || 'Combo'}
                                            </span>
                                        )}

                                        {/* Imagen */}
                                        {showImages && product.imageUrl ? (
                                            <div className="w-full h-28 relative overflow-hidden bg-black/20">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                        ) : null}

                                        {/* Detalle */}
                                        <div className="p-3 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-epilogue font-bold text-xs leading-snug line-clamp-2" style={{ color: textColor }}>
                                                    {product.name}
                                                </h3>
                                                {product.description && (
                                                    <p className="font-manrope text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: subtextColor }}>
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                                                <span className="font-manrope font-extrabold text-sm" style={{ color: accent }}>
                                                    ${product.price.toFixed(2)}
                                                </span>
                                                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                                    {isPreview ? (
                                                        <div
                                                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm"
                                                            style={{ backgroundColor: accent, color: buttonTextColor }}
                                                        >
                                                            +
                                                        </div>
                                                    ) : (
                                                        <AddToCartButton
                                                            product={product}
                                                            themeColor={accent}
                                                            buttonTextColor={buttonTextColor}
                                                            onConfigure={() => setActiveConfigProduct(product)}
                                                            forceNotesModal={store.forceNotesModal}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════
                LAYOUT 3: LIST (Clásico slider horizontal por categorías)
            ═══════════════════════════════════ */}
            {layout === 'LIST' && (
                <div
                    ref={sliderRef}
                    className="relative z-10 flex-1 flex overflow-x-auto hide-scrollbar snap-slider"
                    style={{ minHeight: 0 }}
                >
                    {activeCategories.length === 0 ? (
                        <div className="w-full flex items-center justify-center font-manrope text-sm p-8 text-center snap-slide shrink-0 opacity-60" style={{ color: subtextColor }}>
                            Agrega categorías y productos desde el panel de administración.
                        </div>
                    ) : (
                        activeCategories.map((category, catIndex) => (
                            <div
                                key={category.id}
                                ref={el => { slideRefs.current[catIndex] = el; }}
                                data-index={catIndex}
                                className="snap-slide shrink-0 w-full overflow-y-auto hide-scrollbar"
                                style={{ minHeight: 0 }}
                            >
                                <div className={`px-4 py-4 space-y-3 ${isPreview ? 'max-w-full' : 'max-w-2xl mx-auto'} pb-36`}>
                                    <p className="font-manrope text-[10px] uppercase tracking-widest px-1" style={{ color: subtextColor }}>
                                        {category.products.length} {category.products.length === 1 ? 'producto' : 'productos'}
                                    </p>

                                    {category.products.map((product) => (
                                        <article
                                            key={product.id}
                                            onClick={() => handleProductAction(product)}
                                            className={`flex items-center gap-3 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.97] hover:bg-white/[0.02] relative ${product.isCombo ? 'ring-1 ring-white/10 mt-3 p-4' : 'p-3'}`}
                                            style={{
                                                backgroundColor: cardBg,
                                                border: product.isCombo ? `2px solid ${accent}66` : `1px solid ${accent}22`,
                                                boxShadow: product.isCombo ? `0 4px 20px ${accent}22` : undefined,
                                            }}
                                        >
                                            {product.isCombo && (
                                                <span
                                                    className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider z-10 shadow-sm"
                                                    style={{ backgroundColor: accent, color: buttonTextColor }}
                                                >
                                                    ⭐ {product.comboBadge || 'Combo'}
                                                </span>
                                            )}

                                            {showImages && product.imageUrl && (
                                                <div className="w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden shadow-sm bg-black/20">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

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

                                            <div className="shrink-0">
                                                {isPreview ? (
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                                                        style={{ backgroundColor: accent, color: buttonTextColor }}
                                                    >
                                                        +
                                                    </div>
                                                ) : (
                                                    <AddToCartButton
                                                        product={product}
                                                        themeColor={accent}
                                                        buttonTextColor={buttonTextColor}
                                                        onConfigure={() => setActiveConfigProduct(product)}
                                                        forceNotesModal={store.forceNotesModal}
                                                    />
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Product Configurator Modal (Global) */}
            {activeConfigProduct && (
                <ProductConfiguratorModal
                    product={activeConfigProduct}
                    themeColor={accent}
                    buttonTextColor={buttonTextColor}
                    isOpen={!!activeConfigProduct}
                    onClose={() => setActiveConfigProduct(null)}
                />
            )}

            {/* Floating Cart */}
            {!isPreview && (
                <FloatingCart
                    storeId={store.id}
                    storeName={store.name}
                    whatsapp={store.whatsapp}
                    themeColor={accent}
                    buttonTextColor={buttonTextColor}
                    whatsappHeader={store.whatsappHeader}
                    whatsappFooter={store.whatsappFooter}
                    enableDelivery={store.enableDelivery ?? true}
                    enablePickup={store.enablePickup ?? true}
                    enableDineIn={store.enableDineIn ?? false}
                    requireCedula={store.requireCedula ?? true}
                    upsellCategory={upsellCategory}
                    onConfigureUpsellProduct={(product) => setActiveConfigProduct(product)}
                    deliveryZones={store.deliveryZones ?? []}
                />
            )}

        </div>
    );
}
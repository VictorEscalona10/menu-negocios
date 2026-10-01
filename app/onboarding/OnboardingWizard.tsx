// app/onboarding/OnboardingWizard.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import SharedMenuUI from '@/app/components/SharedMenuUI'
import { MENU_TEMPLATES, MenuTemplate } from '@/app/dashboard/settings/SettingsForm'
import { createStoreFromOnboarding } from '@/src/actions/onboarding'
import Link from 'next/link'

interface OnboardingWizardProps {
    userEmail?: string;
}

export default function OnboardingWizard({ userEmail }: OnboardingWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isPending, startTransition] = useTransition()
    const [errorMessage, setErrorMessage] = useState('')

    // Form state
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [initialCategory, setInitialCategory] = useState('')

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate>(MENU_TEMPLATES[0])
    const [menuLayout, setMenuLayout] = useState<'LINKTREE' | 'GRID' | 'LIST'>('LINKTREE')

    // Socials
    const [instagramUrl, setInstagramUrl] = useState('')
    const [tiktokUrl, setTiktokUrl] = useState('')
    const [googleMapsUrl, setGoogleMapsUrl] = useState('')

    // Logo
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    // Actualiza slug automáticamente al escribir el nombre
    const handleNameChange = (val: string) => {
        setName(val)
        const autoSlug = val
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        setSlug(autoSlug)
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const applyTemplate = (tmpl: MenuTemplate) => {
        setSelectedTemplate(tmpl)
        setMenuLayout(tmpl.menuLayout)
    }

    // Validación por pasos
    const handleNext = () => {
        setErrorMessage('')
        if (step === 1) {
            if (!name.trim()) {
                setErrorMessage('Ingresa el nombre de tu negocio.')
                return
            }
            if (!whatsapp.trim()) {
                setErrorMessage('Ingresa el número de WhatsApp para pedidos.')
                return
            }
        }
        setStep(prev => Math.min(prev + 1, 4))
    }

    const handleBack = () => {
        setErrorMessage('')
        setStep(prev => Math.max(prev - 1, 1))
    }

    // Submit final
    const handleFinish = () => {
        setErrorMessage('')
        startTransition(async () => {
            try {
                const fd = new FormData()
                fd.set('name', name.trim())
                fd.set('slug', slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'))
                fd.set('whatsapp', whatsapp.trim())
                fd.set('backgroundColor', selectedTemplate.backgroundColor)
                fd.set('cardBackgroundColor', selectedTemplate.cardBackgroundColor)
                fd.set('themeColor', selectedTemplate.themeColor)
                fd.set('textColor', selectedTemplate.textColor)
                fd.set('subtextColor', selectedTemplate.subtextColor)
                fd.set('buttonTextColor', selectedTemplate.buttonTextColor)
                fd.set('fontHeading', selectedTemplate.fontHeading)
                fd.set('fontBody', selectedTemplate.fontBody)
                fd.set('menuLayout', menuLayout)
                fd.set('instagramUrl', instagramUrl.trim())
                fd.set('tiktokUrl', tiktokUrl.trim())
                fd.set('googleMapsUrl', googleMapsUrl.trim())
                fd.set('initialCategory', initialCategory.trim())

                if (logoFile) {
                    fd.set('logo', logoFile)
                }

                const result = await createStoreFromOnboarding(fd)
                if (result.success) {
                    router.push('/dashboard')
                }
            } catch (err: any) {
                setErrorMessage(err.message || 'Ocurrió un error al crear tu menú.')
            }
        })
    }

    // Mock store para el Live Preview en tiempo real
    const mockStore = {
        id: 'preview-store',
        name: name.trim() || 'Tu Negocio',
        whatsapp: whatsapp.trim() || '584141234567',
        backgroundColor: selectedTemplate.backgroundColor,
        cardBackgroundColor: selectedTemplate.cardBackgroundColor,
        themeColor: selectedTemplate.themeColor,
        textColor: selectedTemplate.textColor,
        subtextColor: selectedTemplate.subtextColor,
        buttonTextColor: selectedTemplate.buttonTextColor,
        fontHeading: selectedTemplate.fontHeading,
        fontBody: selectedTemplate.fontBody,
        menuLayout: menuLayout,
        logoUrl: logoPreview,
        instagramUrl: instagramUrl.trim() || null,
        tiktokUrl: tiktokUrl.trim() || null,
        googleMapsUrl: googleMapsUrl.trim() || null,
        categories: [
            {
                id: 'cat-1',
                name: initialCategory.trim() || 'Platos Estrella',
                products: [
                    {
                        id: 'p-1',
                        name: 'Hamburguesa Especial',
                        description: 'Carne Angus 200g, queso cheddar fundido y salsa secreta.',
                        price: 12.50,
                        imageUrl: null,
                        isCombo: true,
                        comboBadge: 'Más Vendido',
                    },
                    {
                        id: 'p-2',
                        name: 'Papas Rústicas',
                        description: 'Con sal marina, romero y dip artesanal.',
                        price: 5.00,
                        imageUrl: null,
                    }
                ]
            }
        ]
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
            {/* Top Bar con Logo Oficial de la Landing */}
            <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                        K
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-[#1D1D1F]">
                        komy<span className="text-[#FF453A]">.</span>
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-mono">Paso {step} de 4</span>
                    <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-zinc-900 transition-all duration-300 rounded-full"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Contenedor Principal (Estilo Dashboard de Administrador) */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-8 items-start">

                {/* Lado Izquierdo: Pasos en Tarjeta Blanca con Bordes Rectos */}
                <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col justify-between">
                    <div>
                        {/* Step indicator chips */}
                        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
                            {[
                                { num: 1, label: 'Negocio' },
                                { num: 2, label: 'Diseño & Estilo' },
                                { num: 3, label: 'Logo & Redes' },
                                { num: 4, label: 'Primer Plato' },
                            ].map((s) => (
                                <button
                                    key={s.num}
                                    type="button"
                                    onClick={() => {
                                        if (s.num < step) setStep(s.num)
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${step === s.num
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : s.num < step
                                            ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                                            : 'bg-zinc-50 text-zinc-400 border border-zinc-200'
                                        }`}
                                >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s.num ? 'bg-white/20' : ''}`}>
                                        {s.num < step ? '✓' : s.num}
                                    </span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Error Alert */}
                        {errorMessage && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* ── PASO 1: Identidad del Negocio ── */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="border-b border-zinc-100 pb-4">
                                    <div className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-1">Paso 1</div>
                                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
                                        Apertura de Menú Digital
                                    </h1>
                                    <p className="text-zinc-500 text-sm">
                                        Ingresa los datos iniciales de tu marca para recibir pedidos por WhatsApp.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
                                            Nombre del Local *
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="Ej: Burgers Carlos"
                                            className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-xs"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
                                            Enlace de Menú Público (Bio de Redes)
                                        </label>
                                        <div className="flex items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3 text-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all">
                                            <span className="text-zinc-400 font-mono text-xs select-none">komy.app/menu/</span>
                                            <input
                                                type="text"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                placeholder="tu-local"
                                                className="bg-transparent border-0 outline-none text-zinc-900 font-mono font-medium text-sm ml-0.5 flex-1"
                                            />
                                        </div>
                                        <p className="text-[11px] text-zinc-400 mt-1 font-mono">Este será el enlace que colocarás en tu bio de Instagram o TikTok.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
                                            WhatsApp Receptor *
                                        </label>
                                        <input
                                            type="text"
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            placeholder="Ej: 584141234567"
                                            className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-mono shadow-xs"
                                        />
                                        <p className="text-[11px] text-zinc-400 mt-1 font-mono">Incluir código de país sin el +</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PASO 2: Plantillas y Layout ── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="border-b border-zinc-100 pb-4">
                                    <div className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-1">Paso 2</div>
                                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
                                        Personalización Visual
                                    </h1>
                                    <p className="text-zinc-500 text-sm">
                                        Selecciona la plantilla inicial y la forma en que se desplegará tu menú.
                                    </p>
                                </div>

                                {/* Plantillas */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 font-medium">
                                        Plantillas Prediseñadas
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {MENU_TEMPLATES.map((tmpl) => {
                                            const isSelected = selectedTemplate.id === tmpl.id;
                                            return (
                                                <button
                                                    key={tmpl.id}
                                                    type="button"
                                                    onClick={() => applyTemplate(tmpl)}
                                                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${isSelected
                                                        ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-sm'
                                                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xl">{tmpl.emoji}</span>
                                                            <div className="flex -space-x-1">
                                                                <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: tmpl.backgroundColor }} />
                                                                <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: tmpl.themeColor }} />
                                                            </div>
                                                        </div>
                                                        <p className="font-bold text-xs text-zinc-900 leading-tight">{tmpl.name}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{tmpl.description}</p>
                                                    </div>

                                                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                                                        <span className="text-zinc-400 font-mono text-[9px] uppercase">{tmpl.menuLayout}</span>
                                                        {isSelected && <span className="text-zinc-900 font-bold">✓ Seleccionado</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Layout Selector */}
                                <div className="space-y-3 pt-2">
                                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 font-medium">
                                        Estructura del Menú
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setMenuLayout('LINKTREE')}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${menuLayout === 'LINKTREE'
                                                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-sm'
                                                : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base">🌿</span>
                                                <span className="font-bold text-xs text-zinc-900">Estilo Linktree</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500">Botones táctiles anchos optimizados para bio de Instagram.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setMenuLayout('GRID')}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${menuLayout === 'GRID'
                                                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-sm'
                                                : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base">📱</span>
                                                <span className="font-bold text-xs text-zinc-900">Cuadrícula</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500">2 columnas tipo catálogo con fotos grandes.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setMenuLayout('LIST')}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${menuLayout === 'LIST'
                                                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-sm'
                                                : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base">📋</span>
                                                <span className="font-bold text-xs text-zinc-900">Lista Clásica</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500">Slider horizontal con deslizamiento por categorías.</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PASO 3: Logo & Redes Sociales ── */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="border-b border-zinc-100 pb-4">
                                    <div className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-1">Paso 3</div>
                                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
                                        Logo y Canales Sociales
                                    </h1>
                                    <p className="text-zinc-500 text-sm">
                                        Sube el logotipo de tu marca e ingresa los enlaces de tus perfiles oficiales.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Logo upload */}
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
                                            Logotipo del Negocio (Opcional)
                                        </label>
                                        <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl">🍽️</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
                                                />
                                                <p className="text-[10px] text-zinc-400 mt-1 font-mono">PNG, JPG o WEBP (máx 2MB).</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Redes Sociales */}
                                    <div className="space-y-3 pt-2">
                                        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 font-medium">
                                            Enlaces de Biografía (Estilo Linktree)
                                        </label>

                                        <div>
                                            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all">
                                                <span className="text-zinc-400 text-xs mr-2 font-medium font-mono">Instagram:</span>
                                                <input
                                                    type="text"
                                                    value={instagramUrl}
                                                    onChange={(e) => setInstagramUrl(e.target.value)}
                                                    placeholder="https://instagram.com/tu_negocio"
                                                    className="bg-transparent border-0 outline-none text-zinc-900 text-xs flex-1 placeholder-zinc-400"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all">
                                                <span className="text-zinc-400 text-xs mr-2 font-medium font-mono">TikTok:</span>
                                                <input
                                                    type="text"
                                                    value={tiktokUrl}
                                                    onChange={(e) => setTiktokUrl(e.target.value)}
                                                    placeholder="https://tiktok.com/@tu_negocio"
                                                    className="bg-transparent border-0 outline-none text-zinc-900 text-xs flex-1 placeholder-zinc-400"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all">
                                                <span className="text-zinc-400 text-xs mr-2 font-medium font-mono">Google Maps:</span>
                                                <input
                                                    type="text"
                                                    value={googleMapsUrl}
                                                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                                    placeholder="Enlace de tu ubicación en Maps"
                                                    className="bg-transparent border-0 outline-none text-zinc-900 text-xs flex-1 placeholder-zinc-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PASO 4: Tu Primera Categoría ── */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="border-b border-zinc-100 pb-4">
                                    <div className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-1">Paso 4</div>
                                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
                                        Crear Primera Categoría
                                    </h1>
                                    <p className="text-zinc-500 text-sm">
                                        Define el nombre de tu sección inicial de productos. Podrás agregar más en el panel.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
                                            Nombre de la Categoría *
                                        </label>
                                        <input
                                            type="text"
                                            value={initialCategory}
                                            onChange={(e) => setInitialCategory(e.target.value)}
                                            placeholder="Ej: Hamburguesas, Pizzas, Bebidas"
                                            className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-xs"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Sugerencias rápidas */}
                                    <div>
                                        <p className="text-[11px] text-zinc-400 mb-2 font-mono uppercase tracking-wider">O toca una sugerencia rápida:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['🍔 Hamburguesas', '🍕 Pizzas', '☕ Café & Bebidas', '🥗 Bowls & Ensaladas', '🍰 Postres', '🌮 Tacos & Antojitos'].map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setInitialCategory(item.replace(/^[^\s]+\s/, ''))}
                                                    className="px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-xs text-zinc-700 font-medium transition-colors"
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 leading-relaxed font-mono">
                                        Al hacer clic en <strong>Registrar Local</strong>, tu menú quedará activo y entrarás directamente a tu panel de administración.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones de Navegación Inferior */}
                    <div className="pt-8 mt-8 border-t border-zinc-100 flex items-center justify-between gap-4">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isPending}
                                className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-medium transition-all"
                            >
                                ← Atrás
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm ml-auto"
                            >
                                <span>Continuar</span>
                                <span className="font-mono text-xs">↵</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinish}
                                disabled={isPending}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 ml-auto"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Registrando local...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Registrar Local</span>
                                        <span className="font-mono text-xs">↵</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Lado Derecho: Mockup Móvil en Vivo */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col items-center justify-center sticky lg:top-24">
                    <div className="mb-4 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                            Vista Previa
                        </span>
                        <p className="text-xs text-zinc-500 mt-0.5">Así verán tus clientes tu menú en su teléfono</p>
                    </div>

                    {/* Phone Frame */}
                    <div className="relative mx-auto w-[320px] h-[620px] bg-black rounded-[3rem] border-[8px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col shrink-0 ring-1 ring-zinc-950/10">
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-0 inset-x-0 w-28 h-5 bg-zinc-900 mx-auto rounded-b-2xl z-50 pointer-events-none flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-black ring-1 ring-white/10" />
                        </div>

                        {/* Contenido del Menú en Vivo */}
                        <div className="w-full h-full relative overflow-hidden">
                            <SharedMenuUI store={mockStore} isPreview={true} />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}

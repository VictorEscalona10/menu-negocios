"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  DollarSign,
  Globe,
  Layers,
  MessageCircle,
  QrCode,
  Smartphone,
  Sparkles,
  Zap,
  Plus,
  Minus,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ChevronDown
} from "lucide-react";

export default function HomePage() {
  // --- States for Interactive Hero Device Simulator ---
  const [activeDeviceTab, setActiveDeviceTab] = useState<"client" | "business">("client");
  const [selectedCategory, setSelectedCategory] = useState<"populares" | "hamburguesas" | "bebidas">("populares");
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([
    { id: "1", name: "Truffle Smash Burger", price: 9.5, qty: 1 }
  ]);
  const [orderStatus, setOrderStatus] = useState<"recibido" | "cocina" | "en_camino">("cocina");
  const [claimedSlug, setClaimedSlug] = useState("");

  // --- States for Interactive ROI Calculator ---
  const [monthlyOrders, setMonthlyOrders] = useState(450);
  const [avgTicket, setAvgTicket] = useState(16);

  // Calculate Savings
  const monthlyRevenue = monthlyOrders * avgTicket;
  const traditionalCommission = monthlyRevenue * 0.3; // 30% commission from typical delivery apps
  const annualSavings = traditionalCommission * 12;

  // --- States for Live Item Toggle Demo ---
  const [itemAvailable, setItemAvailable] = useState(true);

  // --- States for FAQ Accordion ---
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Cart helper functions
  const addToCart = (dish: { id: string; name: string; price: number }) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === dish.id);
      if (existing) {
        return prev.map((item) => (item.id === dish.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...dish, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const menuDishes = [
    {
      id: "1",
      name: "Truffle Smash Burger",
      desc: "Doble carne madurada, queso cheddar fundido, alioli de trufa y pan brioche.",
      price: 9.5,
      category: "hamburguesas",
      image: "🍔"
    },
    {
      id: "2",
      name: "Crispy Bacon Burger",
      desc: "Tocino crocante ahumado en leña, cebolla caramelizada y salsa especial Komy.",
      price: 8.9,
      category: "hamburguesas",
      image: "🥓"
    },
    {
      id: "3",
      name: "Papas Rústicas Trufadas",
      desc: "Papas cortadas a mano con queso parmesano reggiano y aceite de trufa blanca.",
      price: 4.5,
      category: "populares",
      image: "🍟"
    },
    {
      id: "4",
      name: "Limonada Menta Jengibre",
      desc: "Limones frescos exprimidos al momento, hojas de menta orgánica y toque de jengibre.",
      price: 3.2,
      category: "bebidas",
      image: "🍋"
    }
  ];

  const filteredDishes =
    selectedCategory === "populares"
      ? menuDishes
      : menuDishes.filter((d) => d.category === selectedCategory);

  const faqs = [
    {
      q: "¿Realmente no cobran comisiones por venta?",
      a: "Totalmente real. A diferencia de las plataformas de delivery que retienen entre el 20% y 35% de cada plato, en Komy tus ventas son 100% tuyas. No somos intermediarios financieros; el cliente te paga directamente a ti."
    },
    {
      q: "¿Cómo llegan los pedidos a mi WhatsApp?",
      a: "El cliente arma su pedido con opciones y complementos en tu menú digital. Al presionar 'Pedir', se genera un mensaje de WhatsApp perfectamente estructurado con el desglose exacto, totales, dirección de entrega y método de pago."
    },
    {
      q: "¿Mis clientes tienen que descargar una aplicación?",
      a: "No. Tu menú abre instantáneamente en el navegador de cualquier teléfono al escanear el código QR o hacer clic en tu enlace. Cero fricción, cero instalaciones y carga en menos de 1 segundo."
    },
    {
      q: "¿Puedo actualizar precios o pausar platos agotados al instante?",
      a: "Sí. Desde tu panel de administración en tu propio teléfono puedes cambiar precios, crear promociones u ocultar platos agotados con un solo toque y el cambio se refleja inmediatamente para todos tus clientes."
    },
    {
      q: "¿Funciona para servicio en mesa, retiro en local y delivery?",
      a: "Exacto. Puedes configurar zonas de delivery con costo por distancia, opción de retiro en local o códigos QR asignados a cada mesa para que tus clientes pidan directamente desde su asiento."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] antialiased selection:bg-[#1D1D1F] selection:text-white font-sans">
      
      {/* ─── Apple Ambient Background Glow ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#FFF2EE] via-[#F3F4F8]/70 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-[800px] -right-40 w-[600px] h-[600px] bg-gradient-to-br from-[#FFE8E5]/40 to-transparent blur-3xl rounded-full opacity-60" />
      </div>

      {/* ─── Apple Navigation Bar ─── */}
      <header className="sticky top-0 z-50 w-full transition-all duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-2">
          <nav className="apple-glass rounded-full px-5 py-3 flex items-center justify-between shadow-apple-subtle border border-white/80">
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                K
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#1D1D1F]">
                komy<span className="text-[#FF453A]">.</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#515154]">
              <a href="#simulador" className="hover:text-[#1D1D1F] transition-colors">
                Simulador
              </a>
              <a href="#caracteristicas" className="hover:text-[#1D1D1F] transition-colors">
                Características
              </a>
              <a href="#calculadora" className="hover:text-[#1D1D1F] transition-colors">
                Calculadora de Ahorro
              </a>
              <a href="#comparativa" className="hover:text-[#1D1D1F] transition-colors">
                Comparativa
              </a>
              <a href="#faq" className="hover:text-[#1D1D1F] transition-colors">
                Preguntas
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[13px] font-medium text-[#515154] hover:text-[#1D1D1F] px-3 py-1.5 transition-colors hidden sm:block"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/dashboard"
                className="apple-pill-btn bg-[#1D1D1F] text-white text-[13px] font-semibold px-4 py-2 rounded-full shadow-sm hover:bg-[#2C2C2E] flex items-center gap-1.5"
              >
                <span>Crear Menú</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Eyebrow Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5EA] shadow-xs text-xs font-medium text-[#515154] hover:border-[#D1D1D6] transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-[#34C759] animate-pulse" />
            <span className="font-semibold text-[#1D1D1F]">Komy 2.0</span>
            <span className="text-[#86868B]">•</span>
            <span>El menú digital con 0% comisiones</span>
          </div>
        </div>

        {/* Display Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] text-[#1D1D1F] leading-[1.06] text-balance">
            El enlace que tu restaurante <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#1D1D1F] via-[#FF453A] to-[#FF6961] bg-clip-text text-transparent">
              necesitaba para vender más.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#6E6E73] max-w-2xl mx-auto font-normal leading-relaxed text-balance">
            Crea tu carta digital en 3 minutos. Recibe pedidos organizados directamente en tu WhatsApp y quédate con el <strong className="text-[#1D1D1F] font-semibold">100% de tus ingresos</strong>.
          </p>

          {/* Interactive URL Claim Bar */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="apple-glass p-2 rounded-2xl sm:rounded-full border border-black/[0.08] shadow-apple-card flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center w-full px-4 py-2 sm:py-0">
                <Globe className="w-4 h-4 text-[#86868B] mr-2 shrink-0" />
                <span className="text-[#86868B] text-sm font-medium select-none">komy.app/</span>
                <input
                  type="text"
                  placeholder="tu-local"
                  value={claimedSlug}
                  onChange={(e) => setClaimedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full bg-transparent text-sm font-semibold text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] ml-0.5"
                />
              </div>

              <Link
                href={`/dashboard${claimedSlug ? `?slug=${claimedSlug}` : ""}`}
                className="apple-pill-btn w-full sm:w-auto bg-[#FF453A] hover:bg-[#E0382E] text-white px-6 py-3 rounded-xl sm:rounded-full text-sm font-semibold whitespace-nowrap shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Reclamar Enlace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Micro Social Proof */}
            <div className="flex items-center justify-center gap-6 mt-5 text-xs text-[#86868B] font-medium">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#34C759] stroke-[2.5]" />
                <span>Sin tarjeta requerida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#34C759] stroke-[2.5]" />
                <span>Configuración en 3 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#34C759] stroke-[2.5]" />
                <span>0% comisiones</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Interactive Device Playground (Simulador en Vivo) ─── */}
        <div id="simulador" className="mt-16 md:mt-24">
          
          {/* Segmented Control Switcher */}
          <div className="flex justify-center mb-8">
            <div className="p-1 rounded-full bg-[#E5E5EA]/80 backdrop-blur-md inline-flex items-center gap-1 border border-black/[0.04] shadow-inner">
              <button
                onClick={() => setActiveDeviceTab("client")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeDeviceTab === "client"
                    ? "bg-white text-[#1D1D1F] shadow-sm scale-100"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Vista Cliente (Móvil)</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab("business")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeDeviceTab === "business"
                    ? "bg-white text-[#1D1D1F] shadow-sm scale-100"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                <MessageCircle className="w-4 h-4 text-[#34C759]" />
                <span>Vista Negocio (WhatsApp & Cocina)</span>
              </button>
            </div>
          </div>

          {/* Interactive Frame Container */}
          <div className="relative max-w-4xl mx-auto rounded-[32px] bg-gradient-to-b from-white to-[#F4F4F6] p-4 sm:p-8 border border-black/[0.06] shadow-apple-floating">
            
            {/* Top Bar Indicator */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10" />
                <span className="ml-3 text-xs font-mono text-[#86868B] tracking-wide">
                  {activeDeviceTab === "client" ? "komy.app/smash-burger-house" : "WhatsApp Business + Panel Cocina"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#34C759]/10 text-[#288E44]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" /> En vivo
                </span>
              </div>
            </div>

            {/* TAB 1: CLIENT EXPERIENCE (Interactive Phone Simulator) */}
            {activeDeviceTab === "client" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Interactive Phone Frame */}
                <div className="md:col-span-6 flex justify-center">
                  <div className="w-[320px] sm:w-[340px] bg-[#111113] rounded-[44px] p-3 shadow-2xl border-[6px] border-[#2C2C2E] relative overflow-hidden">
                    
                    {/* Dynamic Island */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1E] flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#007AFF]" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#1C1C1E]" />
                    </div>

                    {/* Inside Phone Screen */}
                    <div className="bg-white rounded-[36px] overflow-hidden flex flex-col h-[520px] text-[#1D1D1F] relative">
                      
                      {/* Restaurant Header */}
                      <div className="bg-[#1D1D1F] text-white p-4 pt-8 pb-4 relative">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF453A]">Abierto ahora</span>
                            <h3 className="text-base font-bold tracking-tight">Smash Burger House</h3>
                            <p className="text-[11px] text-white/70">Delivery 25-35 min • ⭐ 4.9</p>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
                            🍔
                          </div>
                        </div>

                        {/* Category Pills inside Phone */}
                        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar pt-1">
                          {(["populares", "hamburguesas", "bebidas"] as const).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                                selectedCategory === cat
                                  ? "bg-white text-[#1D1D1F]"
                                  : "bg-white/10 text-white/80 hover:bg-white/20"
                              }`}
                            >
                              {cat === "populares" ? "🔥 Destacados" : cat === "hamburguesas" ? "🍔 Burgers" : "🥤 Bebidas"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dishes List (Interactive Scroll) */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F9F9FB]">
                        {filteredDishes.map((dish) => {
                          const inCart = cartItems.find((i) => i.id === dish.id);
                          return (
                            <div
                              key={dish.id}
                              className="bg-white p-3 rounded-2xl border border-black/[0.04] shadow-xs flex items-center justify-between gap-3 hover:border-black/10 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-2xl shrink-0">
                                  {dish.image}
                                </div>
                                <div className="text-left">
                                  <h4 className="text-xs font-bold text-[#1D1D1F] line-clamp-1">{dish.name}</h4>
                                  <p className="text-[10px] text-[#86868B] line-clamp-1">{dish.desc}</p>
                                  <span className="text-xs font-extrabold text-[#1D1D1F] mt-0.5 block">
                                    ${dish.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Add / Quantity Buttons */}
                              {inCart ? (
                                <div className="flex items-center gap-1.5 bg-[#F5F5F7] p-1 rounded-full border border-black/[0.05]">
                                  <button
                                    onClick={() => removeFromCart(dish.id)}
                                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#1D1D1F] shadow-xs active:scale-90"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-[11px] font-bold px-1">{inCart.qty}</span>
                                  <button
                                    onClick={() => addToCart(dish)}
                                    className="w-5 h-5 rounded-full bg-[#1D1D1F] flex items-center justify-center text-xs font-bold text-white shadow-xs active:scale-90"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(dish)}
                                  className="apple-pill-btn bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] p-2 rounded-xl text-xs font-bold shrink-0 active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Floating Cart Bar at Bottom of Phone */}
                      {cartItems.length > 0 && (
                        <div className="p-3 bg-white/90 backdrop-blur-md border-t border-black/[0.06] sticky bottom-0">
                          <button
                            onClick={() => setActiveDeviceTab("business")}
                            className="w-full bg-[#34C759] hover:bg-[#2DB04E] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm active:scale-98 transition-all"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                                {cartItems.reduce((a, b) => a + b.qty, 0)}
                              </span>
                              <span>Pedir por WhatsApp</span>
                            </span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side explanations */}
                <div className="md:col-span-6 space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF453A]/10 text-[#FF453A] text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> Interactivo — Prueba agregar productos
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    Tus clientes piden en segundos, sin fricciones.
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.08] shadow-xs flex items-center justify-center text-[#1D1D1F] shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-[#FF453A]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F]">Carga Ultra-Rápida</h4>
                        <p className="text-xs text-[#6E6E73] leading-relaxed">
                          Menos de 0.8s en 4G. Sin registros engorrosos ni descargas en la App Store.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.08] shadow-xs flex items-center justify-center text-[#1D1D1F] shrink-0 mt-0.5">
                        <Layers className="w-4 h-4 text-[#007AFF]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F]">Personalización de Opciones</h4>
                        <p className="text-xs text-[#6E6E73] leading-relaxed">
                          Término de la carne, salsas extras, bebidas y notas especiales sin confusiones.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.08] shadow-xs flex items-center justify-center text-[#1D1D1F] shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4 text-[#34C759]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F]">Diseño Ergonómico Apple</h4>
                        <p className="text-xs text-[#6E6E73] leading-relaxed">
                          Microanimaciones fluidas con respuesta instantánea al toque de los dedos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveDeviceTab("business")}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#007AFF] hover:underline"
                    >
                      <span>Ver cómo llega el pedido a la cocina y WhatsApp</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BUSINESS EXPERIENCE (WhatsApp & Kitchen Ticket) */}
            {activeDeviceTab === "business" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* WhatsApp Structured Message Card */}
                <div className="md:col-span-6 bg-[#EFEAE2] p-5 rounded-3xl border border-black/[0.08] shadow-inner space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <MessageCircle className="w-5 h-5 fill-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1D1D1F]">Cliente: Sofía Mendoza</span>
                        <p className="text-[10px] text-[#54656F]">Hace 1 minuto • +56 9 8765 4321</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#54656F] bg-white/60 px-2 py-0.5 rounded-full">WhatsApp</span>
                  </div>

                  {/* Formatted Message Bubble */}
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-xs border border-black/[0.04] text-[#111B21] text-xs font-mono space-y-2 leading-relaxed">
                    <p className="font-bold text-[#008069]">🍔 ¡NUEVO PEDIDO #KM-482!</p>
                    <p className="text-[#667781]">──────────────────────</p>
                    <div>
                      {cartItems.map((item) => (
                        <p key={item.id} className="text-[#111B21]">
                          • {item.qty}x {item.name} (${(item.price * item.qty).toFixed(2)})
                        </p>
                      ))}
                    </div>
                    <p className="text-[#667781]">──────────────────────</p>
                    <p className="font-bold">Total: ${cartTotal.toFixed(2)}</p>
                    <p>📍 Entrega: Av. Las Condes 1024, Depto 402</p>
                    <p>💳 Pago: Transferencia / Efectivo</p>
                    <div className="text-right text-[10px] text-[#667781] pt-1">14:32 ✓✓</div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[11px] font-semibold text-[#008069] bg-[#D9FDD3] px-3 py-1 rounded-full">
                      Listo para imprimir o enviar a cocina
                    </span>
                  </div>
                </div>

                {/* Kitchen Live Order Manager */}
                <div className="md:col-span-6 space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34C759]/10 text-[#288E44] text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pedidos 100% Claros y Estructurados
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    Adiós audios interminables y pedidos incompletos.
                  </h3>

                  <p className="text-sm text-[#6E6E73] leading-relaxed">
                    Cada orden llega con el desglose exacto, las preferencias del cliente, dirección validada y método de pago. Tu equipo ahorra hasta <strong className="text-[#1D1D1F]">12 minutos por pedido</strong> en atención al cliente.
                  </p>

                  {/* Interactive Status Pill Preview */}
                  <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs space-y-3">
                    <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
                      Cambiar estado del pedido en tu panel:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setOrderStatus("recibido")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          orderStatus === "recibido"
                            ? "bg-[#FF9500] text-white shadow-xs"
                            : "bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]"
                        }`}
                      >
                        Recibido
                      </button>
                      <button
                        onClick={() => setOrderStatus("cocina")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          orderStatus === "cocina"
                            ? "bg-[#007AFF] text-white shadow-xs"
                            : "bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]"
                        }`}
                      >
                        En Cocina 👨‍🍳
                      </button>
                      <button
                        onClick={() => setOrderStatus("en_camino")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          orderStatus === "en_camino"
                            ? "bg-[#34C759] text-white shadow-xs"
                            : "bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]"
                        }`}
                      >
                        En Camino 🛵
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Apple Keynote Bento Grid Showcase ─── */}
      <section id="caracteristicas" className="py-20 bg-white border-y border-black/[0.06] relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#FF453A] uppercase">
              Diseñado con rigor y propósito
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Todo lo que necesitas para operar a máxima velocidad.
            </h2>
            <p className="text-base text-[#6E6E73] font-normal">
              Potencia tecnológica sin complicaciones técnicas. Cada detalle optimizado para vender.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: 0% Comisiones */}
            <div className="apple-card-hover bg-[#FBFBFD] p-8 rounded-3xl border border-black/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mb-6">
                  <DollarSign className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight mb-2">
                  0% Comisiones
                </h3>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  No cobramos porcentajes sobre tus platos ni tarifas sorpresa por transacción. El fruto de tu esfuerzo va directo a tu cuenta bancaria.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-black/[0.04] flex items-center justify-between text-xs font-bold text-[#34C759]">
                <span>100% de margen para tu local</span>
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Bento Card 2: Actualización Instantánea (Interactive Toggle) */}
            <div className="apple-card-hover bg-[#FBFBFD] p-8 rounded-3xl border border-black/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mb-6">
                  <Sliders className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight mb-2">
                  Control en Tiempo Real
                </h3>
                <p className="text-sm text-[#6E6E73] leading-relaxed mb-6">
                  ¿Se terminó un ingrediente? Desactiva el plato con un toque y evita reclamos de clientes.
                </p>

                {/* Interactive Toggle Demo inside card */}
                <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🍔</span>
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Smash Doble</div>
                      <div className="text-[10px] text-[#86868B]">
                        {itemAvailable ? "Disponible en menú" : "Agotado temporalmente"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setItemAvailable(!itemAvailable)}
                    className={`w-12 h-7 rounded-full transition-colors duration-200 p-0.5 flex items-center ${
                      itemAvailable ? "bg-[#34C759]" : "bg-[#E5E5EA]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        itemAvailable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/[0.04] text-xs text-[#86868B] font-medium">
                Sincronización instantánea en la nube
              </div>
            </div>

            {/* Bento Card 3: QR Studio & Mesas */}
            <div className="apple-card-hover bg-[#FBFBFD] p-8 rounded-3xl border border-black/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mb-6">
                  <QrCode className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight mb-2">
                  Códigos QR de Alta Definición
                </h3>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  Genera códigos QR listos para imprimir en mesas, stickers o displays de mostrador con tu logo y estilo personalizado.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-black/[0.04] flex items-center justify-between text-xs font-bold text-[#1D1D1F]">
                <span>Descarga en SVG y PNG</span>
                <ExternalLink className="w-4 h-4 text-[#86868B]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interactive Savings / ROI Calculator (Apple Tactile Sliders) ─── */}
      <section id="calculadora" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 z-10 relative">
        <div className="apple-glass rounded-[36px] p-8 sm:p-14 border border-white/90 shadow-apple-floating">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Sliders */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#FF453A] uppercase">
                  Calculadora de Ganancias
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] mt-2">
                  ¿Cuánto dinero estás perdiendo en comisiones?
                </h2>
                <p className="text-sm text-[#6E6E73] mt-2 leading-relaxed">
                  Mueve los controles para simular las ventas mensuales de tu restaurante y descubre tu ahorro real con Komy.
                </p>
              </div>

              {/* Slider 1: Monthly Orders */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#1D1D1F]">Órdenes por mes:</span>
                  <span className="font-mono font-extrabold text-base px-3 py-1 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                    {monthlyOrders} pedidos
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={monthlyOrders}
                  onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                  className="w-full h-2 bg-[#E5E5EA] rounded-lg appearance-none cursor-pointer accent-[#FF453A]"
                />
                <div className="flex justify-between text-[11px] text-[#86868B]">
                  <span>50 pedidos</span>
                  <span>1,000 pedidos</span>
                  <span>2,000+ pedidos</span>
                </div>
              </div>

              {/* Slider 2: Average Ticket */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#1D1D1F]">Ticket promedio por orden:</span>
                  <span className="font-mono font-extrabold text-base px-3 py-1 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                    ${avgTicket} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full h-2 bg-[#E5E5EA] rounded-lg appearance-none cursor-pointer accent-[#FF453A]"
                />
                <div className="flex justify-between text-[11px] text-[#86868B]">
                  <span>$5</span>
                  <span>$30</span>
                  <span>$60</span>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Savings Card */}
            <div className="lg:col-span-6 bg-[#111113] text-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF453A]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#86868B]">
                    Facturación Mensual
                  </span>
                  <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/10 px-2.5 py-1 rounded-full">
                    ${monthlyRevenue.toLocaleString()} USD
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#86868B] uppercase font-bold tracking-wider">
                    Ahorro estimado al año con Komy:
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-[#34C759] tracking-tight">
                    +${annualSavings.toLocaleString()} USD
                  </div>
                  <p className="text-xs text-white/60 pt-1">
                    Dinero que antes pagabas en comisiones del 30% a intermediarios.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/70">Comisión Apps de Delivery (30%):</span>
                    <span className="font-mono text-[#FF453A] font-bold">-${traditionalCommission.toLocaleString()}/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Comisión con Komy:</span>
                    <span className="font-mono text-[#34C759] font-bold">$0.00 / 0%</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="apple-pill-btn w-full bg-white text-[#111113] hover:bg-[#F2F2F7] py-3.5 rounded-full text-center text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Comenzar a Ahorrar Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Apple Comparison Section ─── */}
      <section id="comparativa" className="py-20 bg-white border-y border-black/[0.06] z-10 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold tracking-widest text-[#007AFF] uppercase">
              La diferencia es clara
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Komy vs Apps de Delivery Tradicionales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Traditional Apps */}
            <div className="p-8 rounded-3xl bg-[#F5F5F7] border border-black/[0.06] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1D1D1F]">Apps de Delivery Tradicionales</h3>
                <span className="text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2.5 py-1 rounded-full">Costoso</span>
              </div>

              <ul className="space-y-4 text-sm text-[#6E6E73]">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                  <span>Comisiones abusivas del 20% al 35% en cada venta.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                  <span>Tus clientes pertenecen a la app, no a tu marca.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                  <span>Competencia directa: promocionan otros locales junto al tuyo.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                  <span>Pagos retenidos durante semanas o meses.</span>
                </li>
              </ul>
            </div>

            {/* Komy */}
            <div className="p-8 rounded-3xl bg-[#111113] text-white border border-white/10 space-y-6 shadow-apple-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#34C759]/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span>Komy</span>
                  <span className="text-[#34C759] text-xs font-bold bg-[#34C759]/20 px-2 py-0.5 rounded-full">Recomendado</span>
                </h3>
                <span className="text-xs font-bold text-[#34C759]">0% Comisiones</span>
              </div>

              <ul className="space-y-4 text-sm text-white/80 relative z-10">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong className="text-white">0% comisiones</strong> sobre tus ventas. Todo el dinero es tuyo.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong className="text-white">Clientes 100% tuyos</strong>: mantén su contacto en tu WhatsApp.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong className="text-white">Menú exclusivo</strong> sin distracciones ni marcas competidoras.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong className="text-white">Cobro instantáneo</strong> directo a tu cuenta bancaria.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Apple Accordion FAQ ─── */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 z-10 relative">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold tracking-widest text-[#86868B] uppercase">
            Transparencia Total
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#1D1D1F] hover:text-[#FF453A] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#86868B] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#FF453A]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#6E6E73] leading-relaxed border-t border-black/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Apple Final Call to Action ─── */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 z-10 relative">
        <div className="bg-[#111113] rounded-[40px] p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-apple-floating border border-white/10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF453A]/25 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FF453A]" /> Empieza hoy mismo
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Lleva tu restaurante al siguiente nivel digital.
            </h2>

            <p className="text-sm sm:text-base text-white/70 font-normal leading-relaxed">
              Únete a cientos de negocios gastronómicos que ya aumentaron sus ventas directas sin pagar comisiones.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="apple-pill-btn w-full sm:w-auto bg-[#FF453A] hover:bg-[#E0382E] text-white px-8 py-4 rounded-full font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Crear mi Menú Digital Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Apple Refined Footer ─── */}
      <footer className="border-t border-black/[0.06] bg-[#F5F5F7] text-[#86868B] text-xs py-12 z-10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs">
                K
              </div>
              <span className="font-extrabold text-[#1D1D1F] text-sm">komy</span>
              <span>© {new Date().getFullYear()} Komy Inc. Todos los derechos reservados.</span>
            </div>

            <div className="flex items-center gap-6 font-medium">
              <Link href="/terminos" className="hover:text-[#1D1D1F] transition-colors">
                Términos del Servicio
              </Link>
              <Link href="/privacidad" className="hover:text-[#1D1D1F] transition-colors">
                Privacidad
              </Link>
              <Link href="/login" className="hover:text-[#1D1D1F] transition-colors">
                Acceso Negocios
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans antialiased bg-hueso min-h-screen text-carbon selection:bg-coral selection:text-white">
      {/* Top Bar - Very technical and small */}
      <nav className="sticky top-0 z-50 bg-hueso/90 backdrop-blur-md border-b border-carbon/10">
        <div className="w-full px-4 h-14 flex items-center justify-between text-sm">
          <div className="flex items-center gap-8">
            <span className="font-black tracking-tight text-lg">komy</span>
            <div className="hidden md:flex items-center gap-6 text-carbon/60 font-medium">
              <span className="hover:text-carbon cursor-pointer transition-colors">Características</span>
              <span className="hover:text-carbon cursor-pointer transition-colors">Precios</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-medium hover:text-carbon/70 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/dashboard"
              className="bg-carbon text-white px-4 py-2 rounded-lg font-medium hover:bg-carbon/90 transition-colors shadow-sm"
            >
              Crear menú
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Grid Layout to fill emptiness */}
      <main className="max-w-[1400px] mx-auto w-full px-4 pt-12 pb-32">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (Hero Text) */}
          <div className="lg:col-span-7 bg-white border border-carbon/10 rounded-2xl p-8 md:p-16 flex flex-col justify-center min-h-[550px]">
            <h1 className="text-5xl md:text-[4rem] font-black tracking-tight leading-[1.05] mb-6">
              El único enlace que tu local necesita
            </h1>
            
            <p className="text-lg text-carbon/60 max-w-xl leading-relaxed mb-10 font-medium">
              Transforma tu operación con un menú digital instantáneo. Cero comisiones. Pedidos estructurados directamente a tu WhatsApp. Diseñado para alta velocidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="flex-1 flex items-center bg-hueso border border-carbon/10 rounded-xl px-4 py-3 focus-within:border-carbon/30 focus-within:bg-white transition-colors shadow-inner">
                <span className="text-carbon/40 font-medium text-sm">komy.app/</span>
                <input
                  className="w-full bg-transparent outline-none font-medium text-sm"
                  placeholder="tu-local"
                  type="text"
                />
              </div>
              <button className="bg-coral text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                Reclamar enlace
              </button>
            </div>
          </div>

          {/* Right Column (Interface Mockup to fill space) */}
          <div className="lg:col-span-5 border border-carbon/10 rounded-2xl bg-carbon overflow-hidden relative min-h-[550px] flex flex-col shadow-sm">
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
              <div className="ml-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Dashboard de Ordenes</div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {/* Fake UI Header */}
              <div className="flex gap-4 items-center mb-2">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-white/50 text-xl font-black">B</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 bg-white/20 rounded-md"></div>
                  <div className="h-2 w-1/4 bg-white/10 rounded-md"></div>
                </div>
              </div>
              
              {/* Fake UI Stats */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Órdenes Hoy</div>
                  <div className="text-2xl font-black text-white">24</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">En Línea</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-coral"></span>
                    <span className="text-2xl font-black text-white">Activo</span>
                  </div>
                </div>
              </div>
              
              {/* Fake UI Order Card */}
              <div className="mt-auto bg-white/10 rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Nuevo Pedido</div>
                  <div className="text-[10px] text-white/50 font-mono">hace 1 min</div>
                </div>
                <div className="space-y-2 py-1">
                    <div className="h-2 w-3/4 bg-white/20 rounded-md"></div>
                    <div className="h-2 w-1/2 bg-white/10 rounded-md"></div>
                </div>
                <div className="flex justify-end mt-2">
                    <div className="bg-coral text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                    Confirmar
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Data Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-carbon/10 rounded-2xl p-8 group hover:border-carbon/30 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-hueso border border-carbon/5 rounded-lg flex items-center justify-center mb-6 text-carbon group-hover:bg-coral group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <h3 className="text-sm font-bold mb-2 uppercase tracking-wide">Cero Comisiones</h3>
            <p className="text-sm text-carbon/60 leading-relaxed font-medium">
              Tus ventas son 100% tuyas. Komy no actúa como intermediario financiero ni cobra porcentajes por transacción.
            </p>
          </div>
          
          <div className="bg-white border border-carbon/10 rounded-2xl p-8 group hover:border-carbon/30 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-hueso border border-carbon/5 rounded-lg flex items-center justify-center mb-6 text-carbon group-hover:bg-coral group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">smartphone</span>
            </div>
            <h3 className="text-sm font-bold mb-2 uppercase tracking-wide">Edición Inmediata</h3>
            <p className="text-sm text-carbon/60 leading-relaxed font-medium">
              Oculta productos agotados en un click o actualiza precios instantáneamente desde cualquier dispositivo móvil.
            </p>
          </div>

          <div className="bg-white border border-carbon/10 rounded-2xl p-8 group hover:border-carbon/30 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-hueso border border-carbon/5 rounded-lg flex items-center justify-center mb-6 text-carbon group-hover:bg-coral group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">chat_bubble</span>
            </div>
            <h3 className="text-sm font-bold mb-2 uppercase tracking-wide">Pedidos al WhatsApp</h3>
            <p className="text-sm text-carbon/60 leading-relaxed font-medium">
              Recibe órdenes formateadas perfectamente. Sin audios inentendibles, listas para ser procesadas en cocina.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-4 border border-carbon/10 rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-16 flex flex-col justify-center border-b md:border-b-0 md:border-r border-carbon/10">
              <div className="text-[10px] font-bold text-carbon/40 uppercase tracking-widest mb-4">Módulo de Cliente</div>
              <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">
                Experiencia sin fricción
              </h2>
              <p className="text-sm text-carbon/60 mb-8 max-w-sm font-medium leading-relaxed">
                Escanea el código para ver el menú desde la perspectiva de tus clientes. Carga instantánea, sin instalar apps ni registros molestos.
              </p>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-carbon/40">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-carbon/20 rounded-full"></span> Rápido</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-carbon/20 rounded-full"></span> Ligero</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-carbon/20 rounded-full"></span> Optimizado</span>
              </div>
            </div>
            
            <div className="bg-hueso p-8 md:p-16 flex items-center justify-center relative">
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-carbon/10">
                <div className="w-56 h-56 md:w-64 md:h-64 bg-carbon rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-5 gap-1.5 p-4">
                     {[...Array(25)].map((_, i) => (
                        <div key={i} className={`rounded-sm ${i % 2 === 0 || i % 7 === 0 ? 'bg-white' : 'bg-transparent'}`}></div>
                     ))}
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg z-10 relative shadow-md">
                    <span className="text-xs font-black text-carbon uppercase tracking-widest">Scan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-carbon/10 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-black text-base">komy.</span>
            <span className="text-carbon/40 font-medium">© {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex items-center gap-6 text-carbon/50 font-medium">
            <Link href="/terminos" className="hover:text-carbon transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-carbon transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
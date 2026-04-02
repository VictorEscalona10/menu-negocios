// app/menu/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AddToCartButton from './AddToCartButton'
import FloatingCart from './components/FloatingCart';

export default async function MenuPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    // En Next.js 15+, params es una promesa, así que la esperamos
    const { slug } = await params;

    // Buscamos el local por su slug y traemos sus categorías con los productos DISPONIBLES
    const store = await prisma.store.findUnique({
        where: { slug },
        include: {
            categories: {
                include: {
                    products: {
                        where: { isAvailable: true }
                    }
                }
            }
        }
    });

    // Si alguien escribe una URL de un local que no existe, muestra la página de error 404
    if (!store) {
        notFound();
    }

    return (
        <div
            className="min-h-screen pb-32 font-sans bg-[#131313] text-[#e5e2e1] selection:bg-white/20 relative"
            style={{ backgroundColor: store.backgroundColor || '#131313' }} // Fallback oscuro
        >
            {/* Cabecera Asimétrica y Elegante */}
            <header className="pt-24 pb-16 px-6 md:px-8 max-w-3xl mx-auto relative overflow-hidden">
                <div 
                    className="absolute top-0 right-0 opacity-10 blur-[100px] rounded-full w-96 h-96 -translate-y-1/2 translate-x-1/4 pointer-events-none" 
                    style={{ backgroundColor: store.themeColor || '#FF5630' }}
                ></div>
                
                <div className="flex items-end justify-between mb-8 relative z-10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                        <span className="text-4xl">🏪</span>
                    </div>
                </div>
                
                <div className="relative z-10 max-w-sm">
                    <h1 className="text-5xl md:text-6xl font-serif tracking-tighter font-extrabold mb-4 leading-none text-white">
                        {store.name}
                    </h1>
                    <p className="opacity-60 font-medium text-sm tracking-widest uppercase">
                        Selección Premium • Retira en local
                    </p>
                </div>
            </header>

            {/* Menú Curado */}
            <main className="max-w-3xl mx-auto px-6 space-y-24 relative z-10">
                {store.categories.length === 0 ? (
                    <p className="text-center text-zinc-500 font-serif italic py-20">Esta colección está siendo preparada...</p>
                ) : (
                    store.categories.map((category) => (
                        <section key={category.id} className="space-y-8">
                            <div className="flex items-center gap-6 mb-6">
                                <h2 className="text-3xl font-serif tracking-tight text-white font-bold">
                                    {category.name}
                                </h2>
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                            </div>

                            <div className="flex flex-col gap-6">
                                {category.products.map((product) => (
                                    <article
                                        key={product.id}
                                        className="group relative transition-all duration-300 rounded-[2rem] flex gap-4 md:gap-6 items-center p-2"
                                    >
                                        <div className="flex-1 pr-4">
                                            <h3 className="font-bold text-white text-xl md:text-2xl mb-3 tracking-tight group-hover:text-white transition-colors">{product.name}</h3>
                                            {product.description && (
                                                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-4 line-clamp-2 md:line-clamp-none">{product.description}</p>
                                            )}
                                            <p className="font-serif font-black text-2xl tracking-tighter" style={{ color: store.themeColor }}>
                                                ${product.price.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="shrink-0 bg-[#201f1f] p-1.5 rounded-full shadow-xl border border-white/5">
                                            <AddToCartButton
                                                product={{ id: product.id, name: product.name, price: product.price }}
                                                themeColor={store.themeColor}
                                            />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            <FloatingCart
                storeName={store.name}
                whatsapp={store.whatsapp}
                themeColor={store.themeColor}
            />
        </div>
    )
}
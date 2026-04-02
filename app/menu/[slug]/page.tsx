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
            <header
                className="pt-12 pb-8 px-6 shadow-md rounded-b-[2.5rem] mb-8"
                style={{ backgroundColor: store.themeColor, color: '#fff' }}
            >
                <div className="max-w-2xl mx-auto text-center">
                    {/* Aquí la magia: Si hay logo lo muestra, si no, deja el emoji */}
                    {store.logoUrl ? (
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={store.logoUrl} alt={`Logo de ${store.name}`} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm shadow-lg border-4 border-white">
                            <span className="text-4xl">🏪</span>
                        </div>
                    )}

                    <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
                    <p className="opacity-90 font-medium text-sm">Haz tu pedido y retira en local</p>
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
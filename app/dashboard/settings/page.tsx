// app/dashboard/settings/page.tsx
import { prisma } from "@/src/prisma"; //
import { updateStoreSettings } from "@/src/actions/store";

export default async function SettingsPage() {
    // SIMULACIÓN: Obtenemos el primer local de la base de datos. 
    // En el futuro, esto se filtrará por el ID del usuario autenticado.
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div>No hay ningún local configurado aún. Debes crear uno en la base de datos.</div>;
    }

    // Preparamos la Server Action inyectando el ID del local actual
    const updateStoreWithId = updateStoreSettings.bind(null, store.id);

    return (
        <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
            <h1 className="text-2xl font-bold text-zinc-900 mb-6">Personalización del Menú</h1>

            <form action={updateStoreWithId} className="space-y-6">
                {/* Datos Básicos */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">Datos Básicos</h2>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Local</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={store.name}
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Número de WhatsApp (con código de país)</label>
                        <input
                            type="text"
                            name="whatsapp"
                            defaultValue={store.whatsapp}
                            placeholder="Ej: 584141234567"
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Colores */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">Colores de la Marca</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Color de Fondo</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    name="backgroundColor"
                                    defaultValue={store.backgroundColor}
                                    className="h-10 w-10 rounded cursor-pointer"
                                />
                                <span className="text-sm text-zinc-500 font-mono">{store.backgroundColor}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Color Principal (Botones)</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    name="themeColor"
                                    defaultValue={store.themeColor}
                                    className="h-10 w-10 rounded cursor-pointer"
                                />
                                <span className="text-sm text-zinc-500 font-mono">{store.themeColor}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón de Guardado */}
                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
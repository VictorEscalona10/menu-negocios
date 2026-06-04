'use client'

import { useState, useTransition } from 'react'
import { createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from '@/src/actions/store'

interface DeliveryZone {
    id: string;
    name: string;
    price: number;
}

interface DeliveryZonesManagerProps {
    storeId: string;
    initialZones: DeliveryZone[];
}

export default function DeliveryZonesManager({ storeId, initialZones }: DeliveryZonesManagerProps) {
    const [zones, setZones] = useState<DeliveryZone[]>(initialZones);
    const [isPending, startTransition] = useTransition();

    // Estado para el formulario de nueva zona
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [addError, setAddError] = useState('');

    // Estado para la zona en edición
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editError, setEditError] = useState('');

    const handleAdd = async () => {
        setAddError('');
        if (!newName.trim()) { setAddError('El nombre es obligatorio.'); return; }
        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) { setAddError('Ingresa un precio válido.'); return; }

        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('price', newPrice);

        startTransition(async () => {
            try {
                await createDeliveryZone(storeId, fd);
                // Optimistic update (la página se recarga en el server, pero hacemos UI inmediata)
                setZones(prev => [...prev, { id: Date.now().toString(), name: newName.trim(), price }]);
                setNewName('');
                setNewPrice('');
            } catch (e: any) {
                setAddError(e.message || 'Error al crear la zona.');
            }
        });
    };

    const startEdit = (zone: DeliveryZone) => {
        setEditingId(zone.id);
        setEditName(zone.name);
        setEditPrice(String(zone.price));
        setEditError('');
    };

    const handleUpdate = async (zoneId: string) => {
        setEditError('');
        if (!editName.trim()) { setEditError('El nombre es obligatorio.'); return; }
        const price = parseFloat(editPrice);
        if (isNaN(price) || price < 0) { setEditError('Ingresa un precio válido.'); return; }

        const fd = new FormData();
        fd.set('name', editName.trim());
        fd.set('price', editPrice);

        startTransition(async () => {
            try {
                await updateDeliveryZone(zoneId, fd);
                setZones(prev => prev.map(z => z.id === zoneId ? { ...z, name: editName.trim(), price } : z));
                setEditingId(null);
            } catch (e: any) {
                setEditError(e.message || 'Error al actualizar la zona.');
            }
        });
    };

    const handleDelete = async (zoneId: string) => {
        startTransition(async () => {
            try {
                await deleteDeliveryZone(zoneId);
                setZones(prev => prev.filter(z => z.id !== zoneId));
            } catch (e: any) {
                console.error(e.message);
            }
        });
    };

    return (
        <div className="space-y-4 pt-4 border-t border-zinc-100">
            <div>
                <h2 className="text-lg font-semibold text-zinc-800">🗺️ Zonas de Delivery</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                    Define las zonas de entrega y su precio. El cliente podrá elegir su zona en el carrito.
                </p>
            </div>

            {/* Lista de zonas */}
            <div className="space-y-2">
                {zones.length === 0 && (
                    <p className="text-sm text-zinc-400 italic px-1">
                        Aún no has agregado zonas. ¡Agrega la primera abajo!
                    </p>
                )}
                {zones.map(zone => (
                    <div
                        key={zone.id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-zinc-200 bg-white transition-all"
                    >
                        {editingId === zone.id ? (
                            /* ── Modo edición ── */
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="Nombre de la zona"
                                        className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                                    />
                                    <div className="relative sm:w-28">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">$</span>
                                        <input
                                            type="number"
                                            value={editPrice}
                                            onChange={e => setEditPrice(e.target.value)}
                                            min="0"
                                            step="0.50"
                                            placeholder="0.00"
                                            className="w-full border border-zinc-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                </div>
                                {editError && (
                                    <p className="text-xs text-red-500 font-medium">{editError}</p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleUpdate(zone.id)}
                                        disabled={isPending}
                                        className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? 'Guardando...' : '✓ Guardar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="px-4 text-xs font-bold text-zinc-500 hover:text-black transition-colors border border-zinc-200 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Modo vista ── */
                            <>
                                <span className="text-xl shrink-0">📍</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-zinc-900 truncate">{zone.name}</p>
                                    <p className="text-xs text-zinc-500 font-medium">
                                        Precio delivery: <span className="font-bold text-zinc-700">${zone.price.toFixed(2)}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(zone)}
                                        className="p-2 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all"
                                        title="Editar zona"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(zone.id)}
                                        disabled={isPending}
                                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                        title="Eliminar zona"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Formulario para agregar nueva zona */}
            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/60">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">+ Agregar nueva zona</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => { setNewName(e.target.value); setAddError(''); }}
                        placeholder="Ej: Centro, Turmero, Zona Norte..."
                        className="flex-1 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white"
                    />
                    <div className="relative sm:w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">$</span>
                        <input
                            type="number"
                            value={newPrice}
                            onChange={e => { setNewPrice(e.target.value); setAddError(''); }}
                            min="0"
                            step="0.50"
                            placeholder="0.00"
                            className="w-full border border-zinc-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white"
                        />
                    </div>
                </div>
                {addError && (
                    <p className="text-xs text-red-500 font-medium">{addError}</p>
                )}
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isPending}
                    className="w-full bg-black text-white text-sm font-bold py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                    Agregar Zona
                </button>
            </div>
        </div>
    );
}

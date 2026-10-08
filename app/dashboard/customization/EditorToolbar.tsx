'use client'

import { Check, Loader2, Redo2, RotateCcw, Save, Undo2 } from 'lucide-react'
import { useCustomizationStore } from '@/src/store/customizationStore'
import { toggleCustomizationMode } from '@/src/actions/customization'
import { TemplatePicker } from './components/TemplatePicker'
import { useUndoRedoShortcuts } from './useUndoRedoShortcuts'
import type { DeviceView } from '@/src/types/customization'

type EditorToolbarProps = {
    storeName: string
}

export function EditorToolbar({ storeName }: EditorToolbarProps) {
    useUndoRedoShortcuts()
    const dirty = useCustomizationStore((s) => s.dirty)
    const saving = useCustomizationStore((s) => s.saving)
    const storeId = useCustomizationStore((s) => s.storeId)
    const deviceView = useCustomizationStore((s) => s.layoutJson.deviceView)
    const canUndo = useCustomizationStore((s) => s.history.length > 0)
    const canRedo = useCustomizationStore((s) => s.future.length > 0)
    const setDeviceView = useCustomizationStore((s) => s.setDeviceView)
    const undo = useCustomizationStore((s) => s.undo)
    const redo = useCustomizationStore((s) => s.redo)
    const save = useCustomizationStore((s) => s.save)

    const handleSave = async () => {
        try {
            await save()
        } catch {
            // El store ya apaga "saving"; el error no debe romper la UI
        }
    }

    const handleRevert = async () => {
        if (!storeId) return
        try {
            await toggleCustomizationMode(storeId, 'THEME')
        } catch {
            // Si falla, el modo sigue siendo AVANCED
        }
    }

    return (
        <div className="sticky top-0 z-20 rounded-2xl border border-zinc-200 bg-white/90 backdrop-blur px-4 py-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                {/* Izquierda: selector de plantillas */}
                <div className="flex items-center justify-start min-w-0">
                    <TemplatePicker />
                </div>

                {/* Centro: nombre del local + modo */}
                <div className="text-center min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{storeName}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Modo avanzado
                    </p>
                </div>

                {/* Derecha: guardar, revertir, vista de dispositivo, undo/redo */}
                <div className="flex items-center justify-end gap-2 min-w-0">
                    <select
                        aria-label="Vista de dispositivo"
                        title="Vista de dispositivo"
                        value={deviceView}
                        onChange={(e) => setDeviceView(e.target.value as DeviceView)}
                        className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                    >
                        <option value="phone">Teléfono</option>
                        <option value="tablet">Tablet</option>
                        <option value="desktop">Escritorio</option>
                    </select>

                    <button
                        type="button"
                        aria-label="Deshacer"
                        aria-keyshortcuts="Control+Z Meta+Z"
                        title="Deshacer (Ctrl+Z)"
                        onClick={undo}
                        disabled={!canUndo}
                        className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Rehacer"
                        aria-keyshortcuts="Control+Y Meta+Shift+Z"
                        title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
                        onClick={redo}
                        disabled={!canRedo}
                        className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={handleRevert}
                        disabled={!storeId || saving}
                        title="Regresar al modo THEME"
                        className="hidden sm:inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Revertir
                    </button>

                    {!dirty && !saving ? (
                        <span
                            role="status"
                            title="Todo guardado"
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600"
                        >
                            <Check className="w-4 h-4" />
                            Guardado
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

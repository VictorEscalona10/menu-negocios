'use client'

import { useState } from 'react'
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { useCustomizationStore } from '@/src/store/customizationStore'
import type { DeviceView } from '@/src/types/customization'
import { designStyleOf, pageBackdrop } from '@/src/styles/designStyles'
import { DraggableSection } from './sections/DraggableSection'
import { SectionRenderer } from './sections/SectionRenderer'

const DEVICE_META: Record<DeviceView, { label: string; icon: typeof Monitor; frame: string }> = {
    phone: { label: 'Teléfono', icon: Smartphone, frame: 'w-full max-w-[400px] aspect-[15/23]' },
    tablet: { label: 'Tablet', icon: Tablet, frame: 'w-[460px] aspect-[3/4]' },
    desktop: { label: 'Escritorio', icon: Monitor, frame: 'w-full aspect-[16/10]' },
}

/**
 * Canvas del editor: lista de secciones reordenables con dnd-kit (izquierda)
 * + mini preview en vivo del menú con el deviceView activo (derecha).
 */
export function EditorCanvas() {
    const layoutJson = useCustomizationStore((s) => s.layoutJson)
    const reorderSections = useCustomizationStore((s) => s.reorderSections)
    const selectedSectionId = useCustomizationStore((s) => s.selectedSectionId)
    const selectSection = useCustomizationStore((s) => s.selectSection)

    const [activeId, setActiveId] = useState<string | null>(null)
    const [overId, setOverId] = useState<string | null>(null)

    const sections = layoutJson.sections
    const visibleSections = sections.filter((section) => section.visible)
    const device = DEVICE_META[layoutJson.deviceView]
    const DeviceIcon = device.icon
    const backdrop = pageBackdrop(designStyleOf(layoutJson.global), layoutJson.global)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            // 8px de tolerancia: permite click en botones dentro de la tarjeta
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id))
        setOverId(String(event.active.id))
    }

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over ? String(event.over.id) : null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            reorderSections(String(active.id), String(over.id))
        }
        setActiveId(null)
        setOverId(null)
    }

    const handleDragCancel = () => {
        setActiveId(null)
        setOverId(null)
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_600px] 2xl:grid-cols-[minmax(0,1fr)_720px]">
            {/* Lista de secciones reordenables */}
            <div className="rounded-3xl border border-zinc-100 bg-white p-4 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-black text-zinc-900">Secciones</h2>
                        <p className="text-sm text-zinc-500">
                            {sections.length === 0
                                ? 'Agrega secciones desde el panel lateral'
                                : 'Arrastra para cambiar el orden del menú'}
                        </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                        {sections.length} {sections.length === 1 ? 'sección' : 'secciones'}
                    </span>
                </div>

                {sections.length === 0 ? (
                    <p className="rounded-2xl bg-zinc-50 p-8 text-center font-medium text-zinc-500">
                        Tu diseño está vacío. Agrega secciones para empezar.
                    </p>
                ) : (
                    <DndContext
                        id="editor-canvas"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableContext
                            items={sections.map((section) => section.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div id="editor-canvas-list" className="flex flex-col gap-3">
                                {sections.map((section, index) => (
                                    <DraggableSection
                                        key={section.id}
                                        section={section}
                                        index={index}
                                        selected={selectedSectionId === section.id}
                                        onSelect={() => selectSection(section.id)}
                                        dropLine={
                                            activeId !== null &&
                                            overId === section.id &&
                                            activeId !== section.id
                                        }
                                    >
                                        <div
                                            className="rounded-xl"
                                            style={{
                                                backgroundColor:
                                                    layoutJson.global.backgroundColor,
                                            }}
                                        >
                                            <SectionRenderer
                                                section={section}
                                                layoutJson={layoutJson}
                                                deviceView={layoutJson.deviceView}
                                                interactive
                                            />
                                        </div>
                                    </DraggableSection>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Mini preview en vivo */}
            <aside className="rounded-3xl border border-zinc-100 bg-white p-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:self-start xl:overflow-y-auto">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <DeviceIcon className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-black text-zinc-900">{device.label}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        En vivo
                    </span>
                </div>

                <div
                    className={`mx-auto ${device.frame} rounded-3xl border-4 border-zinc-900 p-1 shadow-xl transition-[width,height] duration-300`}
                >
                    <div
                        className="relative h-full overflow-hidden rounded-2xl"
                        style={{ backgroundColor: layoutJson.global.backgroundColor }}
                    >
                        {backdrop && (
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0"
                                style={backdrop}
                            />
                        )}
                        <div
                            className="relative h-full overflow-y-auto rounded-2xl"
                            style={{
                                color: layoutJson.global.textColor,
                                fontFamily: `'${layoutJson.global.fontBody}', sans-serif`,
                            }}
                        >
                            {visibleSections.length === 0 ? (
                                <p className="p-6 text-center text-sm font-semibold opacity-60">
                                    {sections.length === 0
                                        ? 'Sin secciones para previsualizar'
                                        : 'Todas las secciones están ocultas'}
                                </p>
                            ) : (
                                visibleSections.map((section) => (
                                    <SectionRenderer
                                        key={section.id}
                                        section={section}
                                        layoutJson={layoutJson}
                                        deviceView={layoutJson.deviceView}
                                        interactive
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <p className="mt-3 text-center text-[11px] font-semibold text-zinc-400">
                    Vista previa actualiza en tiempo real
                </p>
            </aside>
        </div>
    )
}

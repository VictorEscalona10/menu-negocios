"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { updateCategoriesOrder } from "@/src/actions/menu"
import { SortableProductList } from "./SortableProductList"
import { DeleteButton } from "./DeleteButton"
import { ToggleCategoryAvailability } from "./ToggleCategoryAvailability"

interface SortableCategoryListProps {
  initialCategories: any[];
  deleteCategoryAction: (id: string) => Promise<void>;
  deleteProductAction: (id: string) => Promise<void>;
  categoriesForProducts: any[];
}

export function SortableCategoryList({
  initialCategories,
  deleteCategoryAction,
  deleteProductAction,
  categoriesForProducts
}: SortableCategoryListProps) {
  const [items, setItems] = useState(initialCategories)
  const [isUpdating, setIsUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(initialCategories)
  }, [initialCategories])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      try {
        setIsUpdating(true)
        const newOrderIds = newItems.map(item => item.id)
        await updateCategoriesOrder(newOrderIds)
      } catch (error) {
        console.error("Error updating category order", error)
        setItems(initialCategories)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  if (!mounted) return null;

  return (
    <DndContext
      id="categories-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className={`space-y-10 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
        <SortableContext
          items={items.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((category) => (
            <SortableCategoryItem
              key={category.id}
              category={category}
              deleteCategoryAction={deleteCategoryAction}
              deleteProductAction={deleteProductAction}
              categoriesForProducts={categoriesForProducts}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}

function SortableCategoryItem({
  category,
  deleteCategoryAction,
  deleteProductAction,
  categoriesForProducts
}: any) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  const boundDeleteCategory = deleteCategoryAction.bind(null, category.id);

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-50' : ''}`}>
      <div className={`flex items-center justify-between mb-6 p-2 pl-4 rounded-xl group border transition-all ${
        category.isActive ? 'bg-zinc-50/80 border-zinc-100 hover:shadow-sm' : 'bg-zinc-100/50 border-zinc-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          <div className="flex flex-col">
            <h3 className={`text-xl font-bold tracking-tight transition-colors ${category.isActive ? 'text-zinc-900' : 'text-zinc-400 line-through'}`}>
              {category.name}
            </h3>
            {!category.isActive && (
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Desactivada</span>
            )}
          </div>

          {/* Switch de activar/desactivar */}
          <ToggleCategoryAvailability
            categoryId={category.id}
            isActive={category.isActive}
            categoryName={category.name}
          />

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DeleteButton
              deleteAction={boundDeleteCategory}
              itemName={category.name}
              isCategory={true}
            />
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-zinc-200/50 rounded-lg transition-colors text-zinc-500 mr-2"
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`animate-in fade-in slide-in-from-top-2 duration-300 ${!category.isActive ? 'opacity-50 grayscale' : ''}`}>
          {category.products.length === 0 ? (
            <p className="text-sm text-zinc-400 italic ml-12 mb-8">Categoría vacía.</p>
          ) : (
            <SortableProductList
              categoryId={category.id}
              initialProducts={category.products}
              categories={categoriesForProducts}
              deleteProductAction={deleteProductAction}
            />
          )}
        </div>
      )}
    </div>
  )
}

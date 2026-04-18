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
  verticalListSortingStrategy 
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { updateProductsOrder } from "@/src/actions/menu"
import { SortableProductCard } from "./SortableProductCard"

interface SortableProductListProps {
  categoryId: string;
  initialProducts: any[];
  categories: any[];
  deleteProductAction: (id: string) => Promise<void>;
}

export function SortableProductList({ categoryId, initialProducts, categories, deleteProductAction }: SortableProductListProps) {
  const [items, setItems] = useState(initialProducts)
  const [isUpdating, setIsUpdating] = useState(false)

  // Sincronizar estado local cuando los props cambian (importante después de revalidatePath)
  useEffect(() => {
    setItems(initialProducts)
  }, [initialProducts])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement to drag, allows clicking buttons inside card
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
        await updateProductsOrder(newOrderIds)
      } catch (error) {
        console.error("Error updating order", error)
        // Revert UI on fail
        setItems(items)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  return (
    <DndContext 
      id={categoryId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className={`grid grid-cols-1 gap-4 ml-2 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
        <SortableContext 
          items={items.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((product) => {
             // Binding actions locally so the card can consume them directly
             const boundDeleteProduct = deleteProductAction.bind(null, product.id)
             
             return (
              <SortableProductCard 
                key={product.id}
                product={product}
                categories={categories}
                deleteAction={boundDeleteProduct}
              />
            )
          })}
        </SortableContext>
      </div>
    </DndContext>
  )
}

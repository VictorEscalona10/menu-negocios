"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ProductCard } from "./ProductCard"

interface SortableProductCardProps {
  product: any;
  categories: any[];
  deleteAction: any;
}

export function SortableProductCard({ product, categories, deleteAction }: SortableProductCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? 'opacity-70 shadow-2xl scale-[1.02]' : ''} transition-shadow duration-200`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 transition-colors z-10 touch-none"
        title="Arrastrar para ordenar"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <div className="pl-6 sm:pl-8">
        <ProductCard 
            product={product}
            categories={categories}
            deleteAction={deleteAction}
        />
      </div>
    </div>
  )
}

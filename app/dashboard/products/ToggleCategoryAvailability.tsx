// app/dashboard/products/ToggleCategoryAvailability.tsx
'use client'

import { useTransition } from 'react'
import { toggleCategoryAvailability } from '@/src/actions/menu'

interface ToggleCategoryAvailabilityProps {
    categoryId: string;
    isActive: boolean;
    categoryName: string;
}

export function ToggleCategoryAvailability({ categoryId, isActive, categoryName }: ToggleCategoryAvailabilityProps) {
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(() => {
            toggleCategoryAvailability(categoryId, isActive)
        })
    }

    return (
        <button
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            disabled={isPending}
            title={isActive ? `Desactivar "${categoryName}"` : `Activar "${categoryName}"`}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${
                isActive ? 'bg-emerald-500' : 'bg-zinc-200'
            }`}
        >
            <span
                className={`inline-block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
            {/* Spinner overlay mientras procesa */}
            {isPending && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                </span>
            )}
        </button>
    )
}

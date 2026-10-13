import {
    GalleryHorizontal,
    Image as ImageIcon,
    LayoutTemplate,
    Share2,
    Tags,
    Type,
    UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SectionType } from '@/src/types/customization'

export type SectionMeta = {
    label: string
    hint: string
    icon: LucideIcon
}

// Icono + etiqueta por tipo de sección (usado en canvas, sidebar y paneles)
export const SECTION_META: Record<SectionType, SectionMeta> = {
    header: { label: 'Encabezado', hint: 'Logo, banner y redes del header', icon: LayoutTemplate },
    'category-nav': { label: 'Categorías', hint: 'Navegación de categorías', icon: Tags },
    menu: { label: 'Menú', hint: 'Lista, grid o linktree de productos', icon: UtensilsCrossed },
    social: { label: 'Redes sociales', hint: 'Enlaces a tus redes', icon: Share2 },
    text: { label: 'Texto', hint: 'Título y párrafo', icon: Type },
    image: { label: 'Imagen', hint: 'Banner con texto superpuesto', icon: ImageIcon },
    carousel: { label: 'Carrusel', hint: 'Galería de imágenes', icon: GalleryHorizontal },
}

import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { saveLayoutSchema, type DesignStyle } from '../src/types/customization.ts'

type SectionType =
  | 'header'
  | 'category-nav'
  | 'menu'
  | 'social'
  | 'text'
  | 'image'
  | 'carousel'

type Alignment = 'left' | 'center' | 'full'
type DeviceView = 'phone' | 'tablet' | 'desktop'

type GlobalConfig = {
  backgroundColor: string
  textColor: string
  subtextColor: string
  accentColor: string
  buttonTextColor: string
  cardBackgroundColor: string
  designStyle: DesignStyle
  fontHeading: string
  fontBody: string
}

type HeaderConfig = {
  showLogo: boolean
  layout: 'centered' | 'inline'
  style: 'classic' | 'minimal' | 'editorial'
}

type CategoryNavConfig = {
  style: 'pills' | 'tabs' | 'minimal'
  sticky: boolean
  showCount: boolean
}

type MenuConfig = {
  layout: 'LIST' | 'GRID' | 'LINKTREE' | 'BENTO'
  showImages: boolean
  showPrices: boolean
  showDescriptions: boolean
  columns: 1 | 2 | 3
  gap: 'sm' | 'md' | 'lg'
  cardStyle: 'default' | 'outlined' | 'filled'
}

type TextConfig = {
  heading?: string
  subheading?: string
  body: string
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  textAlign: 'left' | 'center' | 'right'
  textColor?: string
  bgColor?: string
  padding: string
}

type ImageConfig = {
  imageUrl: string
  alt: string
  opacity: number
  overlayText?: string
  overlaySubheading?: string
  ctaText?: string
  ctaUrl?: string
  borderRadius: string
  height: 'auto' | 'sm' | 'md' | 'lg'
}

type CarouselItem = {
  id: string
  imageUrl: string
  opacity: number
  overlayText?: string
  overlaySubheading?: string
  ctaText?: string
  ctaUrl?: string
}

type CarouselConfig = {
  autoPlay: boolean
  interval: number
  showDots: boolean
  showArrows: boolean
  perView: 1 | 2 | 3
  height: 'sm' | 'md' | 'lg'
  items: CarouselItem[]
}

type SocialPlatform = {
  id: string
  type: 'instagram' | 'tiktok' | 'whatsapp' | 'maps' | 'custom'
  url: string
  label?: string
}

type SocialConfig = {
  platforms: SocialPlatform[]
  layout: 'row' | 'grid'
  iconSize: 'sm' | 'md' | 'lg'
  showLabels: boolean
  bgColor?: string
  padding?: string
}

type SectionConfig =
  | HeaderConfig
  | CategoryNavConfig
  | MenuConfig
  | TextConfig
  | ImageConfig
  | CarouselConfig
  | SocialConfig

type Section = {
  id: string
  type: SectionType
  visible: boolean
  alignment: Alignment
  config: SectionConfig
}

type AdvancedCustomization = {
  version: 1
  deviceView: DeviceView
  global: GlobalConfig
  sections: Section[]
}

type SeedTemplate = {
  id: string
  name: string
  description: string
  scope: 'FULL_PAGE'
  previewUrl: string
  configJson: AdvancedCustomization
  isPublic: boolean
  storeId: string | null
}

const uid = (key: string, suffix: string): string => `${key}-${suffix}`

function previewUrl(
  label: string,
  palette: { bg: string; card: string; accent: string; text: string },
): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">' +
    `<rect width="320" height="200" fill="${palette.bg}"/>` +
    `<rect x="16" y="16" width="44" height="44" rx="22" fill="${palette.accent}"/>` +
    `<rect x="72" y="24" width="140" height="12" rx="6" fill="${palette.text}" opacity="0.85"/>` +
    `<rect x="72" y="44" width="90" height="8" rx="4" fill="${palette.text}" opacity="0.4"/>` +
    `<rect x="16" y="76" width="136" height="52" rx="10" fill="${palette.card}"/>` +
    `<rect x="168" y="76" width="136" height="52" rx="10" fill="${palette.card}"/>` +
    `<rect x="28" y="92" width="64" height="8" rx="4" fill="${palette.text}" opacity="0.6"/>` +
    `<rect x="28" y="108" width="40" height="10" rx="5" fill="${palette.accent}"/>` +
    `<rect x="180" y="92" width="64" height="8" rx="4" fill="${palette.text}" opacity="0.6"/>` +
    `<rect x="180" y="108" width="40" height="10" rx="5" fill="${palette.accent}"/>` +
    `<rect x="16" y="144" width="288" height="40" rx="10" fill="${palette.card}"/>` +
    `<circle cx="44" cy="164" r="10" fill="${palette.accent}"/>` +
    `<circle cx="72" cy="164" r="10" fill="${palette.accent}" opacity="0.6"/>` +
    `<circle cx="100" cy="164" r="10" fill="${palette.accent}" opacity="0.3"/>` +
    `<text x="288" y="169" text-anchor="end" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${palette.text}">${label}</text>` +
    '</svg>'
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const headerSection = (
  key: string,
  config: Partial<HeaderConfig> = {},
): Section => ({
  id: uid(key, 'header'),
  type: 'header',
  visible: true,
  alignment: 'center',
  config: {
    showLogo: true,
    layout: 'centered',
    style: 'classic',
    ...config,
  },
})

const categoryNavSection = (
  key: string,
  config: Partial<CategoryNavConfig> = {},
): Section => ({
  id: uid(key, 'category-nav'),
  type: 'category-nav',
  visible: true,
  alignment: 'full',
  config: { style: 'pills', sticky: true, showCount: true, ...config },
})

const menuSection = (key: string, config: Partial<MenuConfig> = {}): Section => ({
  id: uid(key, 'menu'),
  type: 'menu',
  visible: true,
  alignment: 'full',
  config: {
    layout: 'GRID',
    showImages: true,
    showPrices: true,
    showDescriptions: true,
    columns: 2,
    gap: 'md',
    cardStyle: 'default',
    ...config,
  },
})

const textSection = (
  key: string,
  config: Partial<TextConfig> & { body: string },
  alignment: Alignment = 'center',
): Section => ({
  id: uid(key, 'text'),
  type: 'text',
  visible: true,
  alignment,
  config: { fontSize: 'md', textAlign: 'center', padding: '24px 16px', ...config },
})

const imageSection = (key: string, config: Partial<ImageConfig> = {}): Section => ({
  id: uid(key, 'image'),
  type: 'image',
  visible: true,
  alignment: 'full',
  config: {
    imageUrl: '',
    alt: '',
    opacity: 1,
    borderRadius: '12px',
    height: 'md',
    ...config,
  },
})

const carouselSection = (
  key: string,
  config: Partial<CarouselConfig> = {},
): Section => ({
  id: uid(key, 'carousel'),
  type: 'carousel',
  visible: true,
  alignment: 'full',
  config: {
    autoPlay: true,
    interval: 4000,
    showDots: true,
    showArrows: true,
    perView: 3,
    height: 'sm',
    items: [],
    ...config,
  },
})

const socialSection = (key: string, config: Partial<SocialConfig> = {}): Section => ({
  id: uid(key, 'social'),
  type: 'social',
  visible: true,
  alignment: 'center',
  config: { platforms: [], layout: 'row', iconSize: 'md', showLabels: true, ...config },
})

const carouselItem = (
  key: string,
  index: number,
  overrides: Partial<CarouselItem> = {},
): CarouselItem => ({
  id: uid(key, `item-${index}`),
  imageUrl: '',
  opacity: 1,
  ...overrides,
})

// URL placeholder por red: socialPlatformSchema.url exige min(1), una URL vacía
// haría que el configJson no pase saveLayoutSchema y applyTemplate fallara.
const DEFAULT_URL_BY_TYPE: Record<SocialPlatform['type'], string> = {
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/@',
  whatsapp: 'https://wa.me/',
  maps: 'https://maps.google.com/',
  custom: 'https://',
}

const platform = (
  key: string,
  type: SocialPlatform['type'],
  label: string,
  url = DEFAULT_URL_BY_TYPE[type],
): SocialPlatform => ({ id: uid(key, type), type, url, label })

const templates: SeedTemplate[] = [
  {
    id: '3f8a1c2e-9b47-4d21-8e05-1a6c0f2b7d41',
    name: 'Moderna',
    description:
      'Material Design: tarjetas elevadas con sombras por capas, pills tonales y tipografía Epilogue.',
    scope: 'FULL_PAGE',
    previewUrl: previewUrl('Moderna', {
      bg: '#f8fafc',
      card: '#ffffff',
      accent: '#2563eb',
      text: '#0f172a',
    }),
    isPublic: true,
    storeId: null,
    configJson: {
      version: 1,
      deviceView: 'desktop',
      global: {
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        subtextColor: '#64748b',
        accentColor: '#2563eb',
        buttonTextColor: '#ffffff',
        cardBackgroundColor: '#ffffff',
        designStyle: 'material',
        fontHeading: 'Epilogue',
        fontBody: 'Manrope',
      },
      sections: [
        headerSection('moderna'),
        categoryNavSection('moderna'),
        menuSection('moderna', { layout: 'GRID', columns: 2, gap: 'md' }),
        textSection('moderna', {
          heading: 'Bienvenido a nuestro local',
          subheading: 'Pide en línea y recibe en casa',
          body: 'Explora el menú completo, arma tu pedido y recíbelo por WhatsApp. Rápido, fácil y sin registros.',
          fontSize: 'lg',
          padding: '32px 16px',
        }),
        imageSection('moderna', {
          overlayText: 'Promoción de la semana',
          overlaySubheading: '2x1 en productos seleccionados',
          ctaText: 'Ver promociones',
          borderRadius: '16px',
          height: 'lg',
        }),
        carouselSection('moderna', {
          items: [
            carouselItem('moderna', 1, {
              overlayText: 'Nuevo en el menú',
              overlaySubheading: 'Prueba lo último',
              ctaText: 'Ver novedades',
            }),
            carouselItem('moderna', 2, {
              overlayText: 'Promo de la semana',
              overlaySubheading: 'Solo por tiempo limitado',
              ctaText: 'Aprovechar',
            }),
            carouselItem('moderna', 3, {
              overlayText: 'Favoritos de la casa',
              overlaySubheading: 'Los más pedidos',
              ctaText: 'Pedir ya',
            }),
          ],
        }),
        socialSection('moderna', {
          platforms: [
            platform('moderna', 'instagram', 'Instagram'),
            platform('moderna', 'tiktok', 'TikTok'),
            platform('moderna', 'whatsapp', 'WhatsApp'),
            platform('moderna', 'maps', 'Ubicación'),
          ],
        }),
      ],
    },
  },
  {
    id: '7c2b5e90-4f18-4a63-9d72-2b8e61c4a9f3',
    name: 'Oscura',
    description:
      'Glassmorphism oscuro: tarjetas de vidrio esmerilado sobre negro con acentos ámbar.',
    scope: 'FULL_PAGE',
    previewUrl: previewUrl('Oscura', {
      bg: '#09090b',
      card: '#18181b',
      accent: '#f59e0b',
      text: '#fafafa',
    }),
    isPublic: true,
    storeId: null,
    configJson: {
      version: 1,
      deviceView: 'desktop',
      global: {
        backgroundColor: '#09090b',
        textColor: '#fafafa',
        subtextColor: '#a1a1aa',
        accentColor: '#f59e0b',
        buttonTextColor: '#09090b',
        cardBackgroundColor: 'rgba(255,255,255,0.08)',
        designStyle: 'glassmorphism',
        fontHeading: 'Oswald',
        fontBody: 'Inter',
      },
      sections: [
        headerSection('oscura', { layout: 'inline' }),
        categoryNavSection('oscura', { style: 'tabs', showCount: false }),
        menuSection('oscura', {
          layout: 'LIST',
          cardStyle: 'default',
          columns: 1,
        }),
        textSection('oscura', {
          heading: 'Menú de temporada',
          subheading: 'Sabores que brillan de noche',
          body: 'Ingredientes frescos, combinaciones atrevidas y precios honestos. Todo servido hasta tarde.',
          bgColor: 'rgba(255,255,255,0.05)',
          textColor: '#fafafa',
          padding: '32px 24px',
        }),
        imageSection('oscura', {
          overlayText: 'Edición limitada',
          overlaySubheading: 'Disponible hasta agotar stock',
          ctaText: 'Reservar',
          opacity: 0.95,
          borderRadius: '8px',
          height: 'lg',
        }),
        carouselSection('oscura', {
          interval: 3500,
          items: [
            carouselItem('oscura', 1, {
              overlayText: 'Lo más picante',
              ctaText: 'Ver más',
            }),
            carouselItem('oscura', 2, {
              overlayText: 'Combos nocturnos',
              ctaText: 'Armar combo',
            }),
            carouselItem('oscura', 3, {
              overlayText: 'Bebidas frías',
              ctaText: 'Ver bebidas',
            }),
          ],
        }),
        socialSection('oscura', {
          platforms: [
            platform('oscura', 'instagram', 'Instagram'),
            platform('oscura', 'tiktok', 'TikTok'),
            platform('oscura', 'whatsapp', 'WhatsApp'),
          ],
        }),
      ],
    },
  },
  {
    id: 'd45e2a16-8c94-4b0f-b3d7-5e91a7c2f608',
    name: 'Minimalista',
    description:
      'Flat design: bloques sólidos, bordes definidos, cero sombras. El producto habla por sí solo.',
    scope: 'FULL_PAGE',
    previewUrl: previewUrl('Minimalista', {
      bg: '#ffffff',
      card: '#f4f4f5',
      accent: '#000000',
      text: '#09090b',
    }),
    isPublic: true,
    storeId: null,
    configJson: {
      version: 1,
      deviceView: 'desktop',
      global: {
        backgroundColor: '#ffffff',
        textColor: '#09090b',
        subtextColor: '#71717a',
        accentColor: '#000000',
        buttonTextColor: '#ffffff',
        cardBackgroundColor: '#f4f4f5',
        designStyle: 'flat',
        fontHeading: 'Epilogue',
        fontBody: 'Inter',
      },
      sections: [
        headerSection('minimalista', {
          layout: 'inline',
          style: 'minimal',
        }),
        categoryNavSection('minimalista', {
          style: 'minimal',
          sticky: false,
          showCount: false,
        }),
        menuSection('minimalista', {
          layout: 'LIST',
          showDescriptions: false,
          columns: 1,
          gap: 'sm',
          cardStyle: 'default',
        }),
        textSection(
          'minimalista',
          {
            heading: 'Simple, pero perfecto',
            body: 'Pocas cosas bien hechas: producto fresco, servicio rápido y un menú que no abruma.',
            textAlign: 'left',
            padding: '16px 0',
          },
          'left',
        ),
        imageSection('minimalista', {
          borderRadius: '0px',
          height: 'sm',
        }),
        carouselSection('minimalista', {
          autoPlay: false,
          showDots: false,
          items: [
            carouselItem('minimalista', 1),
            carouselItem('minimalista', 2),
          ],
        }),
        socialSection('minimalista', {
          iconSize: 'sm',
          showLabels: false,
        }),
      ],
    },
  },
  {
    id: '6b9f43d7-2a51-4c88-91ef-c3d05a8b2e76',
    name: 'Colorida',
    description:
      'Liquid Glass + layout bento: vidrio líquido con bloque destacado, naranjas intensos y energía total.',
    scope: 'FULL_PAGE',
    previewUrl: previewUrl('Colorida', {
      bg: '#fff7ed',
      card: '#ffffff',
      accent: '#f97316',
      text: '#1f2937',
    }),
    isPublic: true,
    storeId: null,
    configJson: {
      version: 1,
      deviceView: 'desktop',
      global: {
        backgroundColor: '#fff7ed',
        textColor: '#1f2937',
        subtextColor: '#9a3412',
        accentColor: '#f97316',
        buttonTextColor: '#ffffff',
        cardBackgroundColor: 'rgba(255,255,255,0.55)',
        designStyle: 'liquidGlass',
        fontHeading: 'Bebas Neue',
        fontBody: 'Poppins',
      },
      sections: [
        headerSection('colorida'),
        categoryNavSection('colorida'),
        menuSection('colorida', {
          layout: 'BENTO',
          gap: 'md',
          columns: 2,
          cardStyle: 'default',
        }),
        textSection('colorida', {
          heading: '¡Hola, hola!',
          subheading: 'Colores que dan hambre',
          body: 'Cada plato es una explosión de sabor. Elige, combina y comparte con los tuyos.',
          fontSize: 'xl',
          bgColor: '#ffedd5',
          padding: '32px 24px',
        }),
        imageSection('colorida', {
          overlayText: '¡Promo bomba!',
          overlaySubheading: 'Solo este fin de semana',
          ctaText: 'Quiero probarlo',
          borderRadius: '20px',
          height: 'lg',
        }),
        carouselSection('colorida', {
          interval: 3000,
          items: [
            carouselItem('colorida', 1, {
              overlayText: 'Nuevo sabor',
              ctaText: 'Probar',
            }),
            carouselItem('colorida', 2, {
              overlayText: 'Combo ahorro',
              ctaText: 'Ver combo',
            }),
            carouselItem('colorida', 3, {
              overlayText: 'Edición especial',
              ctaText: 'Pedir',
            }),
          ],
        }),
        socialSection('colorida', {
          layout: 'grid',
          iconSize: 'lg',
          platforms: [
            platform('colorida', 'instagram', 'Instagram'),
            platform('colorida', 'tiktok', 'TikTok'),
            platform('colorida', 'whatsapp', 'WhatsApp'),
            platform('colorida', 'maps', 'Ubicación'),
          ],
        }),
      ],
    },
  },
  {
    id: 'e1c7a954-6d23-4f70-b18a-94f6e32c50bd',
    name: 'Boutique',
    description:
      'Neumorfismo suave: superficies extruidas, sombras de luz y elegancia serena en tonos piedra.',
    scope: 'FULL_PAGE',
    previewUrl: previewUrl('Boutique', {
      bg: '#fafaf9',
      card: '#ffffff',
      accent: '#854d0e',
      text: '#1c1917',
    }),
    isPublic: true,
    storeId: null,
    configJson: {
      version: 1,
      deviceView: 'desktop',
      global: {
        backgroundColor: '#fafaf9',
        textColor: '#1c1917',
        subtextColor: '#78716c',
        accentColor: '#854d0e',
        buttonTextColor: '#ffffff',
        cardBackgroundColor: '#ffffff',
        designStyle: 'neumorphism',
        fontHeading: 'Playfair Display',
        fontBody: 'Lato',
      },
      sections: [
        headerSection('boutique', {
          layout: 'inline',
        }),
        categoryNavSection('boutique', {
          style: 'minimal',
          showCount: false,
        }),
        menuSection('boutique', {
          layout: 'LINKTREE',
          showDescriptions: false,
          columns: 1,
          gap: 'md',
          cardStyle: 'default',
        }),
        textSection('boutique', {
          heading: 'Hecho con dedicación',
          subheading: 'Ediciones limitadas de autor',
          body: 'Piezas únicas, materiales seleccionados y un servicio que hace la diferencia.',
          fontSize: 'lg',
          padding: '40px 24px',
        }),
        imageSection('boutique', {
          overlayText: 'Colección del mes',
          overlaySubheading: 'Descúbrela antes que nadie',
          ctaText: 'Descubrir',
          borderRadius: '4px',
          height: 'lg',
        }),
        carouselSection('boutique', {
          interval: 5000,
          showArrows: false,
          items: [
            carouselItem('boutique', 1, { overlayText: 'Novedades' }),
            carouselItem('boutique', 2, { overlayText: 'Más vendidos' }),
            carouselItem('boutique', 3, { overlayText: 'Temporada' }),
          ],
        }),
        socialSection('boutique', {
          iconSize: 'sm',
          platforms: [
            platform('boutique', 'instagram', 'Instagram'),
            platform('boutique', 'maps', 'Ubicación'),
            platform('boutique', 'whatsapp', 'WhatsApp'),
          ],
        }),
      ],
    },
  },
  {
    id: '2a6d80f3-5e49-4b16-8c7d-a0f95e14b3c2',
    name: 'Cafetería',
    description:
      'Glassmorphism cálido: vidrio crema sobre fondo de barrio, marrones suaves y café recién hecho.',
    scope: 'FULL_PAGE',
    previewUrl: previewUrl('Cafetería', {
      bg: '#fdfbf7',
      card: '#ffffff',
      accent: '#92400e',
      text: '#292524',
    }),
    isPublic: true,
    storeId: null,
    configJson: {
      version: 1,
      deviceView: 'desktop',
      global: {
        backgroundColor: '#fdfbf7',
        textColor: '#292524',
        subtextColor: '#78716c',
        accentColor: '#92400e',
        buttonTextColor: '#ffffff',
        cardBackgroundColor: 'rgba(255,255,255,0.6)',
        designStyle: 'glassmorphism',
        fontHeading: 'Playfair Display',
        fontBody: 'DM Sans',
      },
      sections: [
        headerSection('cafeteria', { style: 'editorial' }),
        categoryNavSection('cafeteria', { sticky: false }),
        menuSection('cafeteria', {
          layout: 'LIST',
          columns: 1,
          gap: 'md',
        }),
        textSection('cafeteria', {
          heading: 'Café de verdad',
          subheading: 'Tostado artesanal cada mañana',
          body: 'Pide tu café favorito junto a algo rico para acompañar. Aquí siempre hay un lugar para ti.',
          bgColor: '#f5efe6',
          padding: '32px 16px',
        }),
        imageSection('cafeteria', {
          overlayText: 'Nuevo: frappés de temporada',
          overlaySubheading: 'Solo por unos días',
          ctaText: 'Ver carta',
          borderRadius: '12px',
        }),
        carouselSection('cafeteria', {
          interval: 4500,
          items: [
            carouselItem('cafeteria', 1, {
              overlayText: 'Café del día',
              ctaText: 'Ver opciones',
            }),
            carouselItem('cafeteria', 2, {
              overlayText: 'Postres caseros',
              ctaText: 'Antojar',
            }),
            carouselItem('cafeteria', 3, {
              overlayText: 'Desayunos',
              ctaText: 'Empezar el día',
            }),
          ],
        }),
        socialSection('cafeteria', {
          platforms: [
            platform('cafeteria', 'whatsapp', 'WhatsApp'),
            platform('cafeteria', 'instagram', 'Instagram'),
            platform('cafeteria', 'maps', 'Ubicación'),
          ],
        }),
      ],
    },
  },
]

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL en el archivo .env')
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString })),
  })

  try {
    console.log(`\nSeed de plantillas: ${templates.length} plantillas\n`)

    // Gate: si un configJson no pasa saveLayoutSchema, applyTemplate fallaría
    // en runtime con "Plantilla inválida". Fallamos aquí, antes de tocar la DB.
    for (const template of templates) {
      const parsed = saveLayoutSchema.safeParse(template.configJson)
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `    - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
          .join('\n')
        throw new Error(`configJson inválido en "${template.name}":\n${issues}`)
      }
    }

    for (const template of templates) {
      const { id, ...data } = template
      const saved = await prisma.customizationTemplate.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      })
      console.log(`  OK  ${saved.name} (${saved.id})`)
    }

    const savedTemplates = await prisma.customizationTemplate.findMany({
      where: { id: { in: templates.map((t) => t.id) } },
      select: { id: true, name: true, scope: true, isPublic: true, storeId: true },
      orderBy: { name: 'asc' },
    })

    console.log(`\nVerificacion: ${savedTemplates.length} plantillas en CustomizationTemplate`)
    for (const t of savedTemplates) {
      console.log(
        `  - ${t.name} | scope=${t.scope} | isPublic=${t.isPublic} | storeId=${t.storeId ?? 'null'}`,
      )
    }
    console.log('')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Error al ejecutar seed-templates:', error)
  process.exitCode = 1
})

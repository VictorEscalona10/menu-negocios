import { z } from 'zod';

export type CustomizationMode = 'THEME' | 'AVANCED';

export type SectionType =
  | 'header'
  | 'category-nav'
  | 'menu'
  | 'social'
  | 'text'
  | 'image'
  | 'carousel';

export type DeviceView = 'phone' | 'tablet' | 'desktop';

// Estilo visual global: pinta cards, pills de nav, chips y backdrop de página.
export type DesignStyle =
  | 'classic'
  | 'material'
  | 'flat'
  | 'glassmorphism'
  | 'liquidGlass'
  | 'neumorphism';

export const DESIGN_STYLES: DesignStyle[] = [
  'classic',
  'material',
  'flat',
  'glassmorphism',
  'liquidGlass',
  'neumorphism',
];

export const DEFAULT_DEVICE_VIEW: DeviceView = 'desktop';

export type Alignment = 'left' | 'center' | 'full';

export type MoveDirection = 'up' | 'down' | 'start' | 'end';

export type TemplateScope = 'FULL_PAGE' | 'SECTION';

export type SectionConfig =
  | HeaderSectionConfig
  | CategoryNavSectionConfig
  | MenuSectionConfig
  | SocialSectionConfig
  | TextSectionConfig
  | ImageSectionConfig
  | CarouselSectionConfig;

export type HeaderStyle = 'classic' | 'minimal' | 'editorial';

export interface HeaderSectionConfig {
  showLogo: boolean;
  layout: 'centered' | 'inline';
  /** Variante visual del encabezado (default = diseño actual) */
  style: HeaderStyle;
  /** Título propio (fallback: nombre del negocio) */
  title?: string;
  /** Subtítulo propio (fallback: "Menú Digital · Pedido Online") */
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
}

export interface CategoryNavSectionConfig {
  style: 'pills' | 'tabs' | 'minimal';
  sticky: boolean;
  showCount: boolean;
  /** Título opcional sobre la navegación de categorías */
  heading?: string;
  bgColor?: string;
  textColor?: string;
}

export interface MenuSectionConfig {
  layout: 'LIST' | 'GRID' | 'LINKTREE' | 'BENTO';
  /** Variante visual dentro del layout elegido (default = diseño actual) */
  layoutStyle?: MenuLayoutStyle;
  showImages: boolean;
  showPrices: boolean;
  showDescriptions: boolean;
  /** Muestra el precio convertido a Bs debajo del precio en USD (default true). */
  showBsPrice?: boolean;
  columns: 1 | 2 | 3;
  gap: 'sm' | 'md' | 'lg';
  cardStyle: 'default' | 'outlined' | 'filled';
  /** Título opcional sobre la lista de productos */
  heading?: string;
  subheading?: string;
  bgColor?: string;
  textColor?: string;
}

/** Colores opcionales que toda sección puede sobreescribir (fallback: global) */
export interface SectionColorOverrides {
  bgColor?: string;
  textColor?: string;
}

export type MenuLayoutStyle =
  | 'CLASSIC'
  | 'CARD'
  | 'HORIZONTAL'
  | 'FLAT'
  | 'DIVIDER'
  | 'FEATURED';

export type MenuLayout = MenuSectionConfig['layout'];

/** Variantes de diseño válidas por layout (CLASSIC siempre = diseño actual) */
export const MENU_LAYOUT_STYLES = {
  LIST: ['CLASSIC', 'DIVIDER', 'FEATURED'],
  GRID: ['CLASSIC', 'HORIZONTAL', 'FLAT'],
  BENTO: ['CLASSIC', 'HORIZONTAL', 'FLAT'],
  LINKTREE: ['CLASSIC', 'CARD'],
} as const satisfies Record<MenuLayout, readonly MenuLayoutStyle[]>;


export interface TextSectionConfig {
  heading?: string;
  subheading?: string;
  body: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  textAlign: 'left' | 'center' | 'right';
  textColor?: string;
  bgColor?: string;
  padding: string;
}

export interface ImageSectionConfig {
  imageUrl: string;
  alt: string;
  opacity: number;
  overlayText?: string;
  overlaySubheading?: string;
  /** Color propio del subtítulo superpuesto (fallback: subtext global) */
  overlaySubheadingColor?: string;
  ctaText?: string;
  ctaUrl?: string;
  borderRadius: string;
  height: 'auto' | 'sm' | 'md' | 'lg';
  bgColor?: string;
  textColor?: string;
}

export interface CarouselSectionConfig {
  autoPlay: boolean;
  interval: number;
  showDots: boolean;
  showArrows: boolean;
  /** Cuántas imágenes se ven a la vez (1-3). Reemplaza la lógica por deviceView. */
  perView: 1 | 2 | 3;
  /** Alto de cada slide del carrusel. */
  height: 'sm' | 'md' | 'lg';
  items: CarouselItem[];
  bgColor?: string;
  textColor?: string;
}

export interface CarouselItem {
  id: string;
  imageUrl: string;
  opacity: number;
  overlayText?: string;
  overlaySubheading?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface SocialSectionConfig {
  platforms: SocialPlatform[];
  layout: 'row' | 'grid';
  iconSize: 'sm' | 'md' | 'lg';
  showLabels: boolean;
  /** Alineación horizontal de los íconos dentro de la sección. */
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
  padding?: string;
}

export interface SocialPlatform {
  id: string;
  type: 'instagram' | 'tiktok' | 'whatsapp' | 'maps' | 'custom';
  url: string;
  label?: string;
}

export interface GlobalStyle {
  backgroundColor: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  buttonTextColor: string;
  cardBackgroundColor: string;
  designStyle: DesignStyle;
  fontHeading: string;
  fontBody: string;
}

export interface Section {
  id: string;
  type: SectionType;
  visible: boolean;
  alignment: Alignment;
  config: SectionConfig;
}

export interface AdvancedCustomization {
  version: 1;
  global: GlobalStyle;
  sections: Section[];
  deviceView: DeviceView;
}

// ---------- DEFAULTS COMPARTIDOS (store + server actions) ----------

export const defaultGlobalStyle: GlobalStyle = {
  backgroundColor: '#0e0e10',
  textColor: '#ffffff',
  subtextColor: '#a1a1aa',
  accentColor: '#FF5630',
  buttonTextColor: '#ffffff',
  cardBackgroundColor: 'rgba(255,255,255,0.06)',
  designStyle: 'classic',
  fontHeading: 'Epilogue',
  fontBody: 'Manrope',
};

export const createDefaultLayout = (): AdvancedCustomization => ({
  version: 1,
  global: { ...defaultGlobalStyle },
  sections: [],
  deviceView: DEFAULT_DEVICE_VIEW,
});

export const defaultAlignmentFor = (type: SectionType): Alignment =>
  type === 'header' || type === 'text' ? 'center' : 'full';


// ---------- ZOD SCHEMAS ----------

export const CUSTOMIZATION_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const CUSTOMIZATION_MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

const cssColor = z
  .string()
  .regex(
    /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))$/,
    'Color inválido (usa formato hex, ej: #ff5630, o rgba)',
  );

export const customizationModeSchema = z.enum(['THEME', 'AVANCED']);

export const sectionTypeSchema = z.enum([
  'header',
  'category-nav',
  'menu',
  'social',
  'text',
  'image',
  'carousel',
]);

export const deviceViewSchema = z.enum(['phone', 'tablet', 'desktop']);

// default('classic'): layouts guardados antes de existir el campo siguen siendo válidos
export const designStyleSchema = z
  .enum(['classic', 'material', 'flat', 'glassmorphism', 'liquidGlass', 'neumorphism'])
  .default('classic');

export const alignmentSchema = z.enum(['left', 'center', 'full']);

const safeFontName = z
  .string()
  .trim()
  .min(1, 'Tipografía obligatoria')
  .max(50, 'Máximo 50 caracteres')
  .regex(/^[a-zA-Z0-9\s\-]+$/, 'Nombre de tipografía inválido (solo caracteres alfanuméricos)');

export const globalStyleSchema = z.object({
  backgroundColor: cssColor,
  textColor: cssColor,
  subtextColor: cssColor,
  accentColor: cssColor,
  buttonTextColor: cssColor,
  cardBackgroundColor: cssColor,
  designStyle: designStyleSchema,
  fontHeading: safeFontName,
  fontBody: safeFontName,
});

export const headerSectionSchema = z.object({
  showLogo: z.boolean(),
  layout: z.enum(['centered', 'inline']),
  style: z.enum(['classic', 'minimal', 'editorial']).default('classic'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  bgColor: cssColor.optional(),
  textColor: cssColor.optional(),
});

export const categoryNavSectionSchema = z.object({
  style: z.enum(['pills', 'tabs', 'minimal']),
  sticky: z.boolean(),
  showCount: z.boolean(),
  heading: z.string().optional(),
  bgColor: cssColor.optional(),
  textColor: cssColor.optional(),
});

export const menuSectionSchema = z.object({
  layout: z.enum(['LIST', 'GRID', 'LINKTREE', 'BENTO']),
  layoutStyle: z
    .enum(['CLASSIC', 'CARD', 'HORIZONTAL', 'FLAT', 'DIVIDER', 'FEATURED'])
    .default('CLASSIC'),
  showImages: z.boolean(),
  showPrices: z.boolean(),
  showDescriptions: z.boolean(),
  showBsPrice: z.boolean().default(true),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  gap: z.enum(['sm', 'md', 'lg']),
  cardStyle: z.enum(['default', 'outlined', 'filled']),
  heading: z.string().optional(),
  subheading: z.string().optional(),
  bgColor: cssColor.optional(),
  textColor: cssColor.optional(),
});

export const textSectionSchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  body: z.string({ message: 'El texto es obligatorio' }),
  fontSize: z.enum(['sm', 'md', 'lg', 'xl', '2xl']),
  textAlign: z.enum(['left', 'center', 'right']),
  textColor: cssColor.optional(),
  bgColor: cssColor.optional(),
  padding: z.string(),
});

export const imageSectionSchema = z.object({
  imageUrl: z.string(),
  alt: z.string(),
  opacity: z.number().min(0, 'Opacidad mínima 0').max(1, 'Opacidad máxima 1'),
  overlayText: z.string().optional(),
  overlaySubheading: z.string().optional(),
  overlaySubheadingColor: cssColor.optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
  borderRadius: z.string(),
  height: z.enum(['auto', 'sm', 'md', 'lg']),
  bgColor: cssColor.optional(),
  textColor: cssColor.optional(),
});

export const carouselItemSchema = z.object({
  id: z.string().min(1, 'El item necesita un id'),
  imageUrl: z.string(),
  opacity: z.number().min(0, 'Opacidad mínima 0').max(1, 'Opacidad máxima 1'),
  overlayText: z.string().optional(),
  overlaySubheading: z.string().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
});

export const carouselSectionSchema = z.object({
  autoPlay: z.boolean(),
  interval: z
    .number({ message: 'El intervalo debe ser un número' })
    .int('El intervalo debe ser un número entero')
    .min(500, 'Intervalo mínimo 500ms')
    .max(60000, 'Intervalo máximo 60000ms'),
  showDots: z.boolean(),
  showArrows: z.boolean(),
  perView: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .default(3),
  height: z.enum(['sm', 'md', 'lg']).default('sm'),
  items: z.array(carouselItemSchema),
  bgColor: cssColor.optional(),
  textColor: cssColor.optional(),
});

export const socialPlatformSchema = z.object({
  id: z.string().min(1, 'La red social necesita un id'),
  type: z.enum(['instagram', 'tiktok', 'whatsapp', 'maps', 'custom']),
  url: z.string().min(1, 'La URL es obligatoria'),
  label: z.string().optional(),
});

export const socialSectionSchema = z.object({
  platforms: z.array(socialPlatformSchema),
  layout: z.enum(['row', 'grid']),
  iconSize: z.enum(['sm', 'md', 'lg']),
  showLabels: z.boolean(),
  align: z.enum(['left', 'center', 'right']).optional(),
  bgColor: cssColor.optional(),
  textColor: cssColor.optional(),
  padding: z.string().optional(),
});

const sectionSchemaFor = (type: z.infer<typeof sectionTypeSchema>) => {
  const base = {
    id: z.string().min(1, 'La sección necesita un id'),
    visible: z.boolean(),
    alignment: alignmentSchema,
  };

  switch (type) {
    case 'header':
      return z.object({ ...base, type: z.literal('header'), config: headerSectionSchema });
    case 'category-nav':
      return z.object({ ...base, type: z.literal('category-nav'), config: categoryNavSectionSchema });
    case 'menu':
      return z.object({ ...base, type: z.literal('menu'), config: menuSectionSchema });
    case 'social':
      return z.object({ ...base, type: z.literal('social'), config: socialSectionSchema });
    case 'text':
      return z.object({ ...base, type: z.literal('text'), config: textSectionSchema });
    case 'image':
      return z.object({ ...base, type: z.literal('image'), config: imageSectionSchema });
    case 'carousel':
      return z.object({ ...base, type: z.literal('carousel'), config: carouselSectionSchema });
  }
};

export const sectionSchema = z.discriminatedUnion('type', [
  sectionSchemaFor('header'),
  sectionSchemaFor('category-nav'),
  sectionSchemaFor('menu'),
  sectionSchemaFor('social'),
  sectionSchemaFor('text'),
  sectionSchemaFor('image'),
  sectionSchemaFor('carousel'),
]);

export const saveLayoutSchema = z.object({
  version: z.literal(1, { message: 'Versión de layout no soportada' }),
  global: globalStyleSchema,
  sections: z.array(sectionSchema),
  deviceView: deviceViewSchema.default('desktop'),
});

export const templateSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
    description: z.string().max(300, 'Máximo 300 caracteres').nullish(),
    scope: z.enum(['FULL_PAGE', 'SECTION']),
    sectionType: sectionTypeSchema.nullish(),
    previewUrl: z.string().min(1, 'La imagen de preview es obligatoria').optional(),
    configJson: z.unknown(),
    isPublic: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const config = value.configJson;
    if (config === null || typeof config !== 'object' || Array.isArray(config)) {
      ctx.addIssue({
        code: 'custom',
        path: ['configJson'],
        message: 'configJson debe ser un objeto JSON',
      });
      return;
    }

    if (value.scope !== 'FULL_PAGE') return;

    const parsed = saveLayoutSchema.safeParse(config);
    if (parsed.success) return;

    for (const issue of parsed.error.issues) {
      ctx.addIssue({
        code: 'custom',
        path: ['configJson', ...issue.path],
        message: issue.message,
      });
    }
  });

export const uploadImageSchema = z.object({
  file: z
    .file()
    .mime(
      [...CUSTOMIZATION_IMAGE_MIME_TYPES],
      'Tipo de archivo no permitido (usa JPEG, PNG, WEBP o GIF)',
    )
    .max(CUSTOMIZATION_MAX_IMAGE_BYTES, 'Archivo muy grande (máximo 10MB)'),
  altText: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

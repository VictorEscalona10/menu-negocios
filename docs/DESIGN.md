# docs/DESIGN.md - Advanced Customization System Design (Updated)

## Overview
This document specifies the design for the Advanced Customization System (ACS) - a WordPress-style drag-and-drop editor for the Menu Negocios platform. The system allows complete visual customization of store fronts including layout, colors, typography, sections, and templates. **New: Device preview mode (phone/tablet/desktop).**

---

## 1. Database Schema Changes

### 1.1 Store Model Update - Enum for `customizationMode`

**Recommendation: Use ENUM over TEXT (approved)**

```prisma
enum CustomizationMode {
  THEME
  AVANCED
}

model Store {
  // ... campos existentes SIN TOCAR ...
  
  // NEW: Modo de personalización (ENUM en DB, default THEME)
  customizationMode CustomizationMode @default(THEME)
  
  // NEW: Relaciones opcionales
  customizationLayout  CustomizationLayout?   // 1:1 con Store
  customizationImages  CustomizationImage[]
  customizationTemplates CustomizationTemplate[]
}
```

**Migration from text to enum (one-time):**
```sql
CREATE TYPE "CustomizationMode" AS ENUM ('THEME', 'AVANCED');
ALTER TABLE "Store" ALTER COLUMN "customizationMode" 
  TYPE "CustomizationMode" USING "customizationMode"::"CustomizationMode";
ALTER TABLE "Store" ALTER COLUMN "customizationMode" 
  SET DEFAULT 'THEME';
```

---

### 1.2 New Tables (3)

#### A. `CustomizationLayout` - Configuración completa por store

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `storeId` | String @unique | **1 layout por store** (obligatorio, no nullable) |
| `layoutJson` | Json | **El JSON completo** del diseño avanzado |
| `version` | Int @default(1) | Versión para historial de cambios |
| `createdAt` | DateTime @default(now()) | |
| `updatedAt` | DateTime @updatedAt | |

**JSON Structure for `layoutJson`** (see §2 below):

---

#### B. `CustomizationTemplate` - Plantillas reutilizables

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `name` | String | Nombre de la plantilla (ej: "Moderna Oscura") |
| `description` | String? | Descripción opcional |
| `scope` | Enum: `FULL_PAGE`, `SECTION` | ¿Aplica a toda página o sección específica? |
| `sectionType` | String? | Si scope=SECTION: type de sección |
| `previewUrl` | String? | URL de imagen preview para el selector |
| `configJson` | JSON | Configuración a inyectar |
| `isPublic` | Boolean @default(true) | Si true, disponible para todos los stores |
| `storeId` | String? | Null = plantilla global; propietario = plantilla privada |
| `createdAt` | DateTime @default(now()) | |
| `updatedAt` | DateTime @updatedAt | |

**JSON Structure for `configJson`** (varía por `scope` y `sectionType`):

*Para `scope: FULL_PAGE`:*
```json
{
  "global": { ... mismos campos que layoutJson.global ... },
  "sections": [ array de SectionConfig ... ]
}
```

*Para `scope: SECTION`:*
```json
{
  "sectionType": "text",  // header | category-nav | menu | social | text | image | carousel
  "config": { ... config específico de sección ... }
}
```

---

#### C. `CustomizationImage` - Referencias de imágenes bucket nuevo

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `storeId` | String | A qué empresa pertenece (FK → Store) |
| `url` | String | URL pública de Supabase (generada al upload) |
| `bucketPath` | String | Path interno para poder borrar después (`advanced-customization/{storeId}/{filename}`) |
| `altText` | String? | Texto alternativo |
| `sectionId` | String? | Sección que la usa (opcional, para limpieza) |
| `createdAt` | DateTime @default(now()) | |
| `updatedAt` | DateTime @updatedAt | |

**Bucket Supabase nuevo:** `advanced-customization`
- Private bucket, access control via signed URLs o RLS policies
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 10MB
- Folder structure: `advanced-customization/{storeId}/{filename}`

---

## 2. Estructura JSON del Layout (layoutJson)

Este es el corazón del sistema. Se guarda en `CustomizationLayout.layoutJson`.

```typescript
interface AdvancedCustomization {
  version: 1;
  
  // Global styles (aplican a todas las secciones)
  global: {
    backgroundColor: string;      // Fondo general de la página
    textColor: string;            // Color texto principal
    subtextColor: string;         // Color texto secundario/placeholder
    accentColor: string;          // Color acento (equivalente themeColor)
    buttonTextColor: string;      // Color texto dentro de botones
    cardBackgroundColor: string;  // Fondo de las tarjetas de producto
    designStyle: DesignStyle;     // Estilo global (classic|material|flat|glassmorphism|liquidGlass|neumorphism)
    fontHeading: string;          // Tipografía para títulos (Epilogue por default)
    fontBody: string;             // Tipografía para cuerpo (Manrope por default)
  };
  
  // Secciones en orden de aparición
  sections: Section[];
}

// ---------- TIPOS PRINCIPARES ----------
type SectionType = 
  | 'header'        // SÓLO ocultar (estructura)
  | 'category-nav'  // SÓLO ocultar (estructura)
  | 'menu'          // SÓLO ocultar (estructura)
  | 'social'        // SÓLO ocultar (estructura)
  | 'text'          // Borrar + ocultar
  | 'image'         // Borrar + ocultar
  | 'carousel';     // Borrar + ocultar

type Alignment = 'left' | 'center' | 'full';

// ---------- INTERFAZ DE SECCIÓN ----------
interface Section {
  id: string;           // UUID único (generado en el front)
  type: SectionType;
  visible: boolean;     // true = visible, false = oculta
  alignment: Alignment; // left | center | full width
  config: SectionConfig; // varía según type
}

// ---------- CONFIGURACIÓN POR TIPO DE SECCIÓN ----------
type SectionConfig = 
  | HeaderSectionConfig
  | CategoryNavSectionConfig
  | MenuSectionConfig
  | SocialSectionConfig
  | TextSectionConfig
  | ImageSectionConfig
  | CarouselSectionConfig;

// 1. HEADER (logo + nombre; sin banner ni redes)
interface HeaderSectionConfig {
  showLogo: boolean;           // Mostrar/ocultar logo
  layout: 'centered' | 'inline'; // Logo + nombre alineados o centrados
  style: 'classic' | 'minimal' | 'editorial'; // Variante visual (default: 'classic')
}
// El encabezado se renderiza con el componente compartido
// `sections/HeaderView.tsx` (preview del editor + menú público).
// `style: 'editorial'` fuerza alineación a la izquierda e ignora `layout`.
// `layout` ya no se expone en el formulario del editor (se conserva por compat).
// Banner y redes salen del header: el banner va en una sección Imagen y las
// redes en la sección Social.

// 2. CATEGORY-NAV (solo ocultar)
interface CategoryNavSectionConfig {
  style: 'pills' | 'tabs' | 'minimal'; // Estilo de pills/navegación
  sticky: boolean;                   // Queda fijo arriba al hacer scroll
  showCount: boolean;                // Mostrar contador de productos por categoría
}

// 3. MENU (solo ocultar, usa la lógica de productos existente)
interface MenuSectionConfig {
  layout: 'LIST' | 'GRID' | 'LINKTREE' | 'BENTO'; // BENTO: grid con tarjeta destacada (span 2)
  showImages: boolean;                  // Mostrar imágenes de productos
  showPrices: boolean;                  // Mostrar precios
  showDescriptions: boolean;            // Mostrar descripciones cortas
  columns: 1 | 2 | 3;                   // Número de columnas en grid
  gap: 'sm' | 'md' | 'lg';              // Espacio entre items
  cardStyle: 'default' | 'outlined' | 'filled'; // Base | Contorno | Tinte de acento (¡nunca acento sólido: debe contrastar con el botón +)
}

// 4. TEXT (borrar + ocultar)
interface TextSectionConfig {
  heading?: string;       // Título principal (opcional)
  subheading?: string;    // Subtítulo (opcional)
  body: string;           // Cuerpo del texto (obligatorio)
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Tamaño de fuente
  textAlign: 'left' | 'center' | 'right'; // Alineación horizontal
  textColor?: string;     // Sobrescribe global (opcional)
  bgColor?: string;       // Color de fondo de la sección (opcional)
  padding: string;        // Espaciado (ej: "16px 24px")
}

// 5. IMAGE (borrar + ocultar)
interface ImageSectionConfig {
  imageUrl: string;           // URL de la imagen (del bucket advanced-customization)
  alt: string;                // Texto alternativo
  opacity: number;            // 0.0 a 1.0 (opacidad general de la imagen)
  overlayText?: string;       // Texto sobre la imagen (ej: "Promoción")
  overlaySubheading?: string; // Subtítulo sobre la imagen
  ctaText?: string;          // Texto del botón CTA
  ctaUrl?: string;          // URL del botón CTA
  borderRadius: string;      // Radio de borde (ej: "8px")
  height: 'auto' | 'sm' | 'md' | 'lg'; // Altura controlada
}

// 6. CAROUSEL (borrar + ocultar)
interface CarouselSectionConfig {
  autoPlay: boolean;          // Rotación automática
  interval: number;           // Velocidad en ms (ej: 3000 = 3 seg)
  showDots: boolean;          // Mostrar indicadores de slide
  showArrows: boolean;        // Mostrar flechas de navegación
  perView: 1 | 2 | 3;         // Imágenes visibles a la vez (default: 3)
  height: 'sm' | 'md' | 'lg'; // Alto de cada slide: h-24 | h-36 | h-48 (default: 'sm')
  items: CarouselItem[];
}

interface CarouselItem {
  id: string;                        // UUID único
  imageUrl: string;                  // URL de la imagen
  opacity: number;                   // 0.0 a 1.0
  overlayText?: string;              // Texto sobre la imagen
  overlaySubheading?: string;        // Subtítulo sobre la imagen
  ctaText?: string;                  // Texto del botón CTA
  ctaUrl?: string;                   // URL del botón CTA
}

// 7. SOCIAL (solo ocultar, estructura fónica)
interface SocialSectionConfig {
  platforms: SocialPlatform[];
  layout: 'row' | 'grid';          // Iconos en fila o grid
  iconSize: 'sm' | 'md' | 'lg';    // Tamaño de los íconos
  showLabels: boolean;               // Mostrar nombre de la red (instagram, tiktok...)
  bgColor?: string;                  // Color de fondo del bloque
  padding?: string;                  // Espaciado interno
}

interface SocialPlatform {
  id: string;                        // UUID único
  type: 'instagram' | 'tiktok' | 'whatsapp' | 'maps' | 'custom';
  url: string;                       // Enlace al perfil
  label?: string;                    // Texto a mostrar (ej: "@menu.negocios")
}
```

---

## 3. Device Preview Feature (NUEVO REQUERIMIENTO)

### 3.1 `deviceView` field in layout JSON

Added to the `AdvancedCustomization` interface:

```typescript
interface AdvancedCustomization {
  // ...
  deviceView: 'phone' | 'tablet' | 'desktop'; // Nueva propiedad
}
```

**Default value:** `'desktop'` (para compatibilidad con vista actual)

### 3.2 How it works

- **Editor mode:** A dropdown selector in the toolbar allows the user to switch between `phone`, `tablet`, `desktop`
- **State persistence:** The selected `deviceView` is saved in the `layoutJson.deviceView` field
- **Public rendering:** When the public menu page (`/menu/[slug]`) renders in AVANCED mode, it checks `store.customizationLayout.layoutJson.deviceView` and applies appropriate CSS/layouts
- **Preview in editor:** Live preview area updates to show how the menu looks on the selected device

### 3.3 Device-Specific CSS/Layout Rules

| Device | Breakpoint | Section Adjustments |
|--------|------------|--------------------|
| **Phone** | < 640px | - Sections stack vertically<br>- `alignment: full` applied automatically<br>- Font sizes reduced 20%<br>- Grid columns → 1 |
| **Tablet** | 640px - 1024px | - Sections may have 2-column layout<br>- Font sizes medium<br>- Grid columns: 1-2 |
| **Desktop** | > 1024px | - Full layout as designed<br>- All alignment options honored<br>- Grid columns as configured |

> **Nota (carousel):** desde la config por sección, el carrusel usa `CarouselSectionConfig.perView` (1-3) elegido en el editor y **ya no** se deriva de `deviceView`. `height` controla el alto de las slides.

**Implementation approach:**
- Use Tailwind CSS 4 responsive classes based on `deviceView`
- Or apply inline styles with media queries
- The `SectionRenderer` component checks `layoutJson.deviceView` and adjusts accordingly

### 3.4 UI Element

**Toolbar selector** (in `EditorToolbar.tsx`):
```tsx
<select 
  value={layoutJson.deviceView}
  onChange={(e) => setLayoutJson(prev => ({ ...prev, deviceView: e.target.value }))}
  className="rounded-md border-input px-2 py-1">
  <option value="desktop">Escritorio</option>
  <option value="tablet">Tablet</option>
  <option value="phone">Teléfono</option>
</select>
```

---

## 4. Component Architecture (Updated)

### 4.1 New Components (with device preview support)

| Componente | Descripción |
|------------|-------------|
| `AdvancedCustomizationPage` | Página principal `/dashboard/customization` |
| `EditorLayout` | Shell del editor con toolbar + canvas |
| `EditorToolbar` | Barra superior: save, undo/redo, device selector, template picker |
| `EditorCanvas` | Canvas con dnd-kit (secciones arrastrables) |
| `EditorSidebar` | Paleta de secciones + panel de configuración |
| `GlobalStylePanel` | Colores, Estilo de diseño, Fuentes globales |
| `SectionConfigPanel` | Configuración por tipo de sección |
| `TemplatePicker` | Selector de plantillas con preview |
| `SectionRenderer` | Renderiza cada sección según `type` + `config` + `deviceView` |
| `DraggableSection` | Wrapper dnd-kit para reordenar |
| `SectionControls` | Botones: ocultar, borrar, mover arriba/abajo, alinear |
| `TemplateCard` | Card con preview miniatura de plantilla |
| `AdvancedMenuUI` | Renderer público para modo AVANCED (see §5) |

### 4.2 Section Renderer Logic

```typescript
function SectionRenderer({ section, layoutJson }: { section: Section; layoutJson: AdvancedCustomization }) {
  const { deviceView } = layoutJson;
  
  // Ajustar columnas/filas según dispositivo
  const isPhone = deviceView === 'phone';
  const isTablet = deviceView === 'tablet';
  const isDesktop = deviceView === 'desktop';
  
  switch (section.type) {
    case 'menu':
      return <MenuSection 
        config={section.config as MenuSectionConfig}
        isPhone={isPhone}
        isTablet={isTablet}
        isDesktop={isDesktop}
      />
    case 'image':
      return <ImageSection 
        config={section.config as ImageSectionConfig}
        deviceView={deviceView}
      />
    case 'carousel':
      return <CarouselSection 
        config={section.config as CarouselSectionConfig}
        deviceView={deviceView}
      />
    // ... etc
  }
}
```

---

## 5. Public Renderer: `AdvancedMenuUI`

New component at `app/components/AdvancedMenuUI.tsx` that renders the public menu in AVANCED mode.

**Key design:**
- Reuses `FloatingCart` and `ProductConfiguratorModal` from existing code (no modification)
- Reads `store.customizationLayout.layoutJson` for config
- Applies `deviceView` from layout (default desktop if null)
- Falls back to `SharedMenuUI` logic for product cards, modifiers, etc.
- Applies global styles as defaults, section configs override

**Rendering flow:**
```
AdvancedMenuUI
  → Apply global styles (colors, fonts from layoutJson.global)
  → Iterate sections[] in order
  → Skip sections where visible=false
  → For each visible section, render based on type:
    - header → render HeaderView (showLogo + style: classic/minimal/editorial)
    - category-nav → render nav pills
    - menu → render products with layout config (LIST/GRID/BENTO/LINKTREE)
    - text → render text block with heading/subheading/body
    - image → render image with opacity overlay
    - carousel → render carousel with items
    - social → render social links
  → Render FloatingCart at bottom (same as SharedMenuUI)
  → Render ProductConfiguratorModal when product clicked
```

**Fallback:** If `store.customizationMode === 'THEME'` or no layout exists, render `<SharedMenuUI store={store} />` (sistema actual intacto).

---

## 6. Security & Edge Cases (Updated)

### 6.1 Authentication & Authorization

- Only **Store Owners** (authenticated via Supabase) can access `/dashboard/customization`
- Route protection via `middleware.ts` (already protects `/dashboard/*`)
- Each store's customization data is isolated by `store_id`
- Templates marked `is_public: true` are readable by any authenticated user

### 6.2 Data Validation

- All `layoutJson` fields validated via **Zod** schemas on server side (see `src/types/customization.ts`)
- Image upload validation: type, size, dimensions (max 10MB)
- Enum values validated at database level (customizationMode, sectionType, deviceView, etc.)
- Store ownership verified before any write operation

### 6.3 Error States

| Scenario | Error Message | Handling |
|----------|---------------|----------|
| User without auth tries ACS | "Sesión expirada" | Redirect to `/login` |
| Store owner tries another store's sections | "Acceso denegado" | 403 Forbidden |
| Image upload exceeds 10MB | "Archivo muy grande" | Show warning, don't upload |
| Invalid layout JSON config | "Configuración inválida" | Prevent save, show field errors |
| DB constraint violation | "Error de guardado" | Log + user-friendly message |
| Network during save | "Conexión perdida" | Auto-save draft, notify user |
| Device view non-supported | "Modo de visualización no disponible" | Fallback a 'desktop' |

### 6.4 Edge Cases & Border Conditions

1. **Mixed modes**: Store could have `customizationMode: THEME` for some purposes and `AVANCED` for the public view — handled via the branch in `page.tsx`

2. **Device view persistence**: When user switches device view in editor, it's saved immediately in layout JSON. Public view reflects the last saved device.

3. **Template application**: When a template is applied, `deviceView` from the template is merged with the store's current layout, with store settings taking precedence.

4. **Undo/Redo device view changes**: The Zustand store history tracks `layoutJson` changes including `deviceView`, so Ctrl+Z reverts the device selector too.

5. **Empty layout**: If `customizationLayout` is null and mode is AVANCED, show a "Start building" empty state with hints.

6. **Backward compatibility**: Existing stores with `customizationMode: THEME` continue working exactly as before — no breaking changes.

---

## 7. Migration Strategy (Updated)

### Step 1: Database Migration
- Add `CustomizationMode` enum type
- Add `customizationMode` column to Store (default THEME)
- Create `CustomizationLayout`, `CustomizationTemplate`, `CustomizationImage` tables
- Run `prisma migrate deploy`

### Step 2: Storage Bucket
- Create bucket `advanced-customization` in Supabase dashboard
- Configure allowed MIME types and RLS policies
- Set up folder structure

### Step 3: Frontend Implementation
- Add new route `/dashboard/customization`
- Implement component tree (as specified)
- Connect to server actions

### Step 4: Backend Implementation
- Create server actions in `src/actions/customization.ts`
- Add Prisma client methods
- Implement image upload/download logic

### Step 5: Device Preview
- Add `deviceView` to layout JSON schema
- Add device selector UI in toolbar
- Implement device-specific rendering logic

### Step 6: Testing & QA
- Unit tests for Zod schemas
- Integration tests for save/load cycle with device view
- Manual QA of drag-and-drop, template application, device switching
- Permission testing (different stores, public vs owner)

### Step 7: Seed & Launch
- Execute `seed-templates.ts` with 4-6 plantillas
- Launch with `customizationMode: THEME` default for all existing stores
- Opt-in stores can switch to `AVANCED` mode

---

## 8. Visual Design Guidelines (Updated)

### Color Palette (Tailwind CSS 4)
Based on existing Store colors plus ACS-specific additions:

| Color | Variable / Value | Usage |
|-------|------------------|-------|
| `background-neutral` | `#f8fafc` / `#e2e8f0` | Fondos de sección |
| `text-primary` | `#1e293b` / `#0f172a` | Color texto principal |
| `accent-primary` | `var(--theme-color)` / `#ef4444` | Botones, acentos |
| `accent-secondary` | `#10b981` / `#f59e0b | Hover states |
| `border-color` | `#e2e8f0` | Bordes de inputs/sections |

### Typography
- Use fonts from Store: `fontHeading`, `fontBody` (Epilogue, Manrope defaults)
- Additional system fonts as fallback
- Size scale adjusted per device (smaller for phone)

### Responsive Breakpoints (Tailwind CSS 4)
- `sm`: 640px (tablet threshold)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop threshold)
- `xl`: 1280px+

### Interactions
- Drag: `cursor-grab` → `cursor-grabbing` feedback
- Device selector: dropdown con animación suave
- Save: `loading` state con spinner, success toast
- Template apply: modal con before/after comparison
- Hover: `transition-colors` en cards y buttons

---

*Document generated for Spec-Driven Development (SDD)*
*Project: Menu Negocios Platform*
*Version: 1.1 - Advanced Customization System (with Device Preview)*
*Last updated: October 2, 2026*
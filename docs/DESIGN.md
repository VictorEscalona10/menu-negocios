# docs/DESIGN.md - Feature Designs (ACS + Tres Menús)

## Overview
This document specifies the designs of the platform's major features. **Parte I (§1-8):** Advanced Customization System (ACS) - a WordPress-style drag-and-drop editor for complete visual customization of store fronts including layout, colors, typography, sections, and templates (with device preview mode). **Parte II (§9-17):** Sistema de Tres Menús — pedido por WhatsApp, pedido del mesero y pedido del cliente en mesa con QR.

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

# Sistema de Tres Menús (WhatsApp / Mesero / Mesa con QR)

> **Parte II de este documento.** Especifica el feature de pedidos por mesa con meseros.
> Fuente de verdad complementaria: `docs/TASKS.md` (FASE 8 en adelante).

## 9. Overview: los tres tipos de menú

El menú público vive en `/menu/[slug]`. El **modo de pedido** se resuelve en el servidor a partir de la URL y la sesión del mesero:

| # | URL | Modo | Quién pide | Destino del pedido |
|---|-----|------|-----------|--------------------|
| 1 | `/menu/[slug]` (sin queries) | `whatsapp` | Cliente | Panel realtime **+** redirección a `wa.me` (COMPORTAMIENTO ACTUAL, intacto) |
| 2 | `/menu/[slug]?mesa=<qrToken>` (sin sesión mesero) | `table` | Cliente en su mesa | Solo panel, con número de mesa. **Sin WhatsApp** |
| 3 | `/menu/[slug]?mesa=<qrToken>` (con sesión mesero) | `waiter` | Mesero identificado | Solo panel, con número de mesa + mesero + datos del cliente (opcionales) |
| 4 | `/menu/[slug]?mesa=<qrToken>&ver=1` (sin sesión mesero) | `view` | **Nadie (solo lectura)** | **Sin pedidos**: carta para ver; el mesero hace los pedidos desde su panel (§15, QR "solo ver carta") |

### 9.1 Reglas de resolución (server-side, en `app/menu/[slug]/page.tsx`)

1. **Sin query `mesa`** → modo `whatsapp`, siempre. Aunque exista sesión de mesero activa (regla: "el URL sin las querys es la actual por ws").
2. **Con `mesa=<qrToken>`** → buscar `Table` por `qrToken` donde `store.slug = slug` e `isActive = true`.
   - Token inválido/inactivo → pantalla "Código de mesa no válido" + link a `/menu/[slug]` (no se cae al modo WhatsApp).
3. Si el token es válido, leer cookie de sesión de mesero:
   - Sesión válida (token existe, no expirada, mesero `isActive`, pertenece al mismo store) → modo `waiter`.
   - Sin sesión o inválida → modo `table`; y si además la URL trae **`&ver=1`** → modo `view` (solo lectura). **La sesión de mesero siempre gana**: un mesero que abra una URL con `ver=1` queda en modo `waiter`.
4. **Sesión de mesero activa pero sin query `mesa`** → se muestra barra CTA "Elige una mesa para empezar" y el `FloatingCart` bloquea el envío (nunca se envía un pedido de mesero por WhatsApp).
5. **Modo `view`** (QR "solo ver carta"): `OrderModeBar` muestra "Mesa N · Carta de solo lectura · Pide a tu mesero"; en las UIs (THEME y AVANCED) se ocultan el `FloatingCart` y los botones "+", y tocar un producto abre `ProductViewModal` (detalle de solo visualización: imagen, precio, descripción y opciones informativas) en lugar de agregar al carrito o abrir el configurador.

> La sesión del mesero vive **solo en cookie httpOnly**, nunca en la URL: compartir la URL de una mesa no otorga permisos de mesero.
>
> **v2.1 (cambio de flujo):** el menú público **no tiene ningún acceso de mesero** — el botón "¿Eres mesero?" se elimina del menú (§13.3). El mesero solo identifica su sesión en **su panel `/mesero/[slug]`** (§18), desde donde entra a las mesas. Así el tipo 2 es siempre una vista limpia para el cliente.

---

## 10. Cambios de base de datos

### 10.1 Modelos nuevos (Prisma)

```prisma
model Waiter {                 // Mesero: lo crea el admin desde /dashboard/mesas
  id             String        @id @default(uuid())
  storeId        String
  store          Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name           String        // Nombre visible en pedidos y panel
  accessCodeHash String        // scrypt de la clave de acceso (NUNCA en claro)
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  tables         Table[]
  sessions       WaiterSession[]
}

model Table {                  // Mesa: QR único por mesa
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  number    String            // "1", "12", "Terraza 3" (visible en panel)
  qrToken   String   @unique  // va en ?mesa= (opaco, no es el número)
  waiterId  String?           // null = libre | mesero asignado por admin o que la tomó
  waiter    Waiter?  @relation(fields: [waiterId], references: [id], onDelete: SetNull)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  @@unique([storeId, number]) // no dos mesas con el mismo número en un store
}

model WaiterSession {          // Sesión del mesero (cookie httpOnly)
  id        String   @id @default(uuid())
  tokenHash String   @unique  // SHA-256 del token (el token solo vive en la cookie)
  waiterId  String
  waiter    Waiter   @relation(fields: [waiterId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  expiresAt DateTime          // 24 h
}
```

Relaciones nuevas en `Store`: `waiters Waiter[]`, `tables Table[]`.

**Ocupación de mesa:** `Table.waiterId` representa tanto la **asignación por admin** como la **toma por elección** del mesero (ambas bloquean la mesa para los demás). Liber es **manual**: botón "Liberar mesa" del mesero + **override del admin** en `/dashboard/mesas`. El pedido NO libera la mesa automáticamente (una mesa puede tener varios pedidos durante la comida).

### 10.2 Cambios en `public.orders` (SQL, fuera de Prisma)

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_number TEXT,        -- "12"
  ADD COLUMN IF NOT EXISTS waiter_name  TEXT,         -- "Carlos"
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'whatsapp'
       CHECK (source IN ('whatsapp','waiter','table'));
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
```

Actualizar `prisma/sql/orders-realtime.sql` (documento vivo) con estas columnas.

### 10.3 Realtime de disponibilidad de mesas (lo que se resuelve con "websockets")

Supabase **Realtime ya es websocket** — no se monta ningún servidor nuevo:

```sql
-- prisma/sql/tables-realtime.sql (nuevo)
ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY;
-- anon (menú público con sesión de mesero propia, no Supabase auth) solo ve mesas activas:
CREATE POLICY "Mesas activas visibles" ON "Table" FOR SELECT TO anon
  USING ("isActive" = true);
ALTER TABLE "Table" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "Table";  -- idempotente (DO $$...$$)
```

- El picker de mesas del mesero se suscribe a `postgres_changes` de `"Table"` y actualiza libres/ocupadas **al instante**.
- **Fallback** (si publication/RLS da problemas): polling cada 10 s con `getTableStatuses(storeId)`.
- Filtro por `storeId` en el cliente. *Nota: el broadcast incluye mesas de otros stores; se expone únicamente número + waiterId de mesas activas (datos de baja sensibilidad).*

---

## 11. Autenticación del mesero (clave hasheada)

- **Clave de acceso**: generada aleatoria (8 chars). Se calcula con `scrypt` (`salt` aleatorio de 16 bytes, `N=16384, r=8, p=1`, 64 bytes) y se guarda como `accessCodeHash` → formato `s2:<salt_hex>:<hash_hex>`. Verificación con `timingSafeEqual`.
- **Si se pierde/olvida la clave, el admin la regenera** (acción "Regenerar clave"): se genera una nueva, se re-hashea y **se borran todas las sesiones** del mesero (fuerza re-login).
- **Sesión**: token aleatorio de 32 bytes (hex). En DB se guarda **solo su SHA-256** (`tokenHash`); el token crudo viaja en cookie `komy_waiter` (httpOnly, sameSite=lax, path=/, maxAge 24 h). Caduca por `expiresAt` o al revocar al mesero.
- Cada server action del mesero resuelve: cookie → hash → sesión → mesero `isActive` → store del menú. Si algo falla → se borra la cookie y se responde `unauthorized`.
- **Dónde se usa el login (v2.1):** el form de clave existe **solo en `/mesero/[slug]`** (§18). El menú público ya **no** muestra acceso de mesero: un cliente que escanea el QR nunca ve UI de mesero.

---

## 12. Server Actions

### `src/actions/waiters.ts` (nuevo)

| Action | Rol | Descripción |
|--------|-----|-------------|
| `createWaiter(storeId, name)` | admin (Supabase auth + ownership) | Crea mesero, genera clave → devuelve la clave **en claro una sola vez** (solo se persiste el hash) |
| `regenerateWaiterCode(waiterId)` | admin | Nueva clave (se muestra una vez) + borra sesiones del mesero |
| `setWaiterActive(waiterId, active)` | admin | Al desactivar se borran sus sesiones |
| `deleteWaiter(waiterId)` | admin | Borra mesero (mesas quedan libres, `onDelete: SetNull`) |
| `createTable(storeId, number)` / `createTablesBulk(storeId, from, to)` | admin | Genera `qrToken` con `crypto.randomUUID()` |
| `deleteTable(tableId)` / `setTableActive(tableId, active)` | admin | |
| `assignWaiter(tableId, waiterId \| null)` | admin | Asignación/remoción manual |
| `signInWaiter(slug, accessCode)` | público | Valida clave (scrypt) → crea sesión + cookie |
| `signOutWaiter()` | mesero | Borra sesión + cookie |
| `claimTable(tableId)` | mesero | `updateMany({ where: { id, isActive: true, waiterId: null } })` → si `count === 1` la tomó; si no, "mesa tomada por otro". **Sin condiciones de carrera.** Solo puede tomar mesas libres o ya suyas (las asignadas por admin aparecen como "mis mesas"). |
| `releaseTable(tableId)` | mesero | Pone `waiterId = null` (solo si es suya) |
| `getTableStatuses(storeId)` | público | Lista `{id, number, waiterId, isActive}` — fallback de polling |

### `src/actions/orders.ts` (modificar)

`createPublicOrder` acepta además: `tableToken?`, `source: 'whatsapp' | 'table' | 'waiter'`.
**El servidor resuelve todo lo sensible**: por `tableToken` hace lookup de `Table.number`, y si hay sesión de mesero válida toma `Waiter.name`. El cliente **nunca** envía mesa ni nombre de mesero (imposible inyectar "Mesa 99" o "Mesero: admin"). Si `source !== 'whatsapp'`, el INSERT incluye `table_number`, `waiter_name` y `source`.

---

## 13. UI del menú público

### 13.1 `app/menu/[slug]/page.tsx`
- Recibe `searchParams` (Promise en Next 16), aplica §9.1 y pasa a **SharedMenuUI y AdvancedMenuUI**: `orderMode`, `table: { id, number, qrToken } | null`, `waiter: { id, name } | null`.

### 13.2 `FloatingCart` (props nuevas `orderMode`, `tableNumber`, `waiterName`)

| Comportamiento | `whatsapp` (actual) | `table` / `waiter` |
|---|---|---|
| Sección "Entrega" | Delivery / Pick-Up / En el local | Oculta → badge "🍽️ En el local" |
| Nombre cliente | Obligatorio (≥3 chars) | **Opcional** |
| Cédula / zonas / GPS | Según config del store | **Ocultos** (se fuerza `requireCedula=false`) |
| Botón final | `createPublicOrder` + redirect `wa.me` | `createPublicOrder` + **éxito en pantalla** (toast/confirmación), limpia carrito |
| Resumen | — | Línea "Mesa 12 · Mesero: Carlos" (mesero solo en modo `waiter`) |
| Analítica | `logOrderIntent(..., 'delivery\|pickup\|dinein')` | `logOrderIntent(..., 'dinein')` |
| `source` enviado | `whatsapp` | `table` / `waiter` |

### 13.3 Componentes nuevos del menú
- **`WaiterLoginModal` (retirado del menú en v2.1)**: antes mostraba el botón "¿Eres mesero?"; ahora **se elimina del menú público** — el login de clave vive únicamente en `/mesero/[slug]` (§18). El componente se conserva en **`app/components/WaiterLoginModal.tsx`** (fuera de `app/menu/`) para reutilizarlo/adaptarlo ahí.
- **Barra de contexto (`OrderModeBar`)**:
  - Modo `table` (cliente que escaneó el QR): solo muestra "Mesa N · Pedido directo al panel" — **sin** botones de mesero.
  - Modo `waiter` (sesión desde el panel): "Mesa N · Mesero" + botones **"← Panel"** (a `/mesero/[slug]`, §18), "Cambiar mesa" y "Salir".
- **`TablePickerSheet`**: lista **mis mesas** (asignadas por admin) primero, luego **mesas libres**; las tomadas por otros aparecen deshabilitadas marcadas como **"Ocupada"** (sin exponer el nombre de otro mesero). Actualización en vivo vía Realtime (§10.3). Al elegir: `claimTable` → `router.replace('/menu/[slug]?mesa=NEWTOKEN')`.
- **Carrito (Zustand)**: se limpia al cambiar de modo o de mesa (`useCartStore.getState().items = []` al detectar cambio de `qrToken`) para no mezclar pedidos de mesas distintas.

---

## 14. Panel de pedidos (`/dashboard/pedidos`)

- Interface `Order` extendida: `table_number?: string | null`, `waiter_name?: string | null`, `source: 'whatsapp' | 'table' | 'waiter'`.
- Badges en cada tarjeta: **`#12`** (mesa), **`👤 Carlos`** (mesero), icono de origen (MessageCircle = WhatsApp, UtensilsCrossed = Mesa, UserRound = Mesero).
- El realtime de Supabase ya entrega los campos nuevos en el INSERT (REPLICA IDENTITY FULL + columnas nuevas). Sin cambios en la suscripción.
- **v2.1 — Entregado**: en la columna "Listos" cada tarjeta tiene el botón **"Entregado"** (acción admin, §19) y las tarjetas entregadas muestran el sello **"Entregado ✓ hora · por X"** (siguen en la columna; no se crea una 4.ª columna).

---

## 15. Dashboard: `/dashboard/mesas` (nueva sección)

Protegida por el middleware actual (`/dashboard/:path*`). Server component con auth + ownership (mismo patrón que `settings/page.tsx`).

- **Bloque Meseros**: crear (nombre → clave generada en claro **una sola vez**, con botón copiar), lista con estado, **regenerar clave**, activar/desactivar, eliminar, ver mesas asignadas.
- **Bloque Mesas**: alta individual o masiva ("1–20"), por cada mesa: número, estado (Libre / Ocupada por X / Desactivada), asignar mesero (select opcional), **liber mesa**, activar/desactivar, **ver QR** (modal con **DOS QRs** y una explicación bajo cada uno; `baseUrl` derivado del header de la request, patrón del dashboard) con opción **imprimir** (imprime los dos juntos):
  - **QR 1 · Pedido en mesa** — `${baseUrl}/menu/${slug}?mesa=${qrToken}`: el cliente pide desde su celular estando en la mesa, sin mesero; el pedido llega al panel (modo `table`).
  - **QR 2 · Solo ver carta** — `${baseUrl}/menu/${slug}?mesa=${qrToken}&ver=1`: carta de solo lectura (modo `view`, §9); el cliente ve los productos y se los pide a su mesero, quien hace el pedido desde su panel. Cada `QRGenerator` trae sus botones de copiar/descargar.
- **Bloque "Panel del mesero" (v2.1)**: link copiable `${baseUrl}/mesero/${slug}` con instrucción breve ("Comparte este link con tus meseros; cada uno entra con su clave de acceso") → §18.
- Card de acceso nuevo en `app/dashboard/page.tsx` → "Mesas y Meseros".

---

## 16. Estrategia de migración (orden estricto)

1. **DB Prisma**: schema (`Waiter`, `Table`, `WaiterSession` + relations en `Store`) → `npx prisma migrate dev --name add_waiters_tables`.
2. **SQL Supabase**: columnas de `public.orders` + `prisma/sql/tables-realtime.sql` (RLS + publication de `"Table"`) — ejecutar en SQL Editor de Supabase.
3. **Actions**: `waiters.ts` + extensión de `orders.ts`.
4. **Menú**: `page.tsx` → props por UI → `FloatingCart` → modal de login → picker de mesas.
5. **Panel**: badges en `pedidos`.
6. **Dashboard**: `/dashboard/mesas` + card de acceso.
7. **QA**: lint + build + prueba manual de los 3 modos.

---

## 17. Edge Cases y Seguridad

| Escenario | Manejo |
|-----------|--------|
| QR de mesa con token inexistente/borrado | Pantalla "Código de mesa no válido" + link al menú base (nunca cae a modo WhatsApp) |
| Dos meseros toman la misma mesa a la vez | `updateMany ... WHERE waiterId IS NULL` → solo uno recibe `count === 1`; el otro ve "La mesa ya fue tomada" (y Realtime la marca ocupada) |
| Mesero desactivado con sesión viva | Desactivar/regenerar clave borra sus sesiones → la cookie queda inválida y vuelve a modo cliente |
| Cliente comparte la URL `?mesa=` | Solo da modo cliente (tipo 2); la sesión de mesero es cookie httpOnly |
| Cliente inyecta `table_number`/`waiter_name` manualmente | No es posible: el action los resuelve en servidor desde el token + cookie |
| Sesión expirada (24 h) o cookie manipulada | Hash no coincide o `expiresAt < now()` → se limpia cookie → modo `table` |
| Mesero con sesión pero sin `?mesa=` | Barra CTA "Elige una mesa" + carrito bloqueado (jamás envía por WhatsApp) |
| Pedido no libera la mesa | Por diseño: liber es manual (mesero) o override (admin) |
| Modos THEME y AVANCED | Ambas UIs reciben las mismas props; el branch de `customizationMode` no cambia |
| Tienda existente sin mesas/meseros | Todo nullable/relación vacía → modo 1 intacto, cero breaking changes |
| Cliente busca la UI de mesero en el menú | **No existe** (v2.1): el botón "¿Eres mesero?" se eliminó; sin sesión, `?mesa=` siempre es modo cliente |
| Mesero pierde el link del panel | El admin lo re-copiable desde `/dashboard/mesas` (es el mismo link por store) |
| `markOrderDelivered` de un pedido ajeno o sin sesión | Server action valida sesión → `waiter_id` propio y `status='completed'`; si no, error (nunca update a ciegas) |
| Pedido de mesa sin mesero (tipo 2) y "Entregado" | Solo el admin puede marcarlo (no hay `waiter_id`); el mesero no lo ve en "Mis pedidos" |
| Admin y mesero marcan entregado a la vez | Idempotente: el segundo update solo sobrescribe `delivered_at`/`delivered_by` (sin error, sin doble sello) |
| Cliente llega por el QR "solo ver carta" (`?ver=1`) | Modo `view`: sin carrito, sin "+"; tocar un producto abre `ProductViewModal` (solo visualización). El pedido lo hace el mesero desde su panel |
| Mesero abre una URL con `ver=1` | Gana la sesión → modo `waiter` (el mesero siempre puede pedir) |
| Cliente edita la URL y quita `ver=1` | Pasa a modo `table` (puede pedir): el "solo ver carta" es una experiencia, no una restricción de seguridad — el pedido igualmente llega al panel con su mesa |

---

## 18. Panel del mesero (`/mesero/[slug]`) — v2.1

El mesero **no entra por el menú**: el admin le comparte (una sola vez, al crearlo) el link del panel y su clave de acceso.

- **Ruta pública** (`app/mesero/[slug]/page.tsx`): NO usa Supabase auth → **no** se agrega al middleware de `/dashboard` (el matcher actual no la toca). 404 si el store no existe por slug.
- **Link copiable** en `/dashboard/mesas` (bloque "Panel del mesero"): `${baseUrl}/mesero/${slug}` — **uno por store**; la clave de acceso es la que identifica al mesero (mismo `signInWaiter` de siempre).
- **Sin sesión** → form de clave inline (reutiliza la lógica de `WaiterLoginModal` adaptada al panel).
- **Con sesión** (cookie `komy_waiter`), dos bloques:
  1. **Mis mesas**: sus mesas asignadas por admin + las que haya tomado; Realtime de `"Table"` (§10.3) + botón **"Liberar mesa"**. Al tocar una mesa → `/menu/[slug]?mesa=<qrToken>` (abre el menú en modo `waiter`, §9). El menú muestra **"← Panel"** en la barra (§13.3) para volver.
  2. **Mis pedidos** (§19): sus pedidos de hoy + estado; botón **"Entregar"** cuando están listos.
- **Realtime Broadcast, sin abrir RLS**: el RLS de `orders` solo da SELECT a `authenticated` (el dueño); un mesero es `anon` → **no se abre un permiso anon sobre `orders`** (expondría nombres de clientes). El panel escucha el canal **público** `waiter-<waiterId>` y un trigger en la DB (`trg_broadcast_waiter_order`, en `prisma/sql/orders-realtime.sql`) emite un ping mínimo (`orderId`, `status`, `op`) en cada INSERT/UPDATE de sus pedidos (`realtime.send(..., private => false)`). Al recibir el ping, el panel relee con `getWaiterOrders()` (cookie httpOnly). Sin polling: se re-sincroniza al volver a la pestaña y al (re)conectar el websocket. *No usar `realtime.broadcast_changes()`: enviaría la fila completa al canal público.*

## 19. Estado "Entregado" — v2.1

"No es un nuevo `status`": vive como **sello sobre la columna "Listos"** (`status='completed'`), así el Kanban no cambia de estructura.

```sql
-- prisma/sql/orders-realtime.sql (idempotente) + migración escrita a mano (migrate deploy)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS waiter_id     TEXT,          -- quién lo creó (sesión mesero, resuelta en servidor)
  ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ,   -- null = sin entregar
  ADD COLUMN IF NOT EXISTS delivered_by  TEXT;          -- "Carlos" o "admin"
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON public.orders(waiter_id);
```

- `createPublicOrder` guarda **además** `waiter_id` (junto a `waiter_name`; resuelto en servidor, nunca llega del cliente).
- **Marcar entregado** (ambos escriben con Prisma `$executeRaw`, que bypass RLS por ser dueño de la tabla):
  - **Mesero** → `markOrderDelivered(orderId)`: valida sesión cookie → exige `waiter_id` propio y `status='completed'` → `delivered_at = now()`, `delivered_by = <nombre>`.
  - **Admin** → `markOrderDeliveredAdmin(orderId)`: Supabase auth + `restaurant_id = user.id` → mismos campos (`delivered_by = 'admin'`). Botón en `/dashboard/pedidos` (columna Listos).
- Sello en ambas vistas: **"Entregado ✓ 3:40 PM · por Carlos"**. Idempotente (sobrescribe sin error).
- Pedidos sin `waiter_id` (WhatsApp / mesa sin mesero): solo el admin puede entregarlos.

## 20. Orden de implementación (fase 2, v2.1)

1. **T51** Quitar el acceso "¿Eres mesero?" del menú público (`OrderModeBar` + `WaiterLoginModal`).
2. **T52** DB: columnas `waiter_id` / `delivered_at` / `delivered_by` + índice (migración a mano + `migrate deploy`; actualizar y ejecutar `orders-realtime.sql`).
3. **T53** Actions: guardar `waiter_id` en el INSERT; `getWaiterOrders`, `markOrderDelivered`, `markOrderDeliveredAdmin`.
4. **T54** Ruta `/mesero/[slug]` (login + "Mis mesas").
5. **T55** "Mis pedidos" + botón "Entregar" (T62: tiempo real por Realtime Broadcast).
6. **T56** "← Panel" en la barra del menú del mesero.
7. **T57** Bloque "Panel del mesero" (link copiable) en `/dashboard/mesas`.
8. **T58** Botón + sello "Entregado" en `/dashboard/pedidos`.
9. **T59** QA: smoke E2E + `tsc`/`lint`/`build` + regresión (cliente nunca ve UI de mesero).
10. **T60** Marcar tareas y mantener DESIGN.md/TASKS.md como fuente de verdad.

> El detalle paso a paso vive en `docs/TASKS.md` (FASE 14, T51-T60). **Tareas aún sin confirmar con el dueño** (decisiones por defecto adoptadas aquí): link por store (no por mesero), sello sobre "Listo" (no 4.ª columna), solo el mesero creador + admin pueden entregar, y el mesero ve solo sus pedidos.

---

*Document generated for Spec-Driven Development (SDD)*
*Project: Menu Negocios Platform*
*Version: 2.0 - Advanced Customization System + Sistema de Tres Menús (WhatsApp / Mesero / Mesa QR)*
*Last updated: October 22, 2026*
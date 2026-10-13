# docs/TASKS.md - Advanced Customization System Tasks (SDD)

## Legend
- **[x]** = Hecho (ya existe en el código base)
- **[ ]** = Pendiente por implementar
- **[≥]** = Dependencia externa (bucket, migración, etc.)

---

## FASE 1: Cimientos y Base de Datos

### T1. Agregar enum CustomizationMode a schema.prisma
- [x] Agregar `enum CustomizationMode { THEME, AVANCED }` al final de `prisma/schema.prisma`
- [x] Agregar campo `customizationMode CustomizationMode @default(THEME)` al model `Store`
- [x] Agregar modelo `CustomizationLayout` con campos: id, storeId@unique, layoutJson( Json ), version(Int), createdAt, updatedAt
- [x] Agregar modelo `CustomizationTemplate` con campos: id, name, description, scope(Enum), sectionType(String?), previewUrl(String), configJson(Json), isPublic(Boolean @default(true)), storeId(String?), createdAt, updatedAt
- [x] Agregar modelo `CustomizationImage` con campos: id, storeId(String), url(String), bucketPath(String), altText(String?), sectionId(String?), createdAt, updatedAt
- [x] Ejecutar: `npx prisma migrate dev add_customization_enums_and_tables`
- [x] Verificar migración generada en `prisma/migrations/`

### T2. Crear bucket Supabase: `advanced-customization`
- [x] En Supabase Dashboard → Storage → New bucket
- [x] Nombre: `advanced-customization`
- [x] Public: NO (privado)
- [x] Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- [x] Max size: `10MB`
- [x] Configurar RLS policies (Row Level Security) para que solo el dueño del store pueda upload/delete de sus imágenes (`prisma/sql/advanced-customization-rls.sql`)
- [x] Estructura de carpetas: `advanced-customization/{storeId}/{filename}`

### T3. Ejecutar seed de plantillas iniciales
- [x] Crear script `prisma/seed-templates.ts` con 4-6 plantillas completas
- [x] Plantillas sugeridas: "Moderna", "Oscura", "Minimalista", "Colorida", "Boutique", "Cafetería"
- [x] Cada plantilla incluye: nombre, description, scope FULL_PAGE, configJson con layout completo
- [x] Ejecutar: `npx prisma db seed`
- [x] Verificar que las plantillas queden en `CustomizationTemplate` table

### T4. Verificar tipos y relaciones en Prisma Studio
- [ ] Ejecutar `npx prisma studio` y confirmar que los nuevos modelos aparecen
- [ ] Confirmar relación 1:1 entre Store y CustomizationLayout
- [ ] Confirmar que CustomizationImage tiene FK a Store
- [ ] Confirmar que CustomizationTemplate storeId puede ser null (plantillas globales)

---

## FASE 2: Tipos y Estado (TypeScript)

### T5. Crear src/types/customization.ts
- [x] Definir `CustomizationMode` type: `'THEME' | 'AVANCED'`
- [x] Definir `SectionType` union type: `'header' | 'category-nav' | 'menu' | 'social' | 'text' | 'image' | 'carousel'`
- [x] Definir `DeviceView` type: `'phone' | 'tablet' | 'desktop'` (default: `'desktop'`)
- [x] Definir todas las interfaces de SectionConfig (Header, CategoryNav, Menu, Social, Text, Image, Carousel, CarouselItem) — coincidir con DESIGN.md
- [x] Definir `AdvancedCustomization` interface con: version, global, sections, deviceView
- [x] Crear esquemas Zod para validación de:
  - `saveLayoutSchema` (layoutJson completo)
  - `textSectionSchema` (heading?, subheading?, body, fontSize, textAlign, etc.)
  - `imageSectionSchema` (imageUrl, opacity, overlayText?, ctaText?, etc.)
  - `carouselSectionSchema` (autoPlay, interval, perView 1|2|3, height sm|md|lg, items[])
  - `templateSchema` (name, description, scope, configJson)
  - `uploadImageSchema` (file type, size, altText)
- [x] Exportar todos los types para usar en server actions y componentes

### T6. Crear src/store/customizationStore.ts (Zustand + Undo/Redo)
- [x] Crear store con `create<CustomizationState>()` de Zustand
- [x] Estado inicial: `layoutJson: AdvancedCustomization` cargado desde API (o default con deviceView: 'desktop')
- [x] Actions requeridas:
  - `setSectionVisible(id, visible)` — toggles visible flag
  - `setSectionAlignment(id, alignment)` — left | center | full
  - `updateSectionConfig(id, configPartial)` — merge config parcial
  - `addSection(type, config)` — agrega nueva sección al final
  - `removeSection(id)` — quita sección (y sus imágenes huerfanas)
  - `moveSection(id, direction)` — mueve arriba/abajo (reorder)
  - `setDeviceView(device)` — phone | tablet | desktop (persiste en layoutJson)
  - `setGlobalStyle(field, value)` — actualiza global.colors/fonts
  - `undo()` / `redo()` — historial de ~50 pasos en memoria
  - `save()` — dispatch a server action `saveCustomizationLayout`
  - `reset()` — regresar a modo THEME (clear layout, set mode = THEME)
- [ ] Persistencia opcional: localStorage para no perder cambios si cierra el navegador

---

## FASE 3: Server Actions (Backend)

### T7. Crear src/actions/customization.ts
Todas las actions son `'use server'` con auth + ownership check (mismo patrón que `updateStoreSettings`):

- [x] `toggleCustomizationMode(storeId, mode)` — cambia customizationMode en Store (THEME ↔ AVANCED)
- [x] `saveCustomizationLayout(storeId, layoutJson)` — upsert CustomizationLayout
- [x] `getCustomizationLayout(storeId)` — devuelve layoutJson o null (si null + modo AVANCED → mostrar empty state)
- [x] `uploadCustomizationImage(storeId, file)` — sube a bucket `advanced-customization`, crea registro en CustomizationImage, retorna url pública
- [x] `deleteCustomizationImage(imageId)` — borra file del bucket + registro DB; también limpiar si section ya no existe
- [x] `getTemplates(scope?, sectionType?)` — lista plantillas (isPublic=true + las del store)
- [x] `applyTemplate(storeId, templateId)` — toma configJson de la template y merge con layout actual
- [x] `saveAsTemplate(storeId, templateData)` — guarda config actual como nueva plantilla (isPublic=false por defecto)
- [x] `deleteCustomizationLayout(storeId)` — borra layout y setea customizationMode = THEME

**Security en cada action:**
  - `createClient()` from `@/utils/supabase/server`
  - `supabase.auth.getUser()` — throw si no hay usuario
  - `prisma.store.findFirst({ where: { id: storeId, userId: user.id } })` — throw si no es dueño

### T8. Crear Zod validaciones en server actions
- [x] `saveLayoutSchema` validar layoutJson estructura (version, global obligatoria, sections array)
- [x] `uploadImageSchema` validar type MIME, tamaño máximo 10MB
- [x] `customizationModeSchema` (toggleModeSchema) validar mode es 'THEME' o 'AVANCED'

---

## FASE 4: Editor UI (Frontend - Nuevo Módulo)

### T9. Crear app/dashboard/customization/page.tsx
- [x] Server Component con auth check (`redirect('/login')` si no hay user)
- [x] Fetch `customizationLayout` via `getCustomizationLayout(storeId)`
- [x] Fetch `store` details via Prisma
- [x] Renderizar `<CustomizationEditor layout={layout} store={store} />` o modo THEME fallback
- [x] Below: condicional — si `store.customizationMode === 'THEME'` renderizar link "Cambiar a personalización avanzada" → page

### T10. Crear app/dashboard/customization/CustomizationEditor.tsx
- [x] ` 'use client' ` component
- [x] Usar `useCustomizationStore` (desde T6)
- [x] Recibir props `layout` y `store`
- [x] Efecto `useEffect` que al montar hace `getCustomizationLayout(storeId)` y llena el store
- [x] Manejar toggle `customizationMode` switch (THEME ↔ AVANCED)
- [x] Si modo es THEME → mostrar aviso + link a settings
-   Si modo es AVANCED → mostrar el editor completo

### T11. Crear app/dashboard/customization/EditorToolbar.tsx
- [x] Barra superior fija
- [x] Izquierda: `TemplatePicker` (selector de plantillas con preview)
- **Centro:** `LayoutTitle` (nombre del local + modo AVANCED)
- **Derecha:**
  - `btnGuardar` — disabled si sin cambios
  - `btnRevertir` — regresar a THEME
  - `deviceView selector` — dropdown phone/tablet/desktop (T6 estado)
  - `undo` / `redo` buttons

### T12. Crear app/dashboard/customization/EditorCanvas.tsx
- [x] Canvas principal con `dnd-kit` para reordenar secciones
- [x] Renderizar `SectionRenderer` para cada sección en `layout.sections`
- [x] Cada sección muestra:
  - Tipo icono (header, text, image, etc.)
- [x] Secciones arrastrables: `DraggableSection` wrapper
- [x] Live preview: un mini-preview a la derecha o abajo que actualiza en tiempo real

### T13. Crear app/dashboard/customization/EditorSidebar.tsx
- [x] Panel izquierdo con paleta de secciones para agregar
- **Tipos de sección para agregar:**
  - Botón "+ Header" (solo ocultar)
  - Botón "+ Categoría/Navegación"
  - Botón "+ Menú" (usa layout LIST/GRID/LINKTREE)
  - Botón "+ Texto"
  - Botón "+ Imagen"
  - Botón "+ Carrusel"
  - Botón "+ Redes Sociales"
- [x] Al hacer click, agregar sección vacía al final de `layout.sections` en el store

### T14. Crear app/dashboard/customization/panels/GlobalStylePanel.tsx
- [x] Colores globales:
  - `backgroundColor` input (color picker)
  - `textColor` input
  - `subtextColor` input
  - `accentColor` input (themeColor)
  - `buttonTextColor` input
  - `cardBackgroundColor` input
- [x] Fuentes globales:
  - `fontHeading` <select> desde opciones (Epilogue, Playfair Display, Oswald, etc.)
  - `fontBody` <select> desde opciones (Manrope, Inter, Poppins, etc.)
- [x] Cada cambio actualiza inmediatamente `layoutJson.global` en el store
- [x] Preview en vivo de cómo se ve aplicado

### T15. Crear app/dashboard/customization/panels/SectionConfigPanel.tsx
- [x] Panel que cambia según `section.type`:
  - Si `header`: style segmented (Clásico | Minimal | Editorial), toggle showLogo
  - Si `category-nav`: style pills/tabs/minimal, sticky toggle, showCount toggle
  - Si `menu`: layout LIST|GRID|BENTO|LINKTREE, showImages, showPrices, showDescriptions, columns 1|2|3, gap sm|md|lg, cardStyle default|outlined|filled
  - Si `text`: heading?, subheading?, body textarea, fontSize select, textAlign radio, textColor picker opcional, bgColor picker opcional, padding input
  - Si `image`: imageUrl (upload button + preview), opacity slider 0-1, overlayText textarea, overlaySubheading textarea, ctaText ctaUrl inputs, borderRadius input, height select
  - Si `carousel`: perView segmented 1|2|3 (imágenes en pantalla), height select sm|md|lg, autoPlay toggle, interval slider ms, showDots toggle, showArrows toggle, listado de items (add item form: imageUrl, opacity, overlayText?, ctaText?, ctaUrl?)
  - Si `social`: platforms multiselect (instagram, tiktok, whatsapp, maps, custom), layout row|grid, iconSize sm|md|lg, showLabels toggle, bgColor picker, padding input
  - Si solo ocultar: mostrar toggle "Visible" + botón "Ocultar permanently" (set visible=false)

### T15b. Crear app/dashboard/customization/sections/SectionRenderer.tsx
- [x] Componente que recibe `{section, layoutJson, deviceView}` y renderiza el preview en el canvas
- [x] Usa `deviceView` para ajustar layout móvil/tablet/desktop (ver DESIGN.md §3.3)
- [x] Retorna JSX que muestra qué elementos están configurados y cuáles son placeholders

### T16. Crear app/dashboard/customization/sections/ DraggableSection.tsx
- [x] Wrapper que usa `@dnd-kit/core` para permitir reordenar secciones
- [x] OnSort cuando el usuario suelta, actualizar orden en el store inmediatamente
- [x] Visual feedback: cursor-grab → cursor-grabbing, línea de posición mientras arrastra

### T17. Crear app/dashboard/customization/components/SectionControls.tsx
- [x] Por cada sección: 3 botones
  - `Ocultar` — set visible=false en el config
  - `Mover arriba` — moveSection('up')
  - `Mover abajo` — moveSection('down')
  - `Borrar` — removeSection (con confirmación) + limpiar imágenes huerfanas
- [x] Botón "Mover al inicio" y "Mover al final"
- [x] States loading disabled mientras guarda

### T18. Crear app/dashboard/customization/components/TemplateCard.tsx
- [x] Card con preview miniatura de la plantilla
- [x] Nombre, descripción breve
- [x] Botón "Aplicar" — llama a `applyTemplate` server action
- [x] Para plantillas públicas: anyone puede aplicar; privadas solo el dueño
- [x] Hover efecto: lift + shadow

### T19. Crear app/dashboard/customization/components/TemplatePicker.tsx
- [x] Dropdown o modal con todas las plantillas del store + plantillas públicas
- [x] Grid de cards scrollable
- [x] Search/filter por nombre
- [x] Preview en vivo pequeño al pasar mouse
- [x] Separador: "Mis plantillas" vs "Plantillas públicas"

### T20. Implementar Undo/Redo básico (T6)
- [x] Historial simple: array de snapshots `layoutJson` previo
- [x] Max 50 pasos (luego de 50, el primero se descarta)
- [x] Botones undo/redo en toolbar (T11)
- [x] Atajos de teclado: Ctrl+Z / Ctrl+Y o Cmd+Z / Cmd+Shift+Y (opcional, para futuro)

---

## FASE 5: Renderer Público

### T21. Crear app/components/AdvancedMenuUI.tsx
- [x] Componente nuevo para renderer modo AVANCED
- [x] Recibir props: `store`, `layoutJson` (del CustomizationLayout)
- [x] Lógica principal:
  ```tsx
  if (store.customizationMode === 'AVANDED' && layoutJson) {
    // 1. Aplicar global styles (colors, fonts)
    // 2. Iterar layoutJson.sections en order
    // 3. Filtrar visible=false
    // 4. Renderizar cada sección por tipo (usar SectionRenderer lógica)
    // 5. Renderizar FloatingCart (reutilizar existente)
    // 6. Renderizar ProductConfiguratorModal (reutilizar existente)
  } else {
    // Fallback: <SharedMenuUI store={store} /> (sistema actual)
  }
  ```
- [x] Integrar `deviceView` del layoutJson: si es 'phone', aplicar clases responsive que apilan todo verticalmente, 1 columna en grid, etc.
- [x] Usar las mismas validaciones de modifiers, combos, cart que ya existen

### T22. Modificar app/menu/[slug]/page.tsx (branch por modo)
- [ ] Agregar import `getCustomizationLayout` desde `../actions/customization`
- [ ] Fetch layout al inicio:
  ```tsx
  const layout = await getCustomizationLayout(slug) // o fetch por storeId
  ```
- [ ] Branch lógica:
  ```tsx
  if (store.customizationMode === 'AVANCED' && layout) {
    return <AdvancedMenuUI store={store} layoutJson={layout} />
  }
  return <SharedMenuUI store={store} />
  ```
- [ ] Manejo de caso: si modo es AVANCED pero no hay layout aún → mostrar "Empieza configurando tu menú" o redirect a editor

### T23. Add link al nav del dashboard
- [ ] Localizar dónde se renderiza el nav del dashboard (puede ser `app/dashboard/layout.tsx` o componente incluido en `page.tsx`)
- [ ] Agregar ítem de menú: "Personalización Avanzada" con link a `/dashboard/customization`
- [ ] Estilo consistente con otros links del nav (usar `NavItem` / `NavLink` existente)
- [ ] Si el usuario no es dueño, esconder el link o mostrar disabled

---

## FASE 6: Testing y QA

### T24. Probar flujo completo save/load
- [ ] Crear un store nuevo
- [ ] Modo THEME: verificar que todo sigue funcionando igual
- [ ] Cambiar a modo AVANCED
- [ ] Agregar 2-3 secciones (text, image, header)
- [ ] Guardar layout
- [ ] Cerrir y volver a abrir el editor → layout debería cargarse
- [ ] Cambiar device view y verificar que se persiste

### T25. Probar modo THEME intacto
- [ ] Asegurar que `SharedMenuUI.tsx` NO haya sido modificado
- [ ] `SettingsForm.tsx` NO haya sido modificado
- [ ] `updateStoreSettings` action NO haya cambiado su firma
- [ ] `app/menu/[slug]/page.tsx` fallback funcione cuando customizationMode = THEME

### T26. Probar upload de imágenes
- [ ] Subir imagen desde el editor → debe ir al bucket `advanced-customization`
- [ ] Verificar que la URL sea pública y se muestre en el preview
- [ ] Borrar sección → la imagen del bucket también se borre (o marcar como huerdana dependiendo de política)
- [ ] Tamaño máximo 10MB rechazado con error

### T27. Probar plantillas
- [ ] Aplicar una plantilla pre-cargada → todos los campos se llenan
- [ ] Guardar configuración actual como nueva plantilla
- [ ] Esa nueva plantilla aparezca en el picker para ese store solo (isPrivate)

### T28. Probar device view switching
- [ ] En editor, cambiar de desktop → tablet → phone
- [ ] Verificar que el canvas preview se ajuste (secciones apilen, columnas cambien)
- [ ] Guardar, cerrar, reabrir → device view se mantenga

### T29. Lint y TypeCheck
- [ ] Ejecutar `npm run lint` o equivalente — 0 errores nuevos
- [ ] Ejecutar `npm run typecheck` o `npx tsc --noEmit` — 0 errores de tipo
- [ ] Revisar que los imports nuevos no rompan rutas existentes

---

## FASE 7: Despliegue y Post-Launch

### T30. Migration execution
- [ ] Ejecutar `npx prisma migrate deploy` en entorno de producción
- [ ] Verificar que la base de datos se actualice sin perder datos existentes
- [ ] Hacer backup de la DB antes de migrate (buena práctica)

### T31. Seed execution
- [ ] Ejecutar script de seed para populate las plantillas iniciales
- [ ] Confirmar que aparecen en el picker del editor

### T32. Feature flag / lanzamiento gradual
- [ ] Considerar lanzar con `customizationMode: THEME` por defecto para todos los stores existentes
- [ ] Opt-in: stores que quieran probar Advanced pueden cambiar desde Settings o desde el propio editor
- [ ] Admin / Tech Lead monitorear primeros 24-48h después del launch

### T33. Documentación final
- [ ] Actualizar SPEC.md si es necesario (cambios en flujo, nuevos endpoints)
- [ ] Tener este `docs/DESIGN.md` y `docs/TASKS.md` como fuente de verdad
- [ ] Comentar en el código los puntos críticos (special notes) para futuros desarrolladores
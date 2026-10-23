# docs/TASKS.md - Feature Tasks (SDD): ACS + Tres Menús

## Legend
- **[x]** = Hecho (ya existe en el código base)
- **[ ]** = Pendiente por implementar
- **[≥]** = Dependencia externa (bucket, migración, etc.)

> **Parte I (FASE 1-7):** Advanced Customization System.
> **Parte II (FASE 8-13, T34-T50):** Sistema de Tres Menús (WhatsApp / Mesero / Mesa QR) — diseño en `docs/DESIGN.md` §9-17. **[x] Ejecutada.**
> **Parte III (FASE 14, T51-T60):** Panel del mesero `/mesero/[slug]` + estado "Entregado" + fin del acceso "¿Eres mesero?" en el menú público — diseño en `docs/DESIGN.md` §13.3, §18-20. **[ ] Pendiente.**

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

---

# PARTE II: Sistema de Tres Menús (WhatsApp / Mesero / Mesa QR)
> Diseño: `docs/DESIGN.md` §9-17. Regla de modos: sin query = WhatsApp (actual) · `?mesa=` = cliente en mesa (solo panel) · `?mesa=` + sesión mesero = mesero (solo panel).

## FASE 8: Base de Datos

### T34. Agregar modelos a prisma/schema.prisma
- [x] Modelo `Waiter`: id, storeId(FK Store, Cascade), name, accessCodeHash, isActive(default true), createdAt, relations tables/sessions
- [x] Modelo `Table`: id, storeId(FK Store, Cascade), number, qrToken(@unique), waiterId(FK Waiter, SetNull, nullable), isActive(default true), createdAt, `@@unique([storeId, number])`
- [x] Modelo `WaiterSession`: id, tokenHash(@unique), waiterId(FK Waiter, Cascade), createdAt, expiresAt
- [x] Agregar relaciones en `Store`: `waiters Waiter[]`, `tables Table[]`
- [x] Ejecutar migración → **`migrate dev` falla aquí (P4002)** por el FK `public.orders → auth.users`; se usó **migración SQL escrita a mano + `npx prisma migrate deploy`** (ver `prisma/migrations/20261022090000_add_waiters_tables/migration.sql`). Regla: nunca listar `auth` en `schemas` ni `@@schema`.
- [x] Verificar migración en `prisma/migrations/` + `prisma generate`

### T35. SQL de public.orders (columnas de mesa/mesero/origen)
- [x] Crear/actualizar `prisma/sql/orders-realtime.sql` con:
  - `ADD COLUMN table_number TEXT`, `ADD COLUMN waiter_name TEXT`
  - `ADD COLUMN source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp','waiter','table'))`
  - `CREATE INDEX idx_orders_source`
- [x] [≥] Ejecutar el SQL en el SQL Editor de Supabase (o script idempotente `IF NOT EXISTS`) — ejecutado y verificado en DB

### T36. SQL de Realtime para mesas (prisma/sql/tables-realtime.sql)
- [x] `ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY`
- [x] Policy SELECT TO anon: `USING ("isActive" = true)` (nombre: "Mesas activas visibles")
- [x] `ALTER TABLE "Table" REPLICA IDENTITY FULL`
- [x] `ALTER PUBLICATION supabase_realtime ADD TABLE "Table"` (idempotente con DO $$)
- [x] [≥] Ejecutar en Supabase SQL Editor después de T34 — ejecutado (realtime: orders + Table; RLS activo)

## FASE 9: Server Actions (Backend)

### T37. Crear src/actions/waiters.ts (hash + sesión + CRUD)
- [x] Helper `hashAccessCode(code)` — scrypt (16B salt derivada de `storeId+code`, N=16384, r=8, p=1, 64B) → `s2:<salt_hex>:<hash_hex>` (hash determinista → lookup por igualdad con UNA consulta, en `lib/waiterAuth.ts`)
- [x] Helper `verifyAccessCode(code, stored)` — scrypt + `timingSafeEqual`
- [x] Helper `getSessionWaiter()` — cookie `komy_waiter` → SHA-256 → WaiterSession(no expirada) → Waiter(isActive) → `{waiter, token}` o null (limpia cookie si inválida)
- [x] `createWaiter(storeId, name)` (admin: supabase.auth.getUser + ownership) — genera clave de 8 chars, guarda hash, **retorna la clave en claro (única vez)**
- [x] `regenerateWaiterCode(waiterId)` (admin) — nueva clave (retorna en claro) + borra sus WaiterSession (fuerza re-login)
- [x] `setWaiterActive(waiterId, active)` (admin) — al poner false borra sus sesiones
- [x] `deleteWaiter(waiterId)` (admin)
- [x] `createTable(storeId, number)` (admin) — qrToken = crypto de 16 bytes hex, valida número único por store
- [x] `createTablesBulk(storeId, from, to)` (admin) — alta masiva (idempotente: cuenta creadas y ya existentes)
- [x] `deleteTable(tableId)`, `setTableActive(tableId, active)` (admin)
- [x] `assignWaiter(tableId, waiterId | null)` (admin)
- [x] `signInWaiter(slug, accessCode)` (público) — valida store por slug + clave → crea sesión (24h) + cookie httpOnly (sameSite=lax, path=/)
- [x] `signOutWaiter()` — borra sesión + cookie
- [x] `claimTable(tableId)` (mesero) — `updateMany({where:{id, isActive:true, waiterId:null}})`, si count!==1 → error "La mesa ya fue tomada"; idempotente si ya es suya; devuelve la mesa con `qrToken`
- [x] `releaseTable(tableId)` (mesero) — solo si es suya → waiterId=null
- [x] `getTableStatuses(storeId)` (público) — fallback de polling (no expone qrToken)

### T38. Extender src/actions/orders.ts (createPublicOrder)
- [x] Payload: `tableToken?: string`, `source?: 'whatsapp' | 'table' | 'waiter'` (default 'whatsapp')
- [x] Si tableToken: lookup Table por token + store → si no existe, error (nunca confiar en el cliente)
- [x] Resolver `waiterName` en servidor solo si hay sesión válida de mesero para ese store (cookie)
- [x] INSERT con `table_number`, `waiter_name`, `source` cuando aplica
- [x] Compatibilidad: pedidos sin token siguen igual (source='whatsapp', columnas null)

## FASE 10: Menú Público (Frontend)

### T39. app/menu/[slug]/page.tsx — resolver modo (DESIGN §9.1)
- [x] Recibir `searchParams: Promise<{mesa?: string}>`
- [x] Sin `mesa` → orderMode='whatsapp' (aunque haya sesión de mesero)
- [x] Con `mesa` → buscar Table por qrToken+slug+isActive; inválido → pantalla "Código de mesa no válido" + link `/menu/[slug]`
- [x] Válida → leer sesión de mesero (getSessionWaiter) → 'waiter' si coincide el store, si no 'table'
- [x] Pasar el contexto a SharedMenuUI y AdvancedMenuUI (implementado como **una sola prop `orderContext: OrderContext`** + `orderSlug`, en vez de props sueltas — menos prop drilling, mismo diseño)

### T40. Propagación por las dos UIs
- [x] `SharedMenuUI`: props nuevas `orderContext`/`orderSlug` → pásalas a FloatingCart + barra de contexto (OrderModeBar arriba del banner; no se renderiza en preview)
- [x] `AdvancedMenuUI`: ídem (OrderModeBar también en `AdvancedLayout`; barra no sticky para no pisar el nav sticky de categorías)
- [x] Verificar que el branch customizationMode THEME/AVANCED no cambie (ambos responden 200, probado en smoke)

### T41. FloatingCart.tsx — modos de pedido (DESIGN §13.2)
- [x] Props: `orderContext` (del que derivan mode/tableNumber/waiterName/blocking) — en vez de props sueltas
- [x] Modos mesa: ocultar sección Entrega → badge "🍽️ En el local"; deliveryType forzado 'dinein'
- [x] Nombre de cliente **opcional**; ocultar cédula/zonas/GPS (requireCedula efectivo false)
- [x] Botón final en modos mesa: `createPublicOrder({tableToken, source})` + confirmación en pantalla (sin wa.me), limpiar carrito, logOrderIntent 'dinein'; si `res.success=false` se muestra el error y no se limpia nada
- [x] Resumen del pedido: línea "Mesa N" (+ "Mesero: X" solo en modo waiter) en la cabecera y en el badge
- [x] Modo whatsapp: sin cambios funcionales (regresión)
- [x] Sesión de mesero sin mesa → en vez del botón, bloqueo con aviso "🔒 Elige una mesa para pedir"

### T42. WaiterLoginModal.tsx (nuevo)
- [x] Botón "¿Eres mesero?" visible en la barra de contexto mientras no haya sesión (solo se muestra la barra con `?mesa=` válido o sesión activa)
- [x] Input de clave → `signInWaiter(slug, code)` → `router.refresh()`; error "Clave incorrecta"
- [x] Si ya hay sesión → no se muestra

### T43. Barra de contexto mesero + TablePickerSheet (nuevo)
- [x] Barra (OrderModeBar): "Mesa N · Nombre" + botones "Cambiar mesa" y "Salir" (signOutWaiter)
- [x] Sesión activa sin `?mesa=` → CTA "Elige una mesa para empezar" y bloquear envío del carrito
- [x] TablePickerSheet: "Mis mesas" (asignadas) primero, luego libres; tomadas por otros deshabilitadas y mostradas como **"Ocupada"** (sin exponer el nombre de otro mesero)
- [x] Suscripción Realtime a `"Table"` (postgres_changes, filtra por storeId) + fallback polling 10s con getTableStatuses
- [x] Al elegir: `claimTable` → `router.replace('/menu/[slug]?mesa=NEWTOKEN')`
- [x] Botón "Liberar mesa" para las propias (liber es manual, DESIGN §10.1)

### T44. Carrito (cartStore) — aislamiento por mesa
- [x] Nuevo `clearCart()` en el store + limpieza al cambiar de `qrToken` o de orderMode en OrderModeBar (no mezclar pedidos de mesas distintas)

## FASE 11: Panel de Pedidos

### T45. /dashboard/pedidos — badges de mesa/mesero/origen
- [x] Interface `Order` + `table_number?`, `waiter_name?`, `source`
- [x] Badge `#mesa` y `👤 mesero` en la tarjeta (componente `OrderBadges` en las 3 columnas: pendientes/cocina/completados)
- [x] Icono de origen: WhatsApp (MessageCircle) / Mesa (UtensilsCrossed) / Mesero (UserRound)
- [x] Verificar realtime entrega los campos nuevos en INSERT y UPDATE (el panel usa `select('*')` + cast `as Order`, y la función SQL de realtime ya expone los campos)

## FASE 12: Dashboard /dashboard/mesas

### T46. Página + bloque Meseros
- [x] `app/dashboard/mesas/page.tsx` (server component: auth + ownership, patrón de settings/page.tsx) con resumen (N meseros / N mesas / ocupadas)
- [x] `components/WaitersManager.tsx` (client): crear (clave en claro una sola vez + botón copiar), lista con estado y mesas asignadas, regenerar clave (fuerza re-login), activar/desactivar, eliminar
- [x] `components/TablesManager.tsx` (client): alta individual y masiva ("1–20"), asignar mesero (select), liber mesa, activar/desactivar, eliminar, estado Libre/Ocupada por X

### T47. QR por mesa
- [x] Modal con `QRGenerator` (reutilizar) → URL `${baseUrl}/menu/${slug}?mesa=${qrToken}` (baseUrl del header de la request, patrón del dashboard; el repo no usa `NEXT_PUBLIC_URL`) + botón copiar enlace
- [x] Botón imprimir (vista de impresión solo del área del QR con `@media print`)

### T48. Acceso desde el dashboard
- [x] Card "Mesas y Meseros" en `app/dashboard/page.tsx` → `/dashboard/mesas`
- [x] Verificar middleware cubre `/dashboard/mesas` (matcher actual ya lo incluye)

## FASE 13: QA y Lanzamiento

### T49. Prueba manual de los 3 modos
> **[≥] Prueba automatizada por HTTP (17/17 PASS)** con el dev server + ruta temporal de humo (ya eliminada):
> login con clave correcta/incorrecta, hash `s2:` en DB, tipo 1/2/3 en HTML, sesión sin mesa → CTA de bloqueo,
> QR inválido → pantalla de error, claim rechazado sin sesión y aceptado con sesión, teardown limpio.
- [x] Tipo 1: `/menu/slug` → sin barra de mesero ni CTA (flujo WhatsApp intacto: mismo código de envío, columnas nuevas null, source='whatsapp')
- [x] Tipo 2: `?mesa=` en incógnito → barra "Mesa N" + "¿Eres mesero?", nunca modo mesero; envío al panel con `tableToken`+`source` resuelto en servidor (sin wa.me)
- [x] Tipo 3: login mesero con clave → barra "Mesa N · Mesero" + "Cambiar mesa"; sin sesión la misma URL sigue siendo tipo 2
- [x] Clave hasheada: en DB solo el hash `s2:salt:hash` (nunca texto plano); regenerar clave borra sus WaiterSession (fuerza re-login)
- [x] Claim de mesa: atómico (`updateMany` con `waiterId:null` + count) → sin sesión rechazado; si dos toman la misma, solo uno gana
- [x] Panel: interface `Order` con campos nuevos + badges en las 3 columnas (realtime entrega los campos por `select('*')`)
- [x] QR de mesa inválido/borrado → pantalla "Código de mesa no válido", no cae a WhatsApp
- [x] Liber mesa: `releaseTable` (mesero) y `assignWaiter(id, null)` (admin override) → waiterId=null, vuelve a estar disponible
- [ ] **QA en navegador (usuario):** escanear QR real desde el celular, imprimir QR, ver un pedido entrar al panel Kanban en vivo con los badges, y regenerar clave con el mesero logueado en otro dispositivo

### T50. Lint, build y regresión
- [x] `npm run lint` — **0 errores en los archivos nuevos/modificados del feature** (quedan errores preexistentes en archivos no tocados: OnboardingWizard, RegisterForm, ProductConfiguratorModal, analytics, etc.)
- [x] `npm run build` — compila (Next 16: `searchParams`/`cookies`/`headers` como Promise/async; migraciones Prisma con `migrate deploy` + SQL a mano)
- [x] Modo THEME y AVANCED del menú intactos (ambos 200 con y sin `?mesa=`); SettingsForm y flujo de customization sin cambios
- [x] Marcar tareas completadas aquí y mantener DESIGN.md/TASKS.md como fuente de verdad

---

## FASE 14: Panel del mesero + estado "Entregado" (v2.1 — pendiente)

> **Diseño:** `docs/DESIGN.md` §13.3, §14, §15 y secciones nuevas §18–§20. **Ejecutar en orden.**
>
> **Decisiones por defecto (confirmar antes de implementar):**
> 1. Link del panel **por store** (`/mesero/<slug>`); la clave de acceso identifica al mesero.
> 2. "Entregado" como **sello sobre la columna "Listos"** del Kanban (sin 4.ª columna).
> 3. Solo el mesero que **creó** el pedido + el **admin** pueden marcarlo entregado.
> 4. El mesero ve **solo sus pedidos** en el panel (los de WhatsApp/mesa sin mesero los marca el admin).
> 5. Pedidos del panel del mesero con **polling de 5 s** (el RLS no da SELECT anon sobre `orders`; no se abren permisos).

### T51. Quitar el acceso "¿Eres mesero?" del menú público
- [x] `app/menu/[slug]/components/OrderModeBar.tsx`: eliminar el botón "¿Eres mesero?" y el estado/modal de login del menú
- [x] Modo `table` (cliente que escanea el QR): la barra solo muestra "Mesa N · Pedido directo al panel" (cero UI de mesero) — rama explícita en `OrderModeBar` (icono de mesa, sin nombre de mesero, sin botones y sin `TablePickerSheet`)
- [x] Quitar imports/estados huérfanos (`WaiterLoginModal` deja de usarse aquí); `lint` limpio — 0 problemas en los archivos del menú/mesas (baseline de 73 preexistentes intacto; `tsc --noEmit` sin errores)
- [x] `WaiterLoginModal.tsx`: se conserva el componente para reutilizarlo/adaptarlo en `/mesero/[slug]` (T54), fuera del menú — movido a **`app/components/WaiterLoginModal.tsx`** (sin importers en `app/menu/`)

### T52. DB: `waiter_id` + entrega en `public.orders`
- [x] `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS waiter_id TEXT, ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS delivered_by TEXT;` — aplicado en DB
- [x] `CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON public.orders(waiter_id);` — creado
- [x] Migración escrita a mano en `prisma/migrations/` + `npx prisma migrate deploy` (**nunca `migrate dev`** — FK a `auth.users`; regla de la FASE 8) → `prisma/migrations/20261022175730_add_orders_waiter_delivery/`; `migrate status` = 6 migrations, *up to date*
- [x] Actualizar `prisma/sql/orders-realtime.sql` (idempotente, documento vivo) y ejecutarlo en el SQL Editor de Supabase — columnas + índice añadidos al CREATE TABLE / ALTERs / índices; ejecutado contra la DB vía `npx prisma db execute --file prisma/sql/orders-realtime.sql` (equivalente al SQL Editor)
- [x] Verificar en DB: columnas + índice presentes — `information_schema.columns` (waiter_id text · delivered_at timestamptz · delivered_by text) + `pg_indexes` (idx_orders_waiter_id); sanidad: `orders` sigue en `supabase_realtime` con `REPLICA IDENTITY FULL` y RLS activo

### T53. Server actions de pedidos (v2.1)
- [x] `src/actions/orders.ts` → `createPublicOrder`: guardar `waiter_id` además de `waiter_name` (ambos resueltos en servidor desde el token + cookie; el cliente nunca los envía) — `waiterId = session.id` en la rama `source='waiter'` + columna `waiter_id` en el INSERT (`CreateOrderPayload` no acepta waiterId ⇒ inyectarlo es imposible)
- [x] `getWaiterOrders()` (en `src/actions/waiters.ts` o archivo nuevo): sesión `komy_waiter` → solo sus pedidos de hoy (`waiter_id` propio), ordenados — en `waiters.ts`, devuelve `WaiterOrder[]` (items, total, hora, estado, sello de entrega); hoy desde medianoche (mismo criterio que `/dashboard/pedidos`), `ORDER BY created_at DESC`; sin sesión → error
- [x] `markOrderDelivered(orderId)`: sesión mesero → exige `waiter_id` propio y `status='completed'` → `delivered_at=now()`, `delivered_by=<nombre del mesero>` (idempotente) — `UPDATE ... RETURNING` en `waiters.ts`; si no coincide distingue *no encontrado* / *no es tuyo* / *aún no está listo*; re-entregar solo sobrescribe el sello
- [x] `markOrderDeliveredAdmin(orderId)`: Supabase auth + `restaurant_id=user.id` → mismos campos con `delivered_by='admin'` — en `orders.ts`, mismas condiciones + ownership por `restaurant_id`
- [x] Verificación: `tsc --noEmit` y `eslint` en `orders.ts`/`waiters.ts` = 0 problemas (baseline 73 intacto); SQL probada en DB (INSERT con rollback, SELECT de tipos `array/number/Date`, `UPDATE..RETURNING` sin tocar filas)

### T54. Ruta `/mesero/[slug]` (pública, sin Supabase auth)
- [x] `app/mesero/[slug]/page.tsx` (server): store por slug (404 si no existe); leer sesión con `getSessionWaiter()` y validar que pertenezca al store — `notFound()` si no hay store; la sesión de **otro** local cuenta como "sin sesión" (verificado en runtime: misma cookie → `/mesero/<otro>` muestra el login)
- [x] Sin sesión → form de clave inline (reutilizar `WaiterLoginModal` — hoy en `app/components/WaiterLoginModal.tsx` — adaptado): `signInWaiter(slug, code)` → `router.refresh()` — nueva variante `variant='inline'` (el padre es server component y no puede pasar callbacks, así que el form hace `router.refresh()` tras el login; la variante `modal` queda intacta para reutilización)
- [x] Bloque **"Mis mesas"**: sus mesas asignadas + tomadas; Realtime de `"Table"` (patrón de `TablePickerSheet`) + botón "Liberar mesa"; tocar una mesa → `/menu/[slug]?mesa=<qrToken>` (nueva pestaña o mismo tab) — `MyTables.tsx` (Realtime + polling 10 s de respaldo) sobre el action nuevo **`getMyTables(storeId)`** (solo mesas propias activas; único punto que sí devuelve `qrToken`); tile abre en **nueva pestaña** con `target="_blank"`; shell con cabecera + "Salir" en `MeseroPanel.tsx`
- [x] Verificar que el middleware **no** proteja/redirija `/mesero/*` (solo cubre `/dashboard` y `/onboarding`) — matcher = `/dashboard/:path*`, `/onboarding/:path*`, `/login`, `/register`; verificado en runtime: `GET /mesero/<slug>` → **200 sin redirect** (con y sin sesión) y `GET /dashboard/mesas` → **307 → /login**; slug inexistente → **404**
- [x] Verificación extra: `tsc --noEmit` y `eslint` (`app/mesero`, modal, `waiters.ts`, `middleware.ts`) = 0 problemas; lint global = baseline 73; smoke con sesión temporal de mesero (creada y **borrada** al terminar)

### T55. "Mis pedidos" en el panel del mesero
- [x] Lista de sus pedidos de hoy: items resumidos, total, hora, estado (Pendiente / En cocina / Listo / Entregado)
- [x] Polling cada **5 s** con `getWaiterOrders()` (patrón del fallback de mesas; sin realtime por RLS)
- [x] Botón **"Entregar"** visible solo cuando `status='completed'` → `markOrderDelivered` → sello "Entregado ✓ hora"
- [x] Pedido sin `waiter_id` nunca aparece aquí (el action filtra por su `waiter_id`)

### T56. "← Panel" en el menú del mesero
- [x] `OrderModeBar`: cuando hay sesión de mesero (modo `waiter` o CTA sin mesa) → botón/link **"← Panel"** a `/mesero/[slug]`
- [x] Cliente en modo `table` (sin sesión): no ve el botón (sigue sin UI de mesero)

### T57. `/dashboard/mesas`: bloque "Panel del mesero"
- [x] Nuevo bloque con el link copiable `${baseUrl}/mesero/${slug}` (botón "Copiar link") + instrucción: "Compártelo con tus meseros; cada uno entra con su clave de acceso"
- [x] Opcional: recordatorio de que las claves se muestran/leen en el bloque de Meseros

### T58. `/dashboard/pedidos`: marca de "Entregado"
- [x] Botón **"Entregado"** en las tarjetas de la columna "Listos" → `markOrderDeliveredAdmin`
- [x] Sello **"Entregado ✓ hora · por X"** en las tarjetas entregadas (columna Listos, sin mover de columna)
- [x] Los pedidos entregados siguen apareciendo (historial del día) — sin 4.ª columna

### T59. QA (fase 2)
- [x] Smoke E2E por HTTP (patrón del smoke de T49, ruta temporal al final borrada): login del panel con clave correcta/mala, "mis mesas" con claim, `getWaiterOrders` con sesión, `markOrderDelivered` (mesero → pedido propio ajeno rechazado), `markOrderDeliveredAdmin`, menú `?mesa=` **sin** botón "¿Eres mesero?" — **52/52 checks PASS**; nota: GoTrue rechaza usuarios creados por SQL directo, así que el login admin del smoke se hizo reescribiendo temporalmente el hash de una cuenta dev y restaurándolo verificado (el pedido real ajeno quedó intacto: `delivered_at` null)
- [x] Regresión: cliente que escanea el QR no ve ninguna UI de mesero; tipo 1 (WhatsApp) intacto
- [x] `tsc --noEmit`, `npm run lint` (0 errores en archivos tocados), `npm run build` — tsc 0 errores; build OK; lint: 0 errores en archivos nuevos de la fase (`waiters.ts`, `waiterAuth.ts`, `app/mesero/*`, `OrderModeBar`, `TablePickerSheet`, `WaiterLoginModal`); los errores que quedan en `SharedMenuUI.tsx`/`FloatingCart.tsx` son preexistentes de HEAD (verificado contra `git show HEAD:`), no de esta fase
- [ ] Prueba en navegador (usuario): panel desde el celular del mesero, entregar un pedido, marcar entregado desde el Kanban

### T60. Cierre fase 2
- [ ] Marcar tareas completadas aquí; mantener DESIGN.md/TASKS.md como fuente de verdad
- [ ] Confirmar con el dueño las 4 decisiones abiertas de la cabecera de la FASE 14 (ajustar docs si cambian)

### T61. Dos QRs por mesa: "Pedido en mesa" + "Solo ver carta" (DESIGN §9 fila 4, §15)
- [x] Nuevo modo `view` en `OrderMode` (`src/types/order.ts`): `?mesa=<qrToken>&ver=1` sin sesión de mesero → carta de solo lectura; la sesión de mesero siempre gana (`waiter`)
- [x] `app/menu/[slug]/page.tsx`: lee el searchParam `ver` y resuelve `table → view` solo cuando no hay sesión
- [x] `OrderModeBar`: rama `view` → "Mesa N · Carta de solo lectura · Pide a tu mesero" (sin botones, sin UI de mesero)
- [x] Nuevo `app/components/ProductViewModal.tsx`: modal de solo visualización (imagen, precio + Bs, descripción, opciones de `modifierGroups` informativas, pie "Este producto se pide con tu mesero"); sin agregar al carrito
- [x] `SharedMenuUI` (THEME) y `AdvancedMenuUI` (AVANCED): `isViewMode` → `handleProductAction` abre el view modal (nunca el configurador ni `addItem`); ocultos los botones "+" (`AddToCartButton`, 3 layouts en THEME y 7 spots en AVANCED) y el `FloatingCart`
- [x] `/dashboard/mesas` → "Ver QR": modal con **dos QRs** (grid 2 cols desktop) — "1 · Pedido en mesa" (`?mesa=`) y "2 · Solo ver carta" (`?mesa=&ver=1`) — cada uno con su explicación debajo; ambos en un solo `.qr-print-area` (se imprimen juntos); retirado el botón "Copiar enlace de la mesa" redundante (cada `QRGenerator` trae su copiar/descargar)
- [x] Verificación: `tsc --noEmit` = 0 errores; lint global = **baseline 73 intacto** (los 2 `any` de `SharedMenuUI.tsx` siguen siendo los preexistentes; se corrigieron de paso 2 errores de memoización del React Compiler)
- [ ] Prueba en navegador (usuario): escanear el QR 2 → tocar producto → modal de vista sin carrito; QR 1 intacto; imprimir los dos QRs
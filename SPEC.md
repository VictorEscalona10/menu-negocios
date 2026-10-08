# SPEC.md - Menu Negocios Platform

## 1. Project Overview

**Purpose:** Digital menu management platform for restaurants and food service businesses. Allows merchants to create and manage their menu, products, categories, modifiers, delivery zones, and settings through a web dashboard.

**Type:** SaaS (Software as a Service) - multi-tenant application where each store has isolated data via `storeId`.

**Target Audience:** Restaurant owners, menu managers, and food service businesses needing a digital ordering system with customizable products, modifiers, and delivery/pickup options.

**Core Value Proposition:** Simplifies digital menu creation with product configurators (modifiers), delivery zone management, and a complete onboarding flow for new merchants to get their online presence running quickly.

## 2. Technology Stack & Dependencies

| Category | Details |
|----------|---------|
| **Framework** | Next.js 16.2.1 (App Router) with React 19 |
| **Language** | TypeScript 5 |
| **ORM** | Prisma 7.6.0 with PostgreSQL (via Supabase PostgreSQL) |
| **Database** | PostgreSQL (Supabase hosted, `aws-1-us-east-1.pooler.supabase.com:5432`) |
| **Authentication** | Supabase Auth (session-based, OAuth flow) |
| **Styling** | Tailwind CSS 4.0 |
| **UI Library** | Lucide React icons, custom React components |
| **State Management** | Zustand 5.12.0 (cart store) |
| **Validation** | Zod 4.3.6 |
| **Drag-and-Drop** | @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0 |
| **HTTP Client** | @supabase/js 2.101.1 (for server client) |
| **Build Tool** | Next.js default (ESBuild/RSPack) |

**Key Dev Dependencies:** Prisma 7.6.0, @prisma/adapter-pg 7.6.0, @tailwindcss/postcss 4, typescript, eslint

## 3. User Roles & Authorization

| Role | Description | Access |
|------|-------------|--------|
| **Anonymous/Unauthenticated** | Public visitors | Access to public menu pages (`/menu/[slug]`) only. Can log order intents via server action (no auth required). |
| **Logged-in User** | Supabase authenticated user | Access to `/login`, `/dashboard` (if onboarding complete), `/onboarding` |
| **Store Owner/Manager** | Merchant associated with a `storeId` | Full access to dashboard: store settings, products, categories, modifiers, delivery zones, onboarding completion |

**Authorization Model:** Session-based via Supabase cookies + `storeId` isolation. No custom RBAC/ABAC beyond store ownership.

**Authentication Strategy:**
- Supabase session middleware (`middleware.ts`) protects routes:
  - `/dashboard/:path*` - requires auth, redirects to `/login` if unauthenticated
  - `/onboarding/:path*` - requires auth
  - `/login` - redirects logged-in users to `/dashboard`
- Form auth via `signInAction` server action (email/password)
- Session persistence via `createServerClient` with cookie handling

**Guards/Middlewares:**
- `middleware.ts` - Supabase auth guard, route protection
- `src/actions/auth.ts` - Server action signIn/signOut

## 4. Data Model & Entities

**Primary DB:** PostgreSQL via Supabase

### Core Tables (Prisma Models)

| Model | Primary Key | Key Fields | Relationships | Soft Delete |
|-------|------------|------------|---------------|-------------|
| **Store** | `id` (UUID) | `userId`, `name`, `slug`, `isActive`, `enableDelivery`, `enablePickup`, `enableDineIn` | 1:n Categories, 1:n DeliveryZones, 1:n Products | ✅ `isActive` flag (not `deletedAt`) |
| **Category** | `id` (UUID) | `name`, `storeId`, `order`, `isActive` | n:1 Store, 1:n Products | ✅ `isActive` flag |
| **Product** | `id` (UUID) | `name`, `description`, `price`, `isAvailable`, `isCombo`, `comboBadge`, `categoryId`, `modifierGroups` | n:1 Category, 1:n ModifierGroups | ✅ `isAvailable` flag |
| **ModifierGroup** | `id` (UUID) | `name`, `isRequired`, `maxSelect`, `productId`, `options` | n:1 Product, 1:n ModifierOptions | ✅ `isAvailable` flag |
| **ModifierOption** | `id` (UUID) | `name`, `price`, `modifierGroupId`, `isAvailable` | n:1 ModifierGroup | ✅ `isAvailable` flag |
| **DeliveryZone** | `id` (UUID) | `name`, `price`, `storeId` | n:1 Store | None |
| **OrderIntentLog** | `id` (UUID) | `storeId`, `total`, `deliveryType`, `createdAt` | n:1 Store | None |

**Relationships (Prisma):**
- `Store` { categories, deliveryZones, products } (Cascade delete on some)
- `Category` { products } 
- `Product` { category, modifierGroups }
- `ModifierGroup` { options }
- `ModifierOption` { modifierGroup }

**Soft Delete Pattern:** Uses `isActive`/`isAvailable` boolean flags rather than `deletedAt` timestamps. Products/Categories/ModifierGroups are toggled unavailable instead of physically deleted.

**UUIDs:** All models use UUID primary keys.

## 5. Functional Modules & API Contracts

All endpoints are **Server Actions** (Next.js 16 App Router). No traditional REST endpoints.

### Module: Authentication

| Endpoint | Method | Parameters | Input DTO | Response |
|----------|--------|------------|-----------|----------|
| `signOut` | Server Action | None | `{}` | `{ success: boolean; redirect: '/login' }` |
| `signInAction` | Server Action | `formData: { email: string; password: string }` | `signInSchema (Zod)` | `{ success: boolean; redirect: '/dashboard' }` |

### Module: Store Settings

| Endpoint | Method | Parameters | Input DTO | Response |
|----------|--------|------------|-----------|----------|
| `updateStoreSettings` | Server Action | `storeId: string`, `formData: { name, whatsapp, logoUrl, bannerUrl, ... }` | `zod` partial schema | `{ success: boolean }` |
| `createDeliveryZone` | Server Action | `storeId: string`, `formData: { name, price }` | `zod` schema | `{ success: boolean; zoneId: string }` |
| `updateDeliveryZone` | Server Action | `zoneId: string`, `formData: { name, price }` | `zod` schema | `{ success: boolean }` |
| `deleteDeliveryZone` | Server Action | `zoneId: string` | `{}` | `{ success: boolean }` |

### Module: Product & Category CRUD

| Endpoint | Method | Parameters | Input DTO | Response |
|----------|--------|------------|-----------|----------|
| `createCategory` | Server Action | `storeId: string`, `formData: { name, order? }` | `zod` schema | `{ success: boolean; categoryId: string }` |
| `createProduct` | Server Action | `storeId: string`, `formData: { name, description, price, imageUrl, categoryId, modifierGroups }` | `zod` schema | `{ success: boolean; productId: string }` |
| `updateProduct` | Server Action | `productId: string`, `formData` (partial) | `zod` partial schema | `{ success: boolean }` |
| `deleteCategory` | Server Action | `categoryId: string` | `{}` | `{ success: boolean }` (cascade products) |
| `deleteProduct` | Server Action | `productId: string` | `{}` | `{ success: boolean }` (Supabase storage cleanup) |
| `toggleProductAvailability` | Server Action | `productId: string`, `currentValue: boolean` | `{}` | `{ success: boolean; isAvailable: boolean }` |
| `updateProductsOrder` | Server Action | `orderedIds: string[]` | `zod` array schema | `{ success: boolean }` (transactional) |
| `toggleCategoryAvailability` | Server Action | `categoryId: string`, `currentValue: boolean` | `{}` | `{ success: boolean; isActive: boolean }` |

### Module: Modifier Groups & Options

| Endpoint | Method | Parameters | Input DTO | Response |
|----------|--------|------------|-----------|----------|
| `toggleModifierGroup` | Server Action | `id: string` | `{}` | `{ success: boolean; isAvailable: boolean }` |
| `toggleModifierOption` | Server Action | `id: string`, `isAvailable: boolean` | `{}` | `{ success: boolean; isAvailable: boolean }` |
| `deleteModifierGroup` | Server Action | `id: string` | `{}` | `{ success: boolean }` |
| `deleteModifierOption` | Server Action | `id: string` | `{}` | `{ success: boolean }` |

### Module: Onboarding

| Endpoint | Method | Parameters | Input DTO | Response |
|----------|--------|------------|-----------|----------|
| `createStoreFromOnboarding` | Server Action | `formData` (step data) | `zod` schema per step | `{ success: boolean; storeId: string }` |

### Module: Analytics (Public)

| Endpoint | Method | Parameters | Input DTO | Response |
|----------|--------|------------|-----------|----------|
| `logOrderIntent` | Server Action | `storeId: string`, `total: number`, `deliveryType: string` | `zod` schema | `{ success: boolean }` (PUBLIC, no auth required) |

## 6. Critical Business Logic

| Area | Description |
|------|-------------|
| **Product Configurator with Modifiers** | Products can have required/optional modifier groups with `maxSelect` limits. Price adjustments added per modifier option selected. Logic in `src/actions/modifiers.ts` handles toggle/availability and option constraints. |
| **Order Intent Logging (Public)** | `logOrderIntent` server action logs WhatsApp order requests from public visitors. No authentication required. Store isolation via `storeId`. Used for WhatsApp integration tracking. |
| **Onboarding Flow (6 steps)** | `src/actions/onboarding.ts` orchestrates multi-step store creation: step 1 (basic info) → step 2 (settings) → step 3 (products) → step 4 (modifiers) → step 5 (delivery zones) → step 6 (completion). Each step validates with Zod and persists incrementally. |
| **Product Reordering (Transactional)** | `updateProductsOrder` and `updateCategoriesOrder` use Prisma transactions to reorder items via the `order` field. Prevents partial states on failure. |
| **Delivery Zone Pricing** | Each delivery zone has a fixed price added to order total. Logic in `src/actions/store.ts` manages zone creation/updation and store-level `enableDelivery` flag. |
| **Modifier Group Constraints** | `isRequired` flags enforce selection; `maxSelect` limits number of options choosable. Validation enforced on server side via Zod and in frontend components (`ModifiersManager.tsx`). |
| **Image Upload & Storage** | Products support `imageUrl`. `deleteProduct` performs Supabase Storage cleanup. Image handling in `src/actions/menu.ts` with formData encoding. |

## 7. Non-Functional Requirements & Security

| Area | Implementation |
|------|----------------|
| **CORS** | Configured via Next.js middleware and Supabase client initialization. No explicit middleware.config, but Supabase SSR handles CORS origins from env. |
| **Rate Limiting** | Not explicitly configured in codebase. Supabase Auth has built-in rate limiting for signIn/signOut. Application-level rate limiting not implemented. |
| **Helmet** | Not found in dependencies. Next.js 16 may include default headers, but no `helmet` middleware detected. |
| **Data Sanitization** | Zod validation on all server action inputs provides type-safe sanitization. Prisma ORM uses parameterized queries (prevents SQL injection). |
| **Global Error Handling** | `middleware.ts` handles auth redirect errors. Next.js error boundaries for page-level errors. No centralized error boundary or error logging service detected. |
| **Authentication Security** | Supabase Auth with email/password, session cookies. CSRF protection via Next.js form standards. Session management via `createServerClient` with `cookies()` function. |
| **Headers/Response Security** | No explicit Helmet, CORS, or security headers middleware found beyond Supabase defaults. |
| **Data Validation** | All server actions use Zod schemas for input validation. Prisma schema defines data types and constraints at DB level. |

## 8. Implementation State Inventory

| Module / Endpoint | Status |
|-------------------|--------|
| **Authentication (signIn/signOut)** | [x] Fully Implemented |
| **Store Settings Update** | [x] Fully Implemented |
| **Delivery Zone CRUD** | [x] Fully Implemented |
| **Category CRUD** | [x] Fully Implemented |
| **Product CRUD** | [x] Fully Implemented |
| **Modifier Group & Option Management** | [x] Fully Implemented |
| **Product Reordering (transactional)** | [x] Fully Implemented |
| **Category Availability Toggle** | [x] Fully Implemented |
| **Modifier Group/Option Toggles** | [x] Fully Implemented |
| **Onboarding Flow (6 steps)** | [x] Fully Implemented |
| **Public Order Intent Logging** | [x] Fully Implemented |
| **Dashboard Route Protection (middleware)** | [x] Fully Implemented |
| **Login Route Redirect (authenticated users)** | [x] Fully Implemented |
| **Cart State Management (Zustand)** | [x] Fully Implemented |
| **Google Maps Integration** | [x] Fully Implemented (API key configured) |
| **Terms & Privacy Pages** | [x] Fully Implemented |
| **Rate Limiting (application-level)** | [ ] Pending / Roadmap |
| **Helmet Security Headers** | [ ] Pending / Roadmap |
| **Centralized Error Boundary/Logging** | [ ] Pending / Roadmap |
| **CSRF Protection (explicit)** | [ ] Pending / Roadmap |
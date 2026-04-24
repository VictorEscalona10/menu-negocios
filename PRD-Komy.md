# Product Requirements Document (PRD) - Komy

## 1. Executive Summary
**Komy** is a specialized platform designed for restaurants and food businesses to create professional digital menus. It bridges the gap between traditional paper menus and complex POS systems by providing a high-end, mobile-first ordering experience that integrates directly with **WhatsApp** for order fulfillment.

The platform focuses on the "Digital Sommelier" aesthetic—premium, clean, and highly functional.

---

## 2. Goals & Objectives
- **Modernize Ordering**: Replace static PDF menus with interactive, customizable digital experiences.
- **Streamline Fulfillment**: Use WhatsApp as the primary communication channel to avoid high commission fees from third-party delivery apps.
- **Customization**: Allow businesses to tailor their menu to their brand (colors, logo, message headers/footers).
- **Simplicity**: No app download required for customers; easy management for business owners.

---

## 3. Target Audience
- **Small to Medium Restaurants**: Need a digital presence without the complexity of a full e-commerce site.
- **Fast-Food Outlets**: Require quick browsing and clear categorization.
- **Premium Dining**: Benefit from the "Amber Noir" design system for a luxurious digital menu feel.

---

## 4. Functional Requirements

### 4.1 Client-Facing Menu
- **Dynamic Categories**: Horizontal navigation bar for easy access to product groups.
- **Product Listing**: Visual grid/list showing names, descriptions, and prices.
- **Product Customization (Modifiers)**:
  - **Required Choices**: Forced selections (e.g., "Meat temperature").
  - **Optional Extras**: Add-ons with incremental costs (e.g., "Extra cheese +$1.50").
  - **Multi-select Limits**: Constraints on how many options can be picked (e.g., "Choose up to 3 sauces").
- **Cart System**: persistent cart store using Zustand, allowing quantity adjustments and real-time total calculation.

### 4.2 Admin Dashboard
- **Store Configuration**:
  - Profile: Name, slug, WhatsApp number.
  - Branding: Logo URL, background color, theme color.
  - Communication: Customizable WhatsApp message headers and footers.
- **Inventory Management**:
  - Full CRUD for Categories and Products.
  - Availability Toggle: Instantly "turn off" products that are out of stock.
- **Modifier Management**: Link modifier groups to specific products to handle complex orders.

### 4.3 WhatsApp Integration
- **Order Generation**: Automatic formatting of cart items into a readable WhatsApp message.
- **Direct Redirection**: One-click "Confirm Order" that opens WhatsApp with the message pre-filled for the business number.

---

## 5. Design System: "Amber Noir"
The project follows a premium design philosophy:
- **Typography**: Modern, sans-serif fonts (Geist/Inter).
- **Color Palette**: Sophisticated dark modes, glassmorphism, and accent colors (default theme: `#ef4444`).
- **Mobile First**: Optimized for touch interaction, swipeable categories, and bottom-sheet modals for configuration.

---

## 6. Technical Stack
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Frontend Logic**: React 19, TypeScript.
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`.
- **Database**: PostgreSQL hosted on Supabase, managed via **Prisma**.
- **State Management**: Zustand (Client-side state for cart and local UI).
- **Authentication**: Supabase Auth (Integrates with `Store` via `userId`).

---

## 7. Data Model Overview
- **Store**: The tenant entity. Holds configuration and branding.
- **Category**: Belongs to a Store. Groups Products.
- **Product**: Belongs to a Category. Can have multiple `ModifierGroups`.
- **ModifierGroup**: Defines rules for choices (IsRequired, MaxSelect).
- **ModifierOption**: Individual choices with optional price additions.

---

## 8. User Flows

### Flow A: The Customer Order
1. Access `/[slug]` URL.
2. Browse categories and select an item.
3. (If applicable) Configure item in the "Digital Sommelier" bottom sheet.
4. Add to cart.
5. Review cart and click "Completar Pedido".
6. Sent to WhatsApp with order details.

### Flow B: Business Setup
1. Authenticate via dashboard.
2. Define Store details and branding.
3. Create Categories.
4. Add Products with images and pricing.
5. Share the generated link with customers.

---

## 9. Future Roadmap
- **Analytics**: Track views and most-ordered items.
- **QR Code Generator**: In-dashboard tool to generate branded QR codes for tables.
- **Multi-language Support**: Automatic translation of the menu interface.
- **Stripe Integration**: Optional online payment before WhatsApp confirmation.

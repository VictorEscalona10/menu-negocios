# Komy - Plataforma de Menús Digitales

**Komy** es una plataforma SaaS diseñada para que restaurantes y negocios de comida puedan crear sus propios menús digitales premium, permitiendo a sus clientes realizar pedidos de forma interactiva y enviarlos directamente a través de WhatsApp.

## Características Principales

- **Menús Premium**: Interfaz moderna, rápida y optimizada para dispositivos móviles (Mobile-First).
- **Integración con WhatsApp**: Recibe los pedidos detallados directamente en tu chat de WhatsApp sin pagar comisiones por venta.
- **Personalización Total**: Ajusta colores, tipografías, logos y mensajes para que el menú refleje la identidad de tu marca.
- **Gestión de Inventario**: Panel de administración intuitivo para gestionar categorías, productos y opciones de personalización (modificadores).
- **QR Integrado**: Generación automática de códigos QR para que tus clientes accedan al menú escaneando desde su mesa.

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript.
- **Estilos**: Tailwind CSS 4.
- **Base de Datos**: PostgreSQL (Supabase) con Prisma ORM.
- **Autenticación**: Supabase Auth.
- **Estado**: Zustand.

## Configuración del Proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/VictorEscalona10/menu-negocios.git
cd menu-saas
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env` basado en `.env.example` (si está disponible) o configura las siguientes variables:
- `DATABASE_URL`: URL de conexión a tu base de datos PostgreSQL.
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto de Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave anónima de Supabase.

### 4. Base de Datos
Genera el cliente de Prisma y aplica las migraciones:
```bash
npx prisma generate
npx prisma db push
```

### 5. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la plataforma.

## Licencia

Este proyecto es propiedad de **Komy**. Todos los derechos reservados.

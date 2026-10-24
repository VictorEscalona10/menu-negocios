-- ==============================================================================
-- KOMY - TABLA DE PEDIDOS Y POLÍTICAS RLS (SUPABASE + REALTIME)
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'completed', 'cancelled')),
    -- --- SISTEMA DE TRES MENÚS (docs/DESIGN.md §10.2) ---
    table_number TEXT,                                   -- "12" (pedido desde mesa QR o mesero)
    waiter_name TEXT,                                    -- "Carlos" (solo source='waiter')
    source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'waiter', 'table')),
    -- --- v2.1 / FASE 14: mesero asignado + entrega (docs/DESIGN.md §18-20) ---
    waiter_id TEXT,                                      -- Waiter.id que creó el pedido (resuelto en servidor)
    delivered_at TIMESTAMPTZ,                            -- sello de hora del estado "Entregado"
    delivered_by TEXT,                                   -- nombre del mesero o 'admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columnas del Sistema de Tres Menús en instalaciones existentes (idempotente)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS waiter_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (source IN ('whatsapp', 'waiter', 'table'));

-- Columnas v2.1 (T52) en instalaciones existentes (idempotente; también en la
-- migración prisma/migrations/20261022175730_add_orders_waiter_delivery)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS waiter_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_by TEXT;

-- Índices para optimizar las consultas y filtros en tiempo real
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON public.orders(waiter_id); -- "Mis pedidos" del mesero
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política de Lectura (SELECT):
-- Solo el usuario autenticado cuyo ID coincida con restaurant_id puede ver sus pedidos.
DROP POLICY IF EXISTS "Restaurante puede ver sus propios pedidos" ON public.orders;
CREATE POLICY "Restaurante puede ver sus propios pedidos"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = restaurant_id);

-- Política de Modificación (UPDATE):
-- Solo el usuario autenticado cuyo ID coincida con restaurant_id puede actualizar pedidos (ej: aprobar, completar, cancelar).
DROP POLICY IF EXISTS "Restaurante puede actualizar sus propios pedidos" ON public.orders;
CREATE POLICY "Restaurante puede actualizar sus propios pedidos"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = restaurant_id)
WITH CHECK (auth.uid() = restaurant_id);

-- Política de Inserción (INSERT):
-- Toda creación legítima de pedidos se realiza a través del Server Action createPublicOrder()
-- (que conecta vía Prisma directo con Postgres superuser, aplicando validaciones completas).
-- Se restringe el INSERT directo en PostgREST para evitar inyecciones anónimas o spam.
DROP POLICY IF EXISTS "Permitir insercion de pedidos para clientes" ON public.orders;

-- 3. ACTIVACIÓN DE REPLICACIÓN LÓGICA (SUPABASE REALTIME)
-- Habilita que Supabase envíe eventos INSERT y UPDATE a través de websockets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- Garantizar que en los eventos UPDATE se envíen todos los datos de la fila
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- 4. CONCESIÓN DE PERMISOS PARA LOS ROLES DE SUPABASE (anon y authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders FROM anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- 5. REALTIME BROADCAST PARA "MIS PEDIDOS" DEL MESERO (v2.1 - T62)
-- ==============================================================================
-- El mesero NO es usuario de Supabase Auth (cookie httpOnly `komy_waiter`) y el
-- RLS de `orders` solo da SELECT a `authenticated`: el panel no puede escuchar
-- `postgres_changes` sin exponer pedidos a `anon`. Solución: el panel escucha
-- el canal público `waiter-<waiter_id>` y este trigger emite un ping desde la
-- DB en cada alta/cambio de estado de un pedido con mesero. El payload es
-- MÍNIMO a propósito (ids opacos + estado, nada de cliente/items/total).
--
-- NO usar `realtime.broadcast_changes()` aquí: envía la fila completa
-- (customer_name, items, total) a cualquiera suscrito al canal público.
--
-- `private => false` (canal público) porque el cliente del mesero es `anon`;
-- el canal del cliente debe ser público también (sin `config.private: true`).
-- Si algún día se desactiva "Allow public access" en Realtime Settings, habrá
-- que pasar a `private => true` + política RLS sobre `realtime.messages`.
--
-- Nota operativa: `realtime.send()` inserta en `realtime.messages` y las
-- particiones diarias las crea un cliente al conectarse. Si no hay nadie
-- conectado, el INSERT falla con `WarnSendingBroadcastMessage`; es inocuo
-- (nadie escucha y el panel hace carga inicial al abrirse).

CREATE OR REPLACE FUNCTION public.broadcast_waiter_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Pedidos de WhatsApp / mesa sin mesero: nadie en el panel los escucha.
    IF NEW.waiter_id IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM realtime.send(
        payload => jsonb_build_object(
            'op', TG_OP,             -- INSERT | UPDATE
            'orderId', NEW.id,
            'status', NEW.status
        ),
        event => 'order-change',
        topic => 'waiter-' || NEW.waiter_id,
        private => false
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_waiter_order ON public.orders;
CREATE TRIGGER trg_broadcast_waiter_order
AFTER INSERT OR UPDATE OF status, delivered_at ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_waiter_order();


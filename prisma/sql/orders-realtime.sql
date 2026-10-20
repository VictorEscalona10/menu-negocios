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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar las consultas y filtros en tiempo real
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
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
-- Permite que los clientes o el menú público puedan crear nuevos pedidos.
DROP POLICY IF EXISTS "Permitir insercion de pedidos para clientes" ON public.orders;
CREATE POLICY "Permitir insercion de pedidos para clientes"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

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
GRANT SELECT, INSERT ON TABLE public.orders TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;


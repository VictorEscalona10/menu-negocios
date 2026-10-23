-- v2.1 / FASE 14 (T52): mesero asignado + estado "Entregado" en public.orders
-- Docs: docs/DESIGN.md §18-20 · documento vivo relacionado: prisma/sql/orders-realtime.sql
-- Regla FASE 8: NUNCA `prisma migrate dev` (el FK public.orders → auth.users rompe el
-- shadow DB con P4002) → migración escrita a mano + `prisma migrate deploy`.
-- Nota: no se agrega FK a "Waiter"(id) — mismo criterio que table_number/waiter_name
-- (texto resuelto en servidor, el pedido sobrevive al borrado del mesero).

-- Columnas nuevas (idempotentes)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS waiter_id TEXT;      -- Waiter.id que creó el pedido (source='waiter')
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ; -- sello de entrega (estado "Entregado")
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_by TEXT;   -- nombre del mesero o 'admin'

-- Índice para "Mis pedidos" del panel del mesero (getWaiterOrders filtra por waiter_id + hoy)
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON public.orders(waiter_id);

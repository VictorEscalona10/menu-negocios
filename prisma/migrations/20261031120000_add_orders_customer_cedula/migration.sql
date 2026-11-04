-- ==============================================================================
-- KOMY — C.I. DEL CLIENTE COMO IDENTIFICADOR ÚNICO (Historial y clientes)
-- ==============================================================================
-- La cédula se guardaba concatenada en customer_name con el formato
-- "Nombre (C.I: 12345678)". Para poder agrupar clientes de forma fiable
-- (varias personas pueden llamarse igual) se añade una columna propia.
--
-- Regla: se almacena SOLO el número normalizado (dígitos), por ejemplo
-- "V-12.345.678" -> "12345678". No lleva UNIQUE porque un cliente tiene
-- muchas órdenes: es una clave de agrupación, no de unicidad de fila.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_cedula TEXT;

COMMENT ON COLUMN public.orders.customer_cedula IS
    'Número de cédula normalizado (solo dígitos). Identificador único del cliente dentro del restaurante.';

-- Backfill de órdenes históricas desde el nombre visible "Nombre (C.I: 12345678)"
UPDATE public.orders
SET customer_cedula = NULLIF(
        regexp_replace(
            substring(customer_name FROM '[(]C[.]I:[[:space:]]*([^)]+)[)]'),
            '[^0-9]',
            '',
            'g'
        ),
        ''
    )
WHERE customer_cedula IS NULL
  AND customer_name LIKE '%(C.I:%';

-- Índices para el historial y el directorio de clientes
CREATE INDEX IF NOT EXISTS idx_orders_customer_cedula
    ON public.orders(restaurant_id, customer_cedula);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created
    ON public.orders(restaurant_id, created_at DESC);

-- ==============================================================================
-- KOMY - DISPONIBILIDAD DE MESAS EN TIEMPO REAL (SUPABASE REALTIME)
-- docs/DESIGN.md §10.3 — ejecutar DESPUÉS de la migración add_waiters_tables
-- ==============================================================================
-- El picker de mesas del mesero se suscribe a postgres_changes de "Table" para
-- ver al instante qué mesas están libres/ocupadas (websockets de Supabase).

-- 1. ROW LEVEL SECURITY
-- La tabla "Table" es consultada por Prisma en el servidor (rol postgres, bypass
-- de RLS como dueña). El menú público (rol anon) solo necesita ver mesas activas.
ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mesas activas visibles" ON "Table";
CREATE POLICY "Mesas activas visibles"
ON "Table"
FOR SELECT
TO anon
USING ("isActive" = true);

-- 2. REPLICACIÓN LÓGICA: que los eventos INSERT/UPDATE/DELETE envíen la fila
ALTER TABLE "Table" REPLICA IDENTITY FULL;

-- 3. Agregar la tabla a la publicación de Supabase Realtime (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'Table'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "Table";
    END IF;
END $$;

-- 4. Permisos (la tabla la crea Prisma, por eso se conceden explícitamente)
GRANT SELECT ON "Table" TO anon, authenticated;

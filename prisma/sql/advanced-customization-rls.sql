-- RLS policies para el bucket advanced-customization
-- Path: advanced-customization/{storeId}/{filename}
-- Solo el dueño del store (Store.userId = auth.uid()) puede subir/borrar.
-- Ejecutar en Supabase Dashboard -> SQL Editor (o con psql/pg).
--
-- Nota: la comprobación de dueño va en una funcion SECURITY DEFINER porque el
-- rol authenticated no tiene SELECT sobre public.Store (y darle ese grant
-- expondria la tabla via PostgREST, ya que Store no tiene RLS habilitado).

create or replace function public.owns_store(store_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public."Store" s
    where s.id = store_id
      and s."userId" = auth.uid()::text
  );
$$;

revoke execute on function public.owns_store(text) from public, anon;
grant execute on function public.owns_store(text) to authenticated;

drop policy if exists "advanced-customization upload" on storage.objects;
drop policy if exists "advanced-customization delete" on storage.objects;
drop policy if exists "advanced-customization select" on storage.objects;

create policy "advanced-customization upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'advanced-customization'
    and public.owns_store((storage.foldername(name))[1])
  );

create policy "advanced-customization delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'advanced-customization'
    and public.owns_store((storage.foldername(name))[1])
  );

create policy "advanced-customization select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'advanced-customization'
    and public.owns_store((storage.foldername(name))[1])
  );

-- Alinear MIME permitidos con TASKS T2 (el codigo acepta GIF)
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'advanced-customization';

-- Bucket models-3d: modelos .glb generados a partir de fotos de productos
-- Path: models-3d/{storeId}/{productId}/{filename}
-- La primera carpeta es el storeId, asi que reutilizamos owns_store()
-- (definida en advanced-customization-rls.sql; ejecutar ese script primero).
-- Ejecutar en Supabase Dashboard -> SQL Editor (o con psql/pg).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'models-3d',
  'models-3d',
  true,
  104857600, -- 100 MB
  array['model/gltf-binary', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "models-3d upload" on storage.objects;
drop policy if exists "models-3d update" on storage.objects;
drop policy if exists "models-3d delete" on storage.objects;
drop policy if exists "models-3d select" on storage.objects;

create policy "models-3d upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'models-3d'
    and public.owns_store((storage.foldername(name))[1])
  );

create policy "models-3d update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'models-3d'
    and public.owns_store((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'models-3d'
    and public.owns_store((storage.foldername(name))[1])
  );

create policy "models-3d delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'models-3d'
    and public.owns_store((storage.foldername(name))[1])
  );

create policy "models-3d select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'models-3d'
    and public.owns_store((storage.foldername(name))[1])
  );

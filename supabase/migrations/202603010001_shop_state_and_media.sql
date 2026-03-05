begin;

alter table public.shops add column if not exists state text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_media_public_read" on storage.objects;
create policy "shop_media_public_read"
on storage.objects
for select
using (bucket_id = 'shop-media');

drop policy if exists "shop_media_user_upload" on storage.objects;
create policy "shop_media_user_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "shop_media_user_update" on storage.objects;
create policy "shop_media_user_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "shop_media_user_delete" on storage.objects;
create policy "shop_media_user_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;

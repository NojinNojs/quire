-- Covers are private and addressed by the owning reader and edition.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('covers', 'covers', false, array['image/webp'])
on conflict (id) do update set public = false, allowed_mime_types = array['image/webp'];

create policy own_covers on storage.objects for all to authenticated
using (
  bucket_id = 'covers'
  and exists (
    select 1 from public.books b
    where b.owner = (select auth.uid())
      and name = b.owner::text || '/' || b.id::text || '/cover.webp'
  )
)
with check (
  bucket_id = 'covers'
  and exists (
    select 1 from public.books b
    where b.owner = (select auth.uid())
      and name = b.owner::text || '/' || b.id::text || '/cover.webp'
  )
);

-- Remove legacy inline images rather than continuing to store encoded image bytes in books.
update public.books set cover_url = null where cover_url ~* '^data:';

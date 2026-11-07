-- Public gallery mappings; only active media is readable by visitors.
-- Existing folder hierarchy and media records are preserved.
create table public.gallery_folder_media (
  folder_id uuid not null references public.gallery_folders(id) on delete cascade,
  media_id uuid not null references public.media_uploads(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (folder_id, media_id)
);
create index gallery_folder_media_media_idx on public.gallery_folder_media(media_id);
alter table public.gallery_folder_media enable row level security;
revoke all on public.gallery_folder_media from public, anon, authenticated;
grant select on public.gallery_folder_media to anon, authenticated;
grant insert, update, delete on public.gallery_folder_media to authenticated;
create policy gallery_media_published_read on public.gallery_folder_media for select to anon, authenticated
  using (exists (select 1 from public.media_uploads m where m.id = gallery_folder_media.media_id and m.is_active));
create policy gallery_media_admin_manage on public.gallery_folder_media for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create table public.gallery_folder_covers (
  folder_id uuid primary key,
  media_id uuid not null,
  foreign key (folder_id, media_id) references public.gallery_folder_media(folder_id, media_id) on delete cascade
);
alter table public.gallery_folder_covers enable row level security;
revoke all on public.gallery_folder_covers from public, anon, authenticated;
grant select on public.gallery_folder_covers to anon, authenticated;
grant insert, update, delete on public.gallery_folder_covers to authenticated;
create policy gallery_covers_published_read on public.gallery_folder_covers for select to anon, authenticated
  using (exists (select 1 from public.media_uploads m where m.id = gallery_folder_covers.media_id and m.is_active and m.media_type = 'image'));
create policy gallery_covers_admin_manage on public.gallery_folder_covers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

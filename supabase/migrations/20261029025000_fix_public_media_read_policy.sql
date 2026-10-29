-- Keep the anonymous media read policy independent of authenticated-only is_admin().
drop policy if exists public_read_active_media on public.media_uploads;
drop policy if exists admin_read_all_media on public.media_uploads;

create policy public_read_active_media
  on public.media_uploads for select to anon, authenticated
  using (is_active = true);

create policy admin_read_all_media
  on public.media_uploads for select to authenticated
  using (public.is_admin());

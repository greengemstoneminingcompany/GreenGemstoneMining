-- Private owner evidence on the dedicated preview database.
create table if not exists public.buyer_evidence(id uuid primary key default gen_random_uuid(),category text not null check(category in ('company','licences','geology','assets','contracts','finance','safety')),title text not null check(length(trim(title)) between 3 and 180),status text not null default 'requested' check(status in ('requested','reviewing','verified','restricted')),reference text not null default '' check(length(reference)<=500),notes text not null default '' check(length(notes)<=2000),storage_path text unique,created_at timestamptz not null default now());
alter table public.buyer_evidence enable row level security;
revoke all on public.buyer_evidence from public,anon,authenticated;
grant select,insert,update,delete on public.buyer_evidence to authenticated;
drop policy if exists buyer_evidence_admin on public.buyer_evidence;
create policy buyer_evidence_admin on public.buyer_evidence for all to authenticated using(public.is_admin()) with check(public.is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ggmc-buyer-documents','ggmc-buyer-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp']::text[]) on conflict(id) do nothing;
drop policy if exists buyer_docs_admin_select on storage.objects;
create policy buyer_docs_admin_select on storage.objects for select to authenticated using(bucket_id='ggmc-buyer-documents' and public.is_admin());
drop policy if exists buyer_docs_admin_insert on storage.objects;
create policy buyer_docs_admin_insert on storage.objects for insert to authenticated with check(bucket_id='ggmc-buyer-documents' and public.is_admin());
drop policy if exists buyer_docs_admin_delete on storage.objects;
create policy buyer_docs_admin_delete on storage.objects for delete to authenticated using(bucket_id='ggmc-buyer-documents' and public.is_admin());

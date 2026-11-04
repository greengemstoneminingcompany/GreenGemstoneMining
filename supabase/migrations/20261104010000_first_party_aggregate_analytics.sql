-- Aggregate-only, company-controlled analytics. No visitor IDs, IPs, or user agents.
create table if not exists public.site_page_views_daily (
  day date not null,
  route text not null check (char_length(route) between 1 and 64),
  language text not null check (language in ('en','zh','so','ar')),
  views bigint not null default 0 check (views >= 0),
  primary key (day, route, language)
);
alter table public.site_page_views_daily enable row level security;
revoke all on public.site_page_views_daily from anon, authenticated;
create or replace function public.record_site_page_view(p_route text, p_language text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_route not in ('home','about','projects','minerals','gallery','contact')
     or p_language not in ('en','zh','so','ar') then
    raise exception 'Invalid analytics dimension';
  end if;
  insert into public.site_page_views_daily (day, route, language, views)
  values ((now() at time zone 'UTC')::date, p_route, p_language, 1)
  on conflict (day, route, language)
  do update set views = site_page_views_daily.views + 1;
end;
$$;
revoke all on function public.record_site_page_view(text,text) from public, anon, authenticated;
grant execute on function public.record_site_page_view(text,text) to service_role;

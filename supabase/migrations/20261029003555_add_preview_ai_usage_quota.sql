-- Preview-only daily quota for the AI writing Edge Function.
-- Apply ONLY to the dedicated green-gemstone-mining-preview Supabase project.
-- Never apply this migration to production.

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);
alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from public, anon, authenticated;

create or replace function public.ai_usage_take(p_limit integer default 100)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  u uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 1000));
  v_today date := (now() at time zone 'UTC')::date;
begin
  -- The quota is also the authorization gate: no usage is recorded for a caller
  -- who is not signed in and listed in the preview-only editor admin allowlist.
  if u is null or not public.is_visual_editor_admin() then
    return false;
  end if;

  insert into public.ai_usage_daily(user_id, usage_date, request_count, updated_at)
  values (u, v_today, 1, now())
  on conflict (user_id, usage_date) do update
    set request_count = public.ai_usage_daily.request_count + 1,
        updated_at = now()
    where public.ai_usage_daily.request_count < v_limit
  returning request_count into v_limit;

  return found;
end;
$$;

revoke all on function public.ai_usage_take(integer) from public, anon;
grant execute on function public.ai_usage_take(integer) to authenticated;

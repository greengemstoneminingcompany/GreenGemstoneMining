-- Cross-device reusable Creative Studio templates for the dedicated preview project only.
create table if not exists public.visual_editor_templates (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'ggmc-preview' check (project_key = 'ggmc-preview'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  block jsonb not null check (jsonb_typeof(block) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visual_editor_templates_payload_size check (pg_column_size(block) <= 100000),
  constraint visual_editor_templates_kind check (block->>'kind' in ('section','text','card','grid','image','video','link','divider','spacer'))
);

create index if not exists visual_editor_templates_updated_idx
  on public.visual_editor_templates (project_key, updated_at desc);

alter table public.visual_editor_templates enable row level security;
drop policy if exists visual_editor_templates_deny_client_access on public.visual_editor_templates;
create policy visual_editor_templates_deny_client_access
  on public.visual_editor_templates for all to anon, authenticated
  using (false) with check (false);
revoke all on table public.visual_editor_templates from anon, authenticated;

create or replace function public.list_visual_editor_templates()
returns table (id uuid, name text, block jsonb, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not public.is_visual_editor_admin() then
    raise exception 'Not authorised to manage preview templates' using errcode = '42501';
  end if;
  return query
    select t.id, t.name, t.block, t.created_at, t.updated_at
    from public.visual_editor_templates t
    where t.project_key = 'ggmc-preview'
    order by t.updated_at desc
    limit 40;
end;
$$;

create or replace function public.save_visual_editor_template(p_id uuid, p_name text, p_block jsonb)
returns public.visual_editor_templates
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare saved public.visual_editor_templates;
begin
  if auth.uid() is null or not public.is_visual_editor_admin() then
    raise exception 'Not authorised to manage preview templates' using errcode = '42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception 'Template name must be 1-80 characters' using errcode = '22023';
  end if;
  if p_block is null or jsonb_typeof(p_block) <> 'object' or pg_column_size(p_block) > 100000 then
    raise exception 'Template block must be a JSON object under 100 KB' using errcode = '22023';
  end if;
  if p_block->>'kind' not in ('section','text','card','grid','image','video','link','divider','spacer') then
    raise exception 'Unsupported template block type' using errcode = '22023';
  end if;
  if p_id is null then
    insert into public.visual_editor_templates(project_key,name,block,created_by,updated_by)
    values ('ggmc-preview',btrim(p_name),p_block,auth.uid(),auth.uid())
    returning * into saved;
  else
    update public.visual_editor_templates
       set name=btrim(p_name), block=p_block, updated_by=auth.uid(), updated_at=now()
     where id=p_id and project_key='ggmc-preview'
     returning * into saved;
    if not found then
      raise exception 'Template not found in this preview project' using errcode = 'P0002';
    end if;
  end if;
  return saved;
end;
$$;

create or replace function public.delete_visual_editor_template(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare removed integer;
begin
  if auth.uid() is null or not public.is_visual_editor_admin() then
    raise exception 'Not authorised to manage preview templates' using errcode = '42501';
  end if;
  delete from public.visual_editor_templates where id=p_id and project_key='ggmc-preview';
  get diagnostics removed = row_count;
  return removed = 1;
end;
$$;

revoke all on function public.list_visual_editor_templates() from public, anon;
revoke all on function public.save_visual_editor_template(uuid,text,jsonb) from public, anon;
revoke all on function public.delete_visual_editor_template(uuid) from public, anon;
grant execute on function public.list_visual_editor_templates() to authenticated;
grant execute on function public.save_visual_editor_template(uuid,text,jsonb) to authenticated;
grant execute on function public.delete_visual_editor_template(uuid) to authenticated;

comment on table public.visual_editor_templates is
  'Reusable Creative Studio templates for the isolated GGMC preview project; direct client table access is denied.';
comment on function public.list_visual_editor_templates() is
  'Lists preview Creative Studio templates for allowlisted editor admins only.';
comment on function public.save_visual_editor_template(uuid,text,jsonb) is
  'Creates or updates a validated reusable preview template for allowlisted editor admins only.';
comment on function public.delete_visual_editor_template(uuid) is
  'Deletes a reusable preview template for allowlisted editor admins only.';

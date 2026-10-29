-- Tighten the server-template kind validation so missing kinds are rejected too.
alter table public.visual_editor_templates
  drop constraint if exists visual_editor_templates_kind;
alter table public.visual_editor_templates
  add constraint visual_editor_templates_kind
  check (coalesce(block->>'kind','') in ('section','text','card','grid','image','video','link','divider','spacer'));

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
  if coalesce(p_block->>'kind','') not in ('section','text','card','grid','image','video','link','divider','spacer') then
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
revoke all on function public.save_visual_editor_template(uuid,text,jsonb) from public, anon;
grant execute on function public.save_visual_editor_template(uuid,text,jsonb) to authenticated;

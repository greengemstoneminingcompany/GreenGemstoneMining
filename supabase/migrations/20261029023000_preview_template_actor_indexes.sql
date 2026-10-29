-- Cover template ownership foreign keys for user deletion and actor lookups.
create index if not exists visual_editor_templates_created_by_idx
  on public.visual_editor_templates (created_by);
create index if not exists visual_editor_templates_updated_by_idx
  on public.visual_editor_templates (updated_by);

-- Remove broad table-level grants that bypass row policies for TRUNCATE and other table operations.
-- Keep only the privileges required by the public site, contact form, and authenticated media admin.
revoke all on table public.admin_users, public.leads, public.media_uploads,
  public.visual_editor_drafts, public.visual_editor_versions,
  public.visual_editor_templates, public.visual_editor_admins, public.ai_usage_daily
  from public, anon, authenticated;

-- Public gallery: visitors may read only rows permitted by RLS; media administration
-- uses authenticated CRUD privileges plus the existing is_admin()-guarded policies.
grant select on table public.media_uploads to anon, authenticated;
grant insert, update, delete on table public.media_uploads to authenticated;

-- Contact form: visitors may submit, and authenticated admins may read leads under RLS.
grant insert on table public.leads to anon, authenticated;
grant select on table public.leads to authenticated;

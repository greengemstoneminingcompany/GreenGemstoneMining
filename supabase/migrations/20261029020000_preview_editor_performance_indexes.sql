-- Preview-only performance follow-up for Visual Editor tables.
-- These indexes cover foreign-key lookups used for account deletion/update checks
-- and keep the admin self-read policy's auth lookup from being re-evaluated per row.
create index if not exists visual_editor_drafts_created_by_idx
  on public.visual_editor_drafts (created_by)
  where created_by is not null;

create index if not exists visual_editor_drafts_updated_by_idx
  on public.visual_editor_drafts (updated_by)
  where updated_by is not null;

create index if not exists visual_editor_versions_actor_id_idx
  on public.visual_editor_versions (actor_id)
  where actor_id is not null;

drop policy if exists admins_read_self on public.admin_users;
create policy admins_read_self
  on public.admin_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

comment on index public.visual_editor_drafts_created_by_idx is
  'Covers the created_by foreign key for preview Visual Editor drafts.';
comment on index public.visual_editor_drafts_updated_by_idx is
  'Covers the updated_by foreign key for preview Visual Editor drafts.';
comment on index public.visual_editor_versions_actor_id_idx is
  'Covers the actor_id foreign key for preview Visual Editor version history.';

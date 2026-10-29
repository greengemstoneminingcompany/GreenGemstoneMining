-- Function-by-function security review documentation and explicit grants.
-- Preview project only. These grants intentionally preserve current editor/site behavior.

revoke all on function public.get_published_visual_editor_payload() from public, anon, authenticated;
grant execute on function public.get_published_visual_editor_payload() to anon, authenticated;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.is_visual_editor_admin() from public, anon, authenticated;
grant execute on function public.is_visual_editor_admin() to authenticated;

revoke all on function public.ai_usage_take(integer) from public, anon, authenticated;
grant execute on function public.ai_usage_take(integer) to authenticated;

revoke all on function public.list_visual_editor_drafts() from public, anon, authenticated;
grant execute on function public.list_visual_editor_drafts() to authenticated;

revoke all on function public.list_visual_editor_versions(uuid) from public, anon, authenticated;
grant execute on function public.list_visual_editor_versions(uuid) to authenticated;

revoke all on function public.save_visual_editor_draft(uuid,integer,text,jsonb) from public, anon, authenticated;
grant execute on function public.save_visual_editor_draft(uuid,integer,text,jsonb) to authenticated;

revoke all on function public.publish_visual_editor_draft(uuid,integer) from public, anon, authenticated;
grant execute on function public.publish_visual_editor_draft(uuid,integer) to authenticated;

revoke all on function public.restore_visual_editor_version(uuid,integer) from public, anon, authenticated;
grant execute on function public.restore_visual_editor_version(uuid,integer) to authenticated;

revoke all on function public.limit_lead_rate() from public, anon, authenticated;
revoke all on function public.reject_visual_editor_version_mutation() from public, anon, authenticated;

comment on function public.get_published_visual_editor_payload() is
 'INTENTIONAL PUBLIC READ: returns only the latest published preview payload, never drafts. SECURITY DEFINER is retained because direct table access is revoked and the public site needs this RPC.';
comment on function public.is_admin() is
 'SIGNED-IN BOOLEAN GATE: checks auth.uid() against public.admin_users and returns only a boolean. EXECUTE is denied to anon; SECURITY DEFINER is retained for compatibility with protected admin-table access.';
comment on function public.is_visual_editor_admin() is
 'SIGNED-IN BOOLEAN GATE: checks auth.uid() against the dedicated preview editor allowlist. EXECUTE is authenticated-only; table access remains revoked.';
comment on function public.ai_usage_take(integer) is
 'AUTHENTICATED QUOTA GATE: returns false unless the caller is a signed-in preview editor admin, then atomically increments that users daily usage. Direct usage-table access remains revoked.';
comment on function public.list_visual_editor_drafts() is
 'EDITOR ADMIN RPC: checks auth.uid() and preview editor allowlist before returning up to 50 non-archived preview drafts.';
comment on function public.list_visual_editor_versions(uuid) is
 'EDITOR ADMIN RPC: checks auth.uid() and preview editor allowlist, validates the preview draft, and returns bounded version history.';
comment on function public.save_visual_editor_draft(uuid,integer,text,jsonb) is
 'EDITOR ADMIN WRITE RPC: checks allowlist, payload/name bounds, expected version, project key and published-snapshot immutability; appends immutable version history.';
comment on function public.publish_visual_editor_draft(uuid,integer) is
 'EDITOR ADMIN PUBLISH RPC: checks allowlist and expected version, locks the draft row, and only publishes an unpublished draft into immutable version history.';
comment on function public.restore_visual_editor_version(uuid,integer) is
 'EDITOR ADMIN RESTORE RPC: checks allowlist and source version, and creates a separate draft without mutating saved history.';
comment on function public.limit_lead_rate() is
 'TRIGGER-ONLY SECURITY DEFINER: rate-limits lead inserts. Direct RPC execution is revoked; fixed search_path is pg_catalog, public.';
comment on function public.reject_visual_editor_version_mutation() is
 'TRIGGER-ONLY guard that rejects updates/deletes to immutable visual editor history. Direct execution is revoked.';

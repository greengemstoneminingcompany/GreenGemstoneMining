-- Preview-only security hardening. Apply ONLY to green-gemstone-mining-preview.
-- This migration deliberately preserves the public published-payload RPC: the public website
-- needs to read the approved snapshot, and the function returns only that published payload.
-- Draft writes and history remain authenticated + editor-admin gated in their function bodies.

-- Trigger-only function: callers must not be able to invoke it as an RPC.
alter function public.limit_lead_rate() set search_path = pg_catalog, public;
revoke all on function public.limit_lead_rate() from public, anon, authenticated;

-- The production/admin check is a boolean gate used by signed-in app flows. Anonymous
-- calls are unnecessary; keep authenticated execution for existing app compatibility.
alter function public.is_admin() set search_path = pg_catalog, public;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Defense in depth for sensitive tables that intentionally have no direct client access.
-- Explicit deny policies document that design and silence the no-policy advisor without
-- granting table privileges or weakening the existing RPC authorization model.
drop policy if exists deny_client_access_visual_editor_admins on public.visual_editor_admins;
create policy deny_client_access_visual_editor_admins
  on public.visual_editor_admins for all to anon, authenticated
  using (false) with check (false);

drop policy if exists deny_client_access_ai_usage_daily on public.ai_usage_daily;
create policy deny_client_access_ai_usage_daily
  on public.ai_usage_daily for all to anon, authenticated
  using (false) with check (false);

-- Explicitly document the intended public read exception for review and future audits.
comment on function public.get_published_visual_editor_payload() is
  'Intentional public read exception for the dedicated preview website: returns only the latest published snapshot; never returns drafts. Keep EXECUTE granted to anon and authenticated unless the public-site snapshot reader is migrated.';
comment on function public.ai_usage_take(integer) is
  'Authenticated-only quota gate for the preview AI Edge Function; returns false unless auth.uid() is an allowlisted visual editor admin and increments quota atomically.';
comment on function public.is_visual_editor_admin() is
  'Authenticated-only boolean authorization check against the preview-specific editor allowlist.';
comment on function public.limit_lead_rate() is
  'Trigger-only lead submission rate limiter. Direct RPC execution is intentionally revoked.';

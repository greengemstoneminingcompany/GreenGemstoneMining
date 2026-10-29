# Preview editor security review

**Scope:** the dedicated green-gemstone-mining-preview Supabase project only.  
**Reviewed:** 2026-10-29.  
**Production:** no production database or deployment was changed.

## Changes applied

- Hardened public.is_admin() and public.limit_lead_rate() with a fixed search_path = pg_catalog, public.
- Revoked direct RPC execution of the trigger-only public.limit_lead_rate() and public.reject_visual_editor_version_mutation() functions.
- Revoked anonymous execution of public.is_admin(); authenticated execution remains for existing signed-in admin flows.
- Added explicit deny-all RLS policies for public.visual_editor_admins and public.ai_usage_daily. Client table privileges remain revoked; privileged operations use narrow RPCs.
- Re-audited direct table grants and removed broad TRUNCATE, REFERENCES, TRIGGER, UPDATE, and DELETE privileges from the preview client roles. Only the required media gallery and lead form privileges remain; editor drafts, versions, templates, allowlists, and quota tables have no direct client grants.
- Split the media SELECT policies so anonymous visitors can read active media without needing execute permission on the authenticated-only `is_admin()` function; authenticated admins retain access to inactive media.
- Added database-side lead constraints for normalized email, email format, trimmed values, company/message lengths, and the contact form's allowed interest values so direct API callers cannot bypass the UI's validation.
- Aligned the preview storage bucket's allowed MIME types with the client-side media validator and retained the 10 MB limit; `text/plain` is no longer accepted by the media bucket.
- Reasserted explicit function grants and added database comments documenting each security-definer function's purpose and intended exposure.
- Kept the public published-snapshot reader because the website needs approved snapshot data. It returns only the latest published payload, not drafts.

## Function-by-function review

| Function | Intended execution | Review and safeguards |
|---|---|---|
| get_published_visual_editor_payload() | anon, authenticated | **Intentional public exception.** Returns only the latest published payload for the fixed preview project. Fixed search path. Its advisor warning is retained rather than breaking public snapshot rendering. |
| is_admin() | authenticated only | Returns a boolean based on auth.uid() and public.admin_users; no anonymous calls. Fixed search path. The security-definer context preserves the existing protected-table check. |
| is_visual_editor_admin() | authenticated only | Returns a boolean from the preview-only allowlist. Direct allowlist table access is revoked. |
| ai_usage_take(integer) | authenticated only | Requires a signed-in allowlisted editor admin and atomically increments that user's daily quota. Direct usage-table access is revoked. Required by the JWT-authenticated AI Edge Function. |
| list_visual_editor_drafts() | authenticated only | Checks both signed-in identity and editor-admin allowlist; scopes results to the fixed preview project and caps the result set. |
| list_visual_editor_versions(uuid) | authenticated only | Checks admin access, validates the draft belongs to the preview project, and limits returned history. |
| save_visual_editor_draft(uuid, integer, text, jsonb) | authenticated only | Checks admin access, validates name/payload bounds, scopes writes to preview, uses expected-version conflict checks, and rejects changes to published snapshots. |
| publish_visual_editor_draft(uuid, integer) | authenticated only | Checks admin access, locks the draft row, checks the expected version, and publishes only a draft. A separate immutable version record is created. |
| restore_visual_editor_version(uuid, integer) | authenticated only | Checks admin access and source version, then creates a new draft instead of mutating existing history. |
| list_visual_editor_templates() | authenticated only | Checks the signed-in identity and editor-admin allowlist; lists only the fixed preview project's templates and caps results at 40. |
| save_visual_editor_template(uuid, text, jsonb) | authenticated only | Checks admin access, validates name, supported block kind, and payload size, and scopes writes to the preview project. |
| delete_visual_editor_template(uuid) | authenticated only | Checks admin access and deletes only a template in the fixed preview project. Direct table privileges remain revoked. |
| limit_lead_rate() | Trigger invocation only | Remains a security-definer trigger because lead submission rate limiting must read protected lead records. Direct execution is revoked and the search path is fixed. |
| reject_visual_editor_version_mutation() | Trigger invocation only | Ordinary trigger guard, not security-definer; direct execution is revoked. It prevents updates/deletes to immutable history. |

## Edge Function review

- `magic-write` is active on the dedicated preview project at version 6 with JWT verification enabled.
- It accepts only POST/OPTIONS, checks the request origin against the preview-host pattern or explicit `ALLOWED_ORIGINS`, bounds request size and text length, and allows only known writing modes and tones.
- Before calling the configured AI provider, it forwards the caller's bearer token to `ai_usage_take(integer)`; that RPC rejects anonymous and non-allowlisted users and applies a per-user daily quota.
- Provider secrets are read from Edge Function environment variables and are not sent to the browser. Provider calls have a timeout and bounded output.
- Live provider calls were not exercised during this static review; verify them after the preview build can be tested.

## Remaining advisor warnings

Supabase's security advisor flags functions based on their SECURITY DEFINER attribute and role grants; it does not prove the function body is exploitable. The remaining function warnings are deliberate:

- **One anonymous-callable definer:** get_published_visual_editor_payload() is public by design and returns only the published preview payload. Removing its anonymous grant without replacing the public read path would break public snapshot rendering.
- **Twelve authenticated-callable definer findings:** these are the quota gate, boolean authorization checks, draft/version RPCs, and the three shared-template RPCs. Each has a narrow grant and performs the relevant authentication/admin checks internally. Moving them to invoker mode without redesigning table privileges would break their purpose or require broader direct table access.

The three shared-template RPCs are also intentionally callable by authenticated users; each checks the preview editor-admin allowlist before reading or changing template records. The template table denies direct client table access and has indexes on both actor foreign keys.

The advisor also reports **Leaked Password Protection Disabled**. This is an Auth configuration setting, not a database function or SQL grant. It was **not** changed through SQL because that is not a supported/safe way to alter the project's Auth configuration. Enable leaked-password protection in the preview project's Supabase Dashboard under **Authentication → Settings → Password Security**. Reference: [Supabase password security documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Recheck checklist

- [x] Anonymous direct execution revoked for editor/admin RPCs and the trigger-only rate limiter.
- [x] Sensitive allowlist and quota tables have deny-all client RLS policies and no client table grants.
- [x] Direct table grants are least-privilege: media read for visitors; media CRUD for authenticated users guarded by admin RLS; lead insert for visitors and authenticated users; lead select for authenticated users guarded by admin RLS; no broad table-operation grants.
- [x] Anonymous media SELECT policy does not call the authenticated-only `is_admin()` RPC.
- [x] Lead inserts are constrained at the database boundary in addition to client-side validation and trigger-based rate limiting.
- [x] Preview media bucket MIME types match the UI allowlist; the 10 MB upload limit remains enforced.
- [x] Draft write/history RPCs remain authenticated-only and perform admin checks.
- [x] Shared-template RPCs enforce the editor-admin allowlist; direct table grants are revoked.
- [x] Template actor foreign keys are indexed.
- [x] Public published snapshot read intentionally preserved.
- [x] Security advisor re-run after migration; RLS no-policy findings cleared.
- [ ] Enable leaked-password protection in Supabase Auth settings.
- [ ] Run live browser/editor acceptance tests against the preview deployment; the connected browser context was unavailable during this review.

// Company-controlled, aggregate-only analytics endpoint.
// Deploy to the company's Supabase project. Requires SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY and SITE_ORIGIN environment secrets.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const allowedRoutes = new Set(['home', 'about', 'projects', 'minerals', 'gallery', 'contact']);
const allowedLanguages = new Set(['en', 'zh', 'so', 'ar']);
Deno.serve(async (request) => {
  const siteOrigin = Deno.env.get('SITE_ORIGIN');
  const requestOrigin = request.headers.get('origin');
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
  if (!siteOrigin || requestOrigin !== siteOrigin) {
    return new Response(JSON.stringify({ error: 'Forbidden origin' }), { status: 403, headers });
  }
  if (request.method === 'OPTIONS') return new Response(null, {
    status: 204, headers: { ...headers, 'Access-Control-Allow-Origin': siteOrigin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' },
  });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  if (Number(request.headers.get('content-length') || '0') > 1024) return new Response(JSON.stringify({ error: 'Too large' }), { status: 413, headers });
  let data: unknown;
  try { data = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }
  if (!data || typeof data !== 'object') return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers });
  const { route, language } = data as Record<string, unknown>;
  if (typeof route !== 'string' || !allowedRoutes.has(route) || typeof language !== 'string' || !allowedLanguages.has(language))
    return new Response(JSON.stringify({ error: 'Invalid dimensions' }), { status: 400, headers });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return new Response(JSON.stringify({ error: 'Not configured' }), { status: 503, headers });
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.rpc('record_site_page_view', { p_route: route, p_language: language });
  if (error) return new Response(JSON.stringify({ error: 'Storage failed' }), { status: 503, headers });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, 'Access-Control-Allow-Origin': siteOrigin } });
});

// Preview-only AI writing endpoint. Deploy with Verify JWT enabled.
const MODES: Record<string, string> = {
  rewrite: 'Rewrite this text in a TONE tone for the same audience. Keep facts unchanged.',
  grammar: 'Fix grammar, spelling and punctuation only. Do not change wording or meaning.',
  expand: 'Expand this text with a little more detail in a TONE tone. Do not invent facts, figures or claims.',
  shorten: 'Shorten this text and keep its meaning.',
  seo_title: 'Write one SEO page title (max 60 characters) for this content.',
  meta_description: 'Write one meta description (max 155 characters) for this content.',
  alt_text: 'Write concise image alt text (max 125 characters) for this description.',
  section_copy: 'Write a concise website section headline on the first line, then a blank line, then 2–4 sentences of supporting copy. Use only facts provided in the brief. Do not invent certifications, locations, statistics, reserves, or claims. Return plain text only.',
};
const TONES = ['professional', 'friendly', 'persuasive', 'technical', 'concise', 'playful', 'bold'];
const MAX_CHARS = 4000;
const allowedOrigins = [...new Set((Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean))];
function originOk(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || parsed.protocol !== 'https:' || parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    const isProjectPreview = host.startsWith('green-gemstone-mining-') && host.endsWith('-green-gemstone-mining-company.vercel.app');
    return isProjectPreview || allowedOrigins.includes(origin);
  } catch { return false; }
}
const headersFor = (origin: string | null) => ({
  'Access-Control-Allow-Origin': originOk(origin) ? origin! : 'null',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
});
const fail = (origin: string | null, status: number, code: string, message: string) =>
  new Response(JSON.stringify({ error: { code, message } }), { status, headers: headersFor(origin) });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: originOk(origin) ? 204 : 403, headers: headersFor(origin) });
  if (req.method !== 'POST') return fail(origin, 405, 'method_not_allowed', 'Use POST.');
  if (!originOk(origin)) return fail(origin, 403, 'origin_not_allowed', 'This site is not allowed to use AI writing.');

  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > 20000) return fail(origin, 413, 'body_too_large', 'Request body is too large.');
  let raw: unknown;
  try {
    const rawText = await req.text();
    if (rawText.length > 20000) return fail(origin, 413, 'body_too_large', 'Request body is too large.');
    raw = JSON.parse(rawText);
  } catch { return fail(origin, 400, 'bad_json', 'Request was not valid JSON.'); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(origin, 400, 'bad_body', 'Request body must be a JSON object.');
  const body = raw as { mode?: unknown; tone?: unknown; text?: unknown };
  const mode = typeof body.mode === 'string' ? body.mode : '';
  const tone = typeof body.tone === 'string' && TONES.includes(body.tone) ? body.tone : 'friendly';
  const text = body.text;
  if (!Object.hasOwn(MODES, mode)) return fail(origin, 400, 'bad_mode', 'Unknown writing action.');
  if (typeof text !== 'string' || !text.trim()) return fail(origin, 400, 'empty_text', 'Select some text first.');
  if (text.length > MAX_CHARS) return fail(origin, 413, 'too_long', `Text is limited to ${MAX_CHARS} characters.`);

  const env = (key: string) => Deno.env.get(key) ?? '';
  const provider = env('AI_PROVIDER') || 'anthropic';
  const model = env('AI_MODEL');
  const supabaseUrl = env('SUPABASE_URL');
  const anonKey = env('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return fail(origin, 500, 'not_configured', 'The preview authorization service is not configured.');
  if (!['anthropic', 'openai_compatible', 'n8n'].includes(provider)) return fail(origin, 500, 'not_configured', 'Unknown AI_PROVIDER.');

  let url: string;
  let headers: Record<string, string> = { 'content-type': 'application/json' };
  let payload: unknown;
  if (provider === 'anthropic') {
    if (!model || !(env('AI_API_KEY') || env('ANTHROPIC_API_KEY'))) return fail(origin, 500, 'not_configured', 'AI_MODEL and an Anthropic API key must be configured.');
    url = 'https://api.anthropic.com/v1/messages';
    headers = { ...headers, 'x-api-key': env('AI_API_KEY') || env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01' };
    payload = { model, max_tokens: 1000, system: 'You edit website copy for a company site. Return only the edited text, plain text, no quotes, markdown, HTML or commentary.', messages: [{ role: 'user', content: `${MODES[mode].replace('TONE', tone)}\n\n${text}` }] };
  } else if (provider === 'openai_compatible') {
    if (!env('AI_BASE_URL') || !model || !env('AI_API_KEY')) return fail(origin, 500, 'not_configured', 'AI_BASE_URL, AI_MODEL and AI_API_KEY are required.');
    try { const base = new URL(env('AI_BASE_URL')); if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error(); url = base.toString().replace(/\/$/, '') + '/chat/completions'; }
    catch { return fail(origin, 500, 'not_configured', 'AI_BASE_URL must be a valid HTTPS endpoint without credentials, query or fragment.'); }
    headers = { ...headers, Authorization: 'Bearer ' + env('AI_API_KEY') };
    payload = { model, max_tokens: 1000, messages: [{ role: 'system', content: 'You edit website copy for a company site. Return only the edited text, plain text, no quotes, markdown, HTML or commentary.' }, { role: 'user', content: `${MODES[mode].replace('TONE', tone)}\n\n${text}` }] };
  } else {
    if (!env('AI_WEBHOOK_URL') || !env('AI_WEBHOOK_SECRET')) return fail(origin, 500, 'not_configured', 'AI_WEBHOOK_URL and AI_WEBHOOK_SECRET are required for n8n.');
    try { const webhook = new URL(env('AI_WEBHOOK_URL')); if (webhook.protocol !== 'https:' || webhook.username || webhook.password) throw new Error(); url = webhook.toString(); }
    catch { return fail(origin, 500, 'not_configured', 'AI_WEBHOOK_URL must be a valid HTTPS URL without credentials.'); }
    headers = { ...headers, 'x-webhook-secret': env('AI_WEBHOOK_SECRET') };
    payload = { system: 'Return only edited website copy as plain text. Do not return HTML or commentary.', prompt: `${MODES[mode].replace('TONE', tone)}\n\n${text}`, mode, tone, text };
  }

  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+/i.test(auth)) return fail(origin, 401, 'not_signed_in', 'Sign in to the editor first.');
  let gate: Response;
  try {
    gate = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/ai_usage_take`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_limit: Math.max(1, Math.min(1000, parseInt(env('AI_DAILY_LIMIT') || '100', 10) || 100)) }),
    });
  } catch { return fail(origin, 502, 'gate_unreachable', 'Could not verify your editor access. Try again.'); }
  if (gate.status === 401) return fail(origin, 401, 'not_signed_in', 'Sign in to the editor first.');
  if (!gate.ok) return fail(origin, 502, 'gate_error', 'Could not verify your editor access.');
  let allowed: unknown;
  try { allowed = await gate.json(); } catch { return fail(origin, 502, 'gate_error', 'Could not verify your editor access.'); }
  if (allowed !== true) return fail(origin, 403, 'not_allowed_or_limit', 'This account is not authorised for AI writing, or its daily limit has been reached.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, { method: 'POST', signal: controller.signal, headers, body: JSON.stringify(payload) });
    if (response.status === 401 || response.status === 403) return fail(origin, 502, 'provider_auth', 'The AI key or webhook secret on the server is missing or invalid.');
    if (response.status === 429) return fail(origin, 429, 'provider_busy', 'The AI service hit its limit or is busy. Try again later.');
    if (!response.ok) return fail(origin, 502, 'provider_error', 'The AI service returned an error.');
    let result: unknown;
    try { result = await response.json(); } catch { return fail(origin, 502, 'bad_provider_response', 'The AI service returned an invalid response.'); }
    if (!result || typeof result !== 'object') return fail(origin, 502, 'bad_provider_response', 'The AI service returned an invalid response.');
    const data = result as Record<string, unknown>;
    const firstContent = Array.isArray(data.content) && data.content[0] && typeof data.content[0] === 'object' ? data.content[0] as Record<string, unknown> : undefined;
    const firstChoice = Array.isArray(data.choices) && data.choices[0] && typeof data.choices[0] === 'object' ? data.choices[0] as Record<string, unknown> : undefined;
    const message = firstChoice?.message && typeof firstChoice.message === 'object' ? firstChoice.message as Record<string, unknown> : undefined;
    const output = provider === 'anthropic' ? firstContent?.text : provider === 'n8n' ? (typeof data.text === 'string' ? data.text : data.output) : message?.content;
    if (typeof output !== 'string' || !output.trim()) return fail(origin, 502, 'empty_result', 'The AI returned nothing. Your text was not changed.');
    if (output.length > 10000) return fail(origin, 502, 'result_too_long', 'The AI returned an unexpectedly long result.');
    return new Response(JSON.stringify({ text: output.trim(), mode }), { headers: headersFor(origin) });
  } catch (error) {
    return fail(origin, (error as Error)?.name === 'AbortError' ? 504 : 502, 'provider_unreachable', 'Could not reach the AI service.');
  } finally { clearTimeout(timer); }
});

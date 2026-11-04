// Optional server-side adapter for a licensed market-data provider.
// Configure MARKET_DATA_URL and MARKET_DATA_TOKEN in deployment secrets.
// Upstream must return { quotes: [{ symbol, price, currency, unit, asOf, source, delayMinutes? }] }.
// No static fallback, simulated series, or client-exposed provider credentials.
export default async function handler(request: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  const upstream = process.env.MARKET_DATA_URL;
  const token = process.env.MARKET_DATA_TOKEN;
  if (!upstream || !token) return new Response(JSON.stringify({ quotes: [], status: 'unconfigured' }), { status: 503, headers });
  let url: URL;
  try { url = new URL(upstream); } catch { return new Response(JSON.stringify({ error: 'Invalid provider configuration' }), { status: 503, headers }); }
  if (url.protocol !== 'https:' || url.username || url.password)
    return new Response(JSON.stringify({ error: 'Invalid provider configuration' }), { status: 503, headers });
  try {
    const result = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!result.ok) throw new Error('Provider unavailable');
    const body: unknown = await result.json();
    const quotes = body && typeof body === 'object' && Array.isArray((body as { quotes?: unknown }).quotes)
      ? (body as { quotes: unknown[] }).quotes : [];
    const clean = quotes.filter((q): q is Record<string, unknown> => {
      if (!q || typeof q !== 'object') return false;
      const v = q as Record<string, unknown>;
      return typeof v.symbol === 'string' && v.symbol.length <= 50
        && typeof v.price === 'number' && Number.isFinite(v.price) && v.price > 0
        && typeof v.currency === 'string' && v.currency.length <= 8
        && typeof v.unit === 'string' && v.unit.length <= 24
        && typeof v.source === 'string' && v.source.length > 0 && v.source.length <= 120
        && typeof v.asOf === 'string' && !Number.isNaN(Date.parse(v.asOf));
    }).map((q) => ({
      symbol: q.symbol, price: q.price, currency: q.currency, unit: q.unit,
      source: q.source, asOf: q.asOf,
      ...(typeof q.delayMinutes === 'number' && Number.isFinite(q.delayMinutes) && q.delayMinutes >= 0
        ? { delayMinutes: q.delayMinutes } : {}),
    }));
    return new Response(JSON.stringify({ quotes: clean }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ quotes: [], status: 'unavailable' }), { status: 503, headers });
  }
}

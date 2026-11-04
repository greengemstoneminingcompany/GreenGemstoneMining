import { useEffect } from 'react';
import { useI18n } from '@/i18n/core';

const ROUTES = new Set(['home', 'about', 'projects', 'minerals', 'gallery', 'contact']);
/** Counts page views in the company's database without cookies, fingerprinting or third-party analytics. */
export default function SiteAnalytics({ route }: { route: string }) {
  const { lang } = useI18n();
  useEffect(() => {
    const endpoint = import.meta.env.VITE_SITE_ANALYTICS_URL;
    if (!endpoint || !ROUTES.has(route) || navigator.doNotTrack === '1') return;
    let url: URL;
    try { url = new URL(endpoint); } catch { return; }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return;
    const controller = new AbortController();
    void fetch(url.toString(), {
      method: 'POST', mode: 'cors', cache: 'no-store', keepalive: true,
      credentials: 'omit', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route, language: lang }),
    }).catch(() => undefined);
    return () => controller.abort();
  }, [route, lang]);
  return null;
}

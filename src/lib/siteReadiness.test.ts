import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
  rewrites: { source: string; destination: string }[];
};

describe('SEO and security configuration acceptance', () => {
  it('publishes canonical and alternate links for all four languages', () => {
    expect(html).toContain('rel="canonical"');
    for (const [lang, path] of [['en', '/'], ['so', '/so/'], ['ar', '/ar/'], ['zh-Hans', '/zh/']]) {
      expect(html).toContain(`hreflang="${lang}" href="%SITE_URL%${path}"`);
    }
    expect(html).toContain('hreflang="x-default"');
  });
  it('includes discoverability and social metadata', () => {
    for (const name of ['description', 'robots', 'twitter:card']) expect(html).toContain(`name="${name}"`);
    for (const property of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image']) expect(html).toContain(`property="${property}"`);
    expect(html).toContain('application/ld+json');
  });
  it('applies key browser security headers to all routes', () => {
    const global = config.headers.find(item => item.source === '/(.*)');
    expect(global).toBeDefined();
    const headers = new Map(global?.headers.map(item => [item.key.toLowerCase(), item.value]));
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('strict-transport-security')).toContain('max-age=');
    const csp = headers.get('content-security-policy') ?? '';
    for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"]) expect(csp).toContain(directive);
  });
  it('rewrites the three non-English language prefixes', () => {
    for (const source of ['/:lang(so|ar|zh)', '/:lang(so|ar|zh)/']) {
      expect(config.rewrites).toContainEqual({ source, destination: '/index.html' });
    }
  });
});

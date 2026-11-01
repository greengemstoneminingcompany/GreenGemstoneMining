/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://green-gemstone-mining-nine.vercel.app').replace(/\/+$/, '');

/** Fills %SITE_URL% in index.html and emits robots.txt + sitemap.xml for the configured domain. */
const siteFiles = (): Plugin => ({
  name: 'site-files',
  transformIndexHtml: (html) => {
    const withSiteUrl = html.replaceAll('%SITE_URL%', SITE_URL);
    // Expose the editor marker only in Vercel Preview builds or local development.
    // Never rely on a static index.html marker: it would leak the editor entry point into production.
    const editorEnabled = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';
    return editorEnabled
      ? withSiteUrl.replace('</head>', '  <meta name="ggmc-preview-editor" content="enabled">\n</head>')
      : withSiteUrl;
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` });
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  ${['', 'zh/', 'so/', 'ar/'].map((p) => `  <url>\n    <loc>${SITE_URL}/${p}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n${[['en', ''], ['zh-Hans', 'zh/'], ['so', 'so/'], ['ar', 'ar/']].map(([l, q]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${q}"/>`).join('\n')}\n  </url>`).join('\n')}\n</urlset>\n`,
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), siteFiles()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep the Supabase client in its own chunk so it loads only when needed.
        manualChunks(id: string) {
          if (id.includes('node_modules/@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

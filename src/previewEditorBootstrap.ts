import DOMPurify from 'dompurify';

declare global {
  interface Window {
    DOMPurify?: typeof DOMPurify;
  }
}

// Bundle the vetted sanitizer with the app. Load the editor only after the main
// module has installed its Supabase-backed authorization bridge.
window.DOMPurify = DOMPurify;
window.addEventListener('load', () => {
  const marker = document.querySelector('meta[name="ggmc-preview-editor"]');
  const host = window.location.hostname;
  const allowedHost = host === 'localhost' || host === '127.0.0.1' || (host.startsWith('green-gemstone-mining-') && host.endsWith('-green-gemstone-mining-company.vercel.app'));
  if (marker?.getAttribute('content') !== 'enabled' || !allowedHost) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = '/visual-editor.js';
  script.async = false;
  script.dataset.previewEditor = 'true';
  document.body.append(script);
}, { once: true });

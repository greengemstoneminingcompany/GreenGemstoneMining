export const safeUrl = (value) => {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\\\\]/.test(value)) return '#';
  const raw = value.trim();
  if (raw.startsWith('#')) return /^#[\w-]*$/.test(raw) ? raw : '#';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const url = new URL(raw, location.origin);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password ? raw : '#';
  } catch { return '#'; }
};

export const safeImageSrc = value => {
  if (typeof value !== 'string' || /[\u0000-\u0020\\\\]/.test(value)) return false;
  if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value)) return true;
  if (/["'();{}]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value, location.origin);
    return url.protocol === 'https:' && !url.username && !url.password && /^https:\/\//i.test(value);
  } catch { return false; }
};

const SAFE_CSS_PROPERTIES = new Set([
  'color', 'background-color', 'font-size', 'padding', 'margin', 'border-radius',
  'text-align', 'font-weight', 'font-style', 'text-decoration-line', 'text-transform',
  'rotate', 'font-family', 'line-height', 'letter-spacing', 'width', 'height', 'border',
  'box-shadow', 'opacity', 'background-size', 'background-position', 'filter',
  'object-fit', 'object-position', 'display',
]);

export const safeCssValue = (prop, value) => {
  if (typeof value !== 'string' || value.length > 200 ||
      /[<>\\\\;{}\u0000-\u001f]/.test(value) ||
      /(?:url\s*\(|expression\s*\(|@import|javascript\s*:|vbscript\s*:)/i.test(value)) return false;
  if (!SAFE_CSS_PROPERTIES.has(prop)) return false;
  try { return typeof CSS !== 'undefined' && CSS.supports(prop, value.trim()); } catch { return false; }
};

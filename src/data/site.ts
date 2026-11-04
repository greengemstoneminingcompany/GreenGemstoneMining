import type { GalleryItem, GalleryGroup } from '@/lib/media';

// Configure a company-controlled HTTPS image CDN to serve the same optimized WebP filenames.
// Local assets remain a safe fallback until the CDN files have been verified.
const configuredMediaBase = import.meta.env.VITE_MEDIA_BASE_URL?.trim() || '';
const IMG = (() => {
  if (!configuredMediaBase) return '/assets/images';
  try {
    const url = new URL(configuredMediaBase);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return '/assets/images';
    return url.href.replace(/[/]$/, '');
  } catch { return '/assets/images'; }
})();

export const SITE = {
  name: 'Green Gemstone Mining Company',
  email: 'greengemstoneminingcompany@gmail.com',
  linkedin: '' as string, // TODO(owner): add the real LinkedIn company URL; the link is hidden while empty.
};

/** Visual identity per deposit card; the words live in src/i18n/*.ts (same order). */
export const DEPOSITS: { tone: string; icon: 'gem' | 'atom' | 'hammer' | 'mountain' }[] = [
  { tone: 'emerald', icon: 'gem' },
  { tone: 'violet', icon: 'atom' },
  { tone: 'copper', icon: 'hammer' },
  { tone: 'slate', icon: 'mountain' },
];

export const MINERALS = [
  { name: 'Emerald', cat: 'Gemstone' },
  { name: 'Beryllium', cat: 'Metal' },
  { name: 'Chromite', cat: 'Metal' },
  { name: 'Copper', cat: 'Metal' },
  { name: 'Gold', cat: 'Precious' },
  { name: 'Lead', cat: 'Metal' },
  { name: 'Lithium', cat: 'Metal' },
  { name: 'Mica muscovite', cat: 'Non-metal' },
  { name: 'Tantalum', cat: 'Metal' },
  { name: 'Tin', cat: 'Metal' },
  { name: 'Tungsten', cat: 'Metal' },
  { name: 'Uranium', cat: 'Metal' },
];

/** Regions on the map. `key` indexes MAP_REGIONS; the id indexes the translated text. dx/dy nudge the name label. */
export const REGIONS: { id: string; key: string; dx?: number; dy?: number }[] = [
  { id: 'awdal', key: 'Awdal' },
  { id: 'maroodiJeex', key: 'Maroodi Jeex', dx: -18, dy: -34 },
  { id: 'sahil', key: 'Sahil', dx: -95, dy: 34 },
  { id: 'togdheer', key: 'Togdheer', dx: 22 },
  { id: 'sanaag', key: 'Sanaag' },
  { id: 'sool', key: 'Sool' },
];

/** Years only; titles and descriptions live in src/i18n/*.ts (same order). */
export const TIMELINE = [{ year: '2018' }, { year: '2020' }, { year: '2022' }, { year: '2025' }];

export const GALLERY_GROUPS: GalleryGroup[] = ['Company', 'Ore gallery', 'Gemstones', 'Field gallery', 'My uploads'];

const g = (file: string, label: string, group: GalleryGroup): GalleryItem => ({
  src: `${IMG}/${file}.webp`,
  label,
  group,
  type: 'image',
  width: 1366,
  height: 768,
});

/** Only real sample collages and the company history. Presentation text slides are not shown as photos. */
export const GALLERY: GalleryItem[] = [
  g('Our_Awesome_History', 'Our history', 'Company'),
  g('Gold_Gallery', 'Gold samples', 'Ore gallery'),
  g('Copper_Ore_Gallery', 'Copper ore samples', 'Ore gallery'),
  g('Lithium_Ore_Gallery', 'Lithium ore samples', 'Ore gallery'),
  g('Tantalum_Ore_Gallery', 'Tantalum ore samples', 'Ore gallery'),
  g('Chromite_Ore_Gallery', 'Chromite ore samples', 'Ore gallery'),
  g('Beryllium_Ore_Gallery', 'Beryllium ore samples', 'Ore gallery'),
  g('Lead_Ore_Gallery', 'Lead ore samples', 'Ore gallery'),
  g('Mica_Muscovite_Gallery', 'Mica muscovite samples', 'Ore gallery'),
  g('Gemstone_Gallery_1', 'Gemstone samples 1', 'Gemstones'),
  g('Gemstone_Gallery_2', 'Gemstone samples 2', 'Gemstones'),
  g('Gemstone_Gallery_3', 'Gemstone samples 3', 'Gemstones'),
  g('Our_Gallery_5', 'Sample records and testing', 'Field gallery'),
];

export const IMAGES = {
  company: `${IMG}/company-field.webp`,
};

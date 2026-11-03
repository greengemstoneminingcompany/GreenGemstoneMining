import { ABOUT } from '@/data/about';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { GALLERY, IMAGES, MINERALS, SITE, TIMELINE } from '@/data/site';
import { PROJECTS, type ProjectArea } from '@/data/company';
import type { GalleryItem } from '@/lib/media';

export const ABOUT_SECTION_KEYS = ['operations', 'development', 'community', 'services', 'history', 'leadership'] as const;
export type AboutSectionKey = typeof ABOUT_SECTION_KEYS[number];
export type AboutCard = { label: string; title: string; paragraphs: string[]; items: string[]; link?: { label: string; target: AboutSectionKey } };
export type AboutSection = { eyebrow: string; title: string; emphasis: string; introduction: string; note: string; cards: AboutCard[] };
export type AboutRecords = Record<AboutSectionKey, AboutSection>;

export type CompanyMetric = { value: string; label: string };
export type CompanyRecords = {
  version: 1;
  about: AboutRecords;
  profile: { legalName: string; email: string; linkedin: string; officeAddress: string; publicLocation: string; heroImage: string; companyImage: string };
  metrics: CompanyMetric[];
  industrialStats: CompanyMetric[];
  projects: ProjectArea[];
  minerals: { name: string; cat: string }[];
  gallery: GalleryItem[];
  timeline: { year: string }[];
  mineralInterests: string[];
  gemstoneInterests: string[];
};

export const defaultCompanyRecords: CompanyRecords = {
  version: 1,
  about: ABOUT,
  profile: { legalName: SITE.name, email: SITE.email, linkedin: SITE.linkedin, officeAddress: 'Omar Hashi Building, 4th Floor, Hargeisa, Somaliland.', publicLocation: 'Hargeisa, Somaliland', heroImage: IMAGES.company, companyImage: IMAGES.company },
  metrics: [
    { value: '12', label: 'Mineral interests' }, { value: '6', label: 'Regions of interest' }, { value: '2018', label: 'Established' }, { value: '14', label: 'Field areas' },
  ],
  industrialStats: [{ value: '12', label: 'Mineral interests' }, { value: '6', label: 'Regions of interest' }, { value: '2018', label: 'Established' }],
  projects: PROJECTS,
  minerals: MINERALS,
  gallery: GALLERY,
  timeline: TIMELINE,
  mineralInterests: ['Gold', 'Mica muscovite', 'Lithium', 'Copper', 'Tin', 'Tungsten', 'Lead', 'Titanium', 'Tantalum', 'Uranium', 'Beryl', 'Molybdenum', 'Chromite', 'Beryllium', 'Emerald'],
  gemstoneInterests: ['Alexandrite', 'Emerald', 'Sapphire', 'Ruby', 'Aquamarine', 'Tsavorite', 'Serendibite', 'Spinel', 'Opal', 'Topaz', 'Tourmaline'],
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const text = (value: unknown, fallback: string, max = 500) => typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : fallback;
const url = (value: unknown, fallback: string) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2000 || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname) && !parsed.username && !parsed.password && !/\s/.test(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

/** Bounded, typed record validation for published editor snapshots. */
export function parseCompanyRecords(value: unknown): CompanyRecords | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>; const base = clone(defaultCompanyRecords);
  const about = raw.about && typeof raw.about === 'object' && !Array.isArray(raw.about) ? raw.about as Record<string, unknown> : {};
  for (const key of ABOUT_SECTION_KEYS) {
    const candidate = about[key];
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>; const section = base.about[key];
    for (const field of ['eyebrow', 'title', 'emphasis', 'introduction', 'note'] as const) {
      const limit = field === 'introduction' || field === 'note' ? 3000 : 180;
      if (typeof row[field] === 'string' && row[field].length <= limit) section[field] = row[field].trim();
    }
    if (Array.isArray(row.cards) && row.cards.length <= 40) section.cards = row.cards.flatMap(value => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      const card = value as Record<string, unknown>;
      const strings = (input: unknown) => Array.isArray(input) && input.length <= 30 ? input.map(item => text(item, '', 3000)).filter(Boolean) : [];
      const title = text(card.title, '', 180);
      const link = card.link && typeof card.link === 'object' ? card.link as Record<string, unknown> : {};
      const target = ABOUT_SECTION_KEYS.find(key => key === link.target);
      const label = text(link.label, '', 180);
      return title ? [{ title, label: text(card.label, '', 180), paragraphs: strings(card.paragraphs), items: strings(card.items), ...(target && label ? { link: { target, label } } : {}) }] : [];
    });
  }
  const profile = raw.profile && typeof raw.profile === 'object' ? raw.profile as Record<string, unknown> : {};
  base.profile = {
    legalName: text(profile.legalName, base.profile.legalName, 160), email: text(profile.email, base.profile.email, 254), linkedin: text(profile.linkedin, base.profile.linkedin, 1000),
    officeAddress: text(profile.officeAddress, base.profile.officeAddress, 500), publicLocation: text(profile.publicLocation, base.profile.publicLocation, 180), heroImage: url(profile.heroImage, base.profile.heroImage), companyImage: url(profile.companyImage, base.profile.companyImage),
  };
  const metrics = (input: unknown, fallback: CompanyMetric[], cap: number) => Array.isArray(input) && input.length <= cap ? input.map((item, index) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}; return { value: text(row.value, fallback[index]?.value || '', 80), label: text(row.label, fallback[index]?.label || '', 160) };
  }).filter(row => row.value && row.label) : fallback;
  base.metrics = metrics(raw.metrics, base.metrics, 12); base.industrialStats = metrics(raw.industrialStats, base.industrialStats, 8);
  if (Array.isArray(raw.projects) && raw.projects.length <= 100) base.projects = raw.projects.map((item, index) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}; const fallback = PROJECTS[index] || PROJECTS[0];
    const lon = row.lon === null || row.lon === undefined || row.lon === '' ? null : Number(row.lon), lat = row.lat === null || row.lat === undefined || row.lat === '' ? null : Number(row.lat), priority = Number(row.priority);
    const findings = Array.isArray(row.findings) ? row.findings.slice(0, 30).flatMap(f => { const x = f && typeof f === 'object' ? f as Record<string, unknown> : {}; const evidence = text(x.evidence, '', 20); return ['observed','reported','unverified','inferred','confirmed'].includes(evidence) && text(x.mineral, '', 100) ? [{ mineral: text(x.mineral, '', 100), evidence: evidence as ProjectArea['findings'][number]['evidence'] }] : []; }) : fallback.findings;
    return { id: text(row.id, fallback.id, 80).replace(/[^a-zA-Z0-9_-]/g, ''), name: text(row.name, fallback.name, 160), region: text(row.region, fallback.region, 80), lon: lon === null ? null : Number.isFinite(lon) && lon >= -180 && lon <= 180 ? lon : null, lat: lat === null ? null : Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : null, priority: [1,2,3].includes(priority) ? priority as 1|2|3 : null, port: row.port === true, findings };
  }).filter((project, index, projects) => project.id && projects.findIndex(other => other.id === project.id) === index) as ProjectArea[];
  if (Array.isArray(raw.minerals) && raw.minerals.length <= 80) base.minerals = raw.minerals.map((item, index) => { const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}; return { name: text(row.name, MINERALS[index]?.name || '', 120), cat: text(row.cat, MINERALS[index]?.cat || '', 80) }; }).filter(item => item.name);
  if (Array.isArray(raw.gallery) && raw.gallery.length <= 200) base.gallery = raw.gallery.map((item, index) => { const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}; const fallback = GALLERY[index] || GALLERY[0]; return { ...fallback, src: url(row.src, fallback.src), label: text(row.label, fallback.label, 180), group: text(row.group, fallback.group, 80) as GalleryItem['group'], type: row.type === 'video' ? 'video' : 'image' }; });
  if (Array.isArray(raw.timeline) && raw.timeline.length <= 20) base.timeline = raw.timeline.map((item, index) => ({ year: text(item && typeof item === 'object' ? (item as Record<string, unknown>).year : '', TIMELINE[index]?.year || '', 16) })).filter(item => item.year);
  for (const key of ['mineralInterests', 'gemstoneInterests'] as const) if (Array.isArray(raw[key]) && raw[key].length <= 80) base[key] = raw[key].map(item => text(item, '', 120)).filter(Boolean);
  return base;
}

const CompanyRecordsContext = createContext<CompanyRecords>(defaultCompanyRecords);
export const useCompanyRecords = () => useContext(CompanyRecordsContext);
export function CompanyRecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState(defaultCompanyRecords);
  useEffect(() => {
    const sync = (event?: Event) => { const detail = event instanceof CustomEvent ? event.detail : window.__GGMC_COMPANY_RECORDS__; const next = parseCompanyRecords(detail); if (next) setRecords(next); };
    sync(); window.addEventListener('ggmc-company-records', sync); return () => window.removeEventListener('ggmc-company-records', sync);
  }, []);
  return <CompanyRecordsContext.Provider value={useMemo(() => records, [records])}>{children}</CompanyRecordsContext.Provider>;
}

declare global { interface Window { __GGMC_COMPANY_RECORDS__?: unknown; __GGMC_COMPANY_DEFAULT_RECORDS__?: CompanyRecords } }

export type SitePage = 'home' | 'about' | 'projects' | 'minerals' | 'gallery' | 'contact';
export type SiteRoute = { page: SitePage; section?: string };
const pages: SitePage[] = ['home', 'about', 'projects', 'minerals', 'gallery', 'contact'];
const sectionPages: Record<string, SitePage> = {
  'company-profile': 'about', 'vision-mission': 'about', leadership: 'about',
  'history-details': 'about', 'rural-development': 'about', 'fieldwork-history': 'about',
  operations: 'projects', 'development-projects': 'projects', services: 'projects',
  'project-dossiers': 'projects', 'development-review': 'projects',
  gemstones: 'minerals', 'industrial-metals': 'minerals', 'buyer-specifications': 'minerals',
};
/** Preserve existing bookmarks while using the feature branch's dedicated pages. */
export function readSiteRoute(hash: string): SiteRoute {
  const value = hash.replace(/^#\/?/, '');
  const [path, query = ''] = value.split('?');
  if (path === 'company') return { page: 'about', section: 'company-profile' };
  if (path === 'mission') return { page: 'about', section: 'vision-mission' };
  if (path === 'resources') return { page: 'minerals' };
  if (sectionPages[path]) return { page: sectionPages[path], section: path };
  const page = pages.find(page => page === path) || 'home';
  const section = new URLSearchParams(query).get('section') || undefined;
  return { page: section && sectionPages[section] ? sectionPages[section] : page, ...(section ? { section } : {}) };
}

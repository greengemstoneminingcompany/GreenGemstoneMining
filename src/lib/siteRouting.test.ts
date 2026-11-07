import { describe, expect, it } from 'vitest';
import { readSiteRoute } from './siteRouting';

describe('public page routes', () => {
  it('keeps the homepage separate from detailed pages', () => {
    expect(readSiteRoute('')).toEqual({ page: 'home' });
    expect(readSiteRoute('#/gallery')).toEqual({ page: 'gallery' });
    expect(readSiteRoute('#/contact')).toEqual({ page: 'contact' });
  });
  it('preserves old company, mission and portfolio bookmarks', () => {
    expect(readSiteRoute('#company')).toEqual({ page: 'about', section: 'company-profile' });
    expect(readSiteRoute('#mission')).toEqual({ page: 'about', section: 'vision-mission' });
    expect(readSiteRoute('#resources')).toEqual({ page: 'minerals' });
  });
  it('opens legacy and routed deep links on the page that owns the section', () => {
    expect(readSiteRoute('#leadership')).toEqual({ page: 'about', section: 'leadership' });
    expect(readSiteRoute('#/projects?section=project-dossiers')).toEqual({ page: 'projects', section: 'project-dossiers' });
    expect(readSiteRoute('#/about?section=operations')).toEqual({ page: 'projects', section: 'operations' });
    expect(readSiteRoute('#buyer-specifications')).toEqual({ page: 'minerals', section: 'buyer-specifications' });
  });
  it('falls back to the homepage for unknown routes', () => {
    expect(readSiteRoute('#/missing-page')).toEqual({ page: 'home' });
  });
});

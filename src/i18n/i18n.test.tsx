// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '@/App';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { langFromPath, matchBrowserLanguage, pathForLang } from '@/i18n/core';
import en from '@/i18n/en';
import { companyPageCopy } from '@/i18n/company-pages';
import so from '@/i18n/so';
import ar from '@/i18n/ar';
import zh from '@/i18n/zh';
import { DEPOSITS, GALLERY, MINERALS, TIMELINE } from '@/data/site';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  document.documentElement.removeAttribute('dir');
});

describe('language helpers', () => {
  it('reads the language from the URL path', () => {
    expect(langFromPath('/')).toBeNull();
    expect(langFromPath('/so/')).toBe('so');
    expect(langFromPath('/ar')).toBe('ar');
    expect(langFromPath('/zh/#contact')).toBe('zh');
    expect(langFromPath('/sox/')).toBeNull();
  });
  it('builds paths and maps browser languages', () => {
    expect(pathForLang('en')).toBe('/');
    expect(pathForLang('so')).toBe('/so/');
    expect(matchBrowserLanguage(['fr-FR', 'zh-CN'])).toBe('zh');
    expect(matchBrowserLanguage(['ar-SA'])).toBe('ar');
    expect(matchBrowserLanguage(['de'])).toBeNull();
  });
});

describe.each([['so', so], ['ar', ar], ['zh', zh]] as const)('%s dictionary', (_name, d) => {
  it('has the same list lengths as English', () => {
    expect(d.hero.metrics).toHaveLength(en.hero.metrics.length);
    expect(d.marquee).toHaveLength(en.marquee.length);
    expect(d.resources.deposits).toHaveLength(DEPOSITS.length);
    expect(d.history.timeline).toHaveLength(TIMELINE.length);
    expect(d.mission.points).toHaveLength(en.mission.points.length);
    expect(d.industrial.stats).toHaveLength(3);
    expect(d.contact.form.interests).toHaveLength(en.contact.form.interests.length);
  });
  it('translates every gallery item, mineral and category', () => {
    for (const item of GALLERY) expect(d.gallery.items[item.label], item.label).toBeTruthy();
    for (const m of MINERALS) {
      expect(d.catalogue.minerals[m.name], m.name).toBeTruthy();
      expect(d.catalogue.cats[m.cat], m.cat).toBeTruthy();
    }
  });
  it('has no empty strings', () => {
    const empties: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'string') { if (!v.trim()) empties.push(path); }
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
    };
    walk(d, 'dict');
    expect(empties).toEqual([]);
  });
});

describe('dictionary structure', () => {
  const shape = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(shape);
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
    }
    return typeof value;
  };
  it.each([['Somali', so], ['Arabic', ar], ['Chinese', zh]] as const)(
    '%s matches the full English dictionary structure',
    (_language, dictionary) => {
      expect(shape(dictionary)).toEqual(shape(en));
    },
  );
});

describe('LanguageProvider', () => {
  it('opens /so/ in Somali with the right document language', async () => {
    window.history.replaceState(null, '', '/so/');
    render(<LanguageProvider><App /></LanguageProvider>);
    await waitFor(() => expect(document.documentElement.lang).toBe('so'));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(so.hero.h1a);
  });

  it('switches to Arabic, flips to right-to-left, and remembers the choice', async () => {
    render(<LanguageProvider><App /></LanguageProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('ar');
    expect(window.location.pathname).toBe('/ar/');
    expect(window.localStorage.getItem('ggm-lang')).toBe('ar');
    expect(document.title).toBe(ar.meta.title);
  });
});


describe('company subpage translation coverage', () => {
  it.each(['en', 'so', 'ar', 'zh'] as const)('%s provides complete project directory labels', (lang) => {
    const copy = companyPageCopy(lang);
    for (const key of ['fieldRecords', 'projectAreas', 'evidenceHeading', 'recordsDisclaimer', 'filterProjects', 'filterAll', 'filterPriority', 'filterOther', 'filterPort'] as const) {
      expect(copy[key].trim().length).toBeGreaterThan(0);
    }
  });
});

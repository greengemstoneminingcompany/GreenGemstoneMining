import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import en, { type Dict } from './en';
import { I18nContext, LANGUAGES, loaders, langFromPath, matchBrowserLanguage, pathForLang, type Lang } from './core';

const STORAGE_KEY = 'ggm-lang';

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'zh' || v === 'so' || v === 'ar';

const readStored = (): Lang | null => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
};

const detectLanguage = (): Lang =>
  langFromPath(window.location.pathname) ?? readStored() ?? matchBrowserLanguage(navigator.languages ?? [navigator.language]) ?? 'en';

const setMeta = (selector: string, attr: string, value: string) => document.querySelector(selector)?.setAttribute(attr, value);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // `shown` is the language of the dictionary actually on screen.
  const [state, setState] = useState<{ lang: Lang; t: Dict }>({ lang: 'en', t: en });

  // A slower previous import must never overwrite a more recent language choice.
  const loadVersion = useRef(0);
  const load = useCallback(async (lang: Lang) => {
    const version = ++loadVersion.current;
    try {
      const t = lang === 'en' ? en : (await loaders[lang]()).default;
      if (version === loadVersion.current) setState({ lang, t });
    } catch (error) {
      if (version === loadVersion.current) console.error('Failed to load language:', lang, error);
    }
  }, []);

  useEffect(() => {
    const initial = detectLanguage();
    // Language detection needs browser APIs (URL, storage, navigator), so it can only run after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(initial);
    // Make the URL match the language (e.g. a Somali browser landing on "/").
    if (langFromPath(window.location.pathname) !== (initial === 'en' ? null : initial)) {
      window.history.replaceState(null, '', pathForLang(initial) + window.location.hash);
    }
    const versionRef = loadVersion;
    const onPop = () => void load(langFromPath(window.location.pathname) ?? 'en');
    window.addEventListener('popstate', onPop);
    return () => { ++versionRef.current; window.removeEventListener('popstate', onPop); };
  }, [load]);

  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === state.lang) ?? LANGUAGES[0];
    const root = document.documentElement;
    root.lang = meta.htmlLang;
    root.dir = meta.dir;
    document.title = state.t.meta.title;
    setMeta('meta[name="description"]', 'content', state.t.meta.description);
    setMeta('meta[property="og:title"]', 'content', state.t.meta.title);
    setMeta('meta[property="og:description"]', 'content', state.t.meta.description);
    setMeta('meta[name="twitter:title"]', 'content', state.t.meta.title);
    setMeta('meta[name="twitter:description"]', 'content', state.t.meta.description);
    setMeta('meta[property="og:locale"]', 'content', ({ en: 'en_US', so: 'so_SO', ar: 'ar_AR', zh: 'zh_CN' } as const)[state.lang]);
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonical) {
      const url = new URL(pathForLang(state.lang), canonical).toString();
      setMeta('link[rel="canonical"]', 'href', url);
      setMeta('meta[property="og:url"]', 'content', url);
    }
  }, [state]);

  const setLang = useCallback(
    (lang: Lang) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* storage unavailable: the choice just will not persist */
      }
      window.history.pushState(null, '', pathForLang(lang) + window.location.hash);
      void load(lang);
    },
    [load],
  );

  const value = useMemo(() => ({ lang: state.lang, t: state.t, setLang }), [state, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

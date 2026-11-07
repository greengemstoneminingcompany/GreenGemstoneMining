import { ABOUT } from '@/data/about';
import type { AboutRecords, AboutSectionKey } from '@/lib/companyRecords';
import type { Lang } from './core';
import { so } from './about-so';
import { ar } from './about-ar';
import { zh } from './about-zh';

const translations = { so, ar, zh };

/**
 * Localize only text that still matches its original English default.
 * Published CMS overrides remain unchanged; never translate stale defaults
 * over a customized fact or an editor-authored disclaimer.
 */
export function localizeAbout(records: AboutRecords, lang: Lang): AboutRecords {
  if (lang === 'en') return records;
  const translated = translations[lang];
  const result = {} as AboutRecords;
  const field = (current: string, original: string, translation: string) =>
    current === original ? translation : current;
  for (const key of Object.keys(ABOUT) as AboutSectionKey[]) {
    const source = ABOUT[key], current = records[key], locale = translated[key];
    result[key] = {
      ...current,
      eyebrow: field(current.eyebrow, source.eyebrow, locale.eyebrow),
      title: field(current.title, source.title, locale.title),
      emphasis: field(current.emphasis, source.emphasis, locale.emphasis),
      introduction: field(current.introduction, source.introduction, locale.introduction),
      note: field(current.note, source.note, locale.note),
      cards: current.cards.map((card, index) => {
        const original = source.cards[index], translation = locale.cards[index];
        if (!original || !translation) return card;
        return {
          ...card,
          label: field(card.label, original.label, translation.label),
          title: field(card.title, original.title, translation.title),
          paragraphs: card.paragraphs.map((value, i) => original.paragraphs[i] !== undefined && translation.paragraphs[i] !== undefined ? field(value, original.paragraphs[i], translation.paragraphs[i]) : value),
          items: card.items.map((value, i) => original.items[i] !== undefined && translation.items[i] !== undefined ? field(value, original.items[i], translation.items[i]) : value),
          ...(card.link && original.link && translation.link ? { link: { ...card.link, label: field(card.link.label, original.link.label, translation.link.label) } } : {}),
        };
      }),
    };
  }
  return result;
}

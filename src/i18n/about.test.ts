import { describe, expect, it } from 'vitest';
import { ABOUT } from '@/data/about';
import { localizeAbout } from './about';

describe('localized detailed About records', () => {
  for (const lang of ['so', 'ar', 'zh'] as const) {
    it(`translates all six sections and preserves key company facts in ${lang}`, () => {
      const localized = localizeAbout(ABOUT, lang);
      for (const key of Object.keys(ABOUT) as (keyof typeof ABOUT)[]) {
        expect(localized[key].title).not.toBe(ABOUT[key].title);
        expect(localized[key].cards).toHaveLength(ABOUT[key].cards.length);
        for (const [index, card] of localized[key].cards.entries()) {
          expect(card.label).not.toBe(ABOUT[key].cards[index].label);
          expect(card.paragraphs[0]).not.toBe(ABOUT[key].cards[index].paragraphs[0]);
        }
      }
      expect(localized.operations.cards[0].paragraphs[0]).toContain('600');
      expect(localized.operations.cards[2].items).toHaveLength(6);
      expect(localized.services.cards[3].link?.target).toBe('community');
    });
  }
  it('preserves CMS-authored changes at field and item granularity', () => {
    const edited = structuredClone(ABOUT);
    edited.operations.cards[0].title = 'Custom title';
    edited.operations.cards[2].items[0] = 'Custom machine';
    edited.operations.note = 'Custom disclaimer';
    edited.services.cards[3].link!.label = 'Custom link';
    for (const lang of ['so', 'ar', 'zh'] as const) {
      const result = localizeAbout(edited, lang);
      expect(result.operations.cards[0].title).toBe('Custom title');
      expect(result.operations.cards[2].items[0]).toBe('Custom machine');
      expect(result.operations.note).toBe('Custom disclaimer');
      expect(result.services.cards[3].link?.label).toBe('Custom link');
      expect(result.operations.cards[1].title).not.toBe(ABOUT.operations.cards[1].title);
    }
  });
});

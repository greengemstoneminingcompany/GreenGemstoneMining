// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { defaultCompanyRecords, parseCompanyRecords } from './companyRecords';
// @ts-expect-error Browser-native editor feature is intentionally JavaScript.
import { mountCompanyRecords } from '../../public/visual-editor/features/company-records.js';

it('edits dedicated About fields in an older draft and preserves unrelated company facts', () => {
  window.__GGMC_COMPANY_DEFAULT_RECORDS__ = defaultCompanyRecords;
  const draft = { companyRecords: structuredClone(defaultCompanyRecords) };
  delete (draft.companyRecords as Partial<typeof defaultCompanyRecords>).about;
  const panel = document.createElement('div');
  const dispose = mountCompanyRecords({ panel, getDraft: () => draft, saveHistory: () => {}, applyChange: () => {}, say: () => {} });
  const tab = [...panel.querySelectorAll('button')].find(button => button.textContent === 'Detailed About')!;
  tab.click();
  const input = panel.querySelector<HTMLInputElement>('[aria-label="operations: Record 3 title"]')!;
  expect(input.value).toBe('1 tonne per hour');
  input.value = 'Verified plant capacity';
  input.dispatchEvent(new Event('change'));
  const parsed = parseCompanyRecords(draft.companyRecords)!;
  expect(parsed.about.operations.cards[2].title).toBe('Verified plant capacity');
  expect(parsed.about.operations.cards[2].items).toEqual(defaultCompanyRecords.about.operations.cards[2].items);
  expect(parsed.about.community).toEqual(defaultCompanyRecords.about.community);
  expect('text' in draft).toBe(false);
  dispose();
  expect(panel.children).toHaveLength(0);
});

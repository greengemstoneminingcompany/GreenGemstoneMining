import { describe, expect, it } from 'vitest';
import { defaultCompanyRecords, parseCompanyRecords } from './companyRecords';

describe('company records', () => {
  it('accepts bounded shared project and contact records', () => {
    const records = parseCompanyRecords({
      profile: { ...defaultCompanyRecords.profile, officeAddress: 'Verified office', legalName: 'Verified company' },
      projects: [{ ...defaultCompanyRecords.projects[0], name: 'Verified project', lon: 44.1, lat: 10.1 }],
      metrics: [{ value: '9', label: 'Verified metric' }],
    });
    expect(records?.profile.officeAddress).toBe('Verified office');
    expect(records?.projects[0]).toMatchObject({ name: 'Verified project', lon: 44.1, lat: 10.1 });
    expect(records?.metrics).toEqual([{ value: '9', label: 'Verified metric' }]);
  });

  it('rejects invalid coordinates and unsupported finding evidence', () => {
    const records = parseCompanyRecords({ projects: [{ ...defaultCompanyRecords.projects[0], lon: 999, findings: [{ mineral: 'Gold', evidence: 'made-up' }] }] });
    expect(records?.projects[0].lon).toBe(defaultCompanyRecords.projects[0].lon);
    expect(records?.projects[0].findings).toEqual([]);
  });
});

it('migrates older snapshots without losing detailed company facts', () => {
  const records = parseCompanyRecords({ version: 1 });
  expect(records?.about).toEqual(defaultCompanyRecords.about);
  expect(records?.about.operations.cards[0].paragraphs[0]).toContain('not 600 tonnes of gold');
  expect(records?.about.operations.cards[2].items).toContain('15×0×250 jaw crusher (notation preserved from the supplied specification)');
  expect(records?.about.leadership.cards.map(card => card.title)).toEqual(['Mr. Ahmed Saleiman', 'Mr. Saeed Guled']);
});

it('bounds detailed records and renders content as plain strings', () => {
  const records = parseCompanyRecords({ about: {
    operations: { title: 'Verified operations', cards: [{ title: '<script>literal text</script>', label: 'Equipment', paragraphs: ['Verified specification'], items: ['Pump'] }] },
    history: { title: 'x'.repeat(181), cards: Array(41).fill({ title: 'Over limit' }) },
    leadership: { cards: [] },
  } });
  expect(records?.about.operations.title).toBe('Verified operations');
  expect(records?.about.operations.cards[0].title).toBe('<script>literal text</script>');
  expect(records?.about.history).toEqual(defaultCompanyRecords.about.history);
  expect(records?.about.leadership.cards).toEqual([]);
  expect(defaultCompanyRecords.about.operations.title).toBe('Real assets.');
});

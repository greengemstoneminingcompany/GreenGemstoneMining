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
    expect(records?.projects[0].lon).toBeNull();
    expect(records?.projects[0].findings).toEqual([]);
  });
});

it('migrates older snapshots without losing detailed company facts', () => {
  const records = parseCompanyRecords({ version: 1 });
  expect(records?.about).toEqual(defaultCompanyRecords.about);
  expect(records?.about.operations.cards[0].paragraphs[0]).toContain('not 600 tonnes of gold');
  expect(records?.about.operations.cards[2].items).toContain('15×0×250 jaw crusher (notation preserved from the supplied specification)');
  expect(records?.about.leadership.cards.map(card => card.title)).toEqual(['Mr. Ahmed Saleiman', 'Mr. Saeed Guled', 'Mr. Abdillahi Omar Abdillahi']);
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


describe('unverified project locations', () => {
  it('preserves unset coordinates without creating a zero-zero map location', () => {
    const parsed = parseCompanyRecords({ projects: [{ id: 'new-project', name: 'Unlocated project', region: 'awdal', lon: null, lat: null, priority: null, findings: [] }] });
    expect(parsed?.projects[0]).toMatchObject({ id: 'new-project', lon: null, lat: null });
  });
  it('rejects out-of-range coordinates rather than substituting another project location', () => {
    const parsed = parseCompanyRecords({ projects: [{ ...defaultCompanyRecords.projects[0], lon: 200, lat: -95 }] });
    expect(parsed?.projects[0].lon).toBeNull();
    expect(parsed?.projects[0].lat).toBeNull();
  });
});


describe('published media URL safety', () => {
  it.each(['//untrusted.example/image.jpg', '/\\\\untrusted.example/image.jpg', 'javascript:alert(1)', 'http://untrusted.example/image.jpg'])('rejects unsafe image URL %s', (src) => {
    const parsed = parseCompanyRecords({ profile: { heroImage: src }, gallery: [{ ...defaultCompanyRecords.gallery[0], src }] });
    expect(parsed?.profile.heroImage).toBe(defaultCompanyRecords.profile.heroImage);
    expect(parsed?.gallery[0].src).toBe(defaultCompanyRecords.gallery[0].src);
  });
  it.each(['https://user:password@example.com/photo.jpg', 'https://user@example.com/photo.jpg', '/\\\\example.com/photo.jpg', '/path\\\\image.jpg', 'https://example.com/\\\\other.example/photo.jpg'])('rejects ambiguous or credential-bearing URL %s', (src) => {
    const parsed = parseCompanyRecords({ profile: { heroImage: src } });
    expect(parsed?.profile.heroImage).toBe(defaultCompanyRecords.profile.heroImage);
  });
  it('accepts HTTPS media without embedded credentials', () => {
    expect(parseCompanyRecords({ profile: { heroImage: 'https://example.com/media/photo.jpg' } })?.profile.heroImage).toBe('https://example.com/media/photo.jpg');
  });
  it('accepts safe local media paths', () => {
    expect(parseCompanyRecords({ profile: { heroImage: '/assets/images/company.jpg' } })?.profile.heroImage).toBe('/assets/images/company.jpg');
  });
});


describe('project record identity', () => {
  it('does not publish duplicate project IDs', () => {
    const first = defaultCompanyRecords.projects[0];
    const parsed = parseCompanyRecords({ projects: [first, { ...first, name: 'Duplicated project' }] });
    expect(parsed?.projects).toHaveLength(1);
    expect(parsed?.projects[0].name).toBe(first.name);
  });
});


describe('case-insensitive published project identities', () => {
  it('keeps the first project when IDs differ only by letter case', () => {
    const first = defaultCompanyRecords.projects[0];
    const parsed = parseCompanyRecords({ projects: [first, { ...first, id: first.id.toUpperCase(), name: 'Duplicate with different case' }] });
    expect(parsed?.projects).toHaveLength(1);
    expect(parsed?.projects[0].name).toBe(first.name);
  });
});

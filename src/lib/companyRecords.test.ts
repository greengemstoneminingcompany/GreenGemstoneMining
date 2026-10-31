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

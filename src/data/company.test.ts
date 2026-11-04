import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/data/company';

describe('company evidence records', () => {
  it('has unique project identifiers', () => {
    const ids = PROJECTS.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses recognized evidence classifications', () => {
    const valid = new Set(['observed', 'reported', 'unverified', 'inferred', 'confirmed']);
    for (const project of PROJECTS) {
      for (const finding of project.findings) {
        expect(valid.has(finding.evidence)).toBe(true);
      }
    }
  });
});

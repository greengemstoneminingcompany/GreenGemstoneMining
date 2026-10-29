import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabase } from '@/lib/supabase';
import { submitLead, validateLead, type LeadInput } from './leads';

vi.mock('@/lib/supabase', () => ({ getSupabase: vi.fn() }));

const base: LeadInput = {
  name: 'Amina Yusuf',
  email: 'amina@example.com',
  company: '',
  interest: 'Investment',
  message: 'I would like the investor pack, please.',
  website: '',
};

describe('validateLead', () => {
  it('accepts a complete enquiry', () => {
    expect(validateLead(base)).toEqual({});
  });
  it('flags a bad email', () => {
    expect(validateLead({ ...base, email: 'nope' }).email).toBe('email');
    expect(validateLead({ ...base, email: 'a@b' }).email).toBe('email');
  });
  it('flags short name and message', () => {
    const errors = validateLead({ ...base, name: 'A', message: 'hi' });
    expect(errors.name).toBe('name');
    expect(errors.message).toBe('messageShort');
  });
  it('flags an over-long message', () => {
    expect(validateLead({ ...base, message: 'x'.repeat(2001) }).message).toBe('messageLong');
  });
});


describe('submitLead', () => {
  beforeEach(() => vi.resetAllMocks());

  it('does not store submissions that fill the honeypot field', async () => {
    await expect(submitLead({ ...base, website: 'https://spam.example' })).resolves.toEqual({ ok: true });
    expect(getSupabase).not.toHaveBeenCalled();
  });

  it('reports missing Supabase configuration without throwing', async () => {
    vi.mocked(getSupabase).mockResolvedValue(null);
    await expect(submitLead(base)).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });

  it('reports client initialization failures as network errors', async () => {
    vi.mocked(getSupabase).mockRejectedValue(new Error('client initialization failed'));
    await expect(submitLead(base)).resolves.toEqual({ ok: false, reason: 'network' });
  });
});

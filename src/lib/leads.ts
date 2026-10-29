import { getSupabase } from '@/lib/supabase';

export const INTERESTS = [
  'Investment',
  'Joint venture or partnership',
  'Offtake or purchasing',
  'Technical or operating services',
  'Other',
] as const;

export type Interest = (typeof INTERESTS)[number];

export interface LeadInput {
  name: string;
  email: string;
  company: string;
  interest: Interest;
  message: string;
  /** Honeypot: real visitors never fill this in. */
  website: string;
}

/** Error codes; the UI translates them (see i18n `contact.form.errors`). */
export interface LeadErrors {
  name?: 'name';
  email?: 'email';
  message?: 'messageShort' | 'messageLong';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(input: LeadInput): LeadErrors {
  const errors: LeadErrors = {};
  if (input.name.trim().length < 2) errors.name = 'name';
  if (!EMAIL_RE.test(input.email.trim()) || input.email.length > 254) {
    errors.email = 'email';
  }
  if (input.message.trim().length < 10) errors.message = 'messageShort';
  if (input.message.length > 2000) errors.message = 'messageLong';
  return errors;
}

export type SubmitResult = { ok: true } | { ok: false; reason: 'unavailable' | 'rejected' | 'network' };

/** Stores the enquiry in the `leads` table (insert-only for anonymous visitors). */
export async function submitLead(input: LeadInput): Promise<SubmitResult> {
  // Bots tend to fill every field: pretend success, store nothing.
  if (input.website.trim() !== '') return { ok: true };
  try {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, reason: 'unavailable' };

    const { error } = await supabase.from('leads').insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      company: input.company.trim() || null,
      interest: input.interest,
      message: input.message.trim(),
    });
    if (error) return { ok: false, reason: 'rejected' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

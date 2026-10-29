import { FormEvent, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { INTERESTS, submitLead, validateLead, type Interest, type LeadErrors } from '@/lib/leads';
import { SITE } from '@/data/site';
import { useI18n } from '@/i18n/core';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const { t } = useI18n();
  const f = t.contact.form;
  const [form, setForm] = useState({ name: '', email: '', company: '', interest: INTERESTS[0] as Interest, message: '', website: '' });
  const [errors, setErrors] = useState<LeadErrors>({});
  const [state, setState] = useState<State>('idle');

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateLead(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setState('sending');
    try {
      const result = await submitLead(form);
      setState(result.ok ? 'sent' : 'error');
    } catch {
      // Keep the form recoverable if the client or network fails unexpectedly.
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="form-success" role="status">
        <Check size={18} /> {f.success}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="contact-form contact-form-full" noValidate>
      <div className="field">
        <label htmlFor="cf-name">{f.name}</label>
        <input id="cf-name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'cf-name-err' : undefined} />
        {errors.name && <small id="cf-name-err" className="field-error">{f.errors[errors.name]}</small>}
      </div>
      <div className="field">
        <label htmlFor="cf-email">{f.email}</label>
        <input id="cf-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'cf-email-err' : undefined} />
        {errors.email && <small id="cf-email-err" className="field-error">{f.errors[errors.email]}</small>}
      </div>
      <div className="field">
        <label htmlFor="cf-company">{f.company}</label>
        <input id="cf-company" autoComplete="organization" value={form.company} onChange={set('company')} />
      </div>
      <div className="field">
        <label htmlFor="cf-interest">{f.interest}</label>
        <select id="cf-interest" value={form.interest} onChange={set('interest')}>
          {INTERESTS.map((i, idx) => <option key={i} value={i}>{f.interests[idx]}</option>)}
        </select>
      </div>
      <div className="field field-wide">
        <label htmlFor="cf-message">{f.message}</label>
        <textarea id="cf-message" rows={4} value={form.message} onChange={set('message')} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'cf-msg-err' : undefined} />
        {errors.message && <small id="cf-msg-err" className="field-error">{f.errors[errors.message]}</small>}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      <button className="btn btn-gold" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? f.sending : <>{f.submit} <ArrowRight size={16} /></>}
      </button>
      {state === 'error' && (
        <p className="field-error" role="alert">
          {f.errorBefore} <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      )}
    </form>
  );
}

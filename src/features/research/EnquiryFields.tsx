import { useI18n } from '@/i18n/core';
import { researchCopy } from './copy';
import type { EnquiryDetails } from './enquiry';

export default function EnquiryFields({ value, onChange }: { value:EnquiryDetails; onChange:(value:EnquiryDetails)=>void }) {
  const { lang }=useI18n();const c=researchCopy(lang);
  const fields=['project','mineral','quantity','destination','requirements'] as const;
  return <details className="field field-wide research-enquiry" open={Boolean(value.project || value.mineral)}><summary>{c.enquiry}</summary><p>{c.enquiryNote}</p><div className="research-enquiry-grid">{fields.map(key=><label key={key} htmlFor={`cf-${key}`}>{c[key]}<input id={`cf-${key}`} maxLength={160} value={value[key]} onChange={event=>onChange({...value,[key]:event.target.value})}/></label>)}</div></details>;
}

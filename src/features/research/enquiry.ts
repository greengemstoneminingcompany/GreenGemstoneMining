export type EnquiryDetails = { project: string; mineral: string; quantity: string; destination: string; requirements: string };
const empty: EnquiryDetails = { project:'', mineral:'', quantity:'', destination:'', requirements:'' };
let pending: Partial<EnquiryDetails> | null = null;
export function prepareEnquiry(value: Partial<EnquiryDetails>) {
  pending = Object.fromEntries(Object.entries(value).filter(([key,v]) => key in empty && typeof v === 'string').map(([key,v]) => [key, v.slice(0,160)]));
  window.dispatchEvent(new CustomEvent('ggmc-enquiry-context', { detail: pending }));
}
export function takeEnquiryDetails(): EnquiryDetails {
  const value = { ...empty, ...pending }; pending=null; return value;
}
export function composeEnquiry(message: string, details: EnquiryDetails): string {
  const labels: Record<keyof EnquiryDetails,string> = { project:'Project / area',mineral:'Mineral / product',quantity:'Quantity and unit',destination:'Destination',requirements:'Specification / documents' };
  const extra=(Object.keys(labels) as (keyof EnquiryDetails)[]).filter(key => details[key].trim()).map(key => `${labels[key]}: ${details[key].trim()}`);
  return [message.trim(), ...extra].filter(Boolean).join('\n');
}

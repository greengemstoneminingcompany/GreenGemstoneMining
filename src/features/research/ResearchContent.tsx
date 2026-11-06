import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/core';
import { COMPANY_NOTES, GLOSSARY, INVESTOR_STEPS, LAB_RECORDS, MICA_SIZES, PRODUCT_NOTES, PROJECT_NOTES, SOURCES, SOURCE_RECORD_IDS, TRADE_STEPS, type SourceId } from './catalogue';
import { researchCopy } from './copy';
import { researchLink } from './routing';
import { prepareEnquiry } from './enquiry';
import './research.css';

export function SourceReferences({ ids }: { ids: readonly SourceId[] }) {
  const { lang } = useI18n(); const c = researchCopy(lang);
  return <details className="research-sources"><summary>{c.references}</summary><ul lang="en">{[...new Set(ids)].map(id => <li key={id}><strong>{SOURCES[id].title}</strong><span>{SOURCES[id].date} · {SOURCES[id].kind} · Evidence {SOURCE_RECORD_IDS[id].join(", ")}</span></li>)}</ul></details>;
}

function Enquire({ project = '', mineral = '', label }: { project?: string; mineral?: string; label?: string }) {
  const { lang } = useI18n();
  return <a className="link-go" href={researchLink('contact')} onClick={() => prepareEnquiry({ project, mineral })}>{label || researchCopy(lang).request} <span aria-hidden="true">↗</span></a>;
}

export default function ResearchContent({ kind }: { kind: 'projects' | 'minerals' | 'company' | 'investor' }) {
  const { lang } = useI18n(); const c = researchCopy(lang);
  const [selected, setSelected] = useState(PROJECT_NOTES[0].id);
  useEffect(() => {
    const select = (event: Event) => {
      const id = (event as CustomEvent<unknown>).detail;
      if (typeof id === 'string' && PROJECT_NOTES.some(p => p.id === id)) setSelected(id);
    };
    window.addEventListener('ggmc-select-project-note', select);
    return () => window.removeEventListener('ggmc-select-project-note', select);
  }, []);
  const note = PROJECT_NOTES.find(p => p.id === selected)!;
  const sectionId = { projects: 'project-dossiers', minerals: 'buyer-specifications', company: 'fieldwork-history', investor: 'development-review' }[kind];
  return <section className="sec research-block" id={sectionId} data-editor-id={`research.${kind}`}>
    <div className="sec-container">
      <div className="research-heading"><p className="eyebrow">{c.references}</p><h2>{({ projects:c.dossiers, minerals:c.products, company:c.company, investor:c.investor })[kind]}</h2><p className="research-source-note">{c.sourceNote}</p><small>{c.original}</small></div>
      {kind === 'projects' && <>
        <label className="research-select">{c.project}<select value={selected} onChange={event => setSelected(event.target.value)}>{PROJECT_NOTES.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <article className="research-dossier" lang="en" data-editor-id={`research.project.${note.id}`}>
          <div><p className="eyebrow">{note.period}</p><h3>{note.name}</h3><p>{note.summary}</p><dl><dt>Geological context</dt><dd>{note.geology}</dd><dt>Access and location</dt><dd>{note.access}</dd><dt>Next technical questions</dt><dd>{note.next}</dd></dl></div>
          <div className="research-dossier-aside"><p>Area markers and source observations describe different levels of detail. Use the field-observation layer in the existing map to inspect the original log.</p><SourceReferences ids={note.sources}/><Enquire project={note.name}/></div>
        </article>
        <details className="research-disclosure"><summary>{c.glossary}</summary><div className="research-grid" lang="en">{GLOSSARY.map(([term,text]) => <article key={term}><h3>{term}</h3><p>{text}</p></article>)}</div></details>
        <div id="laboratory-evidence" data-editor-id="research.laboratory"><h3 className="research-section-title">{c.evidence}</h3><p lang="en">These are historical sample records. None has been assigned to a field point without a documented sample-to-site link. Selected reported values are not reserve estimates or representative mine grades.</p><div className="research-labs">{LAB_RECORDS.map(lab => <details className="research-disclosure" key={lab.id} lang="en"><summary>{lab.sample} <span>{lab.date} · XRF</span></summary><p lang="zh-Hans">{lab.laboratory}</p><p>{lab.method}</p><div className="research-table-wrap"><table><caption>Selected reported analytes · {lab.date} · concentration in {lab.unit}</caption><thead><tr><th scope="col">Element</th><th scope="col">Reported concentration (%)</th></tr></thead><tbody>{lab.analytes.map(([element,value]) => <tr key={element}><th scope="row">{element}</th><td>{value}</td></tr>)}</tbody></table></div><p>{lab.note}</p><SourceReferences ids={[lab.source]}/><Enquire mineral={lab.sample}/></details>)}</div>
          <details className="research-disclosure" lang="en"><summary>Additional historical laboratory records</summary><p>A Swedish analysis compilation describes several submitted materials, including tungsten, niobium and silica sand. A separate ministry record concerns a columbite batch tested on 29 September 2024. Original certificates and scanned table alignment need review before additional numeric results or project links are published.</p><SourceReferences ids={['sweden','columbite']}/><Enquire label="Request original technical records"/></details>
        </div>
      </>}
      {kind === 'minerals' && <>
        <div className="research-grid" lang="en">{PRODUCT_NOTES.map(product => <article key={product.name} className="research-product"><h3>{product.name}</h3><p>{product.detail}</p><SourceReferences ids={product.sources}/><Enquire mineral={product.name}/></article>)}</div>
        <details className="research-disclosure" lang="en"><summary>Mica size and quality reference</summary><p>Historical standard sizes in centimetres: {MICA_SIZES.join('; ')}. V-1 and V-2 are the source’s commercial grade labels, not independent laboratory certifications. Oversized 100 × 100 cm sheets are quoted per piece rather than per kilogram.</p><p>The 2026 master schedule and 24 January 2026 quotation are separate versions with different terms. The January quotation’s 30-day validity has expired. Current prices and availability are supplied on enquiry.</p><SourceReferences ids={['mica','micaOffer']}/><Enquire mineral="Mica — size, grade and quotation"/></details>
        <div className="research-process" lang="en"><h3>From sample request to shipment</h3><ol>{TRADE_STEPS.map(step => <li key={step}>{step}</li>)}</ol><p>The historical 7 October 2024 export record describes a 160 kg columbite sample shipment to China. It expired on 6 November 2024. It is separate from the 155 kg test-report title and does not establish current mining or export rights.</p><SourceReferences ids={['micaOffer','export']}/></div>
      </>}
      {kind === 'company' && <div className="research-history" lang="en">{COMPANY_NOTES.map(item => <article key={item.title} data-editor-id={`research.history.${item.sources[0]}`}><span className="research-date">{item.date}</span><div><h3>{item.title}</h3><p>{item.detail}</p><SourceReferences ids={item.sources}/>{item.sources.includes('excavation') && <Enquire project="Excavation / trenching site assessment"/>}</div></article>)}</div>}
      {kind === 'investor' && <div lang="en"><div className="research-process"><ol>{INVESTOR_STEPS.map(([title,text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol></div><p>Company plans identify processing expansion, representative testing, equipment and operating support as development priorities. Funding amounts and draft forecasts in old documents are not a current investment offer. Original commercial and financial documents are reviewed privately.</p><SourceReferences ids={['gold','partner','equipment','workplan']}/><Enquire label="Request project and investor information"/><button className="research-text-button" type="button" onClick={() => {
        const summary = { title:'Green Gemstone — development review', prepared:'2026-11-07', projects:PROJECT_NOTES, steps:INVESTOR_STEPS, sources:SOURCES, note:'Edited public source summaries. Not a valuation, declared resource or current investment offer.' };
        const url = URL.createObjectURL(new Blob([JSON.stringify(summary,null,2)],{type:'application/json'}));
        const anchor=document.createElement('a');anchor.href=url;anchor.download='green-gemstone-technical-summary.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }}>{c.download}</button></div>}
    </div>
  </section>;
}

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, FileCheck2,
  FileSearch, Gem, LockKeyhole, Mail, MapPin, Menu, Search,
  ShieldCheck, SlidersHorizontal, Sparkles, X,
} from 'lucide-react';
import { PROJECTS, SOURCE_COMPANY, type ProjectArea, type Evidence } from '@/data/company';
import { MINERALS, SITE } from '@/data/site';
import Gallery from '@/components/Gallery';
import { ConceptStudio, DEFAULT_CONTENT, cleanContent, type ConceptContent } from './ConceptStudio';
import './concept.css';

type Page = 'overview' | 'company' | 'projects' | 'minerals' | 'operations' | 'gallery' | 'evidence' | 'contact';
const PAGES: Page[] = ['overview', 'company', 'projects', 'minerals', 'operations', 'gallery', 'evidence', 'contact'];
const pageLabel = (value: Page) => value === 'overview' ? 'Overview' : value[0].toUpperCase() + value.slice(1);
const readPage = (): Page => {
  const value = window.location.hash.replace(/^#\/?/, '').split(/[?&/]/)[0] as Page;
  return PAGES.includes(value) ? value : 'overview';
};
const readDraft = (): ConceptContent => {
  try { return cleanContent(JSON.parse(window.localStorage.getItem('ggmc-buyer-concept-v1') || 'null')); }
  catch { return DEFAULT_CONTENT; }
};
const evidenceInfo: Record<Evidence, string> = {
  observed: 'Recorded in company field material; independent verification is pending',
  reported: 'Reported to company personnel or geologists; further corroboration required',
  unverified: 'Underlying source has not established this result through testing',
  inferred: 'Interpretation, not a declared mineral resource or reserve',
  confirmed: 'Source-classified as supported by a laboratory or document; originals need review',
};
const categories = [
  ['Minerals', '/assets/images/Gemstone_Gallery_1.webp'],
  ['Agriculture', ''],
  ['Livestock', ''],
  ['Fisheries', ''],
  ['Seaweed & Aquaculture', ''],
  ['Company & Corporate', '/assets/images/Our_Awesome_History.webp'],
  ['Media & Communications', ''],
] as const;
function Eyebrow({ children }: { children: ReactNode }) { return <p className="bc-eyebrow"><span>✧</span> {children}</p>; }
function Status({ status }: { status: Evidence }) { return <span className={'bc-status bc-status-' + status} title={evidenceInfo[status]}>{status}</span>; }
function Intro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="bc-page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{text}</p></div>; }
function ProjectCard({ item, onClick }: { item: ProjectArea; onClick: () => void }) {
  return <button type="button" className="bc-project-card" onClick={onClick}>
    <span className="bc-project-top"><span><MapPin size={14} />{item.region === 'awdal' ? 'Awdal' : 'Maroodi Jeex'}</span><ArrowUpRight size={18}/></span>
    <span className="bc-project-art"><i/><i/><i/><b>{item.id.slice(0,3).toUpperCase()}</b></span>
    <span className="bc-project-info"><strong>{item.name}</strong><small>{item.port ? 'Port-site record' : item.findings.length + ' classified findings'}</small>
      <span className="bc-chips">{item.findings.slice(0,3).map((finding,index)=><em key={index}>{finding.mineral} · {finding.evidence}</em>)}</span>
    </span>
  </button>;
}
export default function BuyerConcept() {
  const [page, setPage] = useState<Page>(readPage);
  const [menu, setMenu] = useState(false);
  const [studio, setStudio] = useState(false);
  const [content, setContent] = useState<ConceptContent>(readDraft);
  const [past, setPast] = useState<ConceptContent[]>([]);
  const [future, setFuture] = useState<ConceptContent[]>([]);
  const [saveState, setSaveState] = useState('Not saved in this session');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'priority'|'other'|'port'>('all');
  const [detail, setDetail] = useState<ProjectArea|null>(null);
  const [chosenCategory, setChosenCategory] = useState('Minerals');

  useEffect(() => {
    const sync = () => { setPage(readPage()); setMenu(false); window.scrollTo(0,0); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { document.title = pageLabel(page) + ' | GGMC 2.0 Concept'; }, [page]);
  const go = (target: Page) => {
    setMenu(false); setStudio(false); setDetail(null);
    if (window.location.hash === '#/' + target) { setPage(target); window.scrollTo(0,0); }
    else window.location.hash = '/' + target;
  };
  const edit = (patch: Partial<ConceptContent>) => {
    setPast(history => [...history.slice(-29), content]);
    setFuture([]); setContent(current => cleanContent({...current,...patch}));
    setSaveState('Unsaved local changes');
  };
  const undo = () => {
    if (!past.length) return;
    setFuture(history => [content,...history]); setContent(past[past.length - 1]); setPast(history => history.slice(0,-1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast(history => [...history,content]); setContent(future[0]); setFuture(history => history.slice(1));
  };
  const save = () => {
    try {
      const safe = { ...content, heroImage: content.heroImage.startsWith('blob:') ? DEFAULT_CONTENT.heroImage : content.heroImage };
      window.localStorage.setItem('ggmc-buyer-concept-v1', JSON.stringify(safe));
      setSaveState('Saved in this browser · ' + new Date().toLocaleTimeString());
    } catch { setSaveState('Local storage unavailable'); }
  };
  const reset = () => edit(DEFAULT_CONTENT);
  const results = useMemo(() => PROJECTS.filter(p => {
    if (filter === 'priority' && p.priority !== 1) return false;
    if (filter === 'other' && (p.priority === 1 || p.port)) return false;
    if (filter === 'port' && !p.port) return false;
    const query = search.toLowerCase().trim();
    return !query || (p.name + ' ' + p.region + ' ' + p.findings.map(f => f.mineral).join(' ')).toLowerCase().includes(query);
  }), [filter,search]);
  const evidenceCount = new Set(PROJECTS.flatMap(x => x.findings.map(f => f.evidence))).size;
  return <div className={'ggmc-next bc-theme-' + content.theme}>
    <a className="bc-skip" href="#bc-main">Skip to content</a>
    <div className="bc-demo-ribbon"><span className="bc-pulse"/> GGMC 2.0 &nbsp;/&nbsp; DESIGN CONCEPT <span>Not the live production website</span></div>
    <header className="bc-header">
      <button type="button" className="bc-brand" onClick={() => go('overview')} aria-label="GGMC overview"><img src="/brand-emblem.webp" alt="" width={49} height={42}/><span>GREEN GEMSTONE <small>MINING COMPANY</small></span></button>
      <nav aria-label="Main navigation" id="bc-nav" className={'bc-nav ' + (menu?'open':'')}>
        {PAGES.slice(0,-1).map(p => <button type="button" className={p===page?'active':''} key={p} onClick={() => go(p)}>{pageLabel(p)}</button>)}
        <button type="button" className="bc-nav-mobile-contact" onClick={() => go('contact')}>Contact</button>
      </nav>
      <div className="bc-header-end">
        <button className="bc-contact-short" type="button" onClick={() => go('contact')}>Contact <ArrowUpRight size={16}/></button>
        <button className="bc-studio-button" type="button" onClick={() => setStudio(true)}><SlidersHorizontal size={16}/> Owner Studio <span>DEMO</span></button>
        <button className="bc-hamburger" type="button" aria-controls="bc-nav" aria-expanded={menu} aria-label={menu?'Close menu':'Open menu'} onClick={()=>setMenu(v=>!v)}>{menu?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
    </header>
    <main id="bc-main">
      {page === 'overview' && <>
        <section className="bc-hero"><div className="bc-hero-copy"><Eyebrow>THE NEXT CHAPTER / SOMALILAND</Eyebrow><h1>{content.heroTitle}</h1><p className="bc-hero-sub">{content.heroSubtitle}</p><div className="bc-hero-actions"><button type="button" className="bc-button-gold" onClick={()=>go('projects')}>Explore field records <ArrowUpRight size={17}/></button><button type="button" className="bc-button-text" onClick={()=>go('evidence')}>Our evidence approach <ArrowRight size={16}/></button></div><div className="bc-hero-mark">01 <span/> AN INFORMED PERSPECTIVE</div></div>
          <div className="bc-hero-image"><img src={content.heroImage} alt="Existing company media; provenance not independently verified"/><div className="bc-hero-image-credit"><span>COMPANY MEDIA</span><strong>Image provenance requires verification</strong></div><div className="bc-image-emblem"><Gem size={24}/>GGMC</div></div></section>
        <section className="bc-facts bc-container"><article><strong>{PROJECTS.length.toString().padStart(2,'0')}</strong><span>Project-area records</span><small>Company-supplied records</small></article><article><strong>{MINERALS.length.toString().padStart(2,'0')}</strong><span>Catalogue entries</span><small>Not proven mineral inventory</small></article><article><strong>{evidenceCount.toString().padStart(2,'0')}</strong><span>Evidence classifications</span><small>Not mineral reserves</small></article><button type="button" onClick={()=>go('evidence')}><FileSearch size={23}/><span>Transparency is part of the presentation.</span><small>Review source classifications <ArrowUpRight size={13}/></small></button></section>
        <section className="bc-statement bc-container"><div><Eyebrow>OUR POINT OF VIEW</Eyebrow><h2>{content.introTitle}</h2></div><div><p>{content.introText}</p><span className="bc-evidence-inline"><ShieldCheck size={15}/> Evidence-led company presentation</span></div></section>
        <section className="bc-feature-projects"><div className="bc-container"><div className="bc-section-title"><div><Eyebrow>01 / PORTFOLIO</Eyebrow><h2>Field areas.<br/><em>Clearer context.</em></h2></div><button type="button" className="bc-more" onClick={()=>go('projects')}>Explore all areas <ArrowUpRight size={17}/></button></div><div className="bc-project-grid">{PROJECTS.filter(p=>p.priority===1).slice(0,3).map(p=><ProjectCard key={p.id} item={p} onClick={()=>{go('projects');setDetail(p)}}/>)}</div><p className="bc-disclaimer">All records and classifications are company-supplied. They are not reserve estimates, licence confirmations, or statements of economic viability.</p></div></section>
        <section className="bc-minerals-feature bc-container"><div className="bc-minerals-feature-photo"><img loading="lazy" src="/assets/images/Gemstone_Gallery_1.webp" alt="Existing gallery collage of gemstone examples; sample provenance not verified"/><span>COMPANY GALLERY · SAMPLE IDENTIFICATION PENDING</span></div><div><Eyebrow>02 / COMMODITIES</Eyebrow><h2>A deeper look<br/><em>at every mineral.</em></h2><p>Instead of implying that everything in the catalogue is a saleable product, each mineral can be presented with its actual supporting material and development stage.</p><button className="bc-button-green" type="button" onClick={()=>go('minerals')}>Browse catalogue <ArrowUpRight size={16}/></button></div></section>
        <section className="bc-proof-section"><div className="bc-container bc-proof-layout"><div><Eyebrow>03 / BUYER READINESS</Eyebrow><h2>Show the evidence.<br/>Explain the gaps.</h2><p>Operational claims, project findings, ownership records and financial performance deserve different levels of scrutiny. A buyer should know which is which.</p></div><div className="bc-proof-tile"><FileCheck2 size={32}/><span>EVIDENCE REGISTER</span><h3>Claims, sources and review status in one place.</h3><button type="button" onClick={()=>go('evidence')}>Review register <ArrowUpRight size={17}/></button></div></div></section>
      </>}
      {page === 'company' && <section className="bc-container bc-subpage"><Intro eyebrow="COMPANY" title="Local knowledge. Clear expectations." text="A serious acquirer needs to understand the legal entity, its actual operations, its people and the evidence behind its public statements."/><div className="bc-about-grid"><div className="bc-about-image"><img src="/assets/images/company-field.webp" loading="lazy" alt="Existing company image"/><span>COMPANY IMAGE · PROVENANCE TO VERIFY</span></div><div><Eyebrow>OUR IDENTITY</Eyebrow><h2>Green Gemstone<br/>Mining Company.</h2><p>A Hargeisa-based mining and development business, as described in company-supplied materials, with interests across minerals, gemstones and other development opportunities.</p><p>Its ownership, financial position, exact licence rights and operating performance should be checked against originals before being relied upon by a buyer.</p><button type="button" className="bc-more" onClick={()=>go('evidence')}>What buyers should verify <ArrowUpRight size={16}/></button></div></div><div className="bc-three-values">{[['Local perspective','Company-reported field knowledge, people and regional relationships.'],['Disciplined disclosure','Clear distinctions between observation, reporting and independently substantiated results.'],['Development potential','Opportunities presented separately from proven operations and revenue.']].map(([title,desc])=><article key={title}><CheckCircle2 size={23}/><h3>{title}</h3><p>{desc}</p></article>)}</div></section>}
      {page === 'projects' && <section className="bc-container bc-subpage"><Intro eyebrow="PROJECTS / FIELD RECORDS" title="Follow the source, not the hype." text={PROJECTS.length + ' existing project-area records appear in the company data model. These records describe field findings, not verified ownership, licences, resources or production.'}/><div className="bc-project-tools"><div role="group" aria-label="Project record filter" className="bc-project-filters">{([['all','All areas'],['priority','Priority'],['other','Other areas'],['port','Port']] as const).map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}</div><label className="bc-project-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search projects" placeholder="Search areas or minerals"/></label></div><p className="bc-results">{results.length} records found</p><div className="bc-project-grid bc-project-directory">{results.map(p=><ProjectCard key={p.id} item={p} onClick={()=>setDetail(p)}/>)}</div>{!results.length&&<p className="bc-empty">No matching records. Try another search.</p>}<p className="bc-source-note"><ShieldCheck size={18}/>Source: {SOURCE_COMPANY}. Independent geological, legal and commercial verification has not been performed here.</p></section>}
      {page === 'minerals' && <section className="bc-container bc-subpage"><Intro eyebrow="MINERAL CATALOGUE" title="Commodity interest ≠ mineral reserve." text="The existing catalogue contains twelve mineral and commodity entries. Listing a mineral does not establish that GGMC holds a proven resource, produces it or has saleable inventory."/><div className="bc-mineral-lead"><div><Eyebrow>COMMODITY INFORMATION</Eyebrow><h2>Start with what<br/>is actually recorded.</h2><p>Each future commodity profile should connect location, evidence, sampling records, classification and commercial status without inventing results.</p></div><img src="/assets/images/Copper_Ore_Gallery.webp" alt="Company copper ore gallery collage; no independently confirmed identification" loading="lazy"/></div><div className="bc-mineral-list">{MINERALS.map((item,i)=><div key={item.name}><span>{String(i+1).padStart(2,'0')}</span><strong>{item.name}</strong><em>{item.cat}</em><small>Catalogue listing · evidence required</small></div>)}</div></section>}
      {page === 'operations' && <section className="bc-container bc-subpage"><Intro eyebrow="OPERATIONS / COMPANY-REPORTED" title="Show what exists. Explain what remains." text="The underlying company narrative describes equipment, ore history and contracts. These are representations requiring independent documentary review."/><div className="bc-operations-grid">{[
        ['Approx. 600 tonnes','Telluride ore history','Company-reported ore mined, not 600 tonnes of recovered gold or independently verified production.'],
        ['1 tonne / hour','Processing plant rating','Company-reported capacity, not demonstrated continuous throughput or certified equipment condition.'],
        ['8 contracts','Industrial mineral agreements','Company-reported contracts, pending review of executed agreements and counterparties.'],
        ['Volvo BL70B','Backhoe equipment','Company-reported ownership; titles, serial numbers, condition and encumbrances need examination.'],
      ].map(([value,title,note],i)=><article key={value}><span>{String(i+1).padStart(2,'0')} / COMPANY CLAIM</span><h2>{value}</h2><h3>{title}</h3><p>{note}</p><small><FileSearch size={14}/> Records required</small></article>)}</div><p className="bc-source-note">Source: <a href="https://github.com/greengemstoneminingcompany/GreenGemstoneMining/blob/feature/advanced-design-creative-studio/src/data/about.ts" target="_blank" rel="noopener noreferrer">GGMC company-supplied operations narrative</a>. No independent audit is represented.</p></section>}
      {page === 'gallery' && <section className="bc-container bc-subpage"><Intro eyebrow="GALLERY / ARCHIVE" title="Every category, organized." text="The seven approved gallery categories remain. The cards below are design placeholders; production cover images must be approved and associated with actual folder records."/><div className="bc-category-grid">{categories.map(([title,img],i)=><button type="button" key={title} aria-pressed={chosenCategory===title} className={'bc-category-card '+(chosenCategory===title?'selected':'')} onClick={()=>setChosenCategory(title)}><div>{img?<img loading="lazy" src={img} alt=""/>:<span className="bc-cover-placeholder"><Gem size={39}/> COVER TO APPROVE</span>}<small>{String(i+1).padStart(2,'0')}</small></div><strong>{title}</strong><span>{img?'Existing gallery asset — verification pending':'Approved folder — no cover selected'}</span></button>)}</div><div className="bc-gallery-live-head"><div><Eyebrow>EXISTING FOLDER SYSTEM</Eyebrow><h2>Browse the actual hierarchy.</h2><p>Cover selected for review: <strong>{chosenCategory}</strong>. Media-to-folder linking is not yet complete in the underlying gallery implementation.</p></div><span>Live folders when Supabase is configured</span></div><div className="bc-gallery-live"><Gallery uploads={[]}/></div></section>}
      {page === 'evidence' && <section className="bc-container bc-subpage"><Intro eyebrow="BUYER-READINESS / DUE DILIGENCE" title="Confidence begins with better questions." text="An illustrative claims register based on existing public-source content. It is not an audit or a secure document room."/><div className="bc-register-layout"><div className="bc-register"><div className="bc-register-header"><span>REVIEW AREA</span><span>KNOWN SOURCE</span><span>STATUS</span></div>{[
        ['Company registration and ownership','Company profile; registry evidence not provided','Documents required'],
        ['Field and mineral findings','Company surveys referenced in project data','Source-classified only'],
        ['Plant, machinery and ore history','Company-reported operational narrative','Independent inspection required'],
        ['Commercial agreements','Company-reported contract count','Executed originals required'],
        ['Financial statements and liabilities','Not established by reviewed website records','Confidential review needed'],
      ].map(([topic,source,status])=><div className="bc-register-row" key={topic}><strong>{topic}</strong><span>{source}</span><em>{status}</em></div>)}</div><aside><LockKeyhole size={29}/><h3>Proposed buyer data room</h3><p>Access-controlled review of ownership, permits, contracts, financial statements, technical reports and supporting evidence.</p><div><ShieldCheck size={16}/> Not implemented in this concept</div><small>No private company documents are uploaded or exposed here.</small></aside></div><div className="bc-legend"><h2>How findings are classified</h2><div>{(Object.keys(evidenceInfo) as Evidence[]).map(key=><article key={key}><Status status={key}/><p>{evidenceInfo[key]}</p></article>)}</div></div></section>}
      {page === 'contact' && <section className="bc-container bc-subpage"><Intro eyebrow="CONTACT" title="Begin the conversation." text="For an acquisition, commercial relationship or technical discussion, use the company's published contact address and request independent supporting records."/><div className="bc-contact-grid"><div><Eyebrow>INFORMATION & ENQUIRIES</Eyebrow><h2>Ask the right<br/>questions first.</h2><p>Introduce your organization and the subject of your enquiry. Do not send payment credentials or confidential information through this concept.</p><a className="bc-button-gold" href={'mailto:'+SITE.email+'?subject=GGMC%20Enquiry'}>Email GGMC <Mail size={17}/></a></div><div><MapPin size={25}/><strong>Hargeisa, Somaliland</strong><p>Company-reported location. Confirm an appointment and exact address before visiting.</p><hr/><Mail size={25}/><strong>{SITE.email}</strong><p>This demonstration does not collect, send or store enquiries.</p></div></div></section>}
    </main>
    <footer className="bc-footer"><div className="bc-container"><div className="bc-footer-head"><img src="/brand-emblem.webp" width={64} height={56} alt=""/><div><strong>GREEN GEMSTONE</strong><small>MINING COMPANY</small></div><p>A more transparent presentation of company records, mineral interests and potential.</p></div><div className="bc-footer-bottom"><span>© {new Date().getFullYear()} GGMC</span><span>DESIGN CONCEPT · NOT A VERIFIED INVESTMENT OFFER</span><button type="button" onClick={()=>setStudio(true)}>Try Owner Studio <ArrowUpRight size={15}/></button></div></div></footer>
    <button type="button" className="bc-floating-studio" onClick={()=>setStudio(true)}><Sparkles size={17}/> Try the Owner Studio <ArrowUpRight size={14}/></button>
    {detail&&<div className="bc-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setDetail(null)}} role="presentation"><section className="bc-project-dialog" role="dialog" aria-modal="true" aria-labelledby="bc-dialog-title"><button type="button" className="bc-dialog-close" aria-label="Close project details" onClick={()=>setDetail(null)}><X size={21}/></button><Eyebrow>FIELD RECORD / COMPANY-SUPPLIED</Eyebrow><h2 id="bc-dialog-title">{detail.name}</h2><p>{detail.region} · {detail.lat!==null&&detail.lon!==null?detail.lat.toFixed(3)+'°N, '+detail.lon.toFixed(3)+'°E':'No coordinates supplied'}</p><h3>Source-classified findings</h3><div className="bc-dialog-findings">{detail.findings.length?detail.findings.map((f,i)=><div key={i}><strong>{f.mineral}</strong><Status status={f.evidence}/></div>):<p>No mineral finding included in this record.</p>}</div><p className="bc-source-note">Source: {SOURCE_COMPANY}. No title, licence, reserve or economic viability is established by this card.</p><button type="button" className="bc-button-green" onClick={()=>{setDetail(null);go('evidence')}}>Review evidence framework <ChevronRight size={17}/></button></section></div>}
    {studio&&<ConceptStudio content={content} onChange={edit} onSave={save} onReset={reset} onUndo={undo} onRedo={redo} canUndo={Boolean(past.length)} canRedo={Boolean(future.length)} saveState={saveState} onClose={()=>setStudio(false)} onOpenPage={target=>go(target as Page)} />}
  </div>;
}

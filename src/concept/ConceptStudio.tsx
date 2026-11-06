import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, ClipboardCheck, Eye, FileSearch,
  FileText, Gem, Globe2, Image as ImageIcon, LayoutTemplate, LockKeyhole, Monitor,
  RotateCcw, RotateCw, Save, Search, Settings2, ShieldCheck, Smartphone,
  Sparkles, UploadCloud, Users, X,
} from 'lucide-react';
import { MINERALS } from '@/data/site';
import { PROJECTS } from '@/data/company';

export type ConceptContent = {
  heroTitle: string;
  heroSubtitle: string;
  introTitle: string;
  introText: string;
  heroImage: string;
  theme: 'forest' | 'stone' | 'midnight';
};
export const DEFAULT_CONTENT: ConceptContent = {
  heroTitle: 'A more grounded view of mineral opportunity.',
  heroSubtitle: 'Green Gemstone Mining Company. An evidence-led perspective on field interests, mineral potential and responsible development in Somaliland.',
  introTitle: 'Potential deserves a clearer story.',
  introText: 'The strongest introduction to a mining business is not the biggest claim. It is a coherent picture of the people, fieldwork, assets and records behind every opportunity.',
  heroImage: '/assets/images/company-field.webp',
  theme: 'forest',
};
const safeImage = (value: unknown): string => {
  if (typeof value !== 'string' || value.length > 400) return DEFAULT_CONTENT.heroImage;
  if (value.startsWith('blob:')) return value;
  return /^\/assets\/images\/[\w.-]+\.webp$/.test(value) ? value : DEFAULT_CONTENT.heroImage;
};
export function cleanContent(value: unknown): ConceptContent {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
  const field = (key: keyof ConceptContent, limit: number) => typeof record[key] === 'string' && (record[key] as string).trim()
    ? (record[key] as string).slice(0,limit) : DEFAULT_CONTENT[key];
  return {
    heroTitle: field('heroTitle', 130),
    heroSubtitle: field('heroSubtitle', 330),
    introTitle: field('introTitle', 120),
    introText: field('introText', 430),
    heroImage: safeImage(record.heroImage),
    theme: ['forest','stone','midnight'].includes(String(record.theme)) ? record.theme as ConceptContent['theme'] : 'forest',
  };
}
type StudioTab = 'dashboard'|'pages'|'design'|'media'|'projects'|'evidence'|'translations'|'publishing';
type StudioProps = {
  content: ConceptContent;
  onChange: (patch: Partial<ConceptContent>) => void;
  onSave: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: string;
  onClose: () => void;
  onOpenPage: (page: string) => void;
};
const gallery = [
  {label:'Field image',path:'/assets/images/company-field.webp'},
  {label:'Gemstone specimens',path:'/assets/images/Gemstone_Gallery_1.webp'},
  {label:'Copper samples',path:'/assets/images/Copper_Ore_Gallery.webp'},
  {label:'Gold samples',path:'/assets/images/Gold_Gallery.webp'},
];
const tabs: {name:StudioTab; title:string; icon:typeof Eye}[] = [
  {name:'dashboard',title:'Dashboard',icon:LayoutTemplate},
  {name:'pages',title:'Page editor',icon:FileText},
  {name:'design',title:'Design system',icon:Sparkles},
  {name:'media',title:'Media library',icon:ImageIcon},
  {name:'projects',title:'Project records',icon:Gem},
  {name:'evidence',title:'Evidence review',icon:ClipboardCheck},
  {name:'translations',title:'Languages',icon:Globe2},
  {name:'publishing',title:'Publishing',icon:ShieldCheck},
];
const PagePreview = ({content,view}: {content:ConceptContent;view:'desktop'|'mobile'}) => (
  <div className={'bc-studio-preview ' + view}>
    <div className="bc-studio-preview-top"><img src="/brand-emblem.webp" width={27} height={25} alt=""/><span>GREEN GEMSTONE</span><span className="bc-studio-preview-lines">≡</span></div>
    <div className="bc-studio-preview-main">
      <div><span>THE NEXT CHAPTER / SOMALILAND</span><h3>{content.heroTitle}</h3><p>{content.heroSubtitle}</p><em>Explore field records ↗</em></div>
      <img src={content.heroImage} alt="Selected website hero preview"/>
    </div>
    <div className="bc-studio-preview-foot"><strong>{PROJECTS.length.toString().padStart(2,'0')}</strong> Field records <strong>{MINERALS.length.toString().padStart(2,'0')}</strong> Catalogue entries</div>
  </div>
);

function StudioField({label,value,onEdit,multiline=false}: {label:string;value:string;onEdit:(text:string)=>void;multiline?:boolean}) {
  return <label className="bc-studio-field"><span>{label}</span>{multiline
    ? <textarea value={value} onChange={event=>onEdit(event.target.value)} rows={4}/>
    : <input value={value} onChange={event=>onEdit(event.target.value)}/>}</label>;
}

export function ConceptStudio({
  content, onChange, onSave, onReset, onUndo, onRedo, canUndo, canRedo, saveState, onClose, onOpenPage,
}: StudioProps) {
  const [tab,setTab] = useState<StudioTab>('dashboard');
  const [viewport,setViewport] = useState<'desktop'|'mobile'>('desktop');
  const [notice,setNotice] = useState('');
  const [reviewed,setReviewed] = useState<string[]>([]);
  const [query,setQuery] = useState('');
  const [imageError,setImageError] = useState('');
  const highlight = (next:StudioTab) => { setTab(next);setNotice(''); };
  const save = () => { onSave();setNotice('Your draft has been saved to this browser, not to the production website.'); };
  const checklist = [
    'Company registration and beneficial ownership documents',
    'Mineral licences and land rights',
    'Original geological reports and laboratory records',
    'Plant and equipment ownership documents',
    'Executed contracts and counterparty review',
    'Audited financials, liabilities and tax status',
  ];
  return <div className="bc-studio-backdrop"><div className="bc-studio-shell" role="dialog" aria-modal="true" aria-labelledby="bc-studio-title">
    <aside className="bc-studio-side">
      <div className="bc-studio-identity"><img src="/brand-emblem.webp" width={43} height={37} alt=""/><div><strong id="bc-studio-title">GGMC STUDIO</strong><span>OWNER WORKSPACE / CONCEPT</span></div></div>
      <div className="bc-studio-side-label">MANAGE WEBSITE</div>
      <nav aria-label="Owner Studio navigation">{tabs.map(item => { const Icon=item.icon;return <button type="button" className={tab===item.name?'active':''} onClick={()=>highlight(item.name)} key={item.name}><Icon size={18}/>{item.title}{tab===item.name&&<ChevronRight size={15} className="bc-studio-side-arrow"/>}</button>;})}</nav>
      <div className="bc-studio-side-bottom"><div><LockKeyhole size={17}/><span>Private data room and server publishing are not enabled in this design demonstration.</span></div><button type="button" onClick={onClose}><ArrowLeft size={16}/> Back to website</button></div>
    </aside>
    <div className="bc-studio-content">
      <header className="bc-studio-topbar"><div><span>GGMC 2.0 / STUDIO</span><strong>{tabs.find(t=>t.name===tab)?.title}</strong></div><div className="bc-studio-top-actions"><span className="bc-studio-draft"><span/> LOCAL DRAFT</span><button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo change" title="Undo"><RotateCcw size={17}/></button><button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo change" title="Redo"><RotateCw size={17}/></button><button type="button" className="bc-studio-save" onClick={save}><Save size={16}/> Save locally</button><button type="button" aria-label="Close Owner Studio" onClick={onClose}><X size={21}/></button></div></header>
      <div className="bc-studio-scroll">
        <div className="bc-studio-intro"><div><p className="bc-eyebrow">NO-CODE WEBSITE MANAGEMENT</p><h2>{tab==='dashboard'?'Your website, without the technical clutter.':tabs.find(t=>t.name===tab)?.title}</h2><p>{tab==='dashboard'?'A single place to organize the website, change visuals, review evidence and decide what is ready for publication.':'Changes made in this prototype affect this browser preview only. Real publishing and privileged records require the existing authenticated workflow.'}</p></div><span className="bc-studio-version">CONCEPT VERSION 1.0</span></div>
        {notice&&<div className="bc-studio-notice" role="status"><CheckCircle2 size={16}/>{notice}</div>}
        {tab==='dashboard'&&<>
          <div className="bc-studio-stats"><div><span>WEB PAGES</span><strong>08</strong><small>Demo navigation</small></div><div><span>FIELD AREAS</span><strong>{PROJECTS.length.toString().padStart(2,'0')}</strong><small>Company records</small></div><div><span>COMMODITIES</span><strong>{MINERALS.length.toString().padStart(2,'0')}</strong><small>Catalogue entries</small></div><div><span>PUBLISHING</span><strong>Draft</strong><small>No production connection</small></div></div>
          <h3 className="bc-studio-section-title">What would you like to do?</h3>
          <div className="bc-studio-quick-grid">{[
            ['pages','Edit homepage copy','Click and replace headings and descriptions.'],
            ['media','Change the hero photo','Choose an existing asset or preview a local image.'],
            ['design','Adjust the appearance','Choose a curated website color palette.'],
            ['evidence','Review company claims','Track which business documents are still required.'],
          ].map(([target,title,copy])=><button type="button" key={target} onClick={()=>highlight(target as StudioTab)}><span><Sparkles size={19}/></span><strong>{title}</strong><small>{copy}</small><ArrowRight size={17}/></button>)}</div>
          <div className="bc-studio-overview-note"><ShieldCheck size={24}/><div><strong>What this prototype protects</strong><p>Editable copy and images are kept separate from factual project classifications, private evidence and live publishing privileges.</p></div></div>
        </>}
        {tab==='pages'&&<>
          <div className="bc-studio-two-col"><div className="bc-studio-fields"><h3>Homepage content</h3><StudioField label="Main headline" value={content.heroTitle} onEdit={value=>onChange({heroTitle:value})}/><StudioField label="Hero description" multiline value={content.heroSubtitle} onEdit={value=>onChange({heroSubtitle:value})}/><StudioField label="Introduction heading" value={content.introTitle} onEdit={value=>onChange({introTitle:value})}/><StudioField label="Introduction description" multiline value={content.introText} onEdit={value=>onChange({introText:value})}/><p className="bc-studio-hint">Try changing a headline. The preview updates as you type. No development tools required.</p></div><div className="bc-studio-preview-pane"><div className="bc-studio-preview-toolbar"><strong>LIVE DESIGN PREVIEW</strong><div><button type="button" className={viewport==='desktop'?'active':''} onClick={()=>setViewport('desktop')} aria-label="Desktop preview"><Monitor size={17}/></button><button type="button" className={viewport==='mobile'?'active':''} onClick={()=>setViewport('mobile')} aria-label="Mobile preview"><Smartphone size={17}/></button></div></div><PagePreview content={content} view={viewport}/><button type="button" className="bc-studio-view-link" onClick={()=>onOpenPage('overview')}><Eye size={16}/> View full homepage <ArrowRight size={15}/></button></div></div>
        </>}
        {tab==='design'&&<><h3 className="bc-studio-section-title">Choose a brand-safe appearance</h3><div className="bc-studio-palettes">{([
          ['forest','Forest & gold','#063b2b','#dab96a','Classic GGMC heritage'],
          ['stone','Stone & bronze','#504a40','#d5c3a0','Editorial mineral neutral'],
          ['midnight','Midnight emerald','#091a23','#83c8bb','Modern high-contrast'],
        ] as const).map(([id,name,dark,accent,description])=><button type="button" key={id} className={content.theme===id?'active':''} onClick={()=>onChange({theme:id})}><span className="bc-studio-swatches"><i style={{background:dark}}/><i style={{background:accent}}/></span><strong>{name}</strong><small>{description}</small>{content.theme===id&&<CheckCircle2 size={19}/>}</button>)}</div><div className="bc-studio-overview-note"><Settings2 size={24}/><p>Brand colors, type hierarchy, layout spacing and components should be controlled by one design system. These curated palette controls update this concept only.</p></div></>}
        {tab==='media'&&<><h3 className="bc-studio-section-title">Choose a homepage cover</h3><p className="bc-studio-hint">These are existing repository media assets, not independently verified photographs. Production should use approved originals with documented provenance.</p><div className="bc-studio-media-grid">{gallery.map(item=><button type="button" key={item.path} onClick={()=>onChange({heroImage:item.path})} className={content.heroImage===item.path?'active':''}><img src={item.path} loading="lazy" alt=""/><strong>{item.label}</strong><small>{content.heroImage===item.path?'Selected':'Select as homepage image'}</small></button>)}</div><label className="bc-studio-upload"><UploadCloud size={20}/><span>Try your own image locally (no upload)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10_000_000){setImageError('Select a PNG, JPEG or WebP image under 10 MB.');return;}setImageError('');onChange({heroImage:URL.createObjectURL(file)});}}/></label>{imageError&&<p role="alert">{imageError}</p>}<p className="bc-studio-hint">Selected local files are only displayed in this browser session. They are not uploaded to ImageKit, Supabase or the website. Saving the draft restores the default image on the next session when a temporary image is selected.</p></>}
        {tab==='projects'&&<><label className="bc-studio-search"><Search size={17}/><input value={query} aria-label="Search company project records" placeholder="Search project names or minerals" onChange={event=>setQuery(event.target.value)}/></label><div className="bc-studio-records">{PROJECTS.filter(p=>(p.name+' '+p.findings.map(f=>f.mineral).join(' ')).toLowerCase().includes(query.toLowerCase())).map(p=><div key={p.id}><div><strong>{p.name}</strong><small>{p.region} · {p.findings.length} classified findings</small></div><span>Source record · review required</span><button type="button" onClick={()=>onOpenPage('projects')}>View page <ArrowRight size={15}/></button></div>)}</div><p className="bc-studio-hint">Technical findings are intentionally read-only in this concept. A production editor should require reviewer approval and source documents before modifying mineral evidence or coordinates.</p></>}
        {tab==='evidence'&&<><h3 className="bc-studio-section-title">Acquisition readiness checklist</h3><p className="bc-studio-hint">Mark items for your own planning in this session. Checking a box does not certify that a record exists or has been verified.</p><div className="bc-studio-checklist">{checklist.map(item=><label key={item}><input type="checkbox" checked={reviewed.includes(item)} onChange={event=>setReviewed(current=>event.target.checked?[...current,item]:current.filter(value=>value!==item))}/><span>{item}</span></label>)}</div><div className="bc-studio-overview-note"><FileSearch size={24}/><p>{reviewed.length} of {checklist.length} review topics marked for follow-up. No original documents have been uploaded or validated by this prototype.</p></div></>}
        {tab==='translations'&&<><h3 className="bc-studio-section-title">Language review status</h3><div className="bc-studio-languages">{[['English','Primary company copy'],['Soomaali','Native-language content review needed'],['العربية','RTL review needed'],['简体中文','Technical translation review needed']].map(([name,note])=><article key={name}><Globe2 size={20}/><div><strong>{name}</strong><small>{note}</small></div><span>Review pending</span></article>)}</div><p className="bc-studio-hint">The parent feature branch contains four-language assets. This redesign demonstration uses English copy; it does not claim that its new pages have passed translation review.</p></>}
        {tab==='publishing'&&<><div className="bc-studio-publish-panel"><span><ShieldCheck size={26}/> SAFE PREVIEW WORKFLOW</span><h3>Draft. Review. Then publish through approved controls.</h3><p>The controls here are intentionally local to the design preview. They cannot update the production website or privately stored buyer records.</p><div className="bc-studio-publish-actions"><button type="button" onClick={save}><Save size={17}/> Save local draft</button><button type="button" onClick={()=>{onReset();setNotice('Concept restored to the original design. Use Undo to revert.');}}><RotateCcw size={17}/> Restore starting design</button><button type="button" disabled title="Authenticated, audited publication is not connected in this concept"><LockKeyhole size={17}/> Publish production site</button></div><small>{saveState}</small></div><div className="bc-studio-overview-note"><Users size={24}/><div><strong>Production proposal</strong><p>Roles: Owner, Editor, Reviewer, Translator, Publisher. Approval history and immutable versions should be enforced on the server, not merely through browser controls.</p></div></div></>}
      </div>
      <footer className="bc-studio-foot"><span><ShieldCheck size={14}/> CONCEPT ONLY · NO PRODUCTION DATA MODIFIED</span><button type="button" onClick={onClose}>Return to website <ArrowRight size={16}/></button></footer>
    </div>
  </div></div>;
}

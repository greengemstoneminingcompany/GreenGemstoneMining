import { useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, Compass, FileCheck2, FileSearch, Gem, Layers3, MapPinned, Mountain, ShieldCheck } from 'lucide-react';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { buyerText } from '@/i18n/buyer-interface';
import './BuyerVisionHome.css';

const proofSteps = [
  { number: '01', title: 'Company identity', description: 'Corporate registration, legal structure and authorized representatives.', status: 'Document review required' },
  { number: '02', title: 'Mineral interests', description: 'Separate mapped observations, reported findings and unverified opportunities.', status: 'Evidence classified' },
  { number: '03', title: 'Operating assets', description: 'Equipment ownership, capacities, contracts and site records require supporting documentation.', status: 'Independent checks required' },
  { number: '04', title: 'Commercial opportunity', description: 'Discuss partnerships and potential transactions without presenting projections as established results.', status: 'Subject to due diligence' },
];

const features = [
  { icon: Mountain, title: 'Field exploration', copy: 'Explore documented project areas and distinguish observations from unverified mineral indications.', link: '#/projects', label: 'Explore projects' },
  { icon: Gem, title: 'Mineral interests', copy: 'Browse the mineral and gemstone catalogue. Listed interests do not establish resources or saleable inventory.', link: '#/minerals', label: 'View minerals' },
  { icon: FileSearch, title: 'Company records', copy: 'Understand the company’s stated activities, operating history and the documentation still needed.', link: '#/about', label: 'Company profile' },
];

export default function BuyerVisionHome() {
  const { profile, projects } = useCompanyRecords();
  const { lang, t } = useI18n();
  const english = lang === 'en';
  const [expanded, setExpanded] = useState<number | null>(0);
  const featured = projects.filter(project => project.findings.length > 0).slice(0, 3);
  return (
    <div className="buyer-vision" data-editor-id="buyer.home">
      <section className="bv-hero" id="top" data-editor-id="buyer.hero">
        {profile.heroImage && <img className="bv-hero-image" src={profile.heroImage} alt="" fetchPriority="high" />}
        <div className="bv-hero-shade" />
        <div className="bv-hero-container">
          <div className="bv-hero-content">
            <div className="bv-eyebrow"><span className="bv-eyebrow-line" /> GREEN GEMSTONE MINING COMPANY <span className="bv-hero-dot">·</span> SOMALILAND</div>
            <h1>{english ? <>{buyerText(lang,"From mineral")}<br />{buyerText(lang,"potential to")} <em>{buyerText(lang,"informed opportunity.")}</em></> : <>{t.hero.h1a}<br/><em>{t.hero.h1b}</em></>}</h1>
            <p className="bv-hero-copy">{english ? 'Explore our company, mineral interests and project areas through a clearer, evidence-conscious view of our work and development ambitions.' : t.hero.sub}</p>
            <div className="bv-actions">
              <a className="bv-button bv-button-outline" href="#/gallery">{buyerText(lang,"View field media")} <ArrowUpRight size={17} /></a>
              <a className="bv-button bv-button-primary" href="#/projects">{buyerText(lang,"Explore our projects")} <ArrowUpRight size={17} /></a>
              <a className="bv-button bv-button-outline" href="#/contact">{buyerText(lang,"Start a conversation")} <ArrowRight size={17} /></a>
            </div>
            <div className="bv-hero-bottom"><span><Compass size={16} /> {buyerText(lang,"Hargeisa · Somaliland")}</span><span><ShieldCheck size={16} /> {buyerText(lang,"Evidence-first presentation")}</span></div>
          </div>
        </div>
      </section>


      <section className="bv-intro" data-editor-id="buyer.intro">
        <div className="bv-wrap bv-intro-layout">
          <div><div className="bv-label">{buyerText(lang,"01 / THE COMPANY")}</div><h2>{buyerText(lang,"A more considered")}<br /><em>{buyerText(lang,"view of mining.")}</em></h2></div>
          <div className="bv-intro-copy"><p>{buyerText(lang,"Green Gemstone Mining Company presents mineral exploration and development interests in Somaliland. We believe prospective partners should be able to distinguish documented field information from ambitions that still require validation.")}</p><a className="bv-text-link" href="#/about">{buyerText(lang,"Explore our company")} <ArrowUpRight size={17}/></a></div>
        </div>
        <div className="bv-wrap bv-stat-strip">
          <div><span className="bv-stat-icon"><MapPinned size={20}/></span><strong>{buyerText(lang,"Somaliland")}</strong><small>{buyerText(lang,"Regional focus")}</small></div>
          <div><span className="bv-stat-icon"><Layers3 size={20}/></span><strong>{buyerText(lang,"Multiple areas")}</strong><small>{buyerText(lang,"Mapped field records")}</small></div>
          <div><span className="bv-stat-icon"><FileCheck2 size={20}/></span><strong>{buyerText(lang,"Evidence labels")}</strong><small>{buyerText(lang,"Observed · reported · unverified")}</small></div>
        </div>
      </section>

      <section className="bv-focus" data-editor-id="buyer.focus">
        <div className="bv-wrap">
          <div className="bv-section-top"><div><div className="bv-label bv-label-light">{buyerText(lang,"02 / OUR FOCUS")}</div><h2>{buyerText(lang,"Explore the")} <em>{buyerText(lang,"possibilities.")}</em></h2></div></div>
          <div className="bv-focus-grid">
            {features.map((feature, index) => <article className="bv-focus-card" key={buyerText(lang,feature.title)}>
              <div className="bv-focus-card-top"><span>0{index + 1}</span><feature.icon size={28} strokeWidth={1.2}/></div>
              <div><h3>{buyerText(lang,feature.title)}</h3><p>{buyerText(lang,feature.copy)}</p></div>
              <a href={feature.link}>{buyerText(lang,feature.label)} <ArrowUpRight size={18}/></a>
            </article>)}
          </div>
        </div>
      </section>

      <section className="bv-projects" data-editor-id="buyer.projects">
        <div className="bv-wrap">
          <div className="bv-section-top bv-section-top-dark"><div><div className="bv-label">{buyerText(lang,"03 / FIELD RECORDS")}</div><h2>{buyerText(lang,"Places worth")} <em>{buyerText(lang,"understanding.")}</em></h2></div><p>{buyerText(lang,"Selected areas from company-supplied field records. Mineral findings are not mineral resource or reserve estimates.")}</p></div>
          <div className="bv-project-grid">
            {featured.map((project, index) => <article className="bv-project-card" key={project.id}>
              <div className="bv-project-visual"><span className="bv-project-index">0{index + 1} {buyerText(lang,"/ PROJECT AREA")}</span><Mountain size={92} strokeWidth={0.6}/><span className="bv-project-region">{project.region}</span></div>
              <div className="bv-project-details"><h3><a href={'#/projects?section=project-'+encodeURIComponent(project.id)}>{project.name}</a></h3><div className="bv-finding-list">{project.findings.slice(0, 3).map(finding => <span key={finding.mineral + finding.evidence}>{t.catalogue.minerals[finding.mineral] ?? finding.mineral} <small>· {buyerText(lang,finding.evidence)}</small></span>)}</div></div>
            </article>)}
          </div>
          <div className="bv-project-footer"><p>{buyerText(lang,"Evidence classifications describe the status of reported field information, not legal title, economic viability or production.")}</p><a className="bv-text-link" href="#/projects">{buyerText(lang,"View all project areas")} <ArrowUpRight size={17}/></a></div>
        </div>
      </section>

      <section className="bv-evidence" data-editor-id="buyer.evidence">
        <div className="bv-wrap bv-evidence-layout">
          <div className="bv-evidence-lead"><div className="bv-label bv-label-light">{buyerText(lang,"04 / TRANSPARENT INFORMATION")}</div><h2>{buyerText(lang,"Trust begins")}<br />{buyerText(lang,"with")} <em>{buyerText(lang,"clarity.")}</em></h2><p>{buyerText(lang,"Commercial discussions should begin with the right questions. This overview makes the information categories visible without claiming that due diligence has been completed.")}</p><a className="bv-button bv-button-primary" href="#/contact">{buyerText(lang,"Discuss an opportunity")} <ArrowUpRight size={17}/></a></div>
          <div className="bv-evidence-list">{proofSteps.map((step, index) => <div className="bv-evidence-item" key={step.number}><button type="button" aria-expanded={expanded === index} onClick={() => setExpanded(expanded === index ? null : index)}><span>{step.number}</span><strong>{buyerText(lang,step.title)}</strong><span className="bv-evidence-plus">{expanded === index ? '−' : '+'}</span></button>{expanded === index && <div className="bv-evidence-body"><p>{buyerText(lang,step.description)}</p><span><CheckCircle2 size={13}/>{buyerText(lang,step.status)}</span></div>}</div>)}</div>
        </div>
      </section>

      <section className="bv-cta" data-editor-id="buyer.contact">
        <div className="bv-wrap bv-cta-inner"><div><div className="bv-label">{buyerText(lang,"05 / CONNECT")}</div><h2>{buyerText(lang,"Let's explore what")}<br /><em>{buyerText(lang,"comes next.")}</em></h2><p>{buyerText(lang,"For commercial enquiries, partnerships, technical collaboration or a discussion about the company.")}</p></div><a className="bv-button bv-button-dark" href="#/contact">{buyerText(lang,"Contact Green Gemstone")} <ArrowUpRight size={18}/></a></div>
      </section>
      <div className="bv-preview-disclaimer">{buyerText(lang,'Company-reported information requires independent verification.')}</div>
    </div>
  );
}

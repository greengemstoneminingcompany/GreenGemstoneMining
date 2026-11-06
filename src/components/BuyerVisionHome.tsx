import { useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown, Compass, FileCheck2, FileSearch, Gem, Layers3, MapPinned, Mountain, ShieldCheck } from 'lucide-react';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
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
  const { lang } = useI18n();
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
            <h1>From mineral<br />potential to <em>informed opportunity.</em></h1>
            <p className="bv-hero-copy">Explore our company, mineral interests and project areas through a clearer, evidence-conscious view of our work and development ambitions.</p>
            <div className="bv-actions">
              <a className="bv-button bv-button-primary" href="#/projects">Explore our projects <ArrowUpRight size={17} /></a>
              <a className="bv-button bv-button-outline" href="#/contact">Start a conversation <ArrowRight size={17} /></a>
            </div>
            <div className="bv-hero-bottom"><span><Compass size={16} /> Hargeisa · Somaliland</span><span><ShieldCheck size={16} /> Evidence-first presentation</span></div>
          </div>
          <div className="bv-hero-aside" aria-label="Company overview">
            <div className="bv-aside-top"><span>COMPANY / OVERVIEW</span><span>01 — 04</span></div>
            <div className="bv-aside-center"><Gem size={46} strokeWidth={1.1} /><span>DISCOVER THE PORTFOLIO</span></div>
            <p>Projects, commodities and company-reported operations presented with transparent evidence classifications.</p>
            <a href="#/about">Discover the company <ArrowUpRight size={16} /></a>
          </div>
        </div>
        <div className="bv-scroll-cue">SCROLL TO EXPLORE <ChevronDown size={15}/></div>
      </section>

      <section className="bv-intro" data-editor-id="buyer.intro">
        <div className="bv-wrap bv-intro-layout">
          <div><div className="bv-label">01 / THE COMPANY</div><h2>A more considered<br /><em>view of mining.</em></h2></div>
          <div className="bv-intro-copy"><p>Green Gemstone Mining Company presents mineral exploration and development interests in Somaliland. We believe prospective partners should be able to distinguish documented field information from ambitions that still require validation.</p><a className="bv-text-link" href="#/about">Explore our company <ArrowUpRight size={17}/></a></div>
        </div>
        <div className="bv-wrap bv-stat-strip">
          <div><span className="bv-stat-icon"><MapPinned size={20}/></span><strong>Somaliland</strong><small>Regional focus</small></div>
          <div><span className="bv-stat-icon"><Layers3 size={20}/></span><strong>Multiple areas</strong><small>Mapped field records</small></div>
          <div><span className="bv-stat-icon"><FileCheck2 size={20}/></span><strong>Evidence labels</strong><small>Observed · reported · unverified</small></div>
        </div>
      </section>

      <section className="bv-focus" data-editor-id="buyer.focus">
        <div className="bv-wrap">
          <div className="bv-section-top"><div><div className="bv-label bv-label-light">02 / OUR FOCUS</div><h2>Explore the <em>possibilities.</em></h2></div><p>Three clear ways to understand the company, its interests and the evidence available for review.</p></div>
          <div className="bv-focus-grid">
            {features.map((feature, index) => <article className="bv-focus-card" key={feature.title}>
              <div className="bv-focus-card-top"><span>0{index + 1}</span><feature.icon size={28} strokeWidth={1.2}/></div>
              <div><h3>{feature.title}</h3><p>{feature.copy}</p></div>
              <a href={feature.link}>{feature.label} <ArrowUpRight size={18}/></a>
            </article>)}
          </div>
        </div>
      </section>

      <section className="bv-projects" data-editor-id="buyer.projects">
        <div className="bv-wrap">
          <div className="bv-section-top bv-section-top-dark"><div><div className="bv-label">03 / FIELD RECORDS</div><h2>Places worth <em>understanding.</em></h2></div><p>Selected areas from company-supplied field records. Mineral findings are not mineral resource or reserve estimates.</p></div>
          <div className="bv-project-grid">
            {featured.map((project, index) => <article className="bv-project-card" key={project.id}>
              <div className="bv-project-visual"><span className="bv-project-index">0{index + 1} / PROJECT AREA</span><Mountain size={92} strokeWidth={0.6}/><span className="bv-project-region">{project.region}</span></div>
              <div className="bv-project-details"><h3>{project.name}</h3><div className="bv-finding-list">{project.findings.slice(0, 3).map(finding => <span key={finding.mineral + finding.evidence}>{finding.mineral} <small>· {finding.evidence}</small></span>)}</div></div>
            </article>)}
          </div>
          <div className="bv-project-footer"><p>Evidence classifications describe the status of reported field information, not legal title, economic viability or production.</p><a className="bv-text-link" href="#/projects">View all project areas <ArrowUpRight size={17}/></a></div>
        </div>
      </section>

      <section className="bv-evidence" data-editor-id="buyer.evidence">
        <div className="bv-wrap bv-evidence-layout">
          <div className="bv-evidence-lead"><div className="bv-label bv-label-light">04 / TRANSPARENT INFORMATION</div><h2>Trust begins<br />with <em>clarity.</em></h2><p>Commercial discussions should begin with the right questions. This overview makes the information categories visible without claiming that due diligence has been completed.</p><a className="bv-button bv-button-primary" href="#/contact">Discuss an opportunity <ArrowUpRight size={17}/></a></div>
          <div className="bv-evidence-list">{proofSteps.map((step, index) => <div className="bv-evidence-item" key={step.number}><button type="button" aria-expanded={expanded === index} onClick={() => setExpanded(expanded === index ? null : index)}><span>{step.number}</span><strong>{step.title}</strong><span className="bv-evidence-plus">{expanded === index ? '−' : '+'}</span></button>{expanded === index && <div className="bv-evidence-body"><p>{step.description}</p><span><CheckCircle2 size={13}/>{step.status}</span></div>}</div>)}</div>
        </div>
      </section>

      <section className="bv-cta" data-editor-id="buyer.contact">
        <div className="bv-wrap bv-cta-inner"><div><div className="bv-label">05 / CONNECT</div><h2>Let's explore what<br /><em>comes next.</em></h2><p>For commercial enquiries, partnerships, technical collaboration or a discussion about the company.</p></div><a className="bv-button bv-button-dark" href="#/contact">Contact Green Gemstone <ArrowUpRight size={18}/></a></div>
      </section>
      <div className="bv-preview-disclaimer">DESIGN CONCEPT · {lang.toUpperCase()} CONTENT PREVIEW · COMPANY-REPORTED INFORMATION REQUIRES INDEPENDENT VERIFICATION</div>
    </div>
  );
}

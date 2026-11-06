import { ArrowUpRight, MapPin, Mail } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import Gallery from '@/components/Gallery';
import CompanyContent, { AboutSection } from '@/components/CompanyContent';
import ContactForm from '@/components/ContactForm';
import SomalilandMap from '@/components/SomalilandMap';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { companyPageCopy } from '@/i18n/company-pages';
import { ownerCopy } from './ownerCopy';
import './OwnerSubpages.css';

export type CompanyPage = 'home' | 'about' | 'projects' | 'minerals' | 'gallery' | 'contact';

export default function CompanyPages({ page, uploads }: { page: CompanyPage; uploads: Parameters<typeof Gallery>[0]['uploads'] }) {
  const { t, lang } = useI18n();
  const records = useCompanyRecords();
  const [projectFilter, setProjectFilter] = useState<'all' | 'priority' | 'other' | 'port'>('all');
  const visibleProjects = useMemo(() => records.projects.filter((project) => {
    if (projectFilter === 'priority') return project.priority === 1;
    if (projectFilter === 'other') return project.priority === 2 || project.priority === 3;
    if (projectFilter === 'port') return project.port === true;
    return true;
  }), [projectFilter, records.projects]);
  const catalogue = useMemo(() => {
    const entries: { name: string; cat: string }[] = [];
    const seen = new Set<string>();
    const gemstoneNames = new Set(records.gemstoneInterests.map(name => name.trim().toLocaleLowerCase()));
    const add = (name: string, cat: string) => {
      const normalized = name.trim().toLocaleLowerCase();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      entries.push({ name, cat: gemstoneNames.has(normalized) ? 'Gemstone' : cat });
    };
    records.minerals.forEach(({ name, cat }) => add(name, cat));
    records.mineralInterests.forEach(name => add(name, 'Mineral'));
    records.gemstoneInterests.forEach(name => add(name, 'Gemstone'));
    return entries;
  }, [records.minerals, records.mineralInterests, records.gemstoneInterests]);
  const cp = companyPageCopy(lang);
  const owner = ownerCopy(lang);
  if (page === 'home') return null;
  const localizedPage = { about: { title: `${t.company.h2a} ${t.company.h2b}`, description: t.company.lead }, projects: { title: `${t.projects.h2a} ${t.projects.h2b}`, description: t.projects.text }, minerals: { title: `${t.catalogue.h2a} ${t.catalogue.h2b}`, description: t.catalogue.text }, gallery: { title: `${t.gallery.h2a} ${t.gallery.h2b}`, description: t.gallery.text }, contact: { title: `${t.contact.h2a} ${t.contact.h2b}`, description: t.contact.text } }[page];
  const localizedEyebrow = { about: t.nav.company, projects: t.nav.projects, minerals: t.nav.portfolio, gallery: t.nav.gallery, contact: t.nav.contact }[page];
  return (
    <div className={`company-page owner-subpage company-page-${page}`} data-editor-id={`page.${page}`}>
      <section className="page-hero" data-editor-id={`${page}.hero`}>
        <div className="page-hero-image" />
        <div className="page-hero-content">
          <p className="owner-page-overline">GREEN GEMSTONE MINING COMPANY <span>/ {localizedEyebrow}</span></p>
          <p className="eyebrow">{localizedEyebrow}</p>
          <h1>{localizedPage.title}</h1>
          <p>{localizedPage.description}</p>
          <div className="owner-page-hero-actions"><a className="btn btn-gold" href="#/contact">{t.nav.cta} <ArrowUpRight size={16} /></a>{page === 'projects' && <a className="owner-page-hero-secondary" href="#/operations">{owner.operations} <ArrowUpRight size={15}/></a>}{page === 'about' && <a className="owner-page-hero-secondary" href="#/responsibility">{owner.responsibility} <ArrowUpRight size={15}/></a>}</div>
        </div>
      </section>
      {page === 'about' && <div data-editor-id="about.content"><CompanyContent /></div>}
      {page === 'projects' && <section className="sec sec-dark" data-editor-id="projects.overview"><div className="sec-container">
        <div className="page-section-heading"><p className="body-text">{cp.map}</p></div>
        <SomalilandMap projects={records.projects} />
        <section className="project-directory" aria-label={cp.fieldRecords} data-editor-id="projects.directory">
          <div className="project-directory-head"><p className="eyebrow">{cp.fieldRecords}</p><h2>{cp.projectAreas} <em>{cp.evidenceHeading}</em></h2><p>{cp.recordsDisclaimer}</p></div>
          <div className="project-filters" role="group" aria-label={cp.filterProjects}>{([['all', cp.filterAll], ['priority', cp.filterPriority], ['other', cp.filterOther], ['port', cp.filterPort]] as const).map(([filter, label]) => <button key={filter} type="button" className={projectFilter === filter ? 'active' : ''} aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)}>{label}</button>)}</div>
          <div className="project-card-grid">{visibleProjects.map((project, index) => <article className="project-card" key={project.id}><div className="project-card-art" style={{ '--card-index': index } as CSSProperties}><span>{String(index + 1).padStart(2, '0')}</span></div><div className="project-card-body"><p>{project.region}</p><h3>{project.name}</h3><div className="project-findings">{project.findings.slice(0, 4).map((finding) => <span key={`${finding.mineral}-${finding.evidence}`}>{finding.mineral} · {finding.evidence}</span>)}</div></div></article>)}</div>
        </section>
      </div></section>}
      {page === 'projects' && <><AboutSection sectionKey="operations" /><AboutSection sectionKey="development" /><AboutSection sectionKey="services" /></>}
      {page === 'minerals' && <section className="sec" data-editor-id="minerals.directory"><div className="sec-container">
        <p className="body-text">{cp.directory}</p>
        <section id="industrial-metals" className="portfolio-group">
          <div className="page-section-heading"><h2 className="display">{cp.metalsHeading} <em>{cp.metalsEmphasis}</em></h2><p className="body-text">{cp.metalsIntro}</p></div>
          <div className="content-pill-list">
            {catalogue.filter(item => item.cat !== 'Gemstone').map(item => (
              <span className="content-pill" key={item.name}>{t.catalogue.minerals[item.name] ?? item.name}</span>
            ))}
          </div>
        </section>
        <section id="gemstones" className="portfolio-group">
          <div className="page-section-heading"><h2 className="display">{cp.gemsHeading} <em>{cp.gemsEmphasis}</em></h2><p className="body-text">{cp.gemsIntro}</p></div>
          <div className="content-pill-list">
            {catalogue.filter(item => item.cat === 'Gemstone').map(item => (
              <span className="content-pill" key={item.name}>{t.catalogue.minerals[item.name] ?? item.name}</span>
            ))}
          </div>
        </section>
        <p className="content-note owner-mineral-disclosure">{cp.metalsNote} {cp.dueDiligence}</p>
      </div></section>}
      {page === 'gallery' && <section className="sec sec-dark" data-editor-id="gallery.collection"><div className="sec-container"><div className="page-section-heading"><p className="eyebrow">{t.gallery.eyebrow}</p><h2 className="display light">{t.gallery.h2a} {t.gallery.h2b}</h2><p className="body-text">{t.gallery.text}</p></div></div><Gallery uploads={uploads} items={records.gallery}/></section>}
      {page === 'contact' && <section className="sec sec-dark" data-editor-id="contact.details"><div className="sec-container page-contact-grid"><div><p className="eyebrow">{t.contact.eyebrow}</p><h2 className="display light">{cp.contactHeading}</h2><div className="page-contact-detail"><Mail size={18}/><a href={`mailto:${records.profile.email}`}>{records.profile.email}</a></div><div className="page-contact-detail"><MapPin size={18}/><span>{records.profile.officeAddress}</span></div><p className="page-contact-note">{cp.contactNote}</p></div><div className="page-contact-form"><ContactForm/></div></div></section>}
      {page !== 'contact' && <section className="page-cta" data-editor-id={`${page}.cta`}><div><p className="eyebrow">{records.profile.legalName}</p><h2>{cp.cta}</h2></div><a className="btn btn-gold" href="#/contact">{t.nav.contact} <ArrowUpRight size={16}/></a></section>}
    </div>
  );
}

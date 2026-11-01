import { Gem, ArrowUpRight, MapPin, Mail } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import Gallery from '@/components/Gallery';
import CompanyContent from '@/components/CompanyContent';
import ContactForm from '@/components/ContactForm';
import SomalilandMap from '@/components/SomalilandMap';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { companyPageCopy } from '@/i18n/company-pages';

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
  const cp = companyPageCopy(lang);
  if (page === 'home') return null;
  const localizedPage = { about: { title: `${t.company.h2a} ${t.company.h2b}`, description: t.company.lead }, projects: { title: `${t.projects.h2a} ${t.projects.h2b}`, description: t.projects.text }, minerals: { title: `${t.catalogue.h2a} ${t.catalogue.h2b}`, description: t.catalogue.text }, gallery: { title: `${t.gallery.h2a} ${t.gallery.h2b}`, description: t.gallery.text }, contact: { title: `${t.contact.h2a} ${t.contact.h2b}`, description: t.contact.text } }[page];
  const localizedEyebrow = { about: t.nav.company, projects: t.nav.projects, minerals: t.nav.portfolio, gallery: t.nav.gallery, contact: t.nav.contact }[page];
  return (
    <div className={`company-page company-page-${page}`} data-editor-id={`page.${page}`}>
      <section className="page-hero" data-editor-id={`${page}.hero`}>
        <div className="page-hero-image" />
        <div className="page-hero-content">
          <p className="eyebrow">{localizedEyebrow}</p>
          <h1>{localizedPage.title}</h1>
          <p>{localizedPage.description}</p>
          <a className="btn btn-gold" href="#/contact">{t.nav.cta} <ArrowUpRight size={16} /></a>
        </div>
      </section>
      {page === 'about' && <div data-editor-id="about.content"><CompanyContent /></div>}
      {page === 'projects' && <section className="sec sec-dark" data-editor-id="projects.overview"><div className="sec-container">
        <div className="page-section-heading"><p className="eyebrow">{t.projects.eyebrow}</p><h2 className="display light">{t.projects.h2a} {t.projects.h2b}</h2><p className="body-text">{cp.map}</p></div>
        <SomalilandMap projects={records.projects} />
        <div className="page-info-grid"><article><span>01 / {cp.development}</span><h3>{cp.opportunities}</h3><p>{cp.opportunitiesDesc}</p></article><article><span>02 / {cp.partnerships}</span><h3>{cp.partners}</h3><p>{cp.partnersDesc}</p></article><article><span>03 / {cp.communities}</span><h3>{cp.participation}</h3><p>{cp.participationDesc}</p></article></div>
        <section className="project-directory" aria-label="Company field records" data-editor-id="projects.directory">
          <div className="project-directory-head"><p className="eyebrow">Field records</p><h2>Project areas and <em>evidence.</em></h2><p>These cards summarize company field records. They are not licences, resource estimates, or proof of commercial viability.</p></div>
          <div className="project-filters" role="group" aria-label="Filter project records">{([['all', 'All records'], ['priority', 'Priority areas'], ['other', 'Other areas'], ['port', 'Port sites']] as const).map(([filter, label]) => <button key={filter} type="button" className={projectFilter === filter ? 'active' : ''} aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)}>{label}</button>)}</div>
          <div className="project-card-grid">{visibleProjects.map((project, index) => <article className="project-card" key={project.id}><div className="project-card-art" style={{ '--card-index': index } as CSSProperties}><span>{String(index + 1).padStart(2, '0')}</span></div><div className="project-card-body"><p>{project.region}</p><h3>{project.name}</h3><div className="project-findings">{project.findings.slice(0, 4).map((finding) => <span key={`${finding.mineral}-${finding.evidence}`}>{finding.mineral} · {finding.evidence}</span>)}</div></div></article>)}</div>
        </section>
      </div></section>}
      {page === 'minerals' && <section className="sec" data-editor-id="minerals.directory"><div className="sec-container">
        <div className="page-section-heading"><p className="eyebrow">{t.catalogue.eyebrow}</p><h2 className="display">{t.catalogue.h2a} {t.catalogue.h2b}</h2><p className="body-text">{cp.directory}</p></div>
        <div className="page-mineral-grid">{records.minerals.map((mineral, index) => <article className="page-mineral-card" key={mineral.name}><span>{String(index + 1).padStart(2, '0')}</span><Gem size={24}/><div><h3>{t.catalogue.minerals[mineral.name] ?? mineral.name}</h3><p>{t.catalogue.cats[mineral.cat] ?? mineral.cat}</p></div></article>)}</div>
        <p className="content-note">{cp.dueDiligence}</p>
      </div></section>}
      {page === 'gallery' && <section className="sec sec-dark" data-editor-id="gallery.collection"><div className="sec-container"><div className="page-section-heading"><p className="eyebrow">{t.gallery.eyebrow}</p><h2 className="display light">{t.gallery.h2a} {t.gallery.h2b}</h2><p className="body-text">{t.gallery.text}</p></div></div><Gallery uploads={uploads} items={records.gallery}/></section>}
      {page === 'contact' && <section className="sec sec-dark" data-editor-id="contact.details"><div className="sec-container page-contact-grid"><div><p className="eyebrow">{t.contact.eyebrow}</p><h2 className="display light">{t.contact.h2a} {t.contact.h2b}</h2><p className="body-text">{localizedPage.description}</p><div className="page-contact-detail"><Mail size={18}/><a href={`mailto:${records.profile.email}`}>{records.profile.email}</a></div><div className="page-contact-detail"><MapPin size={18}/><span>{records.profile.officeAddress}</span></div><p className="page-contact-note">{cp.contactNote}</p></div><div className="page-contact-form"><ContactForm/></div></div></section>}
      <section className="page-cta" data-editor-id={`${page}.cta`}><div><p className="eyebrow">{records.profile.legalName}</p><h2>{cp.cta}</h2></div><a className="btn btn-gold" href="#/contact">{t.nav.contact} <ArrowUpRight size={16}/></a></section>
    </div>
  );
}

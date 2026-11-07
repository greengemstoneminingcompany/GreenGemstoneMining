import ResearchContent from '@/features/research/ResearchContent';
import { MapPin, Mail } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Gallery from '@/components/Gallery';
import CompanyContent, { AboutSection } from '@/components/CompanyContent';
import ContactForm from '@/components/ContactForm';
import PublicSearch from '@/components/PublicSearch';
import {matchesPublicSearch} from '@/lib/publicSearch';
import {buyerText} from '@/i18n/buyer-interface';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { companyPageCopy } from '@/i18n/company-pages';
import './BuyerVisionPages.css';

const SomalilandMap=lazy(()=>import('@/components/SomalilandMap'));

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
  const [catalogueQuery,setCatalogueQuery]=useState('');
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
  const filteredCatalogue=catalogue.filter(item=>matchesPublicSearch(catalogueQuery,item.name,t.catalogue.minerals[item.name]??item.name));
  const cp = companyPageCopy(lang);
  useEffect(() => {
    function revealSection() {
      const section = new URLSearchParams(window.location.hash.split('?')[1]).get('section');
      if (!section) return;
      const details = document.getElementById(section)?.closest('details');
      if (details) details.open = true;
    }
    revealSection();
    window.addEventListener('hashchange', revealSection);
    return () => window.removeEventListener('hashchange', revealSection);
  }, [page]);
  if (page === 'home') return null;
  const localizedPage = { about: { title: `${t.company.h2a} ${t.company.h2b}`, description: t.company.lead }, projects: { title: `${t.projects.h2a} ${t.projects.h2b}`, description: t.projects.text }, minerals: { title: `${t.catalogue.h2a} ${t.catalogue.h2b}`, description: t.catalogue.text }, gallery: { title: `${t.gallery.h2a} ${t.gallery.h2b}`, description: t.gallery.text }, contact: { title: `${t.contact.h2a} ${t.contact.h2b}`, description: t.contact.text } }[page];
  const localizedEyebrow = { about: t.nav.company, projects: t.nav.projects, minerals: t.nav.portfolio, gallery: t.nav.gallery, contact: t.nav.contact }[page];
  return (
    <div className={`company-page buyer-secondary company-page-${page}`} data-editor-id={`page.${page}`}>
      <section className="page-hero" data-editor-id={`${page}.hero`}>
        <div className="page-hero-image" />
        <div className="page-hero-content">
          <p className="eyebrow">{localizedEyebrow}</p>
          <h1>{localizedPage.title}</h1>
          {page !== 'gallery' && page !== 'contact' && <p>{localizedPage.description}</p>}
        </div>
      </section>
      {page === 'about' && <div data-editor-id="about.content"><nav className="gallery-nav-actions about-section-nav" aria-label="On this page">{[['company-profile','Company profile'],['leadership','Leadership'],['history-details','Company history'],['rural-development','Community']].map(([id,label])=><a key={id} href={'#/about?section='+id}>{buyerText(lang,label)}</a>)}</nav><CompanyContent /></div>}
      {page === 'projects' && (<section id="telluride-project" className="sec" aria-labelledby="telluride-title">
  <div className="sec-container">
    <h2 id="telluride-title" className="display">Telluride Gold Project</h2>
    <p className="body-text">Explore the company’s field media from geological surveying and excavation at Telluride.</p>
    <div className="gallery-nav-actions">
      <a href="#/gallery?album=241f9bd8-658c-50ce-8680-119f6fe4d438">Mining and Excavation</a>
      <a href="#/contact?project=Telluride%20Gold%20Project">Discuss the project</a><a href="#/buyers?section=project-finder">Find project information</a>
      <a href="/telluride-project-brief.md" download>Download the project brief</a><a href="#/buyers?section=public-documents">Public documents and updates</a>
    </div>
    <details className="compact-details">
      <summary>Evidence and project updates</summary>
      <p>Company field media documents activity at the site. Ask the company for dated records and the current project status.</p>
      <div className="gallery-nav-actions"><a href="#/contact?project=Telluride%20Gold%20Project&amp;request=technical-report">Technical report</a><a href="#/contact?project=Telluride%20Gold%20Project&amp;request=site-visit">Site visit</a><a href="#/contact?project=Telluride%20Gold%20Project&amp;request=management-call">Management call</a></div>
    </details>
  </div>
</section>)}
      {page === 'projects' && <section className="sec sec-dark" data-editor-id="projects.overview"><div className="sec-container">
        <div className="page-section-heading"><p className="body-text">{cp.map}</p></div>
        <div id="project-map" className="project-map-anchor"><Suspense fallback={<p className="map-loading" role="status">{buyerText(lang,'Loading interactive map…')}</p>}><SomalilandMap projects={records.projects} /></Suspense></div>
        <section id="project-portfolio" className="project-directory" aria-label={cp.fieldRecords} data-editor-id="projects.directory">
          <div className="project-directory-head"><p className="eyebrow">{cp.fieldRecords}</p><h2>{cp.projectAreas} <em>{cp.evidenceHeading}</em></h2><p>{cp.recordsDisclaimer}</p></div>
          <div className="project-filters" role="group" aria-label={cp.filterProjects}>{([['all', cp.filterAll], ['priority', cp.filterPriority], ['other', cp.filterOther], ['port', cp.filterPort]] as const).map(([filter, label]) => <button key={filter} type="button" className={projectFilter === filter ? 'active' : ''} aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)}>{label}</button>)}</div>
          <div className="project-card-grid">{visibleProjects.map((project, index) => <article className="project-card" id={'project-'+project.id} key={project.id}><div className="project-card-art" style={{ '--card-index': index } as CSSProperties}><span>{String(index + 1).padStart(2, '0')}</span></div><div className="project-card-body"><p>{project.region}</p><h3>{project.name}</h3><p>{project.findings.length ? buyerText(lang,"Field findings available") : buyerText(lang,"Project profile")}</p><div className="project-findings">{project.findings.slice(0, 4).map((finding) => <span key={`${finding.mineral}-${finding.evidence}`}>{finding.mineral} · {finding.evidence}</span>)}</div><div className="gallery-nav-actions">{Number.isFinite(project.lon)&&Number.isFinite(project.lat)&&<a href={'#/projects?section=project-map&mapProject='+encodeURIComponent(project.id)}>{buyerText(lang,"View map")}</a>}<a href={'#/contact?project='+encodeURIComponent(project.name)}>{buyerText(lang,"Enquire about this project")}</a>{/telluride/i.test(project.name)&&<a href="#/gallery?album=51333d5a-8c0f-547b-aef4-31c521207e70">{buyerText(lang,"View field media")}</a>}</div></div></article>)}</div>
        </section>
      </div></section>}
      {page === 'projects' && <><ResearchContent kind="projects" /><details className="compact-details"><summary>{cp.projectAreas}</summary><AboutSection sectionKey="operations" /><AboutSection sectionKey="development" /><AboutSection sectionKey="services" /></details></>}
      {page === 'minerals' && <section className="sec" data-editor-id="minerals.directory"><div className="sec-container">
        <p className="body-text">{cp.directory}</p>
        <PublicSearch label={buyerText(lang,'Search the mineral catalogue')} value={catalogueQuery} onChange={setCatalogueQuery} count={filteredCatalogue.length}/><a href="#/minerals?section=buyer-specifications">{buyerText(lang,"Buyer specifications")}</a>
        <section id="industrial-metals" className="portfolio-group">
          <div className="page-section-heading"><h2 className="display">{cp.metalsHeading} <em>{cp.metalsEmphasis}</em></h2></div>
          <div className="content-pill-list">
            {filteredCatalogue.filter(item => item.cat !== 'Gemstone').map(item => (
              <a className="content-pill" key={item.name} href={'#/projects?section=project-map&mineral='+encodeURIComponent(item.name)}>{t.catalogue.minerals[item.name] ?? item.name}</a>
            ))}
          </div>
        </section>
        <section id="gemstones" className="portfolio-group">
          <div className="page-section-heading"><h2 className="display">{cp.gemsHeading} <em>{cp.gemsEmphasis}</em></h2></div>
          <div className="content-pill-list">
            {filteredCatalogue.filter(item => item.cat === 'Gemstone').map(item => (
              <a className="content-pill" key={item.name} href={'#/projects?section=project-map&mineral='+encodeURIComponent(item.name)}>{t.catalogue.minerals[item.name] ?? item.name}</a>
            ))}
          </div>
        </section>
        <p className="content-note">{cp.metalsNote} {cp.dueDiligence}</p>
      </div></section>}
      {page === 'minerals' && <ResearchContent kind="minerals" />}
      {page === 'about' && <ResearchContent kind="company" />}
      {page === 'gallery' && <section className="sec sec-dark" data-editor-id="gallery.collection"><Gallery uploads={uploads} items={records.gallery}/></section>}
      {page === 'contact' && <section className="sec sec-dark" data-editor-id="contact.details"><div className="sec-container page-contact-grid"><div><p className="eyebrow">{t.contact.eyebrow}</p><h2 className="display light">{new URLSearchParams(window.location.hash.split('?')[1]).get('project') || cp.contactHeading}</h2><div className="page-contact-detail"><Mail size={18}/><a href={`mailto:${records.profile.email}`}>{records.profile.email}</a></div><div className="page-contact-detail"><MapPin size={18}/><span>{records.profile.officeAddress}</span></div><p className="page-contact-note">{cp.contactNote}</p></div><div className="page-contact-form"><ContactForm/></div></div></section>}
    </div>
  );
}

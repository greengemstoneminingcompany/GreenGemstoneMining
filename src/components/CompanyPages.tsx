import { Gem, ArrowUpRight, MapPin, Mail } from 'lucide-react';
import Gallery from '@/components/Gallery';
import CompanyContent from '@/components/CompanyContent';
import ContactForm from '@/components/ContactForm';
import SomalilandMap from '@/components/SomalilandMap';
import { MINERALS, SITE } from '@/data/site';
import { useI18n } from '@/i18n/core';
import { companyPageCopy } from '@/i18n/company-pages';

export type CompanyPage = 'home' | 'about' | 'projects' | 'minerals' | 'gallery' | 'contact';

export default function CompanyPages({ page, uploads }: { page: CompanyPage; uploads: Parameters<typeof Gallery>[0]['uploads'] }) {
  const { t, lang } = useI18n();
  const cp = companyPageCopy(lang);
  if (page === 'home') return null;
  const localizedPage = { about: { title: `${t.company.h2a} ${t.company.h2b}`, description: t.company.lead }, projects: { title: `${t.projects.h2a} ${t.projects.h2b}`, description: t.projects.text }, minerals: { title: `${t.catalogue.h2a} ${t.catalogue.h2b}`, description: t.catalogue.text }, gallery: { title: `${t.gallery.h2a} ${t.gallery.h2b}`, description: t.gallery.text }, contact: { title: `${t.contact.h2a} ${t.contact.h2b}`, description: t.contact.text } }[page];
  const localizedEyebrow = { about: t.nav.company, projects: t.nav.projects, minerals: t.nav.portfolio, gallery: t.nav.gallery, contact: t.nav.contact }[page];
  return (
    <div className={`company-page company-page-${page}`}>
      <section className="page-hero">
        <div className="page-hero-image" />
        <div className="page-hero-content">
          <p className="eyebrow">{localizedEyebrow}</p>
          <h1>{localizedPage.title}</h1>
          <p>{localizedPage.description}</p>
          <a className="btn btn-gold" href="#/contact">{t.nav.cta} <ArrowUpRight size={16} /></a>
        </div>
      </section>
      {page === 'about' && <CompanyContent />}
      {page === 'projects' && <section className="sec sec-dark"><div className="sec-container">
        <div className="page-section-heading"><p className="eyebrow">{t.projects.eyebrow}</p><h2 className="display light">{t.projects.h2a} {t.projects.h2b}</h2><p className="body-text">{cp.map}</p></div>
        <SomalilandMap />
        <div className="page-info-grid"><article><span>01 / {cp.development}</span><h3>{cp.opportunities}</h3><p>{cp.opportunitiesDesc}</p></article><article><span>02 / {cp.partnerships}</span><h3>{cp.partners}</h3><p>{cp.partnersDesc}</p></article><article><span>03 / {cp.communities}</span><h3>{cp.participation}</h3><p>{cp.participationDesc}</p></article></div>
      </div></section>}
      {page === 'minerals' && <section className="sec"><div className="sec-container">
        <div className="page-section-heading"><p className="eyebrow">{t.catalogue.eyebrow}</p><h2 className="display">{t.catalogue.h2a} {t.catalogue.h2b}</h2><p className="body-text">{cp.directory}</p></div>
        <div className="page-mineral-grid">{MINERALS.map((mineral, index) => <article className="page-mineral-card" key={mineral.name}><span>{String(index + 1).padStart(2, '0')}</span><Gem size={24}/><div><h3>{t.catalogue.minerals[mineral.name] ?? mineral.name}</h3><p>{t.catalogue.cats[mineral.cat] ?? mineral.cat}</p></div></article>)}</div>
        <p className="content-note">{cp.dueDiligence}</p>
      </div></section>}
      {page === 'gallery' && <section className="sec sec-dark"><div className="sec-container"><div className="page-section-heading"><p className="eyebrow">{t.gallery.eyebrow}</p><h2 className="display light">{t.gallery.h2a} {t.gallery.h2b}</h2><p className="body-text">{t.gallery.text}</p></div></div><Gallery uploads={uploads}/></section>}
      {page === 'contact' && <section className="sec sec-dark"><div className="sec-container page-contact-grid"><div><p className="eyebrow">{t.contact.eyebrow}</p><h2 className="display light">{t.contact.h2a} {t.contact.h2b}</h2><p className="body-text">{localizedPage.description}</p><div className="page-contact-detail"><Mail size={18}/><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div><div className="page-contact-detail"><MapPin size={18}/><span>{t.contact.address}</span></div><p className="page-contact-note">{cp.contactNote}</p></div><div className="page-contact-form"><ContactForm/></div></div></section>}
      <section className="page-cta"><div><p className="eyebrow">Green Gemstone Mining Company</p><h2>{cp.cta}</h2></div><a className="btn btn-gold" href="#/contact">{t.nav.contact} <ArrowUpRight size={16}/></a></section>
    </div>
  );
}

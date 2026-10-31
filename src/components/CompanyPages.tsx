import { Gem, ArrowUpRight, MapPin, Mail } from 'lucide-react';
import Gallery from '@/components/Gallery';
import CompanyContent from '@/components/CompanyContent';
import ContactForm from '@/components/ContactForm';
import SomalilandMap from '@/components/SomalilandMap';
import { MINERALS, SITE } from '@/data/site';
import { useI18n } from '@/i18n/core';

export type CompanyPage = 'home' | 'about' | 'projects' | 'minerals' | 'gallery' | 'contact';

const pageCopy: Record<Exclude<CompanyPage, 'home'>, { eyebrow: string; title: string; description: string }> = {
  about: { eyebrow: 'Our company', title: 'Local knowledge. Global opportunity.', description: 'Learn about our company, our approach to responsible mining, and the communities and partners we work with.' },
  projects: { eyebrow: 'Our projects', title: 'Mining development across Somaliland.', description: 'Explore the regions and opportunities identified in company materials. Project status and technical evidence should be reviewed individually.' },
  minerals: { eyebrow: 'Mineral portfolio', title: 'A diverse portfolio of mineral interests.', description: 'Explore the gemstones, metals and industrial minerals identified in the company portfolio. Listings are interests, not reserve declarations.' },
  gallery: { eyebrow: 'Visual stories', title: 'Field work, samples and company milestones.', description: 'Browse the company gallery and authorized media uploads.' },
  contact: { eyebrow: 'Start a conversation', title: 'Build the next opportunity together.', description: 'Contact our team about investment, partnerships, mineral interests or general enquiries.' },
};

export default function CompanyPages({ page, uploads }: { page: CompanyPage; uploads: Parameters<typeof Gallery>[0]['uploads'] }) {
  const { t } = useI18n();
  if (page === 'home') return null;
  const copy = pageCopy[page];
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
        <div className="page-section-heading"><p className="eyebrow">Regional overview</p><h2 className="display light">Explore our areas of interest</h2><p className="body-text">The map provides regional context. It does not imply that every location is a licensed or operating mine.</p></div>
        <SomalilandMap />
        <div className="page-info-grid"><article><span>01 / Development</span><h3>Mining opportunities</h3><p>Company materials describe multiple opportunities at different stages of evaluation. Technical reports and licence details should be reviewed for each project.</p></article><article><span>02 / Partnerships</span><h3>Investment and technical partners</h3><p>We welcome discussions with suitable investment, operating, technical and offtake partners.</p></article><article><span>03 / Communities</span><h3>Local participation</h3><p>Our stated approach includes local employment, regional relationships and community support connected with responsible development.</p></article></div>
      </div></section>}
      {page === 'minerals' && <section className="sec"><div className="sec-container">
        <div className="page-section-heading"><p className="eyebrow">Portfolio directory</p><h2 className="display">Minerals and gemstones</h2><p className="body-text">Company-stated areas of interest. Presence in this directory is not a confirmation of a measured resource, reserve, active production or commercial viability.</p></div>
        <div className="page-mineral-grid">{MINERALS.map((mineral, index) => <article className="page-mineral-card" key={mineral.name}><span>{String(index + 1).padStart(2, '0')}</span><Gem size={24}/><div><h3>{t.catalogue.minerals[mineral.name] ?? mineral.name}</h3><p>{t.catalogue.cats[mineral.cat] ?? mineral.cat}</p></div></article>)}</div>
        <p className="content-note">Project-specific geological evidence, sampling, testing, permits and technical reports should be assessed independently before investment decisions.</p>
      </div></section>}
      {page === 'gallery' && <section className="sec sec-dark"><div className="sec-container"><div className="page-section-heading"><p className="eyebrow">Company media</p><h2 className="display light">A closer look at our work</h2><p className="body-text">Browse sample imagery and authorized company uploads.</p></div></div><Gallery uploads={uploads}/></section>}
      {page === 'contact' && <section className="sec sec-dark"><div className="sec-container page-contact-grid"><div><p className="eyebrow">Contact our team</p><h2 className="display light">Let's explore what's possible.</h2><p className="body-text">{localizedPage.description}</p><div className="page-contact-detail"><Mail size={18}/><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div><div className="page-contact-detail"><MapPin size={18}/><span>{t.contact.address}</span></div><p className="page-contact-note">Please include the subject of your enquiry and any relevant project context.</p></div><div className="page-contact-form"><ContactForm/></div></div></section>}
      <section className="page-cta"><div><p className="eyebrow">Green Gemstone Mining Company</p><h2>Have a project or partnership in mind?</h2></div><a className="btn btn-gold" href="#/contact">{t.nav.contact} <ArrowUpRight size={16}/></a></section>
    </div>
  );
}

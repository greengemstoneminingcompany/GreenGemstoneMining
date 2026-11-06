import { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { ScrollProgress } from '@/components/Effects';
import { BuyerInformation, OwnerStudio } from '@/components/BuyerWorkspace';
import BuyerVisionHome from '@/components/BuyerVisionHome';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useReveals } from '@/hooks/useReveals';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useUploads } from '@/hooks/useUploads';
import { supabaseConfigured } from '@/lib/supabase';
import CompanyPages, { type CompanyPage } from '@/components/CompanyPages';

type SitePage = CompanyPage | 'buyers' | 'studio';
const readPage = (): SitePage => {
  const route = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return (['home', 'about', 'projects', 'minerals', 'gallery', 'contact', 'buyers', 'studio'].includes(route) ? route : 'home') as SitePage;
};

const MediaPanel = lazy(() => import('@/components/MediaPanel'));

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<SitePage>(readPage);
  useEffect(() => {
    const syncRoute = () => {
      setCurrentPage(readPage());
      setMenuOpen(false);
      // Wait until React renders the destination page before locating its section.
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        const section = new URLSearchParams(window.location.hash.split('?')[1] || '').get('section');
        const target = section ? document.getElementById(section) : null;
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'auto' });
      }));
    };
    window.addEventListener('hashchange', syncRoute);
    syncRoute();
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaRequest, setMediaRequest] = useState<{ requestId: string; mediaType: 'image' | 'video' } | null>(null);
  useEffect(() => {
    const openMedia = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setMediaRequest(detail && typeof detail.requestId === 'string' && ['image', 'video'].includes(detail.mediaType) ? detail : null);
      setMediaOpen(true);
    };
    window.addEventListener('ggmc-open-media', openMedia);
    return () => window.removeEventListener('ggmc-open-media', openMedia);
  }, []);
  const { t } = useI18n();
  const records = useCompanyRecords();
  const scrolled = useScrollHeader();
  const { uploads, refresh } = useUploads();
  const admin = useAdminSession(mediaOpen || currentPage === 'studio');
  useReveals();

  return (
    <div className="app">
      <a className="skip-link" href="#main">{t.ui.skip}</a>
      <ScrollProgress />

      <header className={`hdr ${scrolled || menuOpen ? 'scrolled' : ''}`} data-editor-id="site.header">
        <a className="hdr-brand" data-editor-id="site.brand" href="#/home"><img className="hdr-brand-mark" src="/brand-emblem.webp" width={43} height={39} alt="" aria-hidden="true" /><span className="brand-wordmark brand-wordmark--on-dark">{records.profile.legalName}</span></a>
        <nav id="main-nav" data-editor-id="site.navigation" className={`hdr-nav ${menuOpen ? 'open' : ''}`} aria-label={t.ui.mainNav}>
          <a href="#/home" onClick={() => setMenuOpen(false)}>{t.nav.overview}</a>
          <div className="nav-menu-item">
            <a href="#/about" onClick={() => setMenuOpen(false)}>{t.nav.company}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.company} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/about?section=company-profile" onClick={() => setMenuOpen(false)}>Company profile</a>
              <a href="#/about?section=vision-mission" onClick={() => setMenuOpen(false)}>Vision &amp; mission</a>
              <a href="#/about?section=leadership" onClick={() => setMenuOpen(false)}>Leadership</a>
              <a href="#/about?section=history-details" onClick={() => setMenuOpen(false)}>Company history</a>
              <a href="#/buyers" onClick={() => setMenuOpen(false)}>Buyer information</a>
            </div></details>
          </div>
          <div className="nav-menu-item">
            <a href="#/minerals" onClick={() => setMenuOpen(false)}>{t.nav.portfolio}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.portfolio} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/minerals?section=gemstones" onClick={() => setMenuOpen(false)}>Gemstones</a>
              <a href="#/minerals?section=buyer-specifications">Buyer specifications</a>
              <a href="#/minerals?section=industrial-metals" onClick={() => setMenuOpen(false)}>Industrial &amp; precious metals</a>
              <a href="#/projects?section=services" onClick={() => setMenuOpen(false)}>Services</a>
            </div></details>
          </div>
          <div className="nav-menu-item">
            <a href="#/projects" onClick={() => setMenuOpen(false)}>{t.nav.projects}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.projects} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/projects?section=development-projects" onClick={() => setMenuOpen(false)}>Mining development</a>
              <a href="#/about?section=rural-development" onClick={() => setMenuOpen(false)}>Rural development &amp; community support</a>
              <a href="#/projects?section=project-dossiers">Field notes &amp; laboratory evidence</a>
              <a href="#/projects?section=operations" onClick={() => setMenuOpen(false)}>Operations &amp; equipment</a>
            </div></details>
          </div>
          <a href="#/gallery" onClick={() => setMenuOpen(false)}>{t.nav.gallery}</a>
          <a href="#/contact" onClick={() => setMenuOpen(false)}>{t.nav.contact}</a>
          {document.querySelector('meta[name="ggmc-preview-editor"]')?.getAttribute('content') === 'enabled' && (
            <details className="nav-dropdown owner-menu"><summary>Employee portal</summary><div className="nav-dropdown-panel">
              <a href="#/studio" onClick={() => setMenuOpen(false)}>Owner Studio</a>
            </div></details>
          )}
          <LanguageSwitcher />
          <a className="hdr-cta" data-editor-id="site.primary-cta" href="#/contact" onClick={() => setMenuOpen(false)}>{t.nav.cta} <ArrowUpRight size={14} aria-hidden="true" /></a>
        </nav>
        <button type="button" className="hdr-burger" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? t.ui.menuClose : t.ui.menuOpen}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      {mediaOpen && (
        <Suspense fallback={null}>
          <MediaPanel open={mediaOpen} onClose={() => { setMediaOpen(false); setMediaRequest(null); }} onUploaded={refresh} admin={admin} selectionType={mediaRequest?.mediaType} onSelect={mediaRequest ? (asset) => {
            window.dispatchEvent(new CustomEvent('ggmc-media-selected', { detail: { requestId: mediaRequest.requestId, url: asset.public_url, title: asset.title, mediaType: asset.media_type } }));
            setMediaOpen(false); setMediaRequest(null);
          } : undefined} />
        </Suspense>
      )}

      <main id="main">
        {currentPage === 'home' ? <BuyerVisionHome /> : currentPage === 'buyers' ? <BuyerInformation /> : currentPage === 'studio' ? <OwnerStudio admin={admin} onOpenMedia={() => setMediaOpen(true)} /> : <CompanyPages page={currentPage} uploads={uploads} />}
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><img className="footer-brand-mark" src="/brand-emblem.webp" width={30} height={26} alt="" aria-hidden="true" /><span className="brand-wordmark brand-wordmark--on-dark">{records.profile.legalName}</span></div>
            <p className="footer-tag">{t.footer.tagline}</p>
          </div>
          <div className="footer-col">
            <h3>{t.footer.company}</h3>
            <a href="#/about">{t.footer.about}</a>
            <a href="#/about?section=vision-mission">{t.footer.mission}</a>
            <a href="#/projects">{t.footer.projects}</a>
            <a href="#/buyers">Buyer information</a>
          </div>
          <div className="footer-col">
            <h3>{t.footer.resources}</h3>
            <a href="#/minerals">{t.footer.deposits}</a>
            <a href="#/gallery">{t.footer.gallery}</a>
            <a href="#/contact">{t.footer.contact}</a>
          </div>
          <div className="footer-col">
            <h3>{t.footer.connect}</h3>
            <a href={`mailto:${records.profile.email}`}>{t.footer.email}</a>
            {records.profile.linkedin && <a href={records.profile.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>}
            <a href="#/contact">{t.footer.partner}</a>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} {records.profile.legalName}</span>
          <span>{records.profile.publicLocation}</span>
          {supabaseConfigured && <a className="owner-link" href="#/studio">{t.footer.ownerLogin}</a>}
        </div>
        <section id="privacy" className="privacy">
          <h3>{t.footer.privacyTitle}</h3>
          <p>{t.footer.privacyText} <a href={`mailto:${records.profile.email}`}>{records.profile.email}</a>.</p>
        </section>
      </footer>
    </div>
  );
}

import CompanyPages from '@/components/CompanyPages';
import { readSiteRoute } from '@/lib/siteRouting';
import './company-pages.css';
import { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { Crystal3D, ScrollProgress } from '@/components/Effects';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { IMAGES, SITE } from '@/data/site';
import { useI18n } from '@/i18n/core';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useReveals } from '@/hooks/useReveals';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useUploads } from '@/hooks/useUploads';
import { supabaseConfigured } from '@/lib/supabase';


const MediaPanel = lazy(() => import('@/components/MediaPanel'));

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [route, setRoute] = useState(() => readSiteRoute(window.location.hash));
  useEffect(() => {
    const syncRoute = () => {
      if (['#main', '#privacy'].includes(window.location.hash)) return;
      setRoute(readSiteRoute(window.location.hash));
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const target = route.section ? document.getElementById(route.section) : null;
      if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [route]);

  const [mediaOpen, setMediaOpen] = useState(false);
  const { t } = useI18n();
  const scrolled = useScrollHeader();
  const { uploads, refresh } = useUploads();
  const admin = useAdminSession(mediaOpen);
  useReveals(route.page);

  return (
    <div className="app">
      <a className="skip-link" href="#main">{t.ui.skip}</a>
      <ScrollProgress />

      <header className={`hdr ${scrolled || menuOpen ? 'scrolled' : ''}`}>
        <a className="hdr-brand" href="#/home"><img className="hdr-brand-mark" src="/brand-emblem.webp" width={43} height={39} alt="" aria-hidden="true" /><span className="brand-wordmark brand-wordmark--on-dark">Green Gemstone Mining Company</span></a>
        <nav id="main-nav" className={`hdr-nav ${menuOpen ? 'open' : ''}`} aria-label={t.ui.mainNav}>
          <a href="#/home" onClick={() => setMenuOpen(false)}>{t.nav.overview}</a>
          <div className="nav-menu-item">
            <a href="#/about" onClick={() => setMenuOpen(false)}>{t.nav.company}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.company} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/about?section=company-profile" onClick={() => setMenuOpen(false)}>Company profile</a>
              <a href="#/about?section=vision-mission" onClick={() => setMenuOpen(false)}>Vision &amp; mission</a>
              <a href="#/about?section=leadership" onClick={() => setMenuOpen(false)}>Leadership</a>
              <a href="#/about?section=history-details" onClick={() => setMenuOpen(false)}>Company history</a>
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
          <LanguageSwitcher />
          <a className="hdr-cta" href="#/contact" onClick={() => setMenuOpen(false)}>{t.nav.cta} <ArrowUpRight size={14} aria-hidden="true" /></a>
        </nav>
        <button type="button" className="hdr-burger" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? t.ui.menuClose : t.ui.menuOpen}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      {mediaOpen && (
        <Suspense fallback={null}>
          <MediaPanel open={mediaOpen} onClose={() => setMediaOpen(false)} onUploaded={refresh} admin={admin} />
        </Suspense>
      )}

      <main id="main" tabIndex={-1}>
        {route.page === 'home' ? <>
        <section id="top" className="hero">
          <img className="hero-bg" src={IMAGES.company} alt="" width={806} height={536} fetchPriority="high" />
          <div className="hero-overlay" />
          <Crystal3D />
          <div className="hero-inner">
            <p className="hero-kicker">{t.hero.kicker}</p>
            <h1>{t.hero.h1a} <span className="h1-line">{t.hero.h1b}</span></h1>
            <p className="hero-sub">{t.hero.sub}</p>
            <div className="hero-cta">
              <a className="btn btn-gold" href="#/contact">{t.hero.primary} <ArrowRight size={16} aria-hidden="true" /></a>
              <a className="btn-ghost" href="#/minerals">{t.hero.secondary} <ChevronDown size={16} aria-hidden="true" /></a>
            </div>
            <div className="hero-metrics">
              {t.hero.metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-foot"><span>{t.hero.foot}</span></div>
        </section>

        <section id="company" className="sec">
          <div className="sec-container company">
            <div className="company-visual reveal">
              <img src={IMAGES.company} alt={t.company.imgAlt} width={806} height={536} loading="lazy" />
              <div className="company-badge">{t.company.badge1}<br />{t.company.badge2}</div>
            </div>
            <div className="company-text reveal" style={{ transitionDelay: '120ms' }}>
              <p className="eyebrow">{t.company.eyebrow}</p>
              <h2 className="display">{t.company.h2a}<br /><em>{t.company.h2b}</em></h2>
              <p className="body-lg">{t.company.lead}</p>
              <a className="link-go" href="#/about">{t.company.link} <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <section className="sec home-destinations" aria-label="Explore Green Gemstone">
          <div className="sec-container mission-grid">
            {([
              ['minerals', t.nav.portfolio, t.catalogue.text],
              ['projects', t.nav.projects, t.projects.text],
              ['gallery', t.nav.gallery, t.gallery.text],
            ] as const).map(([page, title, text]) => <a className="mission-card" href={`#/${page}`} key={page}>
              <h2 className="home-destination-title">{title} <ArrowUpRight size={18} aria-hidden="true" /></h2>
              <p>{text}</p>
            </a>)}
          </div>
        </section>
        <section className="page-cta"><div><p className="eyebrow">{SITE.name}</p><h2>{t.contact.h2a} {t.contact.h2b}</h2></div><a className="btn btn-gold" href="#/contact">{t.nav.contact} <ArrowRight size={16} aria-hidden="true" /></a></section>
        </> : <CompanyPages page={route.page} uploads={uploads} />}
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><img className="footer-brand-mark" src="/brand-emblem.webp" width={30} height={26} alt="" aria-hidden="true" /><span className="brand-wordmark brand-wordmark--on-dark">Green Gemstone Mining Company</span></div>
            <p className="footer-tag">{t.footer.tagline}</p>
          </div>
          <div className="footer-col">
            <h3>{t.footer.company}</h3>
            <a href="#/about">{t.footer.about}</a>
            <a href="#/about?section=vision-mission">{t.footer.mission}</a>
            <a href="#/projects">{t.footer.projects}</a>
          </div>
          <div className="footer-col">
            <h3>{t.footer.resources}</h3>
            <a href="#/minerals">{t.footer.deposits}</a>
            <a href="#/gallery">{t.footer.gallery}</a>
            <a href="#/contact">{t.footer.contact}</a>
          </div>
          <div className="footer-col">
            <h3>{t.footer.connect}</h3>
            <a href={`mailto:${SITE.email}`}>{t.footer.email}</a>
            {SITE.linkedin && <a href={SITE.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>}
            <a href="#/contact">{t.footer.partner}</a>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} {SITE.name}</span>
          <span>{t.footer.location}</span>
          {supabaseConfigured && <button type="button" className="owner-link" onClick={() => setMediaOpen(true)}>{t.footer.ownerLogin}</button>}
        </div>
        <section id="privacy" className="privacy">
          <h3>{t.footer.privacyTitle}</h3>
          <p>{t.footer.privacyText} <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
        </section>
      </footer>
    </div>
  );
}

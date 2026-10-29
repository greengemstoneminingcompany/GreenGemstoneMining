import { Suspense, lazy, useState } from 'react';
import { Atom, ArrowRight, ArrowUpRight, ChevronDown, Gem, Hammer, Linkedin, Mail, MapPin, Menu, Mountain, X } from 'lucide-react';
import Gallery from '@/components/Gallery';
import CompanyContent from '@/components/CompanyContent';
import ContactForm from '@/components/ContactForm';
import SomalilandMap from '@/components/SomalilandMap';
import { Counter, Crystal3D, ScrollProgress } from '@/components/Effects';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { DEPOSITS, IMAGES, MINERALS, SITE, TIMELINE } from '@/data/site';
import { useI18n } from '@/i18n/core';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useReveals } from '@/hooks/useReveals';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useUploads } from '@/hooks/useUploads';
import { supabaseConfigured } from '@/lib/supabase';

const DEPOSIT_ICONS = { gem: Gem, atom: Atom, hammer: Hammer, mountain: Mountain } as const;
const METALS = MINERALS.filter((m) => m.cat === 'Metal' || m.cat === 'Precious');

const MediaPanel = lazy(() => import('@/components/MediaPanel'));

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const { t } = useI18n();
  const scrolled = useScrollHeader();
  const { uploads, refresh } = useUploads();
  const admin = useAdminSession(mediaOpen);
  useReveals();

  return (
    <div className="app">
      <a className="skip-link" href="#main">{t.ui.skip}</a>
      <ScrollProgress />

      <header className={`hdr ${scrolled || menuOpen ? 'scrolled' : ''}`}>
        <a className="hdr-brand" href="#top"><Gem size={22} aria-hidden="true" /><span>Green Gemstone Mining Company</span></a>
        <nav id="main-nav" className={`hdr-nav ${menuOpen ? 'open' : ''}`} aria-label={t.ui.mainNav}>
          <a href="#top" onClick={() => setMenuOpen(false)}>{t.nav.overview}</a>
          <div className="nav-menu-item">
            <a href="#company" onClick={() => setMenuOpen(false)}>{t.nav.company}</a>
            <details className="nav-dropdown"><summary aria-label="Open company submenu"><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#company-profile" onClick={() => setMenuOpen(false)}>Company profile</a>
              <a href="#vision-mission" onClick={() => setMenuOpen(false)}>Vision &amp; mission</a>
              <a href="#leadership" onClick={() => setMenuOpen(false)}>Leadership</a>
              <a href="#history-details" onClick={() => setMenuOpen(false)}>Company history</a>
            </div></details>
          </div>
          <div className="nav-menu-item">
            <a href="#resources" onClick={() => setMenuOpen(false)}>{t.nav.portfolio}</a>
            <details className="nav-dropdown"><summary aria-label="Open portfolio submenu"><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#gemstones" onClick={() => setMenuOpen(false)}>Gemstones</a>
              <a href="#industrial-metals" onClick={() => setMenuOpen(false)}>Industrial &amp; precious metals</a>
              <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            </div></details>
          </div>
          <div className="nav-menu-item">
            <a href="#projects" onClick={() => setMenuOpen(false)}>{t.nav.projects}</a>
            <details className="nav-dropdown"><summary aria-label="Open projects submenu"><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#development-projects" onClick={() => setMenuOpen(false)}>Mining development</a>
              <a href="#rural-development" onClick={() => setMenuOpen(false)}>Rural development &amp; community support</a>
              <a href="#operations" onClick={() => setMenuOpen(false)}>Operations &amp; equipment</a>
            </div></details>
          </div>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>{t.nav.gallery}</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>{t.nav.contact}</a>
          <LanguageSwitcher />
          <a className="hdr-cta" href="#contact" onClick={() => setMenuOpen(false)}>{t.nav.cta} <ArrowUpRight size={14} aria-hidden="true" /></a>
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

      <main id="main">
        <section id="top" className="hero">
          <img className="hero-bg" src={IMAGES.company} alt="" width={806} height={536} fetchPriority="high" />
          <div className="hero-overlay" />
          <Crystal3D />
          <div className="hero-inner">
            <p className="hero-kicker">{t.hero.kicker}</p>
            <h1>{t.hero.h1a} <span className="h1-line">{t.hero.h1b}</span></h1>
            <p className="hero-sub">{t.hero.sub}</p>
            <div className="hero-cta">
              <a className="btn btn-gold" href="#contact">{t.hero.primary} <ArrowRight size={16} aria-hidden="true" /></a>
              <a className="btn-ghost" href="#resources">{t.hero.secondary} <ChevronDown size={16} aria-hidden="true" /></a>
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

        <section className="marquee">
          <div className="marquee-track">{[...t.marquee, ...t.marquee].map((word, i) => <span key={`${word}-${i}`}><Gem size={12} /> {word}</span>)}</div>
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
              <p className="body-text">{t.company.p1}</p>
              <p className="body-text">{t.company.p2}</p>
              <a className="link-go" href="#mission">{t.company.link} <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <section id="resources" className="sec sec-dark">
          <div className="sec-container">
            <div className="deposits-head reveal">
              <div>
                <p className="eyebrow">{t.resources.eyebrow}</p>
                <h2 className="display light">{t.resources.h2a}<br /><em>{t.resources.h2b}</em></h2>
              </div>
              <p>{t.resources.intro}</p>
            </div>
            <div className="deposits-grid">
              {DEPOSITS.map((deposit, index) => {
                const text = t.resources.deposits[index];
                return (
                <article className="deposit reveal" key={text.name} style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className={`deposit-art tone-${deposit.tone}`} aria-hidden="true">{(() => { const Icon = DEPOSIT_ICONS[deposit.icon]; return <Icon size={96} strokeWidth={0.6} />; })()}</div>
                  <span className="deposit-tag">{text.tag}</span>
                  <div className="deposit-body">
                    <h3>{text.name}</h3>
                    <p>{text.desc}</p>
                    <a href="#contact">{t.resources.discuss} <ArrowUpRight size={14} /></a>
                  </div>
                </article>
              );
              })}
            </div>
          </div>
        </section>

        <section className="split">
          <div className="split-img split-panel"><ul aria-label={t.industrial.listLabel}>{METALS.map((m) => <li key={m.name}>{t.catalogue.minerals[m.name] ?? m.name}</li>)}</ul></div>
          <div className="split-text">
            <div className="reveal">
              <p className="eyebrow">{t.industrial.eyebrow}</p>
              <h2 className="display light">{t.industrial.h2a}<br /><em>{t.industrial.h2b}</em></h2>
              <p className="body-text">{t.industrial.text}</p>
              <div className="split-stats">
                <Counter value={12} label={t.industrial.stats[0]} />
                <Counter value={6} label={t.industrial.stats[1]} plus={false} />
                <Counter value={2018} label={t.industrial.stats[2]} plus={false} />
              </div>
              <a className="btn btn-gold" href="#projects">{t.industrial.cta} <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        <section id="mission" className="sec">
          <div className="sec-container">
            <div className="mission-head reveal">
              <p className="eyebrow">{t.mission.eyebrow}</p>
              <h2 className="display">{t.mission.h2a}<br /><em>{t.mission.h2b}</em></h2>
              <p className="body-text">{t.mission.text}</p>
            </div>
            <div className="mission-grid">
              {t.mission.points.map((point, index) => (
                <div className="mission-card reveal" key={index} style={{ transitionDelay: `${index * 120}ms` }}>
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{point.t}</h3>
                  <p>{point.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="sec sec-dark">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.projects.eyebrow}</p>
              <h2 className="display light">{t.projects.h2a}<br /><em>{t.projects.h2b}</em></h2>
              <p className="body-text">{t.projects.text}</p>
            </div>
            <div className="reveal"><SomalilandMap /></div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.history.eyebrow}</p>
              <h2 className="display">{t.history.h2a}<br /><em>{t.history.h2b}</em></h2>
            </div>
            <div className="timeline-rail">
              {TIMELINE.map((item, index) => (
                <div className="tl-node reveal" key={item.year} style={{ transitionDelay: `${index * 120}ms` }}>
                  <span className="tl-dot" />
                  <span className="tl-year">{item.year}</span>
                  <h3>{t.history.timeline[index].title}</h3>
                  <p>{t.history.timeline[index].desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CompanyContent />

        <section id="gallery" className="sec sec-dark">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.gallery.eyebrow}</p>
              <h2 className="display light">{t.gallery.h2a}<br /><em>{t.gallery.h2b}</em></h2>
              <p className="body-text">{t.gallery.text}</p>
            </div>
          </div>
          <Gallery uploads={uploads} />
        </section>

        <section className="sec">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.catalogue.eyebrow}</p>
              <h2 className="display">{t.catalogue.h2a}<br /><em>{t.catalogue.h2b}</em></h2>
              <p className="body-text">{t.catalogue.text}</p>
            </div>
            <div className="mineral-grid reveal">
              {MINERALS.map((mineral, index) => (
                <div className="mineral" key={mineral.name}>
                  <span className="mineral-num">{String(index + 1).padStart(2, '0')}</span>
                  <Gem size={18} />
                  <div className="mineral-info"><strong>{t.catalogue.minerals[mineral.name] ?? mineral.name}</strong><small>{t.catalogue.cats[mineral.cat] ?? mineral.cat}</small></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="contact-sec">
          <div className="contact-visual">
            <div className="contact-stamp">{t.contact.stamp1}<strong>{t.contact.stamp2}</strong></div>
          </div>
          <div className="contact-panel">
            <div className="reveal">
              <p className="eyebrow">{t.contact.eyebrow}</p>
              <h2 className="display light">{t.contact.h2a}<br /><em>{t.contact.h2b}</em></h2>
              <p className="body-text">{t.contact.text}</p>
              <div className="contact-info">
                <a href={`mailto:${SITE.email}`}><Mail size={16} aria-hidden="true" /> {SITE.email}</a>
                <span><MapPin size={16} aria-hidden="true" /> {t.contact.address}</span>
                {SITE.linkedin && <a href={SITE.linkedin} rel="noopener noreferrer" target="_blank"><Linkedin size={16} aria-hidden="true" /> LinkedIn</a>}
              </div>
              <ContactForm />
              <p className="privacy-note">{t.contact.privacyBefore} <a href="#privacy">{t.contact.privacyLink}</a>.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><Gem size={20} aria-hidden="true" /> Green Gemstone Mining Company</div>
            <p className="footer-tag">{t.footer.tagline}</p>
          </div>
          <div className="footer-col">
            <h3>{t.footer.company}</h3>
            <a href="#company">{t.footer.about}</a>
            <a href="#mission">{t.footer.mission}</a>
            <a href="#projects">{t.footer.projects}</a>
          </div>
          <div className="footer-col">
            <h3>{t.footer.resources}</h3>
            <a href="#resources">{t.footer.deposits}</a>
            <a href="#gallery">{t.footer.gallery}</a>
            <a href="#contact">{t.footer.contact}</a>
          </div>
          <div className="footer-col">
            <h3>{t.footer.connect}</h3>
            <a href={`mailto:${SITE.email}`}>{t.footer.email}</a>
            {SITE.linkedin && <a href={SITE.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>}
            <a href="#contact">{t.footer.partner}</a>
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

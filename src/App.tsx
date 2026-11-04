import { Suspense, lazy, useEffect, useState } from 'react';
import { Atom, ArrowRight, ArrowUpRight, ChevronDown, Gem, Hammer, Handshake, Linkedin, Mail, MapPin, Menu, Mountain, ShieldCheck, Sparkles, X } from 'lucide-react';
import Gallery from '@/components/Gallery';
import ContactForm from '@/components/ContactForm';
import MarketReference from '@/components/MarketReference';
import SiteAnalytics from '@/components/SiteAnalytics';
import EvidenceRegister from '@/components/EvidenceRegister';
import SomalilandMap from '@/components/SomalilandMap';
import { Counter, Crystal3D, ScrollProgress } from '@/components/Effects';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { DEPOSITS } from '@/data/site';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useReveals } from '@/hooks/useReveals';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useUploads } from '@/hooks/useUploads';
import { supabaseConfigured } from '@/lib/supabase';
import CompanyPages, { type CompanyPage } from '@/components/CompanyPages';

const DEPOSIT_ICONS = { gem: Gem, atom: Atom, hammer: Hammer, mountain: Mountain } as const;

const readPage = (): CompanyPage => {
  const route = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return (['home', 'about', 'projects', 'minerals', 'gallery', 'contact'].includes(route) ? route : 'home') as CompanyPage;
};

const MediaPanel = lazy(() => import('@/components/MediaPanel'));

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [currentPage, setCurrentPage] = useState<CompanyPage>(readPage);
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
  const { t, lang } = useI18n();
  const records = useCompanyRecords();
  const metals = records.minerals.filter((m) => m.cat === 'Metal' || m.cat === 'Precious');
  const scrolled = useScrollHeader();
  const { uploads, refresh } = useUploads();
  const admin = useAdminSession(mediaOpen);
  useReveals();

  return (
    <div className={`app ${lowBandwidth ? 'low-bandwidth' : ''}`}>
      <SiteAnalytics route={currentPage} />
      <a className="skip-link" href="#main">{t.ui.skip}</a>
      <ScrollProgress />

      <header className={`hdr ${scrolled || menuOpen ? 'scrolled' : ''}`} data-editor-id="site.header">
        <a className="hdr-brand" data-editor-id="site.brand" href="#/home"><Gem size={22} aria-hidden="true" /><span>{records.profile.legalName}</span></a>
        <nav id="main-nav" data-editor-id="site.navigation" className={`hdr-nav ${menuOpen ? 'open' : ''}`} aria-label={t.ui.mainNav}>
          <a href="#/home" onClick={() => setMenuOpen(false)}>{t.nav.overview}</a>
          <div className="nav-menu-item">
            <a href="#/about" onClick={() => setMenuOpen(false)}>{t.nav.company}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.company} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/about?section=company-profile" onClick={() => setMenuOpen(false)}>{({ en: 'Company profile', zh: '公司简介', so: 'Xogta shirkadda', ar: 'الملف التعريفي للشركة' } as const)[lang]}</a>
              <a href="#/about?section=vision-mission" onClick={() => setMenuOpen(false)}>{({ en: 'Vision & mission', zh: '愿景与使命', so: 'Aragtida iyo himilada', ar: 'الرؤية والرسالة' } as const)[lang]}</a>
              <a href="#/about?section=leadership" onClick={() => setMenuOpen(false)}>{({ en: 'Leadership', zh: '管理团队', so: 'Hoggaanka', ar: 'القيادة' } as const)[lang]}</a>
              <a href="#/about?section=history-details" onClick={() => setMenuOpen(false)}>{({ en: 'Company history', zh: '公司历史', so: 'Taariikhda shirkadda', ar: 'تاريخ الشركة' } as const)[lang]}</a>
            </div></details>
          </div>
          <div className="nav-menu-item">
            <a href="#/minerals" onClick={() => setMenuOpen(false)}>{t.nav.portfolio}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.portfolio} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/about?section=gemstones" onClick={() => setMenuOpen(false)}>{({ en: 'Gemstones', zh: '宝石', so: 'Dhagaxyada qaaliga ah', ar: 'الأحجار الكريمة' } as const)[lang]}</a>
              <a href="#/about?section=industrial-metals" onClick={() => setMenuOpen(false)}>{({ en: 'Industrial & precious metals', zh: '工业与贵金属', so: 'Biraha warshadaha iyo kuwa qaaliga ah', ar: 'المعادن الصناعية والثمينة' } as const)[lang]}</a>
              <a href="#/about?section=services" onClick={() => setMenuOpen(false)}>{({ en: 'Services', zh: '服务', so: 'Adeegyada', ar: 'الخدمات' } as const)[lang]}</a>
            </div></details>
          </div>
          <div className="nav-menu-item">
            <a href="#/projects" onClick={() => setMenuOpen(false)}>{t.nav.projects}</a>
            <details className="nav-dropdown"><summary aria-label={`${t.nav.projects} submenu`}><ChevronDown size={13} /></summary><div className="nav-dropdown-panel">
              <a href="#/about?section=development-projects" onClick={() => setMenuOpen(false)}>{({ en: 'Mining development', zh: '矿业开发', so: 'Horumarinta macdanta', ar: 'تطوير التعدين' } as const)[lang]}</a>
              <a href="#/about?section=rural-development" onClick={() => setMenuOpen(false)}>{({ en: 'Rural development & community support', zh: '乡村发展与社区支持', so: 'Horumarinta miyiga iyo taageerada bulshada', ar: 'التنمية الريفية ودعم المجتمع' } as const)[lang]}</a>
              <a href="#/about?section=operations" onClick={() => setMenuOpen(false)}>{({ en: 'Operations & equipment', zh: '运营与设备', so: 'Hawlaha iyo qalabka', ar: 'العمليات والمعدات' } as const)[lang]}</a>
            </div></details>
          </div>
          <a href="#/gallery" onClick={() => setMenuOpen(false)}>{t.nav.gallery}</a>
          <a href="#/contact" onClick={() => setMenuOpen(false)}>{t.nav.contact}</a>
          {document.querySelector('meta[name="ggmc-preview-editor"]')?.getAttribute('content') === 'enabled' && (
            <details className="nav-dropdown owner-menu"><summary>{({ en: 'Employee portal', zh: '员工门户', so: 'Bogga shaqaalaha', ar: 'بوابة الموظفين' } as const)[lang]}</summary><div className="nav-dropdown-panel">
              <a href="?edit=1" onClick={(event) => { event.preventDefault(); setMenuOpen(false); event.currentTarget.closest('details')?.removeAttribute('open'); window.dispatchEvent(new Event('ggmc-open-editor')); }}>{({ en: 'Employee portal sign-in', zh: '员工登录', so: 'Galitaanka shaqaalaha', ar: 'تسجيل دخول الموظفين' } as const)[lang]}</a>
            </div></details>
          )}
          <button type="button" className="atlas-bandwidth-toggle" aria-pressed={lowBandwidth} onClick={() => setLowBandwidth((value) => !value)}>{({ en: 'Low bandwidth', zh: '低流量模式', so: 'Xog yar', ar: 'بيانات أقل' } as const)[lang]}</button>
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
        {currentPage === 'home' ? (<>
        <section id="top" className="hero" data-editor-id="home.hero">
          {!lowBandwidth && <img className="hero-bg" src={records.profile.heroImage} alt="" width={806} height={536} fetchPriority="high" />}
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
              {records.metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-foot"><span>{t.hero.foot}</span></div>
        </section>

        <section className="showcase-values" aria-label="Company principles" data-editor-id="home.values">
          <div><ShieldCheck aria-hidden="true" /><strong>{t.mission.points[0].t}</strong><span>{t.mission.points[0].d}</span></div>
          <div><Handshake aria-hidden="true" /><strong>{t.mission.points[1].t}</strong><span>{t.mission.points[1].d}</span></div>
          <div><Sparkles aria-hidden="true" /><strong>{t.mission.points[2].t}</strong><span>{t.mission.points[2].d}</span></div>
        </section>

        <section className="marquee" data-editor-id="home.marquee">
          <div className="marquee-track">{[...t.marquee, ...t.marquee].map((word, i) => <span key={`${word}-${i}`}><Gem size={12} /> {word}</span>)}</div>
        </section>

        <section id="company" className="sec" data-editor-id="home.company">
          <div className="sec-container company">
            <div className="company-visual reveal">
              {!lowBandwidth && <img src={records.profile.companyImage} alt={t.company.imgAlt} width={806} height={536} loading="lazy" />}
              <div className="company-badge">{t.company.badge1}<br />{t.company.badge2}</div>
            </div>
            <div className="company-text reveal" style={{ transitionDelay: '120ms' }}>
              <p className="eyebrow">{t.company.eyebrow}</p>
              <h2 className="display">{t.company.h2a}<br /><em>{t.company.h2b}</em></h2>
              <p className="body-lg">{t.company.lead}</p>
              <p className="body-text">{t.company.p1}</p>
              <p className="body-text">{t.company.p2}</p>
              <a className="link-go" href="#/about">{t.company.link} <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <section id="resources" className="sec sec-dark" data-editor-id="home.resources">
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
                    <a href="#/contact">{t.resources.discuss} <ArrowUpRight size={14} /></a>
                  </div>
                </article>
              );
              })}
            </div>
          </div>
        </section>

        <section className="split" data-editor-id="home.industrial">
          <div className="split-img split-panel"><ul aria-label={t.industrial.listLabel}>{metals.map((m) => <li key={m.name}>{t.catalogue.minerals[m.name] ?? m.name}</li>)}</ul></div>
          <div className="split-text">
            <div className="reveal">
              <p className="eyebrow">{t.industrial.eyebrow}</p>
              <h2 className="display light">{t.industrial.h2a}<br /><em>{t.industrial.h2b}</em></h2>
              <p className="body-text">{t.industrial.text}</p>
              <div className="split-stats">
                {records.industrialStats.map((stat, index) => <Counter key={stat.label} value={Number(stat.value) || 0} label={stat.label} plus={index === 0} />)}
              </div>
              <a className="btn btn-gold" href="#/projects">{t.industrial.cta} <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        <MarketReference minerals={records.minerals.map((mineral) => mineral.name)} />

        <section id="mission" className="sec" data-editor-id="home.mission">
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

        <section id="projects" className="sec sec-dark" data-editor-id="home.projects">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.projects.eyebrow}</p>
              <h2 className="display light">{t.projects.h2a}<br /><em>{t.projects.h2b}</em></h2>
              <p className="body-text">{t.projects.text}</p>
            </div>
            <div className="reveal"><SomalilandMap projects={records.projects} /></div>
          </div>
        </section>

        <EvidenceRegister projects={records.projects} />

        <section className="sec" data-editor-id="home.history">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.history.eyebrow}</p>
              <h2 className="display">{t.history.h2a}<br /><em>{t.history.h2b}</em></h2>
            </div>
            <div className="timeline-rail">
              {records.timeline.map((item, index) => (
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

        <section id="gallery" className="sec sec-dark" data-editor-id="home.gallery">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.gallery.eyebrow}</p>
              <h2 className="display light">{t.gallery.h2a}<br /><em>{t.gallery.h2b}</em></h2>
              <p className="body-text">{t.gallery.text}</p>
            </div>
          </div>
          <Gallery uploads={uploads} items={records.gallery} />
        </section>

        <section className="sec" data-editor-id="home.minerals">
          <div className="sec-container">
            <div className="reveal center-block">
              <p className="eyebrow center">{t.catalogue.eyebrow}</p>
              <h2 className="display">{t.catalogue.h2a}<br /><em>{t.catalogue.h2b}</em></h2>
              <p className="body-text">{t.catalogue.text}</p>
            </div>
            <div className="mineral-grid reveal">
              {records.minerals.map((mineral, index) => (
                <div className="mineral" key={mineral.name}>
                  <span className="mineral-num">{String(index + 1).padStart(2, '0')}</span>
                  <Gem size={18} />
                  <div className="mineral-info"><strong>{t.catalogue.minerals[mineral.name] ?? mineral.name}</strong><small>{t.catalogue.cats[mineral.cat] ?? mineral.cat}</small></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="contact-sec" data-editor-id="home.contact">
          <div className="contact-visual">
            <div className="contact-stamp">{t.contact.stamp1}<strong>{t.contact.stamp2}</strong></div>
          </div>
          <div className="contact-panel">
            <div className="reveal">
              <p className="eyebrow">{t.contact.eyebrow}</p>
              <h2 className="display light">{t.contact.h2a}<br /><em>{t.contact.h2b}</em></h2>
              <p className="body-text">{t.contact.text}</p>
              <div className="contact-info">
                <a href={`mailto:${records.profile.email}`}><Mail size={16} aria-hidden="true" /> {records.profile.email}</a>
                <span><MapPin size={16} aria-hidden="true" /> {records.profile.officeAddress}</span>
                {records.profile.linkedin && <a href={records.profile.linkedin} rel="noopener noreferrer" target="_blank"><Linkedin size={16} aria-hidden="true" /> LinkedIn</a>}
              </div>
              <ContactForm />
              <p className="privacy-note">{t.contact.privacyBefore} <a href="#privacy">{t.contact.privacyLink}</a>.</p>
            </div>
          </div>
        </section>
        </>) : <CompanyPages page={currentPage} uploads={uploads} />}
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><Gem size={20} aria-hidden="true" /> {records.profile.legalName}</div>
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
            <a href={`mailto:${records.profile.email}`}>{t.footer.email}</a>
            {records.profile.linkedin && <a href={records.profile.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>}
            <a href="#/contact">{t.footer.partner}</a>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} {records.profile.legalName}</span>
          <span>{records.profile.publicLocation}</span>
          {supabaseConfigured && <button type="button" className="owner-link" onClick={() => setMediaOpen(true)}>{t.footer.ownerLogin}</button>}
        </div>
        <section id="privacy" className="privacy">
          <h3>{t.footer.privacyTitle}</h3>
          <p>{t.footer.privacyText} <a href={`mailto:${records.profile.email}`}>{records.profile.email}</a>.</p>
        </section>
      </footer>
    </div>
  );
}

import { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ScrollProgress } from '@/components/Effects';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useReveals } from '@/hooks/useReveals';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useUploads } from '@/hooks/useUploads';
import CompanyPages, { type CompanyPage } from '@/components/CompanyPages';
import OwnerHome from '@/components/OwnerHome';
import OwnerTopicPage from '@/components/OwnerTopicPage';
import OwnerStudio from '@/components/OwnerStudio';
import { ownerCopy } from '@/components/ownerCopy';
import './components/OwnerNavigation.css';

type SitePage = CompanyPage | 'operations' | 'responsibility' | 'studio';
const allowedPages = new Set<string>(['home','about','projects','minerals','gallery','contact','operations','responsibility','studio']);
const readPage = ():SitePage => {
  const route=window.location.hash.replace(/^#\/?/,'').split(/[/?]/)[0];
  return (allowedPages.has(route)?route:'home') as SitePage;
};
const MediaPanel = lazy(()=>import('@/components/MediaPanel'));

export default function App(){
  const [menuOpen,setMenuOpen]=useState(false);
  const [currentPage,setCurrentPage]=useState<SitePage>(readPage);
  const [mediaOpen,setMediaOpen]=useState(false);
  const [mediaRequest,setMediaRequest]=useState<{requestId:string;mediaType:'image'|'video'}|null>(null);
  const {t,lang}=useI18n();const copy=ownerCopy(lang);const records=useCompanyRecords();
  const scrolled=useScrollHeader();const {uploads,refresh}=useUploads();const admin=useAdminSession(mediaOpen);useReveals();
  const isPreview=typeof document!=='undefined' && document.querySelector('meta[name="ggmc-preview-editor"]')?.getAttribute('content')==='enabled';
  useEffect(()=>{
    const syncRoute=()=>{setCurrentPage(readPage());setMenuOpen(false);window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
      const section=new URLSearchParams(window.location.hash.split('?')[1]||'').get('section');const target=section?document.getElementById(section):null;
      if(target)target.scrollIntoView({behavior:'auto',block:'start'});else window.scrollTo({top:0,behavior:'auto'});
    }));};
    window.addEventListener('hashchange',syncRoute);syncRoute();return()=>window.removeEventListener('hashchange',syncRoute);
  },[]);
  useEffect(()=>{
    const openMedia=(event:Event)=>{const data=(event as CustomEvent).detail;
      setMediaRequest(data && typeof data.requestId==='string' && ['image','video'].includes(data.mediaType)?data:null);setMediaOpen(true);};
    window.addEventListener('ggmc-open-media',openMedia);return()=>window.removeEventListener('ggmc-open-media',openMedia);
  },[]);
  const closeNav=()=>{setMenuOpen(false);document.querySelectorAll('.owner-mega[open]').forEach(item=>item.removeAttribute('open'));};
  return <div className="app owner-shell">
    <a className="skip-link" href="#main">{t.ui.skip}</a><ScrollProgress />
    <header className={`hdr owner-header ${scrolled||menuOpen?'scrolled':''}`} data-editor-id="site.header">
      <a className="hdr-brand owner-brand" href="#/home" onClick={closeNav} data-editor-id="site.brand"><img className="hdr-brand-mark" src="/brand-emblem.webp" width={43} height={39} alt="" aria-hidden="true"/><span className="brand-wordmark brand-wordmark--on-dark">{records.profile.legalName}</span></a>
      <nav id="main-nav" className={`hdr-nav owner-main-nav ${menuOpen?'open':''}`} data-editor-id="site.navigation" aria-label={t.ui.mainNav}>
        <a href="#/home" onClick={closeNav}>{copy.overview}</a>
        <details className="owner-mega"><summary>{copy.company} <ChevronDown size={14} aria-hidden="true"/></summary><div className="owner-mega-panel">
          <a href="#/about" onClick={closeNav}>{copy.profile}</a><a href="#/about?section=vision-mission" onClick={closeNav}>{t.mission.eyebrow}</a><a href="#/about?section=leadership" onClick={closeNav}>{copy.people}</a><a href="#/responsibility" onClick={closeNav}>{copy.responsibility}</a>
        </div></details>
        <details className="owner-mega"><summary>{copy.work} <ChevronDown size={14} aria-hidden="true"/></summary><div className="owner-mega-panel">
          <a href="#/projects" onClick={closeNav}>{copy.projects}</a><a href="#/minerals" onClick={closeNav}>{copy.minerals}</a><a href="#/operations" onClick={closeNav}>{copy.operations}</a><a href="#/projects?section=services" onClick={closeNav}>{copy.services}</a>
        </div></details>
        <a href="#/operations" onClick={closeNav}>{copy.operations}</a>
        <a href="#/responsibility" onClick={closeNav}>{copy.responsibility}</a>
        <a href="#/gallery" onClick={closeNav}>{copy.gallery}</a>
        <a href="#/contact" onClick={closeNav}>{copy.contact}</a>
        {isPreview&&<a href="#/studio" className="owner-portal-link" onClick={closeNav}>{copy.studio}</a>}
        <LanguageSwitcher />
        <a className="hdr-cta owner-contact-cta" data-editor-id="site.primary-cta" href="#/contact" onClick={closeNav}>{t.nav.cta}<ArrowUpRight size={15} aria-hidden="true"/></a>
      </nav>
      <button type="button" className="hdr-burger owner-burger" aria-expanded={menuOpen} aria-controls="main-nav" aria-label={menuOpen?t.ui.menuClose:t.ui.menuOpen} onClick={()=>setMenuOpen(previous=>!previous)}>{menuOpen?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}</button>
    </header>
    {mediaOpen&&<Suspense fallback={null}><MediaPanel open={mediaOpen} onClose={()=>{setMediaOpen(false);setMediaRequest(null);}} onUploaded={refresh} admin={admin} selectionType={mediaRequest?.mediaType} onSelect={mediaRequest?(asset)=>{
      window.dispatchEvent(new CustomEvent('ggmc-media-selected',{detail:{requestId:mediaRequest.requestId,url:asset.public_url,title:asset.title,mediaType:asset.media_type}}));setMediaOpen(false);setMediaRequest(null);
    }:undefined}/></Suspense>}
    <main id="main">
      {currentPage==='home'?<OwnerHome uploads={uploads}/>:
      currentPage==='operations'?<OwnerTopicPage topic="operations"/>:
      currentPage==='responsibility'?<OwnerTopicPage topic="responsibility"/>:
      currentPage==='studio'?<OwnerStudio uploads={uploads} onOpenMedia={()=>setMediaOpen(true)}/>:
      <CompanyPages page={currentPage} uploads={uploads}/>}
    </main>
    <footer className="footer owner-footer"><div className="footer-grid">
      <div><div className="footer-brand"><img className="footer-brand-mark" src="/brand-emblem.webp" width={30} height={26} alt="" aria-hidden="true"/><span className="brand-wordmark brand-wordmark--on-dark">{records.profile.legalName}</span></div><p className="footer-tag">{t.footer.tagline}</p></div>
      <div className="footer-col"><h3>{t.footer.company}</h3><a href="#/about">{t.footer.about}</a><a href="#/about?section=vision-mission">{t.footer.mission}</a><a href="#/operations">{copy.operations}</a><a href="#/responsibility">{copy.responsibility}</a></div>
      <div className="footer-col"><h3>{t.footer.resources}</h3><a href="#/minerals">{copy.minerals}</a><a href="#/projects">{copy.projects}</a><a href="#/gallery">{copy.gallery}</a></div>
      <div className="footer-col"><h3>{t.footer.connect}</h3><a href={`mailto:${records.profile.email}`}>{t.footer.email}</a><a href="#/contact">{t.footer.partner}</a>{records.profile.linkedin&&<a href={records.profile.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>}</div>
    </div><div className="footer-base"><span>© {new Date().getFullYear()} {records.profile.legalName}</span><span>{records.profile.publicLocation}</span>{isPreview&&<a href="#/studio" className="owner-link">{copy.studio}</a>}</div>
      <section id="privacy" className="privacy"><h3>{t.footer.privacyTitle}</h3><p>{t.footer.privacyText} <a href={`mailto:${records.profile.email}`}>{records.profile.email}</a>.</p></section>
    </footer>
  </div>;
}

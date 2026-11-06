import { ArrowDown, ArrowRight, ArrowUpRight, Compass, Factory, Gem, Leaf, MapPin, Mountain, ShieldCheck } from 'lucide-react';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { ownerCopy } from './ownerCopy';
import type { MediaUpload } from '@/lib/supabase';
import './OwnerHome.css';

type Props = { uploads: MediaUpload[] };

export default function OwnerHome({ uploads }: Props) {
  const records = useCompanyRecords();
  const { t, lang } = useI18n();
  const copy = ownerCopy(lang);
  const publishedMedia = uploads.filter(item => item.is_active && item.media_type === 'image');
  const visibleProjects = records.projects.filter(project => project.findings.length > 0).slice(0, 3);
  const mineralLabels = [t.resources.deposits[0], t.resources.deposits[1], t.resources.deposits[2], t.resources.deposits[3]];
  const mineralIcons = [Gem, Compass, Mountain, Factory];

  return <div className="owner-home">
    <section id="top" className="o-hero" data-editor-id="home.hero">
      <img className="o-hero-image" src={records.profile.heroImage} alt="" fetchPriority="high" width={1280} height={800} />
      <div className="o-hero-wash" aria-hidden="true" />
      <div className="o-hero-main">
        <div className="o-hero-text">
          <p className="o-overline o-overline-gold"><span className="o-rule" /> {t.hero.kicker}</p>
          <h1>{t.hero.h1a}<span>{t.hero.h1b}</span></h1>
          <p className="o-lead">{t.hero.sub}</p>
          <div className="o-hero-actions">
            <a className="o-button o-button-gold" href="#/projects">{copy.explore} <ArrowUpRight size={18} aria-hidden="true" /></a>
            <a className="o-button o-button-ghost" href="#/about">{copy.discover} <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="o-hero-corner" aria-label={copy.current}>
          <div className="o-hero-corner-number">01 <span>/ GGMC</span></div>
          <Gem size={48} strokeWidth={1.1} aria-hidden="true" />
          <p>{copy.quality}</p>
          <span>{copy.location}</span>
        </aside>
      </div>
      <div className="o-hero-rail"><span><MapPin size={15} aria-hidden="true" /> {records.profile.publicLocation}</span><a href="#/home?section=company">{copy.overview} <ArrowDown size={16} aria-hidden="true" /></a><span>{copy.informed}</span></div>
    </section>

    <section id="company" className="o-company" data-editor-id="home.company">
      <div className="o-wrap o-company-layout">
        <div className="o-company-photo"><img src={records.profile.companyImage} alt={t.company.imgAlt} loading="lazy" width={806} height={536} /><div className="o-photo-label"><span>GGMC</span><span>{copy.visual}</span></div></div>
        <div className="o-company-info">
          <span className="o-index">01 / {copy.company}</span>
          <p className="o-eyebrow">{t.company.eyebrow}</p>
          <h2>{t.company.h2a} <em>{t.company.h2b}</em></h2>
          <p className="o-body-lead">{t.company.lead}</p>
          <p>{t.company.p1}</p>
          <a className="o-text-link" href="#/about">{copy.profile} <ArrowUpRight size={18} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="o-wrap o-competencies">
        <div><Compass size={22} aria-hidden="true" /><strong>{copy.companyServices}</strong><small>{copy.point}</small></div>
        <div><ShieldCheck size={22} aria-hidden="true" /><strong>{copy.quality}</strong><small>{copy.current}</small></div>
        <div><Leaf size={22} aria-hidden="true" /><strong>{copy.ethics}</strong><small>{copy.people}</small></div>
      </div>
    </section>

    <section id="resources" className="o-portfolio" data-editor-id="home.resources">
      <div className="o-wrap">
        <div className="o-section-top"><div><span className="o-index">02 / {copy.minerals}</span><h2>{t.resources.h2a}<br/><em>{t.resources.h2b}</em></h2></div><div><p>{t.resources.intro}</p><a className="o-inline-gold" href="#/minerals">{copy.focus} <ArrowUpRight size={16}/></a></div></div>
        <div className="o-mineral-grid">{mineralLabels.map((item, i) => { const Icon=mineralIcons[i];return <a key={item.name} href="#/minerals" className={`o-mineral-card o-mineral-card-${i+1}`}>
          <span className="o-mineral-top">0{i+1} <Icon size={27} strokeWidth={1.25} aria-hidden="true" /></span>
          <div className="o-mineral-symbol"><Icon size={76} strokeWidth={0.6} aria-hidden="true" /></div>
          <span className="o-mineral-tag">{item.tag}</span><h3>{item.name}</h3><p>{item.desc}</p><span className="o-mineral-arrow"><ArrowUpRight size={19} /></span>
        </a>;})}</div>
      </div>
      <div className="o-wrap o-operations-banner"><div><span className="o-index">03 / {copy.operations}</span><h3>{copy.process}</h3><p>{copy.operationsIntro}</p></div><a href="#/operations" className="o-button o-button-gold">{copy.services} <ArrowUpRight size={17}/></a></div>
    </section>

    <section id="projects" className="o-projects" data-editor-id="home.projects">
      <div className="o-wrap">
        <div className="o-section-top o-section-top-ink"><div><span className="o-index">04 / {copy.projects}</span><h2>{t.projects.h2a}<br/><em>{t.projects.h2b}</em></h2></div><p>{t.projects.text}</p></div>
        <div className="o-project-grid">{visibleProjects.map((project,i)=><article className="o-project-card" key={project.id}>
          <div className="o-project-art"><span>0{i+1} / FIELD AREA</span><Mountain size={104} strokeWidth={0.65} aria-hidden="true" /><span>{project.region}</span></div>
          <div className="o-project-info"><p className="o-project-location"><MapPin size={14} aria-hidden="true" /> {project.region}</p><h3>{project.name}</h3><div className="o-project-facts">{project.findings.slice(0,3).map(finding=><span key={`${finding.mineral}-${finding.evidence}`}>{finding.mineral} <small>· {finding.evidence}</small></span>)}</div></div>
        </article>)}</div>
        <div className="o-project-note"><p><ShieldCheck size={18} aria-hidden="true" /> {copy.evidence}</p><a className="o-text-link" href="#/projects">{copy.seeAll} <ArrowUpRight size={17}/></a></div>
      </div>
    </section>

    <section id="gallery" className="o-gallery-feature" data-editor-id="home.gallery">
      <div className="o-gallery-cover"><img src={records.profile.companyImage} alt="" loading="lazy" /><div className="o-gallery-glow" /></div>
      <div className="o-wrap o-gallery-layout"><div className="o-gallery-copy"><span className="o-index">05 / {copy.gallery}</span><h2>{t.gallery.h2a}<br/><em>{t.gallery.h2b}</em></h2><p>{t.gallery.text}</p><a href="#/gallery" className="o-button o-button-gold">{copy.mediaLink} <ArrowUpRight size={17} /></a></div>
      {publishedMedia.length>0 && <div className="o-media-preview">{publishedMedia.slice(0,2).map(item=><img key={item.id} src={item.public_url} alt={item.title} loading="lazy" />)}</div>}</div>
    </section>

    <section id="contact" className="o-contact" data-editor-id="home.contact"><div className="o-wrap o-contact-layout"><div><span className="o-index">06 / {copy.contact}</span><h2>{copy.collaboration}</h2><p>{t.contact.text}</p></div><div className="o-contact-actions"><a className="o-button o-button-dark" href="#/contact">{copy.conversation} <ArrowUpRight size={17}/></a><a className="o-mail-link" href={`mailto:${records.profile.email}`}>{records.profile.email}</a></div></div></section>
  </div>;
}

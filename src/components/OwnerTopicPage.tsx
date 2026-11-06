import { ArrowUpRight, Compass, HardHat, Leaf, ShieldCheck } from 'lucide-react';
import { AboutSection } from '@/components/CompanyContent';
import { useCompanyRecords } from '@/lib/companyRecords';
import { useI18n } from '@/i18n/core';
import { ownerCopy } from './ownerCopy';
import './OwnerTopicPage.css';

type Topic = 'operations' | 'responsibility';
export default function OwnerTopicPage({ topic }: { topic: Topic }) {
  const { t, lang } = useI18n(); const copy = ownerCopy(lang); const { profile } = useCompanyRecords();
  const isOperations = topic === 'operations';
  return <div className="owner-topic" data-editor-id={`page.${topic}`}>
    <section className="ot-hero" data-editor-id={`${topic}.hero`}>
      <img src={profile.companyImage} alt="" loading="eager" />
      <div className="ot-shade" />
      <div className="ot-wrap ot-hero-copy"><span className="ot-overline">{profile.legalName} / {isOperations ? copy.operations : copy.responsibility}</span>
        <h1>{isOperations ? copy.process : copy.ethics}</h1><p>{isOperations ? copy.operationsIntro : copy.responsibilityIntro}</p>
        <div className="ot-hero-links"><a href="#/projects">{copy.projects}<ArrowUpRight size={18}/></a><a href="#/contact">{copy.conversation}<ArrowUpRight size={18}/></a></div>
      </div>
    </section>
    <div className="ot-mission"><div className="ot-wrap"><div><span>01 / {copy.point}</span><h2>{isOperations ? copy.companyServices : copy.quality}</h2></div><p>{isOperations ? t.company.lead : t.mission.text}</p></div></div>
    <div className="owner-topic-content">{isOperations ? <><AboutSection sectionKey="operations"/><AboutSection sectionKey="services"/><AboutSection sectionKey="development"/></> : <><div className="ot-values"><div className="ot-wrap"><div className="ot-values-top"><span>02 / {copy.people}</span><h2>{t.mission.h2a} <em>{t.mission.h2b}</em></h2></div><div className="ot-value-grid">{t.mission.points.map((point,i)=>{const Icon=i===0?ShieldCheck:i===1?Compass:Leaf;return <article key={point.t}><Icon size={26} strokeWidth={1.3}/><span>0{i+1}</span><h3>{point.t}</h3><p>{point.d}</p></article>;})}</div></div></div><AboutSection sectionKey="community" /></>}
    </div>
    <div className="ot-caveat ot-wrap"><HardHat size={20}/><p>{copy.proof} {copy.informed}</p></div>
    <section className="ot-cta"><div className="ot-wrap"><div><span>{copy.contact}</span><h2>{copy.collaboration}</h2></div><a href="#/contact">{copy.conversation} <ArrowUpRight size={18}/></a></div></section>
  </div>;
}

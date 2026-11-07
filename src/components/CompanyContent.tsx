import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/core';
import { companyPageCopy } from '@/i18n/company-pages';
import { localizeAbout } from '@/i18n/about';
import { useCompanyRecords, type AboutSectionKey } from '@/lib/companyRecords';

function Card({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <article className="content-card"><span className="content-label">{label}</span><h3>{title}</h3>{children}</article>;
}

export default function CompanyContent() {
  const { t, lang } = useI18n();
  const cp = companyPageCopy(lang);
  const { profile } = useCompanyRecords();
  return (
    <div className="company-content">
      <section id="company-profile" className="sec">
        <div className="sec-container">
          <div className="content-intro reveal in">
            <p className="body-text">{profile.legalName} {cp.profileIntro} {profile.publicLocation}. {cp.profileEnd}</p>
          </div>
          <div className="content-grid">
            <Card label={cp.approach} title={cp.approachTitle}>
              <p>{cp.approachText}</p>
            </Card>
            <Card label={cp.people} title={cp.peopleTitle}>
              <p>{cp.peopleText}</p>
            </Card>
            <Card label={cp.responsibility} title={cp.responsibilityTitle}>
              <p>{cp.responsibilityText}</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="vision-mission" className="sec sec-dark">
        <div className="sec-container">
          <div className="content-intro reveal in">
            <p className="eyebrow center">{t.mission.eyebrow}</p>
            <h2 className="display light">{cp.visionHeading}<br /><em>{cp.visionEmphasis}</em></h2>
            <p className="body-text">{cp.visionIntro}</p>
          </div>
          <div className="content-two-col">
            <Card label={cp.visionLabel} title={cp.visionTitle}>
              <ul>
                <li>{cp.visionPoint1}</li>
                <li>{cp.visionPoint2}</li>
                <li>{cp.visionPoint3}</li>
              </ul>
            </Card>
            <Card label={cp.missionLabel} title={cp.missionTitle}>
              <ul>
                <li>{cp.missionPoint1}</li>
                <li>{cp.missionPoint2}</li>
                <li>{cp.missionPoint3}</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {(['community', 'history', 'leadership'] as const).map((key) => <AboutSection key={key} sectionKey={key} />)}
    </div>
  );
}

const sectionIds: Record<AboutSectionKey, string> = { operations: 'operations', development: 'development-projects', community: 'rural-development', services: 'services', history: 'history-details', leadership: 'leadership' };
const sectionRoutes: Record<AboutSectionKey, string> = {
  operations: '#/projects?section=operations',
  development: '#/projects?section=development-projects',
  community: '#/about?section=rural-development',
  services: '#/projects?section=services',
  history: '#/about?section=history-details',
  leadership: '#/about?section=leadership',
};
export function AboutSection({ sectionKey }: { sectionKey: AboutSectionKey }) {
  const { about, profile } = useCompanyRecords();
  const { t, lang } = useI18n();
  const cp = companyPageCopy(lang);
  const section = localizeAbout(about, lang)[sectionKey];
  const dark = sectionKey === 'development' || sectionKey === 'history';
  return <section id={sectionIds[sectionKey]} className={`sec${dark ? ' sec-dark' : ''}`}>
    <div className="sec-container">
      <div className="content-intro reveal in">
        <p className="eyebrow center">{section.eyebrow === 'Projects' ? t.nav.projects : section.eyebrow === 'Company' ? t.nav.company : section.eyebrow}</p>
        <h2 className={`display${dark ? ' light' : ''}`}>{section.title}<br /><em>{section.emphasis}</em></h2>
        {section.introduction && <p className="body-text">{section.introduction}</p>}
      </div>
      <div className="content-grid">{section.cards.map((card, index) => <Card key={index} label={card.label} title={card.title}>
        {card.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {card.items.length > 0 && <ul>{card.items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
        {card.link && <a className="link-go" href={sectionRoutes[card.link.target]}>{card.link.label} <ArrowRight size={15} /></a>}
      </Card>)}{sectionKey === 'leadership' && <Card label={cp.headOffice} title={profile.publicLocation}><p>{profile.officeAddress}</p></Card>}</div>
      {section.note && <div className="content-note">{section.note}</div>}
    </div>
  </section>;
}

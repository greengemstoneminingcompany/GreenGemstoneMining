import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/core';
import { ABOUT_SECTION_KEYS, useCompanyRecords, type AboutSectionKey } from '@/lib/companyRecords';

function Card({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <article className="content-card"><span className="content-label">{label}</span><h3>{title}</h3>{children}</article>;
}

export default function CompanyContent() {
  const { t } = useI18n();
  const { mineralInterests, gemstoneInterests, profile } = useCompanyRecords();
  return (
    <div className="company-content">
      <section id="company-profile" className="sec">
        <div className="sec-container">
          <div className="content-intro reveal in">
            <p className="eyebrow center">{t.company.eyebrow}</p>
            <h2 className="display">{t.company.h2a}<br /><em>{t.company.h2b}</em></h2>
            <p className="body-text">{profile.legalName} is a local mining and development company based in {profile.publicLocation}. Its stated interests span gemstones, metals and industrial minerals. Mineral evidence and project stages vary, and no resource or reserve estimates are presented in this profile.</p>
          </div>
          <div className="content-grid">
            <Card label="Our approach" title="A diversified strategy">
              <p>The company strategy spans precious and non-precious metals, precious and non-precious gemstones, and mineral concentrates, with development opportunities across Somaliland.</p>
            </Card>
            <Card label="Our people" title="Rooted in Somaliland">
              <p>Company materials describe a diverse local workforce drawn from regions across Somaliland, with a commitment to safe and sustainable practices that create value for employees, customers, shareholders and local communities.</p>
            </Card>
            <Card label="Our responsibility" title="Safety comes first">
              <p>The company states that social and environmental responsibility, industry best practice, and the safety and well-being of its people are central to its operations.</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="vision-mission" className="sec sec-dark">
        <div className="sec-container">
          <div className="content-intro reveal in">
            <p className="eyebrow center">{t.mission.eyebrow}</p>
            <h2 className="display light">Build opportunity.<br /><em>Grow local value.</em></h2>
            <p className="body-text">The company aims to help establish Somaliland as a stronger participant in international gemstone and industrial-mineral markets while expanding local employment and processing capability.</p>
          </div>
          <div className="content-two-col">
            <Card label="Vision" title="Processing and export">
              <ul>
                <li>Evaluate responsible local processing and export opportunities for mineral products, subject to technical, legal and commercial review.</li>
                <li>Create local employment by working with miners and deposit holders, buying suitable mineral output, and developing processing capability.</li>
                <li>Grow the workforce over time; company materials set an ambition of 1,000 employees within five years, subject to growth and financing.</li>
              </ul>
            </Card>
            <Card label="Mission" title="From local connections to global markets">
              <ul>
                <li>Expand the team across Somaliland and build relationships with miners and holders of relevant mineral deposits.</li>
                <li>Assess responsible gemstone, metal and industrial-mineral opportunities as project evidence develops.</li>
                <li>Explore ways to increase local participation in regional and international mineral markets.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section id="industrial-metals" className="sec">
        <div className="sec-container">
          <div className="content-intro reveal in">
            <p className="eyebrow center">{t.nav.portfolio}</p>
            <h2 className="display">Metals and mineral<br /><em>interests.</em></h2>
            <p className="body-text">These are mineral interests identified as areas of company interest. The list reflects company-stated interests. It does not represent independently verified reserves or confirm that every material is currently being mined.</p>
          </div>
          <div className="content-pill-list">{mineralInterests.map((name) => <span className="content-pill" key={name}>{name}</span>)}</div>
          <div className="content-note">Resource descriptions and geological occurrences should be assessed against project-specific technical information. The presence of a mineral in this catalogue is not a reserve estimate or a guarantee of commercial viability.</div>
        </div>
      </section>

      <section id="gemstones" className="sec sec-dark">
        <div className="sec-container">
          <div className="content-intro reveal in">
            <p className="eyebrow center">{t.catalogue.cats.Gemstone}</p>
            <h2 className="display light">A broad gemstone<br /><em>portfolio.</em></h2>
            <p className="body-text">The company's gemstone interests include the following types.</p>
          </div>
          <div className="content-grid">
            {gemstoneInterests.map((name, i) => <article className="content-card gemstone-card" key={name}><span className="content-label">Gemstone {String(i + 1).padStart(2, '0')}</span><h3>{name}</h3><p>Listed in the company's source material as a gemstone of interest.</p></article>)}
          </div>
        </div>
      </section>

      {ABOUT_SECTION_KEYS.map((key) => <AboutSection key={key} sectionKey={key} />)}
    </div>
  );
}

const sectionIds: Record<AboutSectionKey, string> = { operations: 'operations', development: 'development-projects', community: 'rural-development', services: 'services', history: 'history-details', leadership: 'leadership' };
function AboutSection({ sectionKey }: { sectionKey: AboutSectionKey }) {
  const { about, profile } = useCompanyRecords();
  const { t } = useI18n();
  const section = about[sectionKey];
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
        {card.link && <a className="link-go" href={`#/about?section=${sectionIds[card.link.target]}`}>{card.link.label} <ArrowRight size={15} /></a>}
      </Card>)}{sectionKey === 'leadership' && <Card label="Head office" title={profile.publicLocation}><p>{profile.officeAddress}</p></Card>}</div>
      {section.note && <div className="content-note">{section.note}</div>}
    </div>
  </section>;
}

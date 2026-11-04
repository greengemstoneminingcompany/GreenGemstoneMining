import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/i18n/core';

const translations = {
  en: { eyebrow: 'Your entry point', heading: 'Choose your path', intro: 'Different questions call for different evidence.', cta: 'Start a conversation', paths: [['Invest', 'Funding, joint ventures and project information.'], ['Buy', 'Gemstone and mineral offtake conversations.'], ['Partner technically', 'Geology, processing and operating partnerships.'], ['Community & government', 'Local context and supporting information.']] },
  zh: { eyebrow: '合作入口', heading: '选择合作方向', intro: '不同的问题需要不同的证据。', cta: '开始交流', paths: [['投资', '融资、合资和项目信息。'], ['采购', '宝石与矿产承购合作。'], ['技术合作', '地质、加工与运营合作。'], ['社区与政府', '当地情况和支持材料。']] },
  so: { eyebrow: 'Meesha aad ka bilaabayso', heading: 'Dooro waddadaada', intro: 'Su’aalo kala duwan waxay u baahan yihiin caddaymo kala duwan.', cta: 'Bilow wadahadal', paths: [['Maalgashi', 'Maalgelin, iskaashi iyo xogta mashaariicda.'], ['Iibsi', 'Wadahadalka iibka dhagaxyada iyo macdanta.'], ['Iskaashi farsamo', 'Iskaashi juqraafi, farsamayn iyo hawlgal.'], ['Bulshada iyo dawladda', 'Xogta deegaanka iyo dukumentiyada taageerada.']] },
  ar: { eyebrow: 'نقطة البداية', heading: 'اختر مسارك', intro: 'تحتاج الأسئلة المختلفة إلى أدلة مختلفة.', cta: 'ابدأ محادثة', paths: [['الاستثمار', 'التمويل والمشاريع المشتركة ومعلومات المشروعات.'], ['الشراء', 'مناقشات شراء الأحجار الكريمة والمعادن.'], ['الشراكة التقنية', 'شراكات الجيولوجيا والمعالجة والتشغيل.'], ['المجتمع والحكومة', 'السياق المحلي والمعلومات الداعمة.']] },
} as const;

export default function PartnershipPaths() {
  const { lang } = useI18n();
  const t = translations[lang];
  return <section className="sec atlas-paths" data-editor-id="home.partnership-paths">
    <div className="sec-container">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2 className="display">{t.heading}</h2>
      <p className="body-text">{t.intro}</p>
      <div className="atlas-path-grid">
        {t.paths.map(([title, description], index) => <a key={index} href="#/contact" className="atlas-path">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <h3>{title}</h3>
          <p>{description}</p>
          <span className="atlas-path-link">{t.cta} <ArrowUpRight size={16} aria-hidden="true" /></span>
        </a>)}
      </div>
    </div>
  </section>;
}

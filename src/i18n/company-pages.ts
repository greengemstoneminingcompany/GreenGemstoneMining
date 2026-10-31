/** Company subpage copy; English is the reference language. */
import type { Lang } from './core';

const copy = {
  "en": {
    "map": "The map is regional context, not evidence that each location is licensed or operating.",
    "development": "Development",
    "opportunities": "Mining opportunities",
    "opportunitiesDesc": "Company materials describe opportunities at different evaluation stages. Review each project's technical reports and licences.",
    "partnerships": "Partnerships",
    "partners": "Investment and technical partners",
    "partnersDesc": "We welcome qualified investment, operating, technical and offtake partners.",
    "communities": "Communities",
    "participation": "Local participation",
    "participationDesc": "Our stated approach includes local employment, regional relationships and community support.",
    "directory": "Company-stated interests, not independently verified resources, reserves, production or commercial viability.",
    "dueDiligence": "Independently review geological evidence, sampling, testing, permits and technical reports before investing.",
    "contactNote": "Please include your enquiry subject and relevant project context.",
    "cta": "Have a project or partnership in mind?"
  },
  "so": {
    "map": "Khariidaddu waa guudmar goboleed, mana caddaynayso in goob kastaa ruqsad leedahay ama shaqaynayso.",
    "development": "Horumarin",
    "opportunities": "Fursadaha macdanta",
    "opportunitiesDesc": "Xogta shirkaddu waxay tilmaamaysaa fursado heerar kala duwan maraya. Hubi warbixinnada farsamo iyo ruqsadaha mashruuc kasta.",
    "partnerships": "Iskaashi",
    "partners": "Maalgashadayaal iyo khubaro",
    "partnersDesc": "Waxaan soo dhoweynaynaa maalgelin, hawlgal, iskaashi farsamo iyo iibsiga macdanta.",
    "communities": "Bulshooyinka",
    "participation": "Ka-qaybgalka maxalliga ah",
    "participationDesc": "Habkayaga la sheegay wuxuu ku jiraa shaqo-abuur maxalli ah, xiriir goboleed iyo taageero bulsho.",
    "directory": "Kuwani waa danaha ay shirkaddu sheegtay; ma xaqiijinayaan kayd macdaneed, wax-soo-saar ama faa'iido ganacsi.",
    "dueDiligence": "Ka hor maalgelin, si madax-bannaan u hubi caddaynta joolajiyada, muunadaha, tijaabooyinka, ruqsadaha iyo warbixinnada farsamo.",
    "contactNote": "Fadlan sheeg mawduuca codsigaaga iyo xogta mashruuca ee khusaysa.",
    "cta": "Ma haysaa mashruuc ama fikrad iskaashi?"
  },
  "ar": {
    "map": "الخريطة توضح السياق الإقليمي ولا تثبت أن كل موقع مرخص أو قيد التشغيل.",
    "development": "التطوير",
    "opportunities": "فرص التعدين",
    "opportunitiesDesc": "تصف مواد الشركة فرصًا في مراحل تقييم مختلفة. تحقق من التقارير الفنية والتراخيص الخاصة بكل مشروع.",
    "partnerships": "الشراكات",
    "partners": "شركاء الاستثمار والتقنية",
    "partnersDesc": "نرحب بالشركاء المؤهلين في الاستثمار والتشغيل والخدمات الفنية وشراء الإنتاج.",
    "communities": "المجتمعات",
    "participation": "المشاركة المحلية",
    "participationDesc": "يشمل نهجنا المعلن التوظيف المحلي والعلاقات الإقليمية ودعم المجتمعات.",
    "directory": "هذه اهتمامات أعلنتها الشركة، وليست موارد أو احتياطيات أو إنتاجًا أو جدوى تجارية مؤكدة.",
    "dueDiligence": "قبل الاستثمار، تحقق بصورة مستقلة من الأدلة الجيولوجية والعينات والاختبارات والتراخيص والتقارير الفنية.",
    "contactNote": "يرجى توضيح موضوع استفسارك ومعلومات المشروع ذات الصلة.",
    "cta": "هل لديك مشروع أو فكرة شراكة؟"
  },
  "zh": {
    "map": "地图仅提供区域背景，不证明各地点均有采矿许可或正在运营。",
    "development": "开发",
    "opportunities": "矿业机会",
    "opportunitiesDesc": "公司资料描述了不同评估阶段的机会。请逐项核查技术报告与许可证。",
    "partnerships": "合作",
    "partners": "投资与技术伙伴",
    "partnersDesc": "欢迎符合条件的投资、运营、技术及包销合作伙伴洽谈。",
    "communities": "社区",
    "participation": "本地参与",
    "participationDesc": "我们所述的方向包括本地就业、区域合作与社区支持。",
    "directory": "以下仅为公司声明的关注领域，不构成经独立核实的资源量、储量、产量或商业可行性。",
    "dueDiligence": "投资前应独立核查地质证据、取样、测试、许可及技术报告。",
    "contactNote": "请说明咨询主题及相关项目背景。",
    "cta": "有项目或合作构想吗？"
  }
} as const;
export const companyPageCopy = (lang: Lang) => copy[lang];

import { useMemo, useState } from 'react';
import type { Evidence, ProjectArea } from '@/data/company';
import { useI18n } from '@/i18n/core';

const statuses: Evidence[] = ['observed', 'reported', 'unverified', 'inferred', 'confirmed'];
const words = {
  en: { heading: 'Field evidence register', intro: 'Company field records, not mineral resource estimates or proof of a licence.', all: 'All', evidence: 'Evidence', region: 'Region', coordinates: 'Coordinates', findings: 'Recorded findings', none: 'No recorded findings', close: 'Close dossier', open: 'Open dossier', source: 'Company field records' },
  zh: { heading: '实地证据记录', intro: '公司实地记录，不构成矿产资源量估算或采矿许可证证明。', all: '全部', evidence: '证据', region: '地区', coordinates: '坐标', findings: '记录的发现', none: '暂无记录', close: '关闭档案', open: '打开档案', source: '公司实地记录' },
  so: { heading: 'Diiwaanka caddaynta goobta', intro: 'Diiwaannada shirkadda; ma aha qiyaas khayraad macdan ama caddeyn ruqsad.', all: 'Dhammaan', evidence: 'Caddayn', region: 'Gobol', coordinates: 'Isku-duwaha', findings: 'Waxyaabaha la diiwaangeliyay', none: 'Wax la diiwaangeliyay ma jiro', close: 'Xir galka', open: 'Fur galka', source: 'Diiwaannada shirkadda' },
  ar: { heading: 'سجل الأدلة الميدانية', intro: 'سجلات ميدانية للشركة وليست تقديرات للموارد المعدنية أو إثباتاً للترخيص.', all: 'الكل', evidence: 'الدليل', region: 'المنطقة', coordinates: 'الإحداثيات', findings: 'النتائج المسجلة', none: 'لا توجد نتائج مسجلة', close: 'إغلاق الملف', open: 'فتح الملف', source: 'سجلات الشركة الميدانية' },
} as const;
export default function EvidenceRegister({ projects }: { projects: readonly ProjectArea[] }) {
  const { lang } = useI18n();
  const t = words[lang];
  const [filter, setFilter] = useState<Evidence | 'all'>('all');
  const [selected, setSelected] = useState<ProjectArea | null>(null);
  const visible = useMemo(() => projects.filter((p) => filter === 'all' || p.findings.some((f) => f.evidence === filter)), [projects, filter]);
  return <section className="sec atlas-evidence" data-editor-id="home.evidence">
    <div className="sec-container">
      <p className="eyebrow">{t.source}</p>
      <h2 className="display">{t.heading}</h2>
      <p className="body-text">{t.intro}</p>
      <div className="atlas-evidence-filters" role="group" aria-label={t.evidence}>
        {(['all', ...statuses] as const).map((value) =>
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? t.all : value}</button>)}
      </div>
      <div className="atlas-evidence-grid">
        {visible.map((p) => <article className="atlas-evidence-card" key={p.id}>
          <span>{p.region} · {p.findings.length ? Array.from(new Set(p.findings.map((f) => f.evidence))).join(' / ') : t.none}</span>
          <h3>{p.name}</h3>
          <button type="button" onClick={() => setSelected(p)}>{t.open}</button>
        </article>)}
      </div>
      {selected && <div className="atlas-dossier-backdrop" role="presentation" onClick={() => setSelected(null)}>
        <aside className="atlas-dossier" role="dialog" aria-modal="true" aria-label={selected.name} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === 'Escape') setSelected(null); }}>
          <button type="button" onClick={() => setSelected(null)} autoFocus>{t.close}</button>
          <h2>{selected.name}</h2>
          <p>{t.region}: {selected.region}</p>
          <p>{t.coordinates}: {selected.lat == null || selected.lon == null ? '—' : `${selected.lat.toFixed(3)}°N, ${selected.lon.toFixed(3)}°E`}</p>
          <h3>{t.findings}</h3>
          {selected.findings.length ? <ul>{selected.findings.map((f, index) => <li key={index}>{f.mineral} — {f.evidence}</li>)}</ul> : <p>{t.none}</p>}
          <p><small>{t.intro}</small></p>
        </aside>
      </div>}
    </div>
  </section>;
}

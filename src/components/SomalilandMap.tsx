import { useSurveyExplorer, type MapViewport } from '@/features/research/survey';
import { SurveyLayer, SurveyControls } from '@/features/research/SurveyExplorer';
import { researchCopy } from '@/features/research/copy';
import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { MAP_CORRIDOR, MAP_GEOLOGY, MAP_OUTLINE, MAP_PLACES, MAP_REGIONS, MAP_VIEWBOX } from '@/data/mapData';
import { EVIDENCE, OCCURRENCES, SOURCES } from '@/data/geology';
import { KM100, project, unproject } from '@/data/geoProject';
import { REGIONS } from '@/data/site';
import { PROJECTS, type ProjectArea } from '@/data/company';
import { LOCALITIES, MINERAL_COUNT, MINERAL_GROUP, mineralsInRegion, recordsFor } from '@/data/minerals';
import { FINDER, mineralName } from '@/data/mineralText';
import { useI18n } from '@/i18n/core';

type Layer = 'regions' | 'geology';
type Zone = 'guban' | 'basement' | 'mesozoic' | 'haud';
const ZONES: Zone[] = ['guban', 'basement', 'mesozoic', 'haud'];
const GROUPS = ['gems', 'metals', 'industrial', 'energy'] as const;

const W = MAP_VIEWBOX.w;
const H = MAP_VIEWBOX.h;
const CX = W / 2;
const CY = H / 2;
const goContact = () => { window.location.hash = '/contact'; };

/** Standard geological-map fill patterns, also used by the legend swatches. */
const PATTERN: Record<Zone, string> = { guban: 'gm-stipple', basement: 'gm-cross', mesozoic: 'gm-brick', haud: 'gm-lines' };

const fmt = (lon: number, lat: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

/** A fading wedge that sweeps around the country like a radar. */
const SWEEP = Array.from({ length: 10 }, (_, i) => {
  const a0 = (-i * 4 * Math.PI) / 180;
  const a1 = (-(i + 1) * 4 * Math.PI) / 180;
  const r = 760;
  return {
    d: `M${CX} ${CY}L${CX + r * Math.cos(a0)} ${CY + r * Math.sin(a0)}A${r} ${r} 0 0 0 ${CX + r * Math.cos(a1)} ${CY + r * Math.sin(a1)}Z`,
    o: 0.2 * (1 - i / 10),
  };
});

/** Region borders are approximate and the geology layer is generalised, so the map says so in its note. */
export default function SomalilandMap({ projects = PROJECTS }: { projects?: ProjectArea[] }) {
  const { t, lang } = useI18n();
  const F = FINDER[lang];
  const p = t.projects;
  const survey = useSurveyExplorer();
  const research = researchCopy(lang);
  const [viewport, setViewport] = useState<MapViewport>({ x: 0, y: 0, w: W, h: H });
  const zoom = (factor: number) => setViewport(v => { const w = Math.max(8, Math.min(W, v.w * factor)); const h = Math.max(8, Math.min(H, v.h * factor)); return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h }; });
  const [layer, setLayer] = useState<Layer>('regions');
  const [selected, setSelected] = useState<string>('awdal');
  const [occ, setOcc] = useState<string | null>('borama');
  const [showProjects, setShowProjects] = useState(false);
  const [mineral, setMineral] = useState<string | null>(null);
  const [loc, setLoc] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);
  const active = p.regions[selected];

  const markers = useMemo(() => OCCURRENCES.map((o) => ({ ...o, pos: project(o.lon, o.lat) })), []);
  const pins = useMemo(() => LOCALITIES.filter((l) => l.precision === 'point' && !l.outside && l.region).map((l) => ({ ...l, pos: project(l.lon!, l.lat!) })), []);
  const results = useMemo(() => (mineral ? recordsFor(mineral) : []), [mineral]);
  const hitRegions = useMemo(() => new Set(results.map((r) => r.region)), [results]);
  const activeLoc = pins.find((l) => l.id === loc);
  const pickMineral = (m: string | null) => {
    setMineral(m);
    setLoc(null);
  };
  const regionMinerals = useMemo(() => mineralsInRegion(selected), [selected]);
  const regionMarkers = markers.filter((m) => m.region === selected);

  const selectRegion = (id: string) => {
    setSelected(id);
    setOcc(OCCURRENCES.find((o) => o.region === id)?.id ?? null);
  };
  const selectMarker = (id: string, region: string) => {
    setSelected(region);
    setOcc(id);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(ctm.inverse());
    const { lon, lat } = unproject(x, y);
    setCursor(x < 0 || y < 0 || x > W || y > H ? '' : fmt(lon, lat));
  };

  const lonLines = [43, 44, 45, 46, 47, 48, 49];
  const latLines = [8, 9, 10, 11];
  const activeMarker = markers.find((m) => m.id === occ);

  return (
    <div className={`geomap ${mineral ? 'is-finding' : ''}`}>
      <div className="geomap-main">
      <div className="geomap-map-column">
      <div className="geomap-stage">
        <div className="geomap-toolbar">
          <span className="geomap-title"><i className="blink" />{p.mapTitle}</span>
          <div className="geomap-toggle" role="group" aria-label={p.layersLabel}>
            {(['regions', 'geology'] as Layer[]).map((l) => (
              <button key={l} type="button" aria-pressed={layer === l} onClick={() => setLayer(l)}>
                {l === 'regions' ? p.layerRegions : p.layerGeology}
              </button>
            ))}
          </div>
          <button type="button" className="geomap-projects" aria-pressed={survey.enabled} onClick={() => survey.setEnabled(value => !value)}>{research.field}</button>
          <button type="button" className="geomap-projects" aria-pressed={showProjects} onClick={() => setShowProjects((v) => !v)}>{F.projects}</button>
        </div>

        <div className="geomap-frame">
          <div className="map-zoom-controls"><button type="button" aria-label={research.zoomIn} onClick={() => zoom(0.5)}>+</button><button type="button" aria-label={research.zoomOut} onClick={() => zoom(2)}>−</button><button type="button" onClick={() => setViewport({ x: 0, y: 0, w: W, h: H })}>{research.reset}</button></div>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <svg
            ref={svgRef}
            className="geomap-svg"
            viewBox={`${viewport.x} ${viewport.y} ${viewport.w} ${viewport.h}`}
            role="group"
            aria-label={p.mapLabel}
            onPointerMove={onMove}
            onPointerLeave={() => setCursor('')}
          >
            <defs>
              <clipPath id="gm-clip"><path d={MAP_OUTLINE} /></clipPath>
              <filter id="gm-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="gm-scan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#62f5d6" stopOpacity="0" />
                <stop offset="0.85" stopColor="#62f5d6" stopOpacity="0.35" />
                <stop offset="1" stopColor="#c9fff3" stopOpacity="0.9" />
              </linearGradient>
              {/* geological-map conventions: stipple = young sediment, crosses = crystalline basement, brick = limestone, lines = plateau */}
              <pattern id="gm-stipple" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,.5)" /><circle cx="7" cy="5" r="1" fill="rgba(255,255,255,.5)" /><circle cx="4" cy="8.5" r="1" fill="rgba(255,255,255,.5)" />
              </pattern>
              <pattern id="gm-cross" width="9" height="9" patternUnits="userSpaceOnUse">
                <path d="M4.5 1.5v6M1.5 4.5h6" stroke="rgba(255,255,255,.55)" strokeWidth="1" />
              </pattern>
              <pattern id="gm-brick" width="14" height="9" patternUnits="userSpaceOnUse">
                <path d="M0 4.5h14M3.5 0v4.5M10.5 4.5v4.5" stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="none" />
              </pattern>
              <pattern id="gm-lines" width="8" height="6" patternUnits="userSpaceOnUse">
                <path d="M0 3h8" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
              </pattern>
              <pattern id="gm-hex" width="26" height="22.5" patternUnits="userSpaceOnUse">
                <path d="M13 0l13 7.5v7.5L13 22.5 0 15V7.5z" fill="none" stroke="rgba(98,245,214,.1)" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* graticule and coordinate ticks */}
            <g className="geomap-grid" aria-hidden="true">
              {lonLines.map((lo) => {
                const [x] = project(lo, 9);
                return (
                  <g key={lo}>
                    <line x1={x} y1="0" x2={x} y2={H} />
                    <text x={x + 4} y={H - 6}>{lo}°E</text>
                  </g>
                );
              })}
              {latLines.map((la) => {
                const [, y] = project(44, la);
                return (
                  <g key={la}>
                    <line x1="0" y1={y} x2={W} y2={y} />
                    <text x="6" y={y - 4}>{la}°N</text>
                  </g>
                );
              })}
            </g>

            <text className="geomap-sea" x="470" y="78" transform="rotate(-5 470 78)">{p.seaLabel}</text>
            <path d={MAP_OUTLINE} className="geomap-shadow" />

            <g clipPath="url(#gm-clip)">
              <rect width={W} height={H} className="geomap-base" />
              {/* Regions layer */}
              <g className={`geomap-layer ${layer === 'regions' ? 'on' : ''}`}>
                {REGIONS.map((r, i) => (
                  <path key={r.id} d={MAP_REGIONS[r.key].d} className={`gm-fill gm-${r.id}`} style={{ animationDelay: `${i * 90}ms` }} />
                ))}
              </g>
              {/* Geology layer */}
              <g className={`geomap-layer ${layer === 'geology' ? 'on' : ''}`}>
                <path d={MAP_OUTLINE} className="gz gz-haud" />
                <path d={MAP_OUTLINE} fill={`url(#${PATTERN.haud})`} />
                {ZONES.map((z) => (
                  <g key={z}>
                    <path d={MAP_GEOLOGY[z]} className={`gz gz-${z}`} />
                    <path d={MAP_GEOLOGY[z]} fill={`url(#${PATTERN[z]})`} />
                  </g>
                ))}
              </g>
              {/* terrain texture, contour rings and scanning effects */}
              <rect width={W} height={H} fill="url(#gm-hex)" className="geomap-hex" />
              <g className="geomap-contours" fill="none">
                <path d={MAP_OUTLINE} strokeWidth="64" /><path d={MAP_OUTLINE} strokeWidth="44" />
                <path d={MAP_OUTLINE} strokeWidth="26" /><path d={MAP_OUTLINE} strokeWidth="11" />
              </g>
              <g className="geomap-sweep">{SWEEP.map((s, i) => <path key={i} d={s.d} fill="#62f5d6" fillOpacity={s.o} />)}</g>
              <rect className="geomap-scan" width={W} height="90" fill="url(#gm-scan)" />
            </g>

            {/* interactive region shapes */}
            {REGIONS.map((r) => {
              const on = selected === r.id;
              return (
                <g
                  key={r.id}
                  className={`gm-region ${on ? 'is-selected' : ''} ${hovered === r.id ? 'is-hover' : ''} ${mineral && hitRegions.has(r.id) ? 'has-mineral' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={p.regions[r.id].name}
                  onClick={() => selectRegion(r.id)}
                  onMouseEnter={() => setHovered(r.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(r.id)}
                  onBlur={() => setHovered(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectRegion(r.id);
                    }
                  }}
                >
                  <path d={MAP_REGIONS[r.key].d} className="gm-hit" filter={on ? 'url(#gm-glow)' : undefined} />
                </g>
              );
            })}

            <path d={MAP_OUTLINE} className="geomap-outline" />
            <path d={MAP_CORRIDOR} className="geomap-corridor"><title>{p.corridor}</title></path>

            {REGIONS.map((r) => (
              <text
                key={r.id}
                x={MAP_REGIONS[r.key].cx + (r.dx ?? 0)}
                y={MAP_REGIONS[r.key].cy + (r.dy ?? 0)}
                textAnchor="middle"
                className={`geomap-name ${selected === r.id ? 'on' : ''}`}
              >
                {p.regions[r.id].name}
              </text>
            ))}

            {/* towns */}
            {MAP_PLACES.map((pl) => (
              <g key={pl.name} className={`gm-place gm-${pl.kind} pl-${pl.name}`} transform={`translate(${pl.x} ${pl.y})`}>
                {pl.kind === 'capital' ? <path d="M0 -7 L2.2 -2.2 L7 0 L2.2 2.2 L0 7 L-2.2 2.2 L-7 0 L-2.2 -2.2Z" className="dot" /> : <circle r={pl.kind === 'port' ? 4.5 : 3} className="dot" />}
                <text x="9" y="4" className="place-label">{p.places[pl.name] ?? pl.name}</text>
              </g>
            ))}

            {showProjects && (
              <g className="gm-projects">
                {projects.filter((pr) => typeof pr.lon === 'number' && typeof pr.lat === 'number' && Number.isFinite(pr.lon) && Number.isFinite(pr.lat)).map((pr) => {
                  const [x, y] = project(pr.lon!, pr.lat!);
                  return (
                    <g key={pr.id} transform={`translate(${x} ${y})`}>
                      <path d="M0 -9L8 0L0 9L-8 0Z" className={`proj-mark ${pr.port ? 'is-port' : ''}`} />
                      {(pr.priority === 1 || pr.port || pr.id === 'darimile') && <text x="11" y="4" className="proj-label">{pr.name}</text>}
                      <title>{pr.name}{pr.priority ? ` · ${F.priority(pr.priority)}` : ''}{pr.port ? ` · ${F.port}` : ''}</title>
                    </g>
                  );
                })}
              </g>
            )}

            {/* every USGS-recorded site, bright when it holds the chosen mineral */}
            <g className="gm-pins">
              {pins.map((l) => {
                const hit = !!mineral && l.minerals.includes(mineral);
                return (
                  <g key={l.id} className={`gm-pin ${hit ? `hit kind-${MINERAL_GROUP[mineral!] === 'gems' ? 'gem' : MINERAL_GROUP[mineral!] === 'metals' ? 'metal' : MINERAL_GROUP[mineral!] === 'energy' ? 'energy' : 'industrial'}` : ''} ${loc === l.id ? 'is-on' : ''}`} transform={`translate(${l.pos[0]} ${l.pos[1]})`} onClick={() => { setLoc(l.id); setSelected(l.region!); }}>
                    <circle r="9" className="pin-hit" />
                    {hit && <circle r="8" className="pin-ring" />}
                    <circle r={hit ? 4.2 : 2.2} className="pin-core" />
                    <title>{l.name}</title>
                  </g>
                );
              })}
            </g>

            {/* recorded mineral occurrences */}
            {markers.map((m, i) => {
              const on = occ === m.id;
              const o = p.occurrences[m.id];
              return (
                <g
                  key={m.id}
                  className={`gm-occ kind-${m.kind} ${on ? 'is-on' : ''} ${m.region === selected ? 'in-region' : ''}`}
                  transform={`translate(${m.pos[0]} ${m.pos[1]})`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${o.name} (${p.kinds[m.kind]})`}
                  style={{ animationDelay: `${600 + i * 110}ms` }}
                  onClick={() => selectMarker(m.id, m.region)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectMarker(m.id, m.region);
                    }
                  }}
                >
                  <circle r="16" className="occ-hit" />
                  <circle r="9" className="occ-ring" />
                  <circle r="9" className="occ-ring r2" />
                  <circle r="4.6" className="occ-core" />
                  <title>{o.name}</title>
                </g>
              );
            })}

            {activeLoc && (
              <g className="gm-callout" transform={`translate(${activeLoc.pos[0]} ${activeLoc.pos[1]})`} pointerEvents="none">
                <path d="M0 -8L0 -30" className="callout-line" />
                <text y="-36" textAnchor="middle" className="callout-text">{activeLoc.name}</text>
              </g>
            )}
            {!activeLoc && activeMarker && (
              <g className="gm-callout" transform={`translate(${activeMarker.pos[0]} ${activeMarker.pos[1]})`} pointerEvents="none">
                <path d="M0 -12L0 -34" className="callout-line" />
                <text y="-40" textAnchor="middle" className="callout-text">{p.occurrences[activeMarker.id].name}</text>
              </g>
            )}

            <SurveyLayer explorer={survey} viewport={viewport} focus={setViewport} />
            {/* scale bar and north arrow */}
            <g className="geomap-scale" transform={`translate(${W - KM100 - 30} ${H - 26})`} aria-hidden="true">
              <path d={`M0 0V6H${KM100}V0`} />
              <text x={KM100 / 2} y="-5" textAnchor="middle">{p.scale}</text>
            </g>
            <g className="geomap-north" transform={`translate(44 ${H - 70})`} aria-hidden="true">
              <path d="M0 -22L7 6L0 1L-7 6Z" /><text y="22" textAnchor="middle">N</text>
            </g>
          </svg>
          <div className="geomap-readout" aria-hidden="true">{p.coords}: {cursor || '—'}</div>
        </div>

        <div className="geomap-legend" aria-live="polite">
          {layer === 'geology'
            ? ZONES.map((z) => (
                <span key={z} className="lg-item" title={p.zones[z].desc}>
                  <svg className="sw-svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <rect width="18" height="18" rx="4" className={`gz gz-${z}`} />
                    <rect width="18" height="18" rx="4" fill={`url(#${PATTERN[z]})`} />
                  </svg>
                  {p.zones[z].name}
                </span>
              ))
            : REGIONS.map((r) => (
                <span key={r.id} className="lg-item">
                  <i className={`sw gm-${r.id}`} />{p.regions[r.id].name}
                </span>
              ))}
          {(['gem', 'metal', 'industrial', 'energy'] as const).map((k) => (
            <span key={k} className="lg-item"><i className={`sw-occ kind-${k}`} />{p.kinds[k]}</span>
          ))}
        </div>
      </div>

      <section className="geomap-finder" aria-label={F.title}>
        <div className="finder-head">
          <h4>{F.title}</h4>
          <p>{F.hint}</p>
          {mineral && <button type="button" className="finder-clear" onClick={() => pickMineral(null)}>{F.clear}</button>}
        </div>
        <div className="finder-groups">
          {GROUPS.map((g) => (
            <div key={g} className="mg">
              <span className="mg-label">{p.groups[g]}</span>
              <span className="chips">
                {Object.keys(MINERAL_GROUP).filter((m) => MINERAL_GROUP[m] === g && MINERAL_COUNT[m]).map((m) => (
                  <button key={m} type="button" className={`chip chip-${g} chip-btn`} aria-pressed={mineral === m} onClick={() => pickMineral(mineral === m ? null : m)}>
                    {mineralName(m, lang)} <small>{MINERAL_COUNT[m]}</small>
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
        {mineral && (
          <div className="finder-results" aria-live="polite">
            <h5>{mineralName(mineral, lang)} · {F.records(results.length)}</h5>
            <ul>
              {results.map((l) => (
                <li key={l.id} className={`fr fr-${l.precision}`}>
                  <button type="button" disabled={!(l.precision === 'point' && !l.outside && l.region)} aria-pressed={loc === l.id} onClick={() => { setLoc(l.id); setSelected(l.region!); }}>
                    <strong>{l.name ?? (l.region ? p.regions[l.region].name : F.reported)}{l.name && l.region ? ` · ${p.regions[l.region].name}` : ''}</strong>
                    <span className="fr-meta">
                      {l.precision === 'point' ? `${fmt(l.lon!, l.lat!)} · ${F.point}` : l.precision === 'district' ? F.district : F.reported}
                      {l.outside && ` · ${F.outside}`}
                      {l.basis && ` · ${F.basis[l.basis]}`}
                      {l.company && ` · ${F.company}`}
                    </span>
                    {l.evidence && <span className={`ev-badge eb-${l.evidence}`}>{F.evidence[l.evidence]}</span>}
                    <span className="fr-src">{F.source}: {l.link ? <a href={l.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{l.source}</a> : l.source}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="finder-note">{F.precisionNote}</p>
            {results.some((r) => r.company) && <p className="finder-note">{F.evidenceNote}</p>}
          </div>
        )}
      </section>

      <SurveyControls explorer={survey} focus={setViewport} />
      </div>

      <aside className="geomap-panel">
        <div className="region-tabs" role="group" aria-label={p.regionsLabel}>
          {REGIONS.map((r) => (
            <button key={r.id} type="button" className={`gm-tab gm-${r.id}`} aria-pressed={selected === r.id} onClick={() => selectRegion(r.id)}>
              <i className="tab-dot" />
              {p.regions[r.id].name}
            </button>
          ))}
        </div>

        <div className={`region-card gm-${selected}`} key={selected}>
          <div className="region-head">
            <h3>{active.name}</h3>
            <span className={`evidence ev-${EVIDENCE[selected]}`} title={p.evidenceLabel}>
              <i />{p.evidence[EVIDENCE[selected]]}
            </span>
          </div>
          <dl>
            <dt>{p.roleLabel}</dt>
            <dd>{active.role}</dd>
            <dt>{p.geologyLabel}</dt>
            <dd>{active.geology}</dd>
            <dt>{p.mineralsLabel}</dt>
            <dd className="mineral-groups">
              {GROUPS.filter((g) => regionMinerals[g].length > 0).map((g) => (
                <div key={g} className="mg">
                  <span className="mg-label">{p.groups[g]}</span>
                  <span className="chips">
                    {regionMinerals[g].map((m) => (
                      <button key={m} type="button" className={`chip chip-${g} chip-btn`} aria-pressed={mineral === m} onClick={() => pickMineral(mineral === m ? null : m)}>
                        {mineralName(m, lang)}
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </dd>
            {regionMarkers.length > 0 && (
              <>
                <dt>{p.occurrencesLabel}</dt>
                <dd className="occ-list">
                  {regionMarkers.map((m) => (
                    <button key={m.id} type="button" className={`occ-item kind-${m.kind}`} aria-pressed={occ === m.id} onClick={() => setOcc(m.id)}>
                      <i className="occ-dot" />
                      <span><strong>{p.occurrences[m.id].name}</strong>{occ === m.id && <em>{p.occurrences[m.id].text}</em>}</span>
                    </button>
                  ))}
                </dd>
              </>
            )}
          </dl>
          <button type="button" className="region-cta" onClick={goContact}>
            {p.cta} <ArrowUpRight size={16} />
          </button>
        </div>
        <p className="national"><strong>{p.nationalLabel}:</strong> {p.national}</p>
      </aside>

      </div>





      <div className="geomap-foot">
        <p className="geomap-note">{p.note}</p>
        <details className="geomap-sources">
          <summary>{p.sourcesLabel}</summary>
          <ul>
            {SOURCES.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

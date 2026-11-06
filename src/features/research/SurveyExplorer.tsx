import { useState } from 'react';
import { MAP_VIEWBOX } from '@/data/mapData';
import { project } from '@/data/geoProject';
import { useI18n } from '@/i18n/core';
import { researchCopy } from './copy';
import { clusterObservations, observationBounds, type MapViewport, type Observation, type SurveyExplorer } from './survey';
import { researchLink } from './routing';
import { prepareEnquiry } from './enquiry';
import { SourceReferences } from './ResearchContent';
import './research.css';

export function SurveyLayer({ explorer, viewport, focus }: { explorer:SurveyExplorer;viewport:MapViewport;focus:(value:MapViewport)=>void }){
  const {lang}=useI18n();const c=researchCopy(lang);
  if(!explorer.enabled||!explorer.data)return null;
  const scale=viewport.w/MAP_VIEWBOX.w;
  const route=explorer.data.routes.find(r=>r.id===explorer.route);
  return <g className="survey-overlay">
    {route&&<path className="survey-route" fill="none" vectorEffect="non-scaling-stroke" d={route.coordinates.map(([lon,lat],index)=>`${index?'L':'M'}${project(lon,lat).map(n=>n.toFixed(3)).join(' ')}`).join('')}><title>{c.route} · {route.sourcePointCount} GPS points</title></path>}
    {clusterObservations(explorer.observations,viewport.w,MAP_VIEWBOX.w).map(cluster=>{
      const single=cluster.rows.length===1;const row=cluster.rows[0];const label=single?`${row.sample} · ${row.project} · ${row.rock}`:`${cluster.rows.length} ${c.group}`;
      const activate=()=>{if(single)explorer.setSelectedId(row.id);else focus(observationBounds(cluster.rows,8));};
      return <g key={cluster.id} role="button" tabIndex={0} aria-label={label} aria-pressed={single&&explorer.selected?.id===row.id} onClick={event=>{event.stopPropagation();activate();}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();activate();}}} transform={`translate(${cluster.x} ${cluster.y})`} className={`survey-pin ${single?'':'survey-cluster'}`}>
        <title>{label}</title><circle r={(single?5:10)*scale} strokeWidth={scale*1.5}/>{!single&&<text textAnchor="middle" dy={3*scale} fontSize={8*scale}>{cluster.rows.length}</text>}
      </g>;
    })}
  </g>;
}

export function SurveyControls({explorer,focus}:{explorer:SurveyExplorer;focus:(value:MapViewport)=>void}){
  const {lang}=useI18n();const c=researchCopy(lang);const [limit,setLimit]=useState(20);
  if(!explorer.enabled)return null;
  if(explorer.error)return <div className="survey-controls" role="alert">{c.loadError} <button type="button" onClick={explorer.retry}>{c.retry}</button></div>;
  if(!explorer.data)return <div className="survey-controls" role="status">{c.loading}</div>;
  const data=explorer.data;const areas=[...new Map(data.observations.map(row=>[row.projectId,row.project])).entries()];const rocks=[...new Set(data.observations.map(row=>row.rockGroup))].sort();
  const select=(row:Observation)=>{explorer.setSelectedId(row.id);focus(observationBounds([row],30));};
  return <section className="survey-controls" aria-label={c.field} data-editor-id="map.field-observations">
    <div className="survey-controls-head"><h4>{c.field} <span>{explorer.observations.length} / 208</span></h4><button type="button" disabled={!explorer.observations.length} onClick={()=>focus(observationBounds(explorer.observations))}>{c.fit}</button></div>
    <p className="survey-note">{c.displayNote}</p>
    <div className="survey-filters">
      <label>{c.search}<input value={explorer.query} maxLength={120} onChange={event=>{explorer.setQuery(event.target.value);setLimit(20);}}/></label>
      <label>{c.project}<select value={explorer.area} onChange={event=>{explorer.setArea(event.target.value);setLimit(20);}}><option value="">{c.all}</option>{areas.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
      <label>{c.rock}<select value={explorer.rock} onChange={event=>{explorer.setRock(event.target.value);setLimit(20);}}><option value="">{c.all}</option>{rocks.map(rock=><option key={rock}>{rock}</option>)}</select></label>
      <label>{c.routes}<select value={explorer.route} onChange={event=>explorer.setRoute(event.target.value)}><option value="">—</option>{data.routes.map(route=><option key={route.id} value={route.id}>{route.name} ({route.sourcePointCount})</option>)}</select></label>
    </div>
    {explorer.route&&<p className="survey-note">{c.route}</p>}
    {explorer.selected&&<article className="survey-selection" aria-live="polite"><div className="survey-controls-head"><h5>{c.selected}: {explorer.selected.sample} · {explorer.selected.project}</h5><button type="button" onClick={()=>explorer.setSelectedId('')}>{c.close}</button></div><p lang="en">{explorer.selected.description}</p><dl><dt>{c.rock}</dt><dd lang="en">{explorer.selected.rock}</dd><dt>{c.coordinate}</dt><dd>{explorer.selected.lat.toFixed(6)}°N, {explorer.selected.lon.toFixed(6)}°E</dd><dt>{c.elevation}</dt><dd>{explorer.selected.rl||'—'}</dd><dt>{c.source}</dt><dd lang="en">2017 field log · original source row {explorer.selected.sourceRow} · {explorer.selected.coordinateNote}</dd></dl><a href={researchLink('contact')} onClick={()=>prepareEnquiry({project:explorer.selected!.project,requirements:`Field observation ${explorer.selected!.sample}, source row ${explorer.selected!.sourceRow}`})}>{c.request} ↗</a></article>}
    <div className="survey-results" aria-live="polite">{!explorer.observations.length?<p>{c.noMatch}</p>:<ul>{explorer.observations.slice(0,limit).map(row=><li key={row.id}><button type="button" aria-label={`${row.sample} · ${row.project} · ${row.rock} · source row ${row.sourceRow}`} aria-pressed={explorer.selected?.id===row.id} onClick={()=>select(row)}><strong>{row.sample}</strong><span>{row.project}</span><span lang="en">{row.rock}</span><small>#{row.sourceRow}</small></button></li>)}</ul>}{limit<explorer.observations.length&&<button className="survey-more" type="button" onClick={()=>setLimit(x=>x+40)}>{c.more}</button>}</div>
    <details className="research-disclosure"><summary>{c.followup} · 42</summary><p>{c.followupNote}</p><div className="research-table-wrap"><table lang="en"><caption>Unconverted source values · axis labels and grid status need review</caption><thead><tr><th scope="col">Sample / row</th><th scope="col">Original Northings</th><th scope="col">Original Easting</th><th scope="col">Source description</th></tr></thead><tbody>{data.followup.map(row=><tr key={row.id}><th scope="row">{row.sample} / {row.sourceRow}</th><td>{row.northingsOriginal}</td><td>{row.eastingOriginal}</td><td>{[row.project,row.rock,row.description].filter(Boolean).join(' · ')}</td></tr>)}</tbody></table></div></details>
    <SourceReferences ids={['log','survey','followup']}/>
  </section>;
}

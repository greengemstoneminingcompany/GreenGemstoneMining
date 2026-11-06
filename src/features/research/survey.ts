import { useEffect, useMemo, useState } from 'react';
import { project } from '@/data/geoProject';

export type SurveyData = typeof import('./surveyData.json');
export type Observation = SurveyData['observations'][number];
export type MapViewport = { x:number; y:number; w:number; h:number };
export function observationBounds(records: Observation[], minimum=24): MapViewport {
  const positions=records.map(row=>project(row.lon,row.lat));
  const xs=positions.map(p=>p[0]),ys=positions.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const w=Math.max(minimum,maxX-minX+12),h=Math.max(minimum,maxY-minY+12);
  return {x:(minX+maxX-w)/2,y:(minY+maxY-h)/2,w,h};
}
export function clusterObservations(records: Observation[], viewWidth:number, mapWidth:number) {
  const cell=14*viewWidth/mapWidth;const groups=new Map<string,Observation[]>();
  for(const row of records){const [x,y]=project(row.lon,row.lat);const key=`${Math.floor(x/cell)}:${Math.floor(y/cell)}`;groups.set(key,[...(groups.get(key)||[]),row]);}
  return [...groups.entries()].map(([id,rows])=>({id,rows,x:rows.reduce((sum,r)=>sum+project(r.lon,r.lat)[0],0)/rows.length,y:rows.reduce((sum,r)=>sum+project(r.lon,r.lat)[1],0)/rows.length}));
}
export function useSurveyExplorer(){
  const [enabled,setEnabled]=useState(false);const [data,setData]=useState<SurveyData|null>(null);const [error,setError]=useState(false);const [attempt,setAttempt]=useState(0);
  const [query,setQuery]=useState('');const [area,setArea]=useState('');const [rock,setRock]=useState('');const [route,setRoute]=useState('');const [selectedId,setSelectedId]=useState('');
  useEffect(()=>{
    if(!enabled)return;let cancelled=false;
    import('./surveyData.json').then(module=>{if(!cancelled){setData(module.default);setError(false);}}).catch(()=>{if(!cancelled)setError(true);});
    return()=>{cancelled=true;};
  },[enabled,attempt]);
  const observations=useMemo(()=>data?.observations.filter(row=>(!area||row.projectId===area)&&(!rock||row.rockGroup===rock)&&(!query||`${row.sample} ${row.project} ${row.rock} ${row.description}`.toLowerCase().includes(query.toLowerCase())))||[],[data,area,rock,query]);
  const selected=data?.observations.find(row=>row.id===selectedId&&observations.some(filtered=>filtered.id===row.id));
  return {enabled,setEnabled,data,error,retry:()=>{setError(false);setAttempt(x=>x+1);},query,setQuery,area,setArea,rock,setRock,route,setRoute,selected,setSelectedId,observations};
}
export type SurveyExplorer = ReturnType<typeof useSurveyExplorer>;

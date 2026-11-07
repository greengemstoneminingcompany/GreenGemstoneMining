import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Folder, X } from 'lucide-react';
import { getSupabase, type MediaUpload } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/media';
import {useI18n} from '@/i18n/core';
import {buyerText} from '@/i18n/buyer-interface';
import PublicSearch from '@/components/PublicSearch';
import {matchesPublicSearch} from '@/lib/publicSearch';
import './BuyerWorkspace.css';
type FolderRow={id:string;name:string;parent_id:string|null;sort_order:number};type Link={folder_id:string;media_id:string;sort_order:number};type Cover={folder_id:string;media_id:string};
export default function Gallery({uploads}:{uploads:MediaUpload[];items?:GalleryItem[]}){
 const {lang}=useI18n();const [query,setQuery]=useState('');const headingRef=useRef<HTMLHeadingElement>(null);const viewerRef=useRef<HTMLDivElement>(null);
 const [folders,setFolders]=useState<FolderRow[]>([]);const [links,setLinks]=useState<Link[]>([]);const [covers,setCovers]=useState<Cover[]>([]);const [current,setCurrent]=useState<string|null>(null);const [opened,setOpened]=useState<MediaUpload|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let live=true;void(async()=>{try{const sb=await getSupabase();if(!sb)throw new Error('Gallery database is not configured.');const result=await sb.from('gallery_folders').select('id,name,parent_id,sort_order').order('sort_order');if(result.error)throw result.error;if(live)setFolders((result.data??[]) as FolderRow[]);const [l,c]=await Promise.all([sb.from('gallery_folder_media').select('folder_id,media_id,sort_order'),sb.from('gallery_folder_covers').select('folder_id,media_id')]);if(l.error)throw l.error;if(c.error)throw c.error;if(live){setLinks((l.data??[]) as Link[]);setCovers((c.data??[]) as Cover[]);}}catch(e){if(live)setError(e instanceof Error?e.message:'Gallery unavailable.');}finally{if(live)setLoading(false);}})();return()=>{live=false;};},[]);
 useEffect(()=>{
  if(!opened)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const dialog=viewerRef.current;
  const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href], video[controls], [tabindex="0"]')??[]);
  focusable()[0]?.focus();
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setOpened(null);return;}
   if(event.key!=='Tab')return;
   const elements=focusable();const first=elements[0],last=elements[elements.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  const keepFocus=(event:FocusEvent)=>{if(dialog&&!dialog.contains(event.target as Node))focusable()[0]?.focus();};
  document.addEventListener('keydown',key);document.addEventListener('focusin',keepFocus);
  return()=>{document.removeEventListener('keydown',key);document.removeEventListener('focusin',keepFocus);document.body.style.overflow=previousOverflow;previous?.focus();};
 },[opened]);
 const media=useMemo(()=>new Map(uploads.filter(m=>m.is_active).map(m=>[m.id,m])),[uploads]);const children=folders.filter(f=>f.parent_id===current).sort((a,b)=>a.sort_order-b.sort_order||a.name.localeCompare(b.name));const currentFolder=folders.find(f=>f.id===current);const crumbs:FolderRow[]=[];const seen=new Set<string>();let cursor=currentFolder;while(cursor&&!seen.has(cursor.id)){seen.add(cursor.id);crumbs.unshift(cursor);cursor=folders.find(f=>f.id===cursor?.parent_id);}
 const byId=new Map(folders.map(folder=>[folder.id,folder]));
 const pathFor=(folder:FolderRow)=>{const names=[folder.name];const visited=new Set([folder.id]);let parent=folder.parent_id;while(parent&&!visited.has(parent)){visited.add(parent);const row=byId.get(parent);if(!row)break;names.unshift(row.name);parent=row.parent_id;}return names.join(' / ');};
 const matchingFolders=query.trim()?folders.map(folder=>({folder,path:pathFor(folder)})).filter(({path})=>matchesPublicSearch(query,path)):[];
 const openFolder=(id:string|null)=>{setQuery('');setCurrent(id);requestAnimationFrame(()=>headingRef.current?.focus());};
 const visible=links.filter(l=>l.folder_id===current).sort((a,b)=>a.sort_order-b.sort_order).map(l=>media.get(l.media_id)).filter((m):m is MediaUpload=>Boolean(m));const coversByFolder=new Map(covers.map(c=>[c.folder_id,c.media_id]));
 return <section className="bw-gallery" aria-label={buyerText(lang,"Gallery folders")}><div className="bw-gallery-heading"><span>{buyerText(lang,"GREEN GEMSTONE / COLLECTIONS")}</span><h3 ref={headingRef} tabIndex={-1}>{currentFolder?.name??buyerText(lang,'Explore the Gallery')}</h3><p>{buyerText(lang,"Browse published media organized by subject. Empty collections are shown honestly until approved company photographs are assigned.")}</p></div><nav aria-label={buyerText(lang,"Gallery breadcrumb")} className="bw-crumbs"><button type="button" onClick={()=>openFolder(null)}>{buyerText(lang,"Gallery")}</button>{crumbs.map(c=><button key={c.id} aria-current={c.id===current?'page':undefined} type="button" onClick={()=>openFolder(c.id)}> / {c.name}</button>)}</nav>{current&&<button type="button" className="bw-gallery-back" onClick={()=>openFolder(currentFolder?.parent_id??null)}><ArrowLeft size={14}/> {buyerText(lang,"Back")}</button>}{loading&&<p role="status">{buyerText(lang,"Loading folders…")}</p>}{error&&<p role="alert">{buyerText(lang,error)}</p>}{!loading&&!error&&<PublicSearch label={buyerText(lang,'Search gallery folders')} value={query} onChange={setQuery} count={matchingFolders.length}/>}{!loading&&!error&&query.trim()&&<ul className="gallery-search-results">{matchingFolders.map(({folder,path})=><li key={folder.id}><button type="button" onClick={()=>openFolder(folder.id)}><Folder size={20} aria-hidden="true"/><span>{path}</span><ArrowUpRight size={17} aria-hidden="true"/></button></li>)}</ul>}{!loading&&!error&&!query.trim()&&<><div className="bw-folder-grid">{children.map(f=>{const cover=media.get(coversByFolder.get(f.id)??'');return <button className="bw-folder" key={f.id} type="button" onClick={()=>openFolder(f.id)}><div className="bw-folder-image">{cover?.media_type==='image'?<img src={cover.public_url} alt="" loading="lazy"/>:<Folder size={65} strokeWidth={1}/>}</div><div className="bw-folder-caption"><strong>{f.name}</strong><ArrowUpRight size={18}/></div></button>;})}</div>{visible.length>0&&<div className="bw-photo-grid">{visible.map(m=><button key={m.id} type="button" onClick={()=>setOpened(m)}>{m.media_type==='image'?<img src={m.public_url} alt={m.title} loading="lazy"/>:<div className="bw-video">{buyerText(lang,"Video")}</div>}<span>{m.title}</span></button>)}</div>}{children.length===0&&visible.length===0&&<div className="bw-empty"><Folder size={34}/><p>{buyerText(lang,"No published photographs in this collection yet.")}</p></div>}</>}{opened&&<div ref={viewerRef} role="dialog" aria-modal="true" aria-label={opened.title} className="bw-photo-viewer"><button type="button" aria-label={buyerText(lang,"Close viewer")} onClick={()=>setOpened(null)}><X size={21}/></button>{opened.media_type==='image'?<img src={opened.public_url} alt={opened.title}/>:<video controls src={opened.public_url}/>}<p>{opened.title} {opened.description??''}</p></div>}</section>;
}

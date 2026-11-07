import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Folder, X } from 'lucide-react';
import { getSupabase, type MediaUpload } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/media';
import './BuyerWorkspace.css';
type FolderRow={id:string;name:string;parent_id:string|null;sort_order:number};type Link={folder_id:string;media_id:string;sort_order:number};type Cover={folder_id:string;media_id:string};
export default function Gallery({uploads}:{uploads:MediaUpload[];items?:GalleryItem[]}){
 const viewerRef=useRef<HTMLDivElement>(null);
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
 const visible=links.filter(l=>l.folder_id===current).sort((a,b)=>a.sort_order-b.sort_order).map(l=>media.get(l.media_id)).filter((m):m is MediaUpload=>Boolean(m));const coversByFolder=new Map(covers.map(c=>[c.folder_id,c.media_id]));
 return <section className="bw-gallery" aria-label="Gallery folders"><div className="bw-gallery-heading"><span>GREEN GEMSTONE / COLLECTIONS</span><h3>{currentFolder?.name??'Explore the Gallery'}</h3><p>Browse published media organized by subject. Empty collections are shown honestly until approved company photographs are assigned.</p></div><nav aria-label="Gallery breadcrumb" className="bw-crumbs"><button type="button" onClick={()=>setCurrent(null)}>Gallery</button>{crumbs.map(c=><button key={c.id} aria-current={c.id===current?'page':undefined} type="button" onClick={()=>setCurrent(c.id)}> / {c.name}</button>)}</nav>{current&&<button type="button" className="bw-gallery-back" onClick={()=>setCurrent(currentFolder?.parent_id??null)}><ArrowLeft size={14}/> Back</button>}{loading&&<p role="status">Loading folders…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&<><div className="bw-folder-grid">{children.map(f=>{const cover=media.get(coversByFolder.get(f.id)??'');return <button className="bw-folder" key={f.id} type="button" onClick={()=>setCurrent(f.id)}><div className="bw-folder-image">{cover?.media_type==='image'?<img src={cover.public_url} alt="" loading="lazy"/>:<Folder size={65} strokeWidth={1}/>}</div><div className="bw-folder-caption"><strong>{f.name}</strong><ArrowUpRight size={18}/></div></button>;})}</div>{visible.length>0&&<div className="bw-photo-grid">{visible.map(m=><button key={m.id} type="button" onClick={()=>setOpened(m)}>{m.media_type==='image'?<img src={m.public_url} alt={m.title} loading="lazy"/>:<div className="bw-video">Video</div>}<span>{m.title}</span></button>)}</div>}{children.length===0&&visible.length===0&&<div className="bw-empty"><Folder size={34}/><p>No published photographs in this collection yet.</p></div>}</>}{opened&&<div ref={viewerRef} role="dialog" aria-modal="true" aria-label={opened.title} className="bw-photo-viewer"><button type="button" aria-label="Close viewer" onClick={()=>setOpened(null)}><X size={21}/></button>{opened.media_type==='image'?<img src={opened.public_url} alt={opened.title}/>:<video controls src={opened.public_url}/>}<p>{opened.title} {opened.description??''}</p></div>}</section>;
}

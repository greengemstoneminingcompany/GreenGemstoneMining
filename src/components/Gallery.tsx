import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Folder, Images, Search, X } from 'lucide-react';
import { getSupabase, type MediaUpload } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/media';
import './OwnerGallery.css';

type GalleryFolder = { id: string; name: string; parent_id: string | null; sort_order: number };
const keyOf = (value:string):string=>value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pathOf = (item:MediaUpload):string[]=>item.storage_path.split('/').filter(Boolean).slice(1,-1).map(keyOf);

export default function Gallery({uploads}: {uploads:MediaUpload[];items?:GalleryItem[]}) {
  const [folders,setFolders]=useState<GalleryFolder[]>([]);const [current,setCurrent]=useState<string|null>(null);
  const [search,setSearch]=useState('');const [lightbox,setLightbox]=useState<MediaUpload|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);
  useEffect(()=>{let active=true;void(async()=>{try{const sb=await getSupabase();if(!sb)throw new Error('Gallery folders require the existing configured media database.');const result=await sb.from('gallery_folders').select('id,name,parent_id,sort_order').order('sort_order',{ascending:true});if(result.error)throw result.error;if(active)setFolders((result.data??[]) as GalleryFolder[]);}catch(reason){if(active)setError(reason instanceof Error?reason.message:'Unable to load gallery folders.');}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[]);
  useEffect(()=>{if(!lightbox)return;const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setLightbox(null);};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);},[lightbox]);
  const validMedia=useMemo(()=>uploads.filter(item=>item.is_active&&['image','video'].includes(item.media_type)),[uploads]);
  const parentById=useMemo(()=>new Map(folders.map(row=>[row.id,row])),[folders]);
  const folderTrail=(folder:GalleryFolder):string[]=>{const parts=[folder.name];const seen=new Set([folder.id]);let pointer=folder.parent_id;while(pointer&&!seen.has(pointer)){seen.add(pointer);const found=parentById.get(pointer);if(!found)break;parts.unshift(found.name);pointer=found.parent_id;}return parts.map(keyOf);};
  const directMedia=(folder:GalleryFolder)=>{const parts=folderTrail(folder);return validMedia.filter(item=>{const mediaParts=pathOf(item);return mediaParts.length>=parts.length&&parts.every((part,i)=>mediaParts[mediaParts.length-parts.length+i]===part);});};
  const children=folders.filter(item=>item.parent_id===current).sort((a,b)=>a.sort_order-b.sort_order||a.name.localeCompare(b.name)).filter(item=>item.name.toLowerCase().includes(search.toLowerCase()));
  const selected=current?parentById.get(current):undefined;
  const breadcrumb:GalleryFolder[]=[];let walk=selected;const seen=new Set<string>();while(walk&&!seen.has(walk.id)){seen.add(walk.id);breadcrumb.unshift(walk);walk=walk.parent_id?parentById.get(walk.parent_id):undefined;}
  const currentMedia=selected?directMedia(selected):validMedia.filter(item=>item.category==='gallery');
  const visibleMedia=currentMedia.filter(item=>(item.title+' '+(item.description??'')).toLowerCase().includes(search.toLowerCase()));
  const navigate=(id:string|null)=>{setCurrent(id);setSearch('');setLightbox(null);};
  return <div className="og-gallery" aria-label="Company gallery folders">
    <div className="og-gallery-header"><div><p className="og-overline">GREEN GEMSTONE MINING COMPANY / GALLERY</p><h3>{selected?.name??'Explore the collections'}</h3><p>Browse the established gallery folders and published company media. Unpublished and unassigned files are not presented as evidence of mining activity.</p></div><label className="og-search"><Search size={17}/><span className="sr-only">Search current gallery level</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this level"/></label></div>
    <nav aria-label="Gallery breadcrumb" className="og-breadcrumb"><button type="button" onClick={()=>navigate(null)}>Gallery</button>{breadcrumb.map(folder=><button key={folder.id} aria-current={folder.id===current?'page':undefined} type="button" onClick={()=>navigate(folder.id)}><span aria-hidden="true">/</span>{folder.name}</button>)}</nav>
    {current&&<button type="button" className="og-back" onClick={()=>navigate(selected?.parent_id??null)}><ArrowLeft size={16}/> Back to previous folder</button>}
    {loading&&<p role="status" className="og-message">Loading folders…</p>}{error&&<p role="alert" className="og-message">{error}</p>}
    {!loading&&!error&&<><div className="og-folder-grid">{children.map(folder=>{const photo=directMedia(folder).find(item=>item.media_type==='image');const subCount=folders.filter(item=>item.parent_id===folder.id).length;return <button key={folder.id} type="button" className="og-folder-card" onClick={()=>navigate(folder.id)}><span className="og-folder-cover">{photo?<img src={photo.public_url} loading="lazy" alt=""/>:<span className="og-folder-placeholder"><Folder size={55} strokeWidth={1.1}/></span>}<span className="og-folder-tag">COLLECTION</span></span><span className="og-folder-caption"><span><strong>{folder.name}</strong><small>{subCount>0?`${subCount} subfolders`:'Browse media'}</small></span><ArrowUpRight size={19}/></span></button>;})}</div>
      {visibleMedia.length>0&&<section className="og-media-section" aria-label="Published gallery media"><div className="og-media-head"><span><Images size={17}/> Published media</span><small>{visibleMedia.length} items</small></div><div className="og-media-grid">{visibleMedia.map(item=><button key={item.id} type="button" onClick={()=>setLightbox(item)} className="og-media-tile"><span className="og-media-image">{item.media_type==='image'?<img src={item.public_url} alt={item.title} loading="lazy"/>:<span><Images size={28}/> Video</span>}</span><span className="og-media-title">{item.title}</span></button>)}</div></section>}
      {children.length===0&&visibleMedia.length===0&&<div className="og-empty"><Folder size={35} strokeWidth={1}/><p>{search?'No matching published media or folders.':'This collection has no published media yet.'}</p><small>Folder names and file associations come from existing records and saved upload paths. New media appears after publication.</small></div>}
    </>}
    {lightbox&&<div className="og-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.title}><button type="button" className="og-lightbox-close" aria-label="Close media viewer" onClick={()=>setLightbox(null)}><X size={21}/></button>{lightbox.media_type==='image'?<img src={lightbox.public_url} alt={lightbox.title}/>:<video src={lightbox.public_url} controls/>}<p>{lightbox.title}{lightbox.description?` · ${lightbox.description}`:''}</p></div>}
  </div>;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, Folder, X } from 'lucide-react';
import { getSupabase, type MediaUpload } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/media';

type GalleryFolder = { id: string; name: string; parent_id: string | null; sort_order: number };
type MediaLink = { folder_id: string; media_id: string; sort_order: number };
type FolderCover = { folder_id: string; media_id: string };

export default function Gallery({ uploads }: { uploads: MediaUpload[]; items?: GalleryItem[] }) {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [links, setLinks] = useState<MediaLink[]>([]);
  const [covers, setCovers] = useState<FolderCover[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [opened, setOpened] = useState<MediaUpload | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const client = await getSupabase();
        if (!client) throw new Error('Gallery folders are unavailable until Supabase is configured.');
        const result = await client.from('gallery_folders').select('id,name,parent_id,sort_order').order('sort_order', { ascending: true });
        if (result.error) throw result.error;
        const [mediaResult, coverResult] = await Promise.all([
          client.from('gallery_folder_media').select('folder_id,media_id,sort_order'),
          client.from('gallery_folder_covers').select('folder_id,media_id'),
        ]);
        if (active) {
          setFolders((result.data ?? []) as GalleryFolder[]);
          setLinks((mediaResult.data ?? []) as MediaLink[]);
          setCovers((coverResult.data ?? []) as FolderCover[]);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load gallery folders.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!opened) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpened(null);
      if (event.key === 'Tab') {
        const panel = closeButton.current?.closest('[role="dialog"]');
        const controls = Array.from(panel?.querySelectorAll<HTMLElement>('button, video[controls]') ?? []);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); document.body.style.overflow = overflow; previous?.focus(); };
  }, [opened]);

  const media = useMemo(() => new Map(uploads.filter(item => item.is_active).map(item => [item.id, item])), [uploads]);
  const children = folders.filter(folder => folder.parent_id === current).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const selected = folders.find(folder => folder.id === current);
  const breadcrumbs: GalleryFolder[] = [];
  const seen = new Set<string>();
  let cursor = selected;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id); breadcrumbs.unshift(cursor);
    cursor = folders.find(folder => folder.id === cursor?.parent_id);
  }
  const visible = links.filter(link => link.folder_id === current).sort((a, b) => a.sort_order - b.sort_order)
    .map(link => media.get(link.media_id)).filter((item): item is MediaUpload => Boolean(item));
  const coverByFolder = new Map(covers.map(cover => [cover.folder_id, cover.media_id]));

  return <section className="gallery-folder-browser" aria-label="Gallery folders">
    <nav aria-label="Gallery breadcrumb" className="gallery-breadcrumb">
      <button type="button" onClick={() => setCurrent(null)}>Gallery</button>
      {breadcrumbs.map(folder => <button key={folder.id} type="button" aria-current={folder.id === current ? 'page' : undefined} onClick={() => setCurrent(folder.id)}> / {folder.name}</button>)}
    </nav>
    {current && <button type="button" className="gallery-back" onClick={() => setCurrent(selected?.parent_id ?? null)}><ChevronLeft size={16} aria-hidden="true" /> Back</button>}
    {loading && <p role="status">Loading folders…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && <>
      <div className="gallery-folder-grid">{children.map(folder => {
        const cover = media.get(coverByFolder.get(folder.id) ?? '');
        return <button className="gallery-folder-button" key={folder.id} type="button" onClick={() => setCurrent(folder.id)}>
          <div className="gallery-folder-cover">{cover?.media_type === 'image' ? <img src={cover.public_url} alt="" loading="lazy" /> : <Folder size={58} strokeWidth={1} aria-hidden="true" />}</div>
          <div className="gallery-folder-caption"><strong>{folder.name}</strong><ArrowUpRight size={18} aria-hidden="true" /></div>
        </button>;
      })}</div>
      {visible.length > 0 && <>
        <div className="gallery-view-switch" role="group" aria-label="Gallery view"><button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Grid</button><button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</button></div>
        {view === 'grid' ? <div className="gallery-media-grid">{visible.map(item => <button className="gallery-media-button" type="button" key={item.id} onClick={() => setOpened(item)}>
          {item.media_type === 'image' ? <img src={item.public_url} alt="" loading="lazy" /> : <div className="gallery-video-placeholder">Video</div>}<span>{item.title}</span>
        </button>)}</div> : <div className="gallery-table-wrap"><table className="gallery-media-table"><caption>Published media in {selected?.name}</caption><thead><tr><th scope="col">Title</th><th scope="col">Type</th><th scope="col">View</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td>{item.title}</td><td>{item.media_type}</td><td><button type="button" aria-label={`Open ${item.title}`} onClick={() => setOpened(item)}>Open</button></td></tr>)}</tbody></table></div>}
      </>}
      {children.length === 0 && visible.length === 0 && <p>This folder is empty.</p>}
    </>}
    {opened && <div className="gallery-lightbox" role="presentation" onClick={event => { if (event.target === event.currentTarget) setOpened(null); }}><div className="gallery-lightbox-panel" role="dialog" aria-modal="true" aria-labelledby="gallery-media-title">
      <button ref={closeButton} className="gallery-lightbox-close" type="button" onClick={() => setOpened(null)}><X size={18} aria-hidden="true" /> Close</button>
      {opened.media_type === 'image' ? <img src={opened.public_url} alt={opened.title} /> : <video src={opened.public_url} controls preload="metadata" />}
      <h3 id="gallery-media-title">{opened.title}</h3>
    </div></div>}
  </section>;
}

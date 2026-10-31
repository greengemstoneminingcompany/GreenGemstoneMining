import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Video, X } from 'lucide-react';
import { GALLERY, GALLERY_GROUPS } from '@/data/site';
import { getUploadFolderName, matchesGalleryFilter, type GalleryFilter, type GalleryItem } from '@/lib/media';
import type { MediaUpload } from '@/lib/supabase';
import { useI18n } from '@/i18n/core';

const WIDTHS = ['w5', 'w6', 'w7'];
const FILTERS: GalleryFilter[] = ['All', ...GALLERY_GROUPS];

export default function Gallery({ uploads, items = GALLERY }: { uploads: MediaUpload[]; items?: GalleryItem[] }) {
  const { t } = useI18n();
  const tg = t.gallery;
  const itemLabel = (label: string) => tg.items[label] ?? label;
  const [filter, setFilter] = useState<GalleryFilter>('All');
  const [folder, setFolder] = useState('All folders');
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 480, behavior: 'smooth' });
  const returnFocus = useRef<HTMLElement | null>(null);

  const uploadItems: GalleryItem[] = useMemo(
    () => uploads.map((u) => ({
      src: u.public_url, label: u.title, group: 'My uploads' as const, type: u.media_type,
      width: 1200, height: 800, folder: getUploadFolderName(u.storage_path),
    })),
    [uploads],
  );
  const folders = useMemo(() => ['All folders', ...Array.from(new Set(uploadItems.map((i) => i.folder ?? 'General'))).sort()], [uploadItems]);
  const filters = uploadItems.length ? FILTERS : FILTERS.filter((f) => f !== 'My uploads');

  const visible = useMemo(() => {
    const all = [...items, ...uploadItems].filter((i) => matchesGalleryFilter(i, filter));
    return filter === 'My uploads' && folder !== 'All folders' ? all.filter((i) => i.folder === folder) : all;
  }, [filter, folder, uploadItems, items]);

  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'Tab') {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnFocus.current?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="gallery-filters" role="group" aria-label={tg.filterLabel}>
        {filters.map((f) => (
          <button key={f} type="button" className={filter === f ? 'active' : ''} aria-pressed={filter === f} onClick={() => { setFilter(f); setFolder('All folders'); }}>{f === 'All' ? tg.all : tg.groups[f] ?? f}</button>
        ))}
      </div>
      {filter === 'My uploads' && folders.length > 2 && (
        <div className="gallery-filters" role="group" aria-label={tg.folderLabel}>
          {folders.map((f) => (
            <button key={f} type="button" className={folder === f ? 'active' : ''} aria-pressed={folder === f} onClick={() => setFolder(f)}>{f === 'All folders' ? tg.allFolders : f}</button>
          ))}
        </div>
      )}
      <div className="gallery-nav">
        <span aria-live="polite">{tg.count(visible.length)}</span>
        <div>
          <button type="button" onClick={() => scrollBy(-1)} aria-label={tg.left}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => scrollBy(1)} aria-label={tg.right}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="gallery-h reveal in" ref={scroller} tabIndex={0} role="region" aria-label={tg.regionLabel}>
        <div className="gallery-track">
          {visible.map((item, i) => (
            <button key={`${item.src}-${i}`} type="button" className={`g-item ${WIDTHS[i % 3]}`} onClick={() => setOpen(item)}>
              {item.type === 'video' ? (
                <video src={item.src} muted preload="metadata" className="g-video" />
              ) : (
                <img src={item.src} alt="" width={item.width} height={item.height} loading="lazy" decoding="async" />
              )}
              {item.type === 'video' && <span className="g-video-icon"><Video size={16} /></span>}
              {item.folder && <span className="g-folder-tag">{item.folder}</span>}
              <span className="g-label">{itemLabel(item.label)}</span>
            </button>
          ))}
        </div>
      </div>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={itemLabel(open.label)} onClick={() => setOpen(null)}>
          <button ref={closeRef} type="button" onClick={() => setOpen(null)} aria-label={t.ui.close}><X /></button>
          {open.type === 'video' ? (
            <video src={open.src} controls autoPlay className="lightbox-video" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={open.src} alt={itemLabel(open.label)} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}

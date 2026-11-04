import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Folder } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { MediaUpload } from '@/lib/supabase';

type GalleryFolder = { id: string; name: string; parent_id: string | null; sort_order: number };

export default function Gallery(props: { uploads: MediaUpload[] }) {
  void props.uploads; // Preserve the existing public component API until media is folder-linked.
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const client = await getSupabase();
        if (!client) throw new Error('Gallery folders are unavailable until Supabase is configured.');
        const { data, error: queryError } = await client.from('gallery_folders')
          .select('id,name,parent_id,sort_order').order('sort_order', { ascending: true });
        if (queryError) throw queryError;
        if (active) setFolders((data ?? []) as GalleryFolder[]);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load gallery folders.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const children = useMemo(() => folders.filter((folder) => folder.parent_id === current)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [folders, current]);
  const selected = folders.find((folder) => folder.id === current);
  const breadcrumbs: GalleryFolder[] = [];
  let cursor = selected;
  while (cursor) {
    breadcrumbs.unshift(cursor);
    cursor = folders.find((folder) => folder.id === cursor?.parent_id);
  }

  return (
    <section className="gallery-folder-browser" aria-label="Gallery folders">
      <nav aria-label="Gallery breadcrumb" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => setCurrent(null)}>Gallery</button>
        {breadcrumbs.map((folder) => (
          <button key={folder.id} type="button" onClick={() => setCurrent(folder.id)} aria-current={folder.id === current ? 'page' : undefined}>
            / {folder.name}
          </button>
        ))}
      </nav>
      {current && <button type="button" onClick={() => setCurrent(selected?.parent_id ?? null)} style={{ marginBottom: '1rem' }}>
        <ChevronLeft size={16} aria-hidden="true" /> Back
      </button>}
      {loading && <p role="status">Loading folders…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        children.length > 0
          ? <div className="gallery-folder-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {children.map((folder) => (
                <button key={folder.id} type="button" onClick={() => setCurrent(folder.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', border: '1px solid currentColor', borderRadius: '0.75rem', background: 'transparent', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                  <Folder size={22} aria-hidden="true" /><span>{folder.name}</span>
                </button>
              ))}
            </div>
          : <p>This folder is empty.</p>
      )}
    </section>
  );
}

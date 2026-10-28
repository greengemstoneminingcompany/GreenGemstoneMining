import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEDIA_BUCKET, type MediaUpload, type MediaCategory } from '@/lib/supabase';
import { MAX_FILE_SIZE, formatBytes, isAllowedMime, isVideoName, normalizeFolderSlug } from '@/lib/media';
import {
  X, Upload, Trash2, Image as ImageIcon, Video, Loader2, Check, Gem, Folder, Plus,
} from 'lucide-react';

interface AdminSession {
  client: SupabaseClient | null;
  email: string | null;
  isAdmin: boolean;
  checking: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

interface MediaPanelProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  admin: AdminSession;
}

interface UploadProgressItem {
  id: string;
  name: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
}

const CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: 'hero', label: 'Hero / Banner' },
  { value: 'company', label: 'Company' },
  { value: 'deposits', label: 'Deposits' },
  { value: 'projects', label: 'Projects' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'contact', label: 'Contact' },
  { value: 'general', label: 'General' },
];

const isVideoFile = (file: File) => isVideoName(file.name, file.type);
const isAllowedFileType = (file: File) => isAllowedMime(file.type);

const humanizeStorageError = (error: { message: string } | null, fallback: string) => {
  if (!error) return fallback;
  const message = error.message.toLowerCase();
  if (message.includes('403') || message.includes('permission')) {
    return 'Permission denied: check the Supabase bucket policy and make sure the media bucket is public or your session is authorized.';
  }
  if (message.includes('409') || message.includes('already exists') || message.includes('conflict')) {
    return 'A file with that name already exists. Rename the file or allow overwrite.';
  }
  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'Network error while uploading. Please try again.';
  }
  return `${fallback}: ${error.message}`;
};

const deriveFolders = (rows: MediaUpload[], category: MediaCategory) => {
  const map = new Map<string, { path: string; count: number }>();

  rows
    .filter((row) => row.category === category)
    .forEach((row) => {
      const relative = row.storage_path.replace(`${category}/`, '');
      const idx = relative.lastIndexOf('/');
      const folderPath = idx >= 0 ? relative.slice(0, idx) : '';
      if (!folderPath) return;

      const existing = map.get(folderPath);
      map.set(folderPath, {
        path: `${category}/${folderPath}`,
        count: existing ? existing.count + 1 : 1,
      });
    });

  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
};

function MediaManager({ open, onClose, onUploaded, admin }: MediaPanelProps) {
  const sb = admin.client as SupabaseClient;
  const [allMedia, setAllMedia] = useState<MediaUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('gallery');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folderDraft, setFolderDraft] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb
      .from('media_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setStatus({ type: 'error', msg: `Could not load media: ${error.message}` });
      return;
    }

    const rows = (data ?? []) as MediaUpload[];
    setAllMedia(rows);
  }, [sb]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const timeout = window.setTimeout(() => modalRef.current?.focus(), 50);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // Fetching when the panel opens is a legitimate effect; it flips the loading flag before the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [open, fetchAll]);

  const folders = useMemo(() => deriveFolders(allMedia, uploadCategory), [allMedia, uploadCategory]);
  // A selected folder only counts while it still holds items in the current category.
  const activeFolder =
    selectedFolder && allMedia.some((row) => row.storage_path.startsWith(`${uploadCategory}/${selectedFolder}/`))
      ? selectedFolder
      : '';

  const visibleMedia = allMedia.filter((item) => {
    if (item.category !== uploadCategory) return false;
    if (!activeFolder) return true;
    return item.storage_path.startsWith(`${uploadCategory}/${activeFolder}/`);
  });

  const handleCreateFolder = async () => {
    const cleaned = normalizeFolderSlug(folderDraft);
    if (!cleaned) {
      setStatus({ type: 'error', msg: 'Please enter a valid folder name.' });
      return;
    }

    if (cleaned.startsWith('.') || cleaned.includes('..')) {
      setStatus({ type: 'error', msg: 'Folder names cannot begin with a dot or contain parent directory references.' });
      return;
    }

    const folderPath = `${uploadCategory}/${cleaned}/.keep`;

    setUploading(true);
    setStatus({ type: 'info', msg: `Creating folder "${cleaned}"…` });

    const { error } = await sb.storage
      .from(MEDIA_BUCKET)
      .upload(folderPath, new Blob(['folder marker'], { type: 'text/plain' }), {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/plain',
      });

    setUploading(false);

    if (error) {
      setStatus({ type: 'error', msg: `Folder creation failed: ${humanizeStorageError(error, 'Folder creation failed')}` });
      return;
    }

    setFolderDraft('');
    setSelectedFolder(cleaned);
    setStatus({ type: 'success', msg: `Folder "${cleaned}" created successfully.` });
    await fetchAll();
    onUploaded();
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nextFiles = Array.from(files).filter((file) => {
      if (!isAllowedFileType(file)) {
        setStatus({ type: 'error', msg: `${file.name} is not a supported image or video file.` });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setStatus({ type: 'error', msg: `${file.name} is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.` });
        return false;
      }
      return true;
    });

    if (!nextFiles.length) return;

    setUploading(true);
    setUploadQueue((prev) => [
      ...prev,
      ...nextFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${file.name}`,
        name: file.name,
        status: 'uploading' as const,
        progress: 15,
        message: 'Preparing upload',
      })),
    ]);

    for (const file of nextFiles) {
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
      const safeName = `${crypto.randomUUID()}${ext}`;
      const folderPrefix = activeFolder ? `${activeFolder}/` : '';
      const filePath = `${uploadCategory}/${folderPrefix}${safeName}`;

      setUploadQueue((prev) => prev.map((entry) => (entry.id.includes(file.name) ? { ...entry, progress: 35, message: 'Uploading to storage' } : entry)));
      setStatus({ type: 'info', msg: `Uploading ${file.name}…` });

      const { error: uploadError } = await sb.storage
        .from(MEDIA_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setUploadQueue((prev) => prev.map((entry) => (entry.name === file.name ? { ...entry, status: 'error', progress: 100, message: humanizeStorageError(uploadError, 'Upload failed') } : entry)));
        setStatus({ type: 'error', msg: humanizeStorageError(uploadError, `Upload failed for ${file.name}`) });
        continue;
      }

      setUploadQueue((prev) => prev.map((entry) => (entry.name === file.name ? { ...entry, progress: 70, message: 'Writing media record' } : entry)));

      const { data: urlData } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);

      const { error: insertError } = await sb.from('media_uploads').insert({
        title: uploadTitle || file.name.replace(/\.[^/.]+$/, ''),
        description: uploadDesc || null,
        media_type: isVideoFile(file) ? 'video' : 'image',
        storage_path: filePath,
        public_url: urlData.publicUrl,
        category: uploadCategory,
        sort_order: 0,
        is_active: true,
      });

      if (insertError) {
        setUploadQueue((prev) => prev.map((entry) => (entry.name === file.name ? { ...entry, status: 'error', progress: 100, message: 'Database insert failed' } : entry)));
        setStatus({ type: 'error', msg: `Database insert failed for ${file.name}: ${insertError.message}` });
        continue;
      }

      setUploadQueue((prev) => prev.map((entry) => (entry.name === file.name ? { ...entry, status: 'success', progress: 100, message: 'Completed' } : entry)));
      setStatus({ type: 'success', msg: `${file.name} uploaded successfully.` });
    }

    setUploading(false);
    setUploadTitle('');
    setUploadDesc('');
    setFolderDraft('');
    await fetchAll();
    onUploaded();
  };

  const handleDelete = async (item: MediaUpload) => {
    const { error } = await sb.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
    if (error) {
      setStatus({ type: 'error', msg: `Delete failed: ${error.message}` });
      return;
    }

    const { error: dbError } = await sb.from('media_uploads').delete().eq('id', item.id);
    if (dbError) {
      setStatus({ type: 'error', msg: `Database cleanup failed: ${dbError.message}` });
      return;
    }

    setStatus({ type: 'success', msg: 'Media deleted.' });
    await fetchAll();
    onUploaded();
  };

  const handleToggleActive = async (item: MediaUpload) => {
    const { error } = await sb.from('media_uploads').update({ is_active: !item.is_active }).eq('id', item.id);

    if (error) {
      setStatus({ type: 'error', msg: `Visibility update failed: ${error.message}` });
      return;
    }

    setStatus({ type: 'success', msg: 'Visibility updated.' });
    await fetchAll();
    onUploaded();
  };

  if (!open) return null;

  return (
    <div
      className="media-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="media-modal" ref={modalRef} tabIndex={-1} aria-modal="true" role="dialog">
        <div className="media-modal-header">
          <div>
            <h2>
              <Gem size={20} />
              Manage Media
            </h2>
            <p className="media-modal-sub">
              Signed in as {admin.email}. Uploads appear in the public gallery under &quot;My uploads&quot;.
            </p>
          </div>
          <button type="button" onClick={() => void admin.signOut().then(onClose)} className="media-close media-signout">Sign out</button>
          <button type="button" onClick={onClose} className="media-close" aria-label="Close media panel">
            <X size={22} />
          </button>
        </div>

        {status && (
          <div className={`media-status media-status-${status.type}`} role="status">
            {status.msg}
          </div>
        )}

        <div className="media-modal-body">
          <div className="media-upload-section">
            <div className="media-upload-fields">
              <div>
                <label className="media-label" htmlFor="mm-title">Title (optional)</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Emerald excavation site"
                  id="mm-title"
                  className="media-input"
                />
              </div>

              <div>
                <label className="media-label" htmlFor="mm-desc">Description (optional)</label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="e.g. Field work in Sanaag region"
                  id="mm-desc"
                  className="media-input"
                />
              </div>

              <div>
                <label className="media-label" htmlFor="mm-cat">Where should it appear?</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => {
                    const next = e.target.value as MediaCategory;
                    setUploadCategory(next);
                    setSelectedFolder('');
                  }}
                  id="mm-cat"
                  className="media-input media-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="media-folder-box">
              <div className="media-folder-header">
                <span className="media-label">
                  <Folder size={14} />
                  Folder
                </span>
              </div>

              <div className="media-folder-toolbar">
                <div className="media-folder-list">
                  <button
                    className={`media-folder-button ${!activeFolder ? 'active' : ''}`}
                    type="button"
                    onClick={() => setSelectedFolder('')}
                  >
                    Root
                  </button>

                  {folders.map((folder) => (
                    <button
                      key={folder.path}
                      type="button"
                      className={`media-folder-button ${activeFolder === folder.path.replace(`${uploadCategory}/`, '') ? 'active' : ''}`}
                      onClick={() => setSelectedFolder(folder.path.replace(`${uploadCategory}/`, ''))}
                    >
                      {folder.path.replace(`${uploadCategory}/`, '')}
                      <span>({folder.count})</span>
                    </button>
                  ))}
                </div>

                <div className="media-folder-create">
                  <input
                    type="text"
                    value={folderDraft}
                    onChange={(e) => setFolderDraft(e.target.value)}
                    placeholder="New folder name"
                    className="media-input"
                    aria-label="Create a new folder"
                  />
                  <button type="button" className="media-primary-btn" onClick={handleCreateFolder} disabled={uploading}>
                    <Plus size={14} />
                    Create folder
                  </button>
                </div>
              </div>

              <div className="media-folder-target">
                Upload target:
                <strong>{activeFolder ? `${uploadCategory}/${activeFolder}` : `${uploadCategory}/root`}</strong>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="media-dropzone"
              role="button"
              tabIndex={0}
              aria-label="Upload media files"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {uploading ? (
                <div className="media-dropzone-loading">
                  <Loader2 size={32} className="media-spin" />
                  <p>Uploading...</p>
                </div>
              ) : (
                <div className="media-dropzone-idle">
                  <Upload size={32} />
                  <p>
                    Drag &amp; drop or <span>click to browse</span>
                  </p>
                  <p className="media-dropzone-hint">Photos (JPG, PNG, WebP, GIF) and videos (MP4, WebM, MOV) up to 10 MB each</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="media-file-hidden"
                onChange={(e) => handleUpload(e.target.files)}
                aria-label="Choose media files to upload"
              />
            </div>

            {uploadQueue.length > 0 && (
              <div className="media-progress-list" aria-live="polite">
                {uploadQueue.map((item) => (
                  <div key={`${item.id}-${item.name}`} className={`media-progress-item ${item.status}`}>
                    <div className="media-progress-meta">
                      <span>{item.name}</span>
                      <small>{item.message}</small>
                    </div>
                    <div className="media-progress-bar">
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="media-loading">
              <Loader2 size={24} className="media-spin" />
            </div>
          ) : (
            <div className="media-list">
              {visibleMedia.length === 0 ? (
                <div className="media-empty">
                  <ImageIcon size={48} />
                  <p>
                    No uploads yet in this folder. Use the upload area above to add your photos and videos.
                  </p>
                </div>
              ) : (
                CATEGORIES.map((cat) => {
                  const items = visibleMedia.filter((m) => m.category === cat.value);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.value} className="media-cat-group">
                      <h3 className="media-cat-title">
                        {cat.label} <span>({items.length})</span>
                      </h3>
                      <div className="media-cat-grid">
                        {items.map((item) => (
                          <div key={item.id} className="media-thumb">
                            <div className="media-thumb-media">
                              {item.media_type === 'video' ? (
                                <video src={item.public_url} muted className="media-thumb-video" />
                              ) : (
                                <img src={item.public_url} alt={item.title || 'Uploaded media'} className="media-thumb-img" />
                              )}
                              {item.media_type === 'video' && (
                                <div className="media-video-badge">
                                  <Video size={14} />
                                </div>
                              )}
                            </div>

                            <div className="media-thumb-hidden-badge">{!item.is_active && <span>Hidden</span>}</div>

                            <div className="media-thumb-overlay">
                              <div className="media-thumb-actions">
                                <button
                                  onClick={() => handleToggleActive(item)}
                                  className="media-thumb-btn"
                                  title={item.is_active ? 'Hide' : 'Show'}
                                  aria-label={item.is_active ? 'Hide media item' : 'Show media item'}
                                >
                                  {item.is_active ? <Check size={14} /> : <ImageIcon size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="media-thumb-btn media-thumb-delete"
                                  title="Delete"
                                  aria-label="Delete media item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <p className="media-thumb-name">{item.title || 'Untitled'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerLogin({ onClose, admin }: Pick<MediaPanelProps, 'onClose' | 'admin'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(await admin.signIn(email, password));
    setBusy(false);
  };

  const signedInNotAdmin = admin.email && !admin.isAdmin && !admin.checking;

  return (
    <div className="media-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="media-modal media-login" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Owner login">
        <div className="media-modal-header">
          <h2><Gem size={20} /> Owner login</h2>
          <button type="button" onClick={onClose} className="media-close" aria-label="Close"><X size={22} /></button>
        </div>
        {signedInNotAdmin ? (
          <div className="media-modal-body">
            <p className="media-status media-status-error" role="alert">{admin.email} is not an authorised media manager.</p>
            <button type="button" className="media-primary-btn" onClick={() => void admin.signOut()}>Sign out</button>
          </div>
        ) : (
          <form className="media-modal-body" onSubmit={submit}>
            <label className="media-label" htmlFor="ol-email">Email</label>
            <input id="ol-email" type="email" autoComplete="username" className="media-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className="media-label" htmlFor="ol-pass">Password</label>
            <input id="ol-pass" type="password" autoComplete="current-password" className="media-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="media-status media-status-error" role="alert">{error}</p>}
            <button className="media-primary-btn" type="submit" disabled={busy || admin.checking || !admin.client}>{busy ? 'Signing in…' : admin.checking || !admin.client ? 'Connecting securely…' : 'Sign in'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MediaPanel(props: MediaPanelProps) {
  if (!props.open) return null;
  if (!props.admin.client || !props.admin.isAdmin) return <OwnerLogin onClose={props.onClose} admin={props.admin} />;
  return <MediaManager {...props} />;
}

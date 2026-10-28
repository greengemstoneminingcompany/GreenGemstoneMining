import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, Check, ChevronDown, Clock3, Eye, History, ImagePlus, LayoutGrid, Link2, LogIn, LogOut, Minus, Monitor, Plus, Redo2, Save, Smartphone, Tablet, Type, Undo2, X } from 'lucide-react';
import { applyPublishedVisualEditorPayload } from '@/lib/visualEditorBridge';
import type { VisualEditorServerDraft, VisualEditorServerVersion } from '@/lib/visualEditorBridge';

type EditorPayload = {
  text?: Record<string, { after: string }>;
  styles?: Record<string, Record<string, unknown>>;
  hidden?: Record<string, boolean>;
  actions?: Record<string, Record<string, unknown>>;
  blocks?: Array<Record<string, unknown>>;
};
type EditorTab = 'edit' | 'add' | 'history' | 'ai';
type Dock = 'float' | 'left' | 'right';
type Session = { email: string | null; isAdmin: boolean };

const emptyPayload = (): EditorPayload => ({ text: {}, styles: {}, hidden: {}, actions: {}, blocks: [] });
const safeSelector = (el: Element): string => {
  const id = (el as HTMLElement).id;
  if (id && /^[A-Za-z][\w-]*$/.test(id)) return '#' + id;
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.id !== 'root' && node.tagName.toLowerCase() !== 'body') {
    const tag = node.tagName.toLowerCase();
    const classes = Array.from(node.classList).filter((c) => /^[A-Za-z_-][\w-]*$/.test(c)).slice(0, 2);
    let part = tag + classes.map((c) => '.' + c).join('');
    const parent = node.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter((child) => child.tagName === node?.tagName);
      if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
    }
    parts.unshift(part);
    if (parent?.id === 'root') break;
    node = parent;
  }
  return parts.join(' > ').slice(0, 500);
};

export default function PreviewEditorStudio() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dock, setDock] = useState<Dock>('float');
  const [tab, setTab] = useState<EditorTab>('edit');
  const [session, setSession] = useState<Session>({ email: null, isAdmin: false });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [payload, setPayload] = useState<EditorPayload>(emptyPayload);
  const [past, setPast] = useState<EditorPayload[]>([]);
  const [future, setFuture] = useState<EditorPayload[]>([]);
  const [selected, setSelected] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('inherit');
  const [textColor, setTextColor] = useState('#f2eee4');
  const [backgroundColor, setBackgroundColor] = useState('#111a15');
  const [padding, setPadding] = useState('16');
  const [radius, setRadius] = useState('8');
  const [linkUrl, setLinkUrl] = useState('');
  const [newTitle, setNewTitle] = useState('New section');
  const [newText, setNewText] = useState('Add your content here.');
  const [imageUrl, setImageUrl] = useState('');
  const [drafts, setDrafts] = useState<VisualEditorServerDraft[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('Website draft');
  const [draftVersion, setDraftVersion] = useState(0);
  const [versions, setVersions] = useState<VisualEditorServerVersion[]>([]);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const originalText = useRef(new Map<string, string>());
  const originalStyles = useRef(new Map<string, Map<string, string>>());
  const originalDisplay = useRef(new Map<string, string>());

  const api = useMemo(() => typeof window !== 'undefined' ? window.__GGMC_EDITOR_API__ : undefined, []);

  const enabled = useMemo(() => {
    if (import.meta.env.VITE_VISUAL_EDITOR_ENABLED !== 'true') return false;
    const expectedRef = import.meta.env.VITE_VISUAL_EDITOR_SUPABASE_REF;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!expectedRef || !supabaseUrl || typeof window === 'undefined') return false;
    try {
      const actualRef = new URL(supabaseUrl).hostname.split('.')[0];
      return actualRef === expectedRef && (window.location.hostname.endsWith('.vercel.app') || window.location.hostname === 'localhost');
    } catch {
      return false;
    }
  }, []);

  const restoreCanvas = useCallback((next: EditorPayload) => {
    for (const [selector, value] of originalText.current) {
      try { document.querySelectorAll(selector).forEach((el) => { if (!el.closest('#ggmc-visual-editor')) el.textContent = value; }); } catch { /* stale selector */ }
    }
    for (const [selector, props] of originalStyles.current) {
      try { document.querySelectorAll(selector).forEach((el) => props.forEach((value, key) => (el as HTMLElement).style.setProperty(key, value))); } catch { /* stale selector */ }
    }
    for (const [selector, value] of originalDisplay.current) {
      try { document.querySelectorAll(selector).forEach((el) => { (el as HTMLElement).style.display = value; }); } catch { /* stale selector */ }
    }
    document.querySelectorAll('[data-ve-block-id]').forEach((el) => el.remove());
    applyPublishedVisualEditorPayload(next as Record<string, unknown>);
  }, []);

  const changePayload = useCallback((next: EditorPayload) => {
    setPast((items) => [...items.slice(-79), payload]);
    setFuture([]);
    setPayload(next);
    restoreCanvas(next);
  }, [payload, restoreCanvas]);

  const selectedElement = useCallback((): HTMLElement | null => {
    if (!selected) return null;
    try { const el = document.querySelector(selected); return el instanceof HTMLElement && !el.closest('#ggmc-visual-editor') ? el : null; } catch { return null; }
  }, [selected]);

  const rememberText = (selector: string, el: HTMLElement) => {
    if (!originalText.current.has(selector)) originalText.current.set(selector, el.textContent ?? '');
  };
  const rememberStyle = (selector: string, el: HTMLElement, key: string) => {
    if (!originalStyles.current.has(selector)) originalStyles.current.set(selector, new Map());
    const map = originalStyles.current.get(selector)!;
    if (!map.has(key)) map.set(key, el.style.getPropertyValue(key));
  };

  const refreshDrafts = useCallback(async (): Promise<boolean> => {
    if (!api) {
      setMessage('The editor connection is not loaded. Reload this preview and try again.');
      return false;
    }
    try {
      setDrafts(await api.listDrafts());
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load saved drafts.');
      return false;
    }
  }, [api]);

  const loadSession = useCallback(async (): Promise<Session> => {
    if (!api) {
      const error = new Error('The editor connection is not loaded. Reload this preview and try again.');
      setMessage(error.message);
      throw error;
    }
    setBusy(true);
    try {
      const current = await api.getSession();
      setSession(current);
      if (!current.isAdmin) {
        const error = new Error(current.email
          ? 'Your account signed in, but it is not authorised to edit this preview.'
          : 'You are not signed in yet.');
        setMessage(error.message);
        return current;
      }
      const draftsLoaded = await refreshDrafts();
      if (!draftsLoaded) throw new Error('You are signed in, but saved drafts could not be loaded. The error is shown here; please retry after checking the connection.');
      return current;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not verify your sign-in. Please try again.';
      setMessage(message);
      throw error;
    } finally {
      setBusy(false);
    }
  }, [api, refreshDrafts]);

  useEffect(() => { if (open) void loadSession().catch(() => {}); }, [open, loadSession]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (device === 'desktop') { root.style.removeProperty('max-width'); root.style.removeProperty('margin'); }
    else { root.style.maxWidth = device === 'tablet' ? '820px' : '390px'; root.style.margin = '0 auto'; }
    return () => { root.style.removeProperty('max-width'); root.style.removeProperty('margin'); };
  }, [device]);

  useEffect(() => {
    if (!open || !session.isAdmin || collapsed) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest('#ggmc-visual-editor')) return;
      const el = target.closest('h1,h2,h3,h4,p,span,a,button,img,li,small,strong,em') as HTMLElement | null;
      if (!el || el.closest('#ggmc-visual-editor') || el.closest('header') || el.closest('footer') && el.classList.contains('owner-link')) return;
      if (!(el instanceof HTMLImageElement) && el.childElementCount > 0) return;
      const selector = safeSelector(el);
      if (!selector || selector.length > 500) return;
      setSelected(selector);
      setSelectedText(el instanceof HTMLImageElement ? el.alt : (el.textContent ?? '').slice(0, 10000));
      setFontSize(String(Math.round(parseFloat(getComputedStyle(el).fontSize) || 16)));
      setFontFamily(getComputedStyle(el).fontFamily || 'inherit');
      setTextColor(rgbToHex(getComputedStyle(el).color) || '#f2eee4');
      setBackgroundColor(rgbToHex(getComputedStyle(el).backgroundColor) || '#111a15');
      setPadding(String(Math.round(parseFloat(getComputedStyle(el).padding) || 0)));
      setRadius(String(Math.round(parseFloat(getComputedStyle(el).borderRadius) || 0)));
      setLinkUrl(el instanceof HTMLAnchorElement ? el.href : '');
      el.dataset.veSelected = 'true';
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [open, session.isAdmin, collapsed]);

  const updateText = (value: string) => {
    setSelectedText(value);
    const el = selectedElement();
    if (!el) return;
    rememberText(selected, el);
    if (el instanceof HTMLImageElement) {
      el.alt = value;
      changePayload({ ...payload, styles: { ...payload.styles, [selected]: { ...(payload.styles?.[selected] ?? {}), '--ve-image-alt': value } } });
    } else {
      const next = { ...payload, text: { ...payload.text, [selected]: { after: value } } };
      changePayload(next);
    }
  };

  const updateStyle = (key: string, value: string) => {
    const el = selectedElement();
    if (!el) return;
    rememberStyle(selected, el, key);
    el.style.setProperty(key, value);
    changePayload({ ...payload, styles: { ...payload.styles, [selected]: { ...(payload.styles?.[selected] ?? {}), [key]: value } } });
  };

  const undo = () => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, -1)); setFuture([payload, ...future]); setPayload(previous); restoreCanvas(previous);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture(future.slice(1)); setPast([...past, payload]); setPayload(next); restoreCanvas(next);
  };

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!api) {
      setMessage('The editor connection is not loaded. Reload this preview and try again.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await api.signIn(email.trim(), password);
      setPassword('');
      const current = await loadSession();
      if (!current.isAdmin) {
        setMessage('Sign-in completed, but this account does not have preview editor access.');
        return;
      }
      setMessage('Signed in successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed. Please check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!api) return;
    setBusy(true); setMessage('');
    try {
      const saved = await api.saveDraft({ id: draftId, expectedVersion: draftVersion, name: draftName, payload: payload as Record<string, unknown> });
      setDraftId(saved.id); setDraftVersion(saved.version); setDraftName(saved.name); setMessage('Draft saved securely to the preview database.');
      await refreshDrafts();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed. Reload the latest draft and try again.'); }
    finally { setBusy(false); }
  };

  const publishPreview = async () => {
    if (!api || !draftId) { setMessage('Save this draft first, then publish its preview snapshot.'); return; }
    setBusy(true); setMessage('');
    try {
      const published = await api.publishDraft(draftId, draftVersion);
      setDraftVersion(published.version);
      setPayload(published.payload as EditorPayload);
      restoreCanvas(published.payload as EditorPayload);
      setMessage('Preview snapshot published to this preview website. Production was not changed.');
      await refreshDrafts();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not publish preview snapshot.'); }
    finally { setBusy(false); }
  };

  const loadDraft = (draft: VisualEditorServerDraft) => {
    setDraftId(draft.id); setDraftName(draft.name); setDraftVersion(draft.version);
    setPayload(draft.payload as EditorPayload); setPast([]); setFuture([]); restoreCanvas(draft.payload as EditorPayload);
    setMessage('Loaded saved draft: ' + draft.name);
  };

  const loadVersions = async () => {
    if (!api || !draftId) { setMessage('Save a draft before opening its version history.'); return; }
    setBusy(true);
    try { setVersions(await api.listVersions(draftId)); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load history.'); }
    finally { setBusy(false); }
  };

  const restoreVersion = async (version: number) => {
    if (!api || !draftId) return;
    setBusy(true);
    try {
      const restored = await api.restoreVersion(draftId, version);
      loadDraft(restored);
      setMessage('Restored as a new draft. Earlier versions remain unchanged.');
      await refreshDrafts();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not restore that version.'); }
    finally { setBusy(false); }
  };

  const addBlock = (kind: 'section' | 'card' | 'text' | 'image' | 'link' | 'divider' | 'spacer') => {
    const block: Record<string, unknown> = { id: crypto.randomUUID(), kind, title: kind === 'divider' || kind === 'spacer' ? '' : newTitle, text: kind === 'divider' || kind === 'spacer' ? '' : newText };
    if (kind === 'image') { block.src = imageUrl; block.alt = newTitle; }
    if (kind === 'link') { block.href = linkUrl || '#contact'; block.title = newTitle; }
    const next = { ...payload, blocks: [...(payload.blocks ?? []), block] };
    changePayload(next);
    setTab('edit');
    setMessage('Added a new ' + kind + ' block to the preview canvas. Save to keep it.');
  };

  const dockStyle = dock === 'left'
    ? { left: '12px', right: 'auto', top: '12px', bottom: '12px', width: 'min(440px, calc(100vw - 24px))', height: 'auto', maxHeight: 'calc(100vh - 24px)' }
    : dock === 'right'
      ? { right: '12px', left: 'auto', top: '12px', bottom: '12px', width: 'min(440px, calc(100vw - 24px))', height: 'auto', maxHeight: 'calc(100vh - 24px)' }
      : { right: '20px', bottom: '20px', left: 'auto', top: 'auto', width: 'min(440px, calc(100vw - 24px))', height: 'min(760px, calc(100vh - 40px))', maxHeight: 'calc(100vh - 24px)' };

  if (!enabled) return null;
  if (!open) return <button className="ve-launcher" onClick={() => { setOpen(true); setCollapsed(false); }} type="button"><LayoutGrid size={17} /> Preview Editor</button>;

  return (
    <>
      <style>{studioCss}</style>
      {device !== 'desktop' && <div className={'ve-device-frame ve-device-' + device} aria-hidden="true" />}
      <aside id="ggmc-visual-editor" className={'ve-studio' + (collapsed ? ' is-collapsed' : '') + (dock !== 'float' ? ' is-docked' : '')} style={collapsed ? { right: '20px', bottom: '20px', left: 'auto', top: 'auto', width: 'auto', height: 'auto' } : dockStyle}>
        <header className="ve-head">
          <div className="ve-brand"><span className="ve-mark"><LayoutGrid size={17} /></span><span><strong>Preview Editor</strong><small>Visual Studio · Preview only</small></span></div>
          <div className="ve-head-actions">
            <button title="Dock left" aria-label="Dock left" onClick={() => setDock(dock === 'left' ? 'float' : 'left')}><ArrowLeftToLine size={15} /></button>
            <button title="Dock right" aria-label="Dock right" onClick={() => setDock(dock === 'right' ? 'float' : 'right')}><ArrowRightToLine size={15} /></button>
            <button title={collapsed ? 'Expand studio' : 'Collapse studio'} aria-label={collapsed ? 'Expand studio' : 'Collapse studio'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <Plus size={16} /> : <Minus size={16} />}</button>
            <button title="Close editor" aria-label="Close editor" onClick={() => { setOpen(false); setDevice('desktop'); document.getElementById('root')?.style.removeProperty('max-width'); document.getElementById('root')?.style.removeProperty('margin'); }}><X size={16} /></button>
          </div>
        </header>
        {!collapsed && (
          <>
            {!session.isAdmin ? (
              <form className="ve-login" onSubmit={signIn}>
                <div className="ve-login-icon"><LogIn size={24} /></div>
                <h2>Sign in to edit your preview</h2>
                <p>Use the owner account you created in the dedicated preview Supabase project.</p>
                <label>Email address<input autoComplete="username" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
                <label>Password<input autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your Supabase Auth password" /></label>
                <button className="ve-primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in securely'}</button>
                {message && <p className="ve-message" role="alert">{message}</p>}
                <p className="ve-muted">Your password is sent directly to Supabase Auth. It is not saved in this editor.</p>
              </form>
            ) : (
              <>
                <div className="ve-account"><span><Check size={13} /> Signed in as {session.email}</span><button onClick={async () => { await api?.signOut(); setSession({ email: null, isAdmin: false }); setMessage('Signed out.'); }}><LogOut size={13} /> Sign out</button></div>
                <div className="ve-commandbar">
                  <button disabled={!past.length} onClick={undo} title="Undo"><Undo2 size={16} /> Undo</button>
                  <button disabled={!future.length} onClick={redo} title="Redo"><Redo2 size={16} /> Redo</button>
                  <span className="ve-command-spacer" />
                  <button onClick={() => setDevice(device === 'desktop' ? 'tablet' : device === 'tablet' ? 'mobile' : 'desktop')} title="Toggle responsive preview">{device === 'desktop' ? <Monitor size={15} /> : device === 'tablet' ? <Tablet size={15} /> : <Smartphone size={15} />}{device[0].toUpperCase() + device.slice(1)}</button>
                </div>
                <div className="ve-draftbar">
                  <select aria-label="Load saved draft" value={draftId ?? ''} onChange={(e) => { const found = drafts.find((d) => d.id === e.target.value); if (found) loadDraft(found); else { setDraftId(null); setDraftVersion(0); setPayload(emptyPayload()); restoreCanvas(emptyPayload()); } }}>
                    <option value="">New draft…</option>{drafts.map((d) => <option key={d.id} value={d.id}>{d.name} · v{d.version}</option>)}
                  </select>
                  <input aria-label="Draft name" value={draftName} maxLength={120} onChange={(e) => setDraftName(e.target.value)} />
                </div>
                <nav className="ve-tabs" aria-label="Editor tools">
                  <button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}><Type size={15} /> Edit</button>
                  <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}><Plus size={15} /> Add</button>
                  <button className={tab === 'history' ? 'active' : ''} onClick={() => { setTab('history'); void loadVersions(); }}><History size={15} /> History</button>
                  <button className={tab === 'ai' ? 'active' : ''} onClick={() => setTab('ai')}><Eye size={15} /> AI Lab</button>
                </nav>
                <div className="ve-content">
                  {tab === 'edit' && (
                    <section className="ve-panel">
                      <h3>Selected element</h3>
                      <p className="ve-help">Click any visible text, image, card, or section on the page behind this panel to select it.</p>
                      {selected ? (
                        <>
                          <div className="ve-selected"><span>Selected</span><code>{selected}</code></div>
                          <label>{document.querySelector(selected) instanceof HTMLImageElement ? 'Image description (alt text)' : 'Text content'}
                            <textarea rows={4} value={selectedText} onChange={(e) => updateText(e.target.value)} />
                          </label>
                          <div className="ve-two">
                            <label>Font size (px)<input type="number" min="8" max="120" value={fontSize} onChange={(e) => { setFontSize(e.target.value); updateStyle('font-size', Math.max(8, Math.min(120, Number(e.target.value) || 16)) + 'px'); }} /></label>
                            <label>Corner radius (px)<input type="number" min="0" max="80" value={radius} onChange={(e) => { setRadius(e.target.value); updateStyle('border-radius', Math.max(0, Math.min(80, Number(e.target.value) || 0)) + 'px'); }} /></label>
                          </div>
                          <label>Font family<select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); updateStyle('font-family', e.target.value); }}><option value="inherit">Match website</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="'Trebuchet MS', sans-serif">Trebuchet MS</option><option value="system-ui, sans-serif">System UI</option><option value="'Courier New', monospace">Courier New</option></select></label>
                          <div className="ve-two">
                            <label>Text color<input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); updateStyle('color', e.target.value); }} /></label>
                            <label>Background<input type="color" value={backgroundColor} onChange={(e) => { setBackgroundColor(e.target.value); updateStyle('background-color', e.target.value); }} /></label>
                          </div>
                          <label>Padding (px)<input type="range" min="0" max="80" value={padding} onChange={(e) => { setPadding(e.target.value); updateStyle('padding', e.target.value + 'px'); }} /></label>
                          {document.querySelector(selected) instanceof HTMLAnchorElement && <label>Link URL<input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); updateStyle('--ve-link-href', e.target.value); const el = selectedElement(); if (el instanceof HTMLAnchorElement) el.href = e.target.value; }} placeholder="https://…" /></label>}
                          <button className="ve-secondary" onClick={() => { const el = selectedElement();
                    if (el && !originalDisplay.current.has(selected)) originalDisplay.current.set(selected, el.style.display);
                    const next = { ...payload, hidden: { ...payload.hidden, [selected]: !(payload.hidden?.[selected] ?? false) } }; changePayload(next); }}><Eye size={14} /> {payload.hidden?.[selected] ? 'Show element' : 'Hide element'}</button>
                        </>
                      ) : <div className="ve-empty"><Type size={25} /><strong>Nothing selected yet</strong><span>Click a heading, paragraph, image, or card on the page.</span></div>}
                    </section>
                  )}
                  {tab === 'add' && (
                    <section className="ve-panel">
                      <h3>Add to page</h3><p className="ve-help">New content is added to the preview. Review it, then save your draft.</p>
                      <label>Title<input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={120} /></label>
                      <label>Text<textarea rows={3} value={newText} onChange={(e) => setNewText(e.target.value)} maxLength={5000} /></label>
                      <div className="ve-add-grid">
                        <button onClick={() => addBlock('section')}><LayoutGrid size={17} /> Section</button>
                        <button onClick={() => addBlock('card')}><Plus size={17} /> Content card</button>
                        <button onClick={() => addBlock('text')}><Type size={17} /> Text block</button>
                        <button onClick={() => addBlock('divider')}><Minus size={17} /> Divider</button>
                        <button onClick={() => addBlock('spacer')}><ArrowDownToLine size={17} /> Spacer</button>
                        <button onClick={() => addBlock('link')}><Link2 size={17} /> Link button</button>
                      </div>
                      <label>Image URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… or /images/photo.jpg" /></label>
                      <button className="ve-secondary" onClick={() => addBlock('image')}><ImagePlus size={15} /> Add image block</button>
                    </section>
                  )}
                  {tab === 'history' && (
                    <section className="ve-panel">
                      <h3>Saved history</h3><p className="ve-help">Each save creates an immutable database version. Restore makes a new draft instead of overwriting history.</p>
                      <button className="ve-secondary" onClick={() => void loadVersions()}><Clock3 size={15} /> Refresh timeline</button>
                      {!draftId && <div className="ve-empty">Save a draft first to start its version timeline.</div>}
                      <div className="ve-timeline">{versions.map((v) => <article key={v.id} className="ve-version"><div><strong>Version {v.version}</strong><small>{v.note} · {new Date(v.created_at).toLocaleString()}</small></div><button onClick={() => void restoreVersion(v.version)}>Restore</button></article>)}</div>
                    </section>
                  )}
                  {tab === 'ai' && (
                    <section className="ve-panel">
                      <h3>AI creative lab</h3>
                      <div className="ve-ai-note"><strong>AI connection not configured yet</strong><p>Magic Write, generated images/video, automatic style matching, and external asset libraries need a secure AI/provider connection and usage budget. This panel does not pretend to generate AI content until that is connected.</p></div>
                      <p className="ve-help">Available now: select and edit website content, tune typography and color, add content blocks, preview responsive widths, save drafts, and restore versions.</p>
                    </section>
                  )}
                </div>
                <footer className="ve-footer">
                  {message && <p className="ve-message" role="status">{message}</p>}
                  <div className="ve-footer-actions">
                    <button className="ve-secondary" disabled={busy} onClick={() => void saveDraft()}><Save size={15} /> {busy ? 'Working…' : 'Save draft'}</button>
                    <button className="ve-primary" disabled={busy} onClick={() => void publishPreview()}><Check size={15} /> Publish preview</button>
                  </div>
                  <small>Preview database only · Production is not changed by this button</small>
                </footer>
                <div className="ve-resize-hint">Drag the lower-right corner to resize the studio.</div>
              </>
            )}
          </>
        )}
      </aside>
    </>
  );
}

function rgbToHex(color: string): string {
  const match = color.match(/\d+/g);
  if (!match || match.length < 3) return '#f2eee4';
  return '#' + match.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

const studioCss = `
.ve-launcher{position:fixed;right:22px;bottom:22px;z-index:9998;display:flex;align-items:center;gap:9px;border:1px solid #c4a252;border-radius:999px;background:#101a15;color:#f2eee4;padding:13px 18px;box-shadow:0 12px 40px #0008;font:600 13px system-ui,sans-serif}
.ve-studio{position:fixed;z-index:9999;display:flex;flex-direction:column;overflow:auto;resize:both;min-width:310px;min-height:260px;border:1px solid #4b5c4e;border-radius:18px;background:#0b110e;color:#f2eee4;box-shadow:0 24px 90px #000a;font:13px/1.45 system-ui,sans-serif;scrollbar-color:#455447 #101712}
.ve-studio.is-docked{resize:both;border-radius:16px}
.ve-studio.is-collapsed{min-width:0;min-height:0;resize:none;border-radius:999px;overflow:hidden}
.ve-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 14px;background:linear-gradient(130deg,#17241b,#101713);border-bottom:1px solid #2a392d;position:sticky;top:0;z-index:2}
.ve-brand{display:flex;align-items:center;gap:9px}.ve-brand>span:last-child{display:flex;flex-direction:column}.ve-brand strong{font-size:13px;letter-spacing:.01em}.ve-brand small{font-size:10px;color:#a6b1a6}.ve-mark{display:grid;place-items:center;width:32px;height:32px;border:1px solid #6d5c35;border-radius:10px;color:#e4c87c}
.ve-head-actions{display:flex;gap:3px}.ve-head-actions button,.ve-commandbar button{display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border:1px solid transparent;border-radius:8px;color:#bfc9be}.ve-head-actions button:hover,.ve-commandbar button:hover{background:#26362a;color:#fff}
.ve-account{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 14px;color:#b7c6b6;background:#0f1812;font-size:10px}.ve-account span,.ve-account button{display:flex;align-items:center;gap:5px}.ve-account svg{color:#a7d3a7}.ve-account button{color:#c7d0c7}
.ve-commandbar{display:flex;align-items:center;gap:4px;padding:8px 12px;border-bottom:1px solid #233027}.ve-commandbar button{font-size:11px}.ve-commandbar button:disabled{opacity:.3;cursor:not-allowed}.ve-command-spacer{flex:1}
.ve-draftbar{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:10px 12px;border-bottom:1px solid #233027}.ve-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px 12px;border-bottom:1px solid #233027}.ve-tabs button{display:flex;justify-content:center;align-items:center;gap:5px;padding:9px 4px;border-radius:9px;color:#aeb9ae;font-size:11px}.ve-tabs button.active{background:#28392b;color:#e4c87c;box-shadow:inset 0 0 0 1px #4b603e}
.ve-content{padding:14px;overflow:auto;flex:1;min-height:0}.ve-panel h3{font-size:15px;margin:0 0 6px;color:#f6f2e9}.ve-help{font-size:11px;color:#9eaa9e;line-height:1.6;margin:0 0 14px}.ve-panel label,.ve-login label{display:flex;flex-direction:column;gap:6px;margin:11px 0;color:#c4cfc3;font-size:11px}.ve-panel input:not([type=color]):not([type=range]),.ve-panel textarea,.ve-panel select,.ve-login input,.ve-draftbar input,.ve-draftbar select{width:100%;border:1px solid #344538;border-radius:8px;padding:9px 10px;background:#111a14;color:#f2eee4;outline:none}.ve-panel input:focus,.ve-panel textarea:focus,.ve-login input:focus{border-color:#c4a252}.ve-panel textarea{resize:vertical;min-height:65px}.ve-panel input[type=color]{width:100%;height:34px;border:1px solid #344538;border-radius:8px;background:#111a14;padding:3px}.ve-panel input[type=range]{width:100%;accent-color:#c4a252}.ve-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ve-selected{display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:8px;background:#111a14;border:1px solid #2b3b2e}.ve-selected span{font-size:10px;color:#9da99c}.ve-selected code{font-size:10px;overflow-wrap:anywhere;color:#e4c87c}.ve-empty{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:30px 16px;border:1px dashed #354438;border-radius:12px;color:#aab6a9}.ve-empty strong{color:#e6ede5}.ve-empty span{font-size:11px;line-height:1.5}.ve-secondary,.ve-primary{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:9px;padding:10px 12px;font-size:11px;font-weight:650}.ve-secondary{border:1px solid #3b4b3e;background:#141e17;color:#d5ded4}.ve-primary{border:1px solid #d2b15e;background:#c4a252;color:#11160f}.ve-primary:disabled,.ve-secondary:disabled{opacity:.5;cursor:wait}.ve-add-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:12px 0}.ve-add-grid button{display:flex;align-items:center;gap:9px;text-align:left;border:1px solid #2f4033;background:#111a14;border-radius:10px;padding:12px;color:#d8e1d6}.ve-add-grid button svg{color:#e4c87c}.ve-ai-note{padding:14px;border:1px solid #66552f;background:#211c10;border-radius:12px;margin:14px 0}.ve-ai-note strong{color:#e4c87c}.ve-ai-note p{font-size:11px;line-height:1.6;color:#d2c9b0;margin-top:7px}.ve-timeline{display:flex;flex-direction:column;gap:8px;margin-top:12px}.ve-version{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border:1px solid #2b3b2e;border-radius:9px}.ve-version div{display:flex;flex-direction:column;gap:4px}.ve-version strong{font-size:11px}.ve-version small{font-size:10px;color:#9eaa9e}.ve-version button{padding:7px 9px;border:1px solid #3b4b3e;border-radius:7px;color:#e4c87c;font-size:10px}.ve-footer{padding:12px;border-top:1px solid #28362b;background:#0e1510}.ve-message{font-size:10px;line-height:1.5;color:#e4c87c;margin-bottom:8px}.ve-footer-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ve-footer>small{display:block;text-align:center;color:#879487;font-size:9px;margin-top:9px}.ve-resize-hint{padding:0 12px 8px;color:#6e7d70;font-size:9px;text-align:right}.ve-login{padding:24px 20px}.ve-login-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#263629;color:#e4c87c}.ve-login h2{font-size:17px;margin:14px 0 6px}.ve-login p{font-size:11px;color:#a6b1a6;line-height:1.6}.ve-login .ve-primary{width:100%;margin:8px 0 12px}.ve-muted{font-size:10px!important}.ve-device-frame{position:fixed;z-index:8000;pointer-events:none;top:0;bottom:0;left:50%;transform:translateX(-50%);border-left:1px dashed #c4a25266;border-right:1px dashed #c4a25266;background:#c4a25205}.ve-device-tablet{width:min(820px,100vw)}.ve-device-mobile{width:min(390px,100vw)}@media(max-width:600px){.ve-studio{right:8px!important;bottom:8px!important;left:8px!important;top:auto!important;width:auto!important;max-height:82vh}.ve-launcher{right:12px;bottom:12px}.ve-brand small{display:none}.ve-head{padding:10px}.ve-two{gap:7px}}
`;

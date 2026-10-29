import { getSupabase } from '@/lib/supabase';
import DOMPurify from 'dompurify';

export interface VisualEditorServerDraft {
 id:string; name:string; payload:Record<string,unknown>; version:number;
 status:'draft'|'published'|'archived'; updated_at:string; published_at:string|null;
}
export interface VisualEditorServerVersion {
 id:number; draft_id:string; version:number; payload:Record<string,unknown>;
 status:'draft'|'published'|'restored'; created_at:string; note:string;
}
export interface VisualEditorBridge {
 getSession():Promise<{email:string|null;isAdmin:boolean}>;
 signIn(email:string,password:string):Promise<void>;
 signOut():Promise<void>;
 listDrafts():Promise<VisualEditorServerDraft[]>;
 saveDraft(input:{id:string|null;expectedVersion:number;name:string;payload:Record<string,unknown>}):Promise<VisualEditorServerDraft>;
 publishDraft(id:string,expectedVersion:number):Promise<VisualEditorServerDraft>;
 listVersions(id:string):Promise<VisualEditorServerVersion[]>;
 restoreVersion(id:string,version:number):Promise<VisualEditorServerDraft>;
 getPublishedPayload():Promise<Record<string,unknown>|null>;
 aiWrite(input:{mode:string;tone:string;text:string}):Promise<string>;
}
declare global { interface Window { __GGMC_EDITOR_API__?:VisualEditorBridge } }

function isDedicatedPreviewProject(): boolean {
 const expectedPreviewRef = import.meta.env.VITE_VISUAL_EDITOR_SUPABASE_REF;
 const previewEditorEnabled = import.meta.env.VITE_VISUAL_EDITOR_ENABLED === 'true';
 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 if (!previewEditorEnabled || !expectedPreviewRef || !supabaseUrl) return false;
 try {
  const actualRef = new URL(supabaseUrl).hostname.split('.')[0];
  const host = window.location.hostname;
  return actualRef === expectedPreviewRef && (host.endsWith('.vercel.app') || host === 'localhost');
 } catch { return false; }
}
async function getPreviewSupabase() {
 if (!isDedicatedPreviewProject()) return null;
 return getSupabase();
}
async function adminClient(){
 const sb=await getPreviewSupabase(); if(!sb)throw new Error('Visual editor is disabled until a dedicated preview Supabase project is configured.');
 const {data:{session}}=await sb.auth.getSession(); if(!session)throw new Error('Sign in with your owner account first.');
 const {data,error}=await sb.rpc('is_visual_editor_admin'); if(error||data!==true)throw new Error('This account is not authorised to manage the website.');
 return sb;
}
export function installVisualEditorBridge(){
 window.__GGMC_EDITOR_API__={
  async getSession(){
   const sb=await getPreviewSupabase();
   if(!sb)return {email:null,isAdmin:false};
   const {data:{session},error:sessionError}=await sb.auth.getSession();
   if(sessionError)throw new Error('Could not read the current sign-in session: '+sessionError.message);
   if(!session)return {email:null,isAdmin:false};
   const {data,error}=await sb.rpc('is_visual_editor_admin');
   if(error)throw new Error('Signed in, but the preview permission check failed: '+error.message);
   return {email:session.user.email??null,isAdmin:data===true};
  },
  async signIn(email,password){
   const sb=await getPreviewSupabase();
   if(!sb)throw new Error('Visual editor is disabled until a dedicated preview Supabase project is configured.');
   const {error}=await sb.auth.signInWithPassword({email,password});
   if(error)throw new Error('Supabase sign-in failed: '+error.message);
   const {data,error:permissionError}=await sb.rpc('is_visual_editor_admin');
   if(permissionError){
    await sb.auth.signOut();
    throw new Error('Your credentials were accepted, but the preview permission check failed: '+permissionError.message);
   }
   if(data!==true){
    await sb.auth.signOut();
    throw new Error('This account is not authorised to manage the website.');
   }
  },
  async signOut(){const sb=await getPreviewSupabase();await sb?.auth.signOut();},
  async listDrafts(){const sb=await adminClient();const {data,error}=await sb.rpc('list_visual_editor_drafts');if(error)throw error;return (data??[]) as VisualEditorServerDraft[];},
  async saveDraft(input){const sb=await adminClient();const {data,error}=await sb.rpc('save_visual_editor_draft',{p_draft_id:input.id,p_expected_version:input.expectedVersion,p_name:input.name,p_payload:input.payload});if(error)throw error;return data as VisualEditorServerDraft;},
  async publishDraft(id,expectedVersion){const sb=await adminClient();const {data,error}=await sb.rpc('publish_visual_editor_draft',{p_draft_id:id,p_expected_version:expectedVersion});if(error)throw error;return data as VisualEditorServerDraft;},
  async listVersions(id){const sb=await adminClient();const {data,error}=await sb.rpc('list_visual_editor_versions',{p_draft_id:id});if(error)throw error;return (data??[]) as VisualEditorServerVersion[];},
  async restoreVersion(id,version){const sb=await adminClient();const {data,error}=await sb.rpc('restore_visual_editor_version',{p_draft_id:id,p_version:version});if(error)throw error;return data as VisualEditorServerDraft;},
  async getPublishedPayload(){const sb=await getPreviewSupabase();if(!sb)return null;const {data,error}=await sb.rpc('get_published_visual_editor_payload');if(error)throw error;return (data??null) as Record<string,unknown>|null;},
  async aiWrite(input){const sb=await adminClient();const {data,error}=await sb.functions.invoke('magic-write',{body:input});if(error)throw new Error('AI writing request failed: '+error.message);if(!data||typeof data.text!=='string'||!data.text.trim())throw new Error('AI writing returned no reviewable text.');return data.text;}
 };
}

function hasControlOrBackslash(value: string, rejectSpaces = false): boolean {
 for (const char of value) { const code=char.charCodeAt(0); if (code <= (rejectSpaces ? 32 : 31) || code === 127 || char === '\\\\') return true; }
 return false;
}
function safePublishedImageSrc(value: unknown): value is string {
 if(typeof value!=='string'||hasControlOrBackslash(value,true))return false;
 if(/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value))return true;
 if(value.startsWith('/')&&!value.startsWith('//'))return true;
 try{const url=new URL(value,location.origin);return url.protocol==='https:'&&!url.username&&!url.password&&/^https:\/\//i.test(value);}catch{return false;}
}
function safePublishedHref(value: unknown): string {
 if(typeof value!=='string'||!value.trim()||hasControlOrBackslash(value,true))return '#';
 const raw=value.trim();if(/^#[\w-]*$/.test(raw))return raw;if(raw.startsWith('/')&&!raw.startsWith('//'))return raw;
 try{const url=new URL(raw,location.origin);return ['https:','http:','mailto:'].includes(url.protocol)&&!url.username&&!url.password?raw:'#';}catch{return '#';}
}
function safePublishedSelector(selector: string): boolean {
 return typeof selector === 'string' && selector.length > 0 && selector.length <= 500 && !/^(?:html|body|#root|#ggmc-visual-editor)$/i.test(selector.trim());
}
function safePublishedCssValue(prop: string, value: unknown): value is string {
 const allowed = new Set(['color','background-color','font-size','font-family','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration','text-transform','padding','padding-top','padding-right','padding-bottom','padding-left','margin','margin-top','margin-right','margin-bottom','margin-left','border','border-color','border-width','border-style','border-radius','box-shadow','background-size','background-position','filter','width','min-width','max-width','height','min-height','max-height','opacity','display','position','top','right','bottom','left','gap','column-gap','row-gap','object-fit','object-position']);
 if(typeof value!=='string'||value.length>=100||!allowed.has(prop)||Array.from(value).some(char=>{const code=char.charCodeAt(0);return ['<','>','\\\\',';','{','}'].includes(char)||code<=31||code===127;})||/(?:url\s*\(|expression\s*\(|javascript\s*:|vbscript\s*:|@import|!important)/i.test(value))return false;
 try{return typeof CSS!=='undefined'&&CSS.supports(prop,value.trim());}catch{return false;}
}

/** Apply a published snapshot. Inserted content is rendered with textContent and safe URL checks. */
export function applyPublishedVisualEditorPayload(payload: Record<string, unknown> | null, root: HTMLElement | null = document.getElementById('root')) {
 if (!payload || !root || typeof payload !== 'object') return;
 const text = payload.text && typeof payload.text === 'object' ? payload.text as Record<string, {after?:unknown}> : {};
 for (const [selector, change] of Object.entries(text)) {
  if (!change || typeof change.after !== 'string' || change.after.length > 10000 || !safePublishedSelector(selector)) continue;
  try {
   root.querySelectorAll(selector).forEach((el) => {
    if (el === root || el.closest('#ggmc-visual-editor')) return;
    if (el.childElementCount === 0) { el.textContent = change.after as string; return; }
    const directText = Array.from(el.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim());
    if (directText) directText.textContent = change.after as string;
   });
  } catch { /* malformed or stale selector */ }
 }
 const styles = payload.styles && typeof payload.styles === 'object' ? payload.styles as Record<string, Record<string, unknown>> : {};
 for (const [selector, props] of Object.entries(styles)) {
  if (!safePublishedSelector(selector)) continue;
  const customCss: Record<string,string> = {'--ve-background-size':'background-size','--ve-background-position':'background-position','--ve-image-filter':'filter','--ve-object-fit':'object-fit','--ve-object-position':'object-position'};
  try { root.querySelectorAll(selector).forEach((el) => Object.entries(props || {}).forEach(([key,value]) => {
   if (key === '--ve-background-image' && safePublishedImageSrc(value)) (el as HTMLElement).style.backgroundImage = `url("${value}")`;
   else if (customCss[key] && safePublishedCssValue(customCss[key],value)) (el as HTMLElement).style.setProperty(customCss[key],value as string);
   else if (key === '--ve-image-src' && el instanceof HTMLImageElement && safePublishedImageSrc(value)) el.src = value;
   else if (key === '--ve-image-alt' && el instanceof HTMLImageElement && typeof value === 'string' && value.length < 500) el.alt = value;
   else if (key === '--ve-link-href' && el instanceof HTMLAnchorElement && typeof value === 'string') el.setAttribute('href', safePublishedHref(value));
   else if (/^(color|background-color|font-size|font-family|font-weight|font-style|line-height|letter-spacing|text-align|text-decoration|text-transform|padding|padding-top|padding-right|padding-bottom|padding-left|margin|margin-top|margin-right|margin-bottom|margin-left|border|border-color|border-width|border-style|border-radius|box-shadow|width|min-width|max-width|height|min-height|max-height|opacity|display|position|top|right|bottom|left|gap|column-gap|row-gap|object-fit|object-position)$/.test(key) && safePublishedCssValue(key,value)) (el as HTMLElement).style.setProperty(key,value);
  })); } catch { /* stale selector */ }
 }
 const hidden = payload.hidden && typeof payload.hidden === 'object' ? payload.hidden as Record<string,unknown> : {};
 for (const [selector, hide] of Object.entries(hidden)) {
  if (!safePublishedSelector(selector)) continue;
  try { root.querySelectorAll(selector).forEach((el) => { if (hide === true) (el as HTMLElement).style.display='none'; }); } catch { /* stale selector */ }
 }
 
  const actions = payload.actions && typeof payload.actions === 'object' ? payload.actions as Record<string, Record<string, unknown>> : {};
  const safeHref = safePublishedHref;
  const makeMenu = (items: unknown) => {
   const menu = document.createElement('div');
   menu.style.cssText = 'display:none;gap:5px;padding:8px;margin:6px 0;border:1px solid #8d7747;border-radius:8px;background:#101a15';
   menu.setAttribute('data-ve-published-menu','true');
   (Array.isArray(items) ? items : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const item = entry as Record<string, unknown>;
    if (typeof item.label !== 'string' || !item.label.trim()) return;
    const a = document.createElement('a'); a.textContent = item.label.slice(0,100); a.href = safeHref(item.href);
    a.style.cssText = 'display:block;color:#f2eee4;padding:7px;text-decoration:none;border-radius:5px';
    menu.append(a);
   });
   return menu;
  };
  for (const [selector, action] of Object.entries(actions)) {
   if (!action || typeof action !== 'object') continue;
   if (!safePublishedSelector(selector)) continue;
   let el: Element|null; try { el=root.querySelector(selector); } catch { continue; }
   if (!el || el.closest('#ggmc-visual-editor')) continue;
   const items = Array.isArray(action.items) ? action.items : [];
   if (action.mode === 'text' && typeof action.text === 'string' && action.text) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node: Node|null;
    while ((node=walker.nextNode())) {
     const content=node.textContent||''; const at=content.indexOf(action.text); if(at<0) continue;
     const range=document.createRange(); range.setStart(node,at); range.setEnd(node,at+action.text.length);
     const control=document.createElement(action.type==='link'?'a':'button');
     control.textContent=action.text; control.style.cssText='display:inline-block;padding:8px 14px;border:0;border-radius:24px;background:#c4a252;color:#07100b;text-decoration:none;font:600 13px system-ui,sans-serif;cursor:pointer';
     if(action.type==='link') (control as HTMLAnchorElement).href=safeHref(action.href);
     else (control as HTMLButtonElement).type='button';
     try { range.surroundContents(control); } catch { continue; }
     if(action.type==='button' && items.length) {
      const menu=makeMenu(items); menu.style.display='none'; control.setAttribute('aria-haspopup','true'); control.setAttribute('aria-expanded','false');
      control.insertAdjacentElement('afterend',menu);
      control.addEventListener('click',()=>{ const opening=menu.style.display==='none'; menu.style.display=opening?'grid':'none'; control.setAttribute('aria-expanded',String(opening)); });
     }
     break;
    }
   } else if (action.mode === 'element' && action.type === 'dropdown' && (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement)) {
    const control=el as HTMLButtonElement|HTMLAnchorElement; if(control.dataset.vePublishedDropdown==='true') continue;
    control.dataset.vePublishedDropdown='true'; control.setAttribute('aria-haspopup','true'); control.setAttribute('aria-expanded','false');
    const menu=makeMenu(items); control.insertAdjacentElement('afterend',menu);
    control.addEventListener('click',(event)=>{ if(control instanceof HTMLAnchorElement) event.preventDefault(); const opening=menu.style.display==='none'; menu.style.display=opening?'grid':'none'; control.setAttribute('aria-expanded',String(opening)); });
   }
  }

  const blocks = Array.isArray(payload.blocks) ? payload.blocks as Array<Record<string,unknown>> : [];
 const main = root.querySelector('main') || root;
 for (const block of blocks) {
  const id = typeof block.id === 'string' ? block.id : '';
  if (!id || [...root.querySelectorAll('[data-ve-block-id]')].some(el => (el as HTMLElement).dataset.veBlockId === id)) continue;
  const kind = typeof block.kind === 'string' ? block.kind : 'card';
  const el = document.createElement(kind === 'section' ? 'section' : 'article');
  el.dataset.veBlockId = id;
   el.dataset.vePublishedBlock = 'true';
   el.style.cssText = 'padding:24px;margin:16px 0;border:1px solid #8d7747;border-radius:10px;color:inherit;background:rgba(16,27,21,.96)';
  if (typeof block.title === 'string' && block.title && kind!=='html') { const h = document.createElement(kind==='section'?'h2':'h3'); h.textContent=block.title; el.append(h); }
  if (kind === 'html') {
    const html = typeof block.html === 'string' ? block.html : typeof block.text === 'string' ? block.text : '';
    const fragment = DOMPurify.sanitize(html,{RETURN_DOM_FRAGMENT:true,ALLOWED_TAGS:['a','abbr','b','blockquote','br','caption','code','dd','del','details','div','dl','dt','em','figcaption','figure','h2','h3','h4','hr','i','img','li','ol','p','picture','pre','q','s','section','small','span','strong','sub','summary','sup','table','tbody','td','th','thead','tr','u','ul','form','label','input','button'],ALLOWED_ATTR:['alt','aria-label','class','colspan','disabled','for','height','href','id','name','placeholder','rel','required','rowspan','src','target','title','type','value','width'],FORBID_TAGS:['script','style','iframe','object','embed','base','meta','link'],FORBID_ATTR:['action','formaction','srcdoc']});
    el.append(fragment);el.addEventListener('submit',event=>{if(event.target instanceof HTMLFormElement)event.preventDefault();},true);
   }
   if (kind === 'image' && safePublishedImageSrc(block.src)) {
   const img=document.createElement('img');img.src=block.src;img.alt=typeof block.alt==='string'?block.alt:'';img.loading='lazy';img.style.cssText='max-width:100%;height:auto';el.append(img);
  }
  if (kind === 'link' && typeof block.href === 'string') {
   const href=safePublishedHref(block.href);
   const a=document.createElement('a');a.href=href;a.textContent=typeof block.title==='string'&&block.title?block.title:'Learn more';el.append(a);
  }
  if (kind!=='html' && typeof block.text === 'string' && block.text) { const p=document.createElement('p');p.textContent=block.text;p.style.whiteSpace='pre-wrap';el.append(p); }
  const after = typeof block.after === 'string' ? block.after : '';
  let target: Element|null=null;try{target=after?root.querySelector(after):null;}catch{ /* stale selector */ }
  if (target?.parentElement) target.insertAdjacentElement('afterend',el); else main.append(el);
 }
}

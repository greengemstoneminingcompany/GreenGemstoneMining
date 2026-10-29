(async () => {
  const params = new URLSearchParams(location.search);
  const previewEnabled = document.querySelector('meta[name="ggmc-preview-editor"]')?.content === 'enabled';
  const allowedPreviewHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || (location.hostname.startsWith('green-gemstone-mining-') && location.hostname.endsWith('-green-gemstone-mining-company.vercel.app'));
  if (!previewEnabled || !allowedPreviewHost) return;
  const showPreviewTrigger = () => {
    if (!previewEnabled || document.getElementById('ggmc-preview-editor-trigger')) return;
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.id = 'ggmc-preview-editor-trigger'; trigger.textContent = 'Preview Editor';
    trigger.setAttribute('aria-label', 'Open Preview Editor');
    trigger.style.cssText = 'position:fixed;z-index:2147483646;right:18px;bottom:18px;padding:12px 18px;border:1px solid #e4c87c;border-radius:999px;background:#0d1310;color:#f2eee4;font:700 14px system-ui,sans-serif;box-shadow:0 8px 28px #0008;cursor:pointer';
    trigger.addEventListener('click', () => { trigger.remove(); void startEditor(); });
    document.body.append(trigger);
  };
  const startEditor = async () => {
  const editorApi = window.__GGMC_EDITOR_API__;
  let authorized = false;
  try { authorized = (await editorApi?.getSession?.())?.isAdmin === true; } catch { authorized = false; }
  if (!authorized) {
    const gate = document.createElement('section'); gate.id = 'ggmc-editor-auth-gate'; gate.setAttribute('aria-label','Preview editor sign in');
    gate.style.cssText='position:fixed;z-index:2147483647;right:18px;bottom:18px;width:min(360px,calc(100vw - 36px));padding:20px;background:#0d1310;color:#f2eee4;border:1px solid #c4a252;border-radius:14px;font:14px system-ui,sans-serif;box-shadow:0 12px 36px #0009';
    const title=document.createElement('h2');title.textContent='Preview editor sign in';title.style.cssText='margin:0 0 8px;color:#e4c87c;font-size:18px';
    const note=document.createElement('p');note.textContent='Sign in with an authorised preview editor account. Opening this URL does not grant access.';
    const form=document.createElement('form');
    const email=document.createElement('input');email.type='email';email.required=true;email.autocomplete='username';email.placeholder='Owner email';email.setAttribute('aria-label','Owner email');email.style.cssText='display:block;box-sizing:border-box;width:100%;margin:8px 0;padding:10px';
    const password=document.createElement('input');password.type='password';password.required=true;password.autocomplete='current-password';password.placeholder='Password';password.setAttribute('aria-label','Password');password.style.cssText=email.style.cssText;
    const submit=document.createElement('button');submit.type='submit';submit.textContent='Sign in';submit.style.cssText='padding:10px 14px;background:#c4a252;color:#07100b;border:0;border-radius:6px;font-weight:700';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Close';cancel.style.cssText='padding:10px 14px;margin-left:8px';cancel.addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.delete('edit');history.replaceState({},'',u);gate.remove();showPreviewTrigger();});
    const message=document.createElement('p');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
    form.append(email,password,submit,cancel,message);form.addEventListener('submit',async event=>{event.preventDefault();submit.disabled=true;message.textContent='Checking preview editor permissions…';try{const api=window.__GGMC_EDITOR_API__;if(!api?.signIn||!api?.getSession)throw Error('Preview sign-in is not ready. Reload this preview and try again.');await api.signIn(email.value.trim(),password.value);const session=await api.getSession();if(session?.isAdmin!==true)throw Error('This account is not authorised to edit the preview.');gate.remove();void startEditor();}catch(error){password.value='';message.textContent=error instanceof Error?error.message:'Sign-in failed.';}finally{submit.disabled=false;}});
    gate.append(title,note,form);document.body.append(gate);return;
  }
  const KEY = 'ggmc-preview-editor-v2';
  const SERVER_KEY = 'ggmc-preview-editor-server-draft-v1';
  const ID = 'ggmc-visual-editor';
  const root = document.getElementById('root');
  if (!root) return;

  const blank = () => ({ text: {}, styles: {}, hidden: {}, blocks: [], actions: {} });
  const copy = (v) => JSON.parse(JSON.stringify(v));
  let draft = blank(), undo = [], redo = [], mode = 'text', selected = null, applying = false;
  let panel, inspector, status, counter, layers, textStart = null, lastSelection = null, layerFilter = '', layerOffset = 0;
  const styleBaselines = new WeakMap(), imageSrcBaselines = new WeakMap(), imageAltBaselines = new WeakMap(); let lastAppliedStyles = [], lastAppliedImageSrc = [], lastAppliedImageAlt = [], lastHiddenElements = [];
  let observer = null, featureTeardown = null;
  const lifetime = new AbortController();
  const rootStyleBaseline = ['max-width','width','margin-inline','box-shadow'].map(prop => [prop, root.style.getPropertyValue(prop), root.style.getPropertyPriority(prop)]);
  const rootViewportBaseline = root.dataset.veViewport;
  let serverDraftId=null,serverVersion=0,serverDraftStatus='draft';
  try { const savedServer=JSON.parse(localStorage.getItem(SERVER_KEY)||'null'); if(savedServer&&typeof savedServer==='object'){serverDraftId=typeof savedServer.id==='string'?savedServer.id:null;serverVersion=Number.isInteger(savedServer.version)&&savedServer.version>=0?savedServer.version:0;serverDraftStatus=['draft','published','archived'].includes(savedServer.status)?savedServer.status:'draft';} } catch {}
  const persistServerState=()=>{try{localStorage.setItem(SERVER_KEY,JSON.stringify({id:serverDraftId,version:serverVersion,status:serverDraftStatus}));}catch{say('Could not persist the server draft pointer in this browser.');}};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') draft = { ...blank(), ...saved };
    else {
      const old = JSON.parse(localStorage.getItem('ggmc-preview-editor-v1') || '{}');
      Object.entries(old).forEach(([key, value]) => { if (value && typeof value.after === 'string') draft.text[key] = value; });
    }
  } catch {}

  const style = document.createElement('style');
  style.textContent = [
    'body.ggmc-ve-on #root,body.ggmc-ve-on #root *{visibility:visible!important;animation:none!important;animation-delay:0s!important;transition-delay:0s!important}',
    'body.ggmc-ve-on #root .reveal,body.ggmc-ve-on #root .reveal.in{opacity:1!important;transform:none!important}',
    'body.ggmc-ve-text [data-ve-key][contenteditable="true"]{outline:1px dashed #c4a252!important;outline-offset:3px;cursor:text!important}',
    'body.ggmc-ve-text [data-ve-key][contenteditable="true"]:focus{outline:2px solid #e4c87c!important;background:rgba(196,162,82,.08)}',
    'body.ggmc-ve-select #root *{cursor:crosshair!important}',
    'body.ggmc-ve-select [data-ve-selected="true"]{outline:3px solid #e4c87c!important;outline-offset:3px!important}',
    '.ve-added-section{padding:64px 24px;background:#101b15;color:#f2eee4}.ve-added-inner{max-width:1120px;margin:auto}.ve-added-section h2,.ve-added-card h3{font:500 clamp(28px,4vw,48px)/1.15 Georgia,serif;margin:0 0 18px;color:inherit}.ve-added-section p,.ve-added-card p{font:400 16px/1.7 system-ui,sans-serif;white-space:pre-wrap}.ve-added-card{padding:24px;margin:14px 0;border:1px solid #705d35;border-radius:12px;background:#16231b;color:inherit}.ve-added-image{display:block;max-width:100%;height:auto;border-radius:10px;margin:16px 0}.ve-added-video{display:block;width:100%;max-height:70vh;border-radius:10px;margin:16px 0;background:#000}.ve-added-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:18px 0}.ve-added-grid .ve-added-card{margin:0}.ve-added-spacer{height:48px;min-height:8px}.ve-added-link{display:inline-block;padding:12px 18px;background:#c4a252;color:#07100b;border-radius:30px;text-decoration:none;font-weight:700;margin:12px 0}.ve-inline-action{display:inline-block;padding:8px 14px;border:0;border-radius:24px;background:#c4a252;color:#07100b;text-decoration:none;font:600 13px system-ui,sans-serif;cursor:pointer}.ve-dropdown-menu{display:grid;gap:5px;padding:8px;margin:6px 0;border:1px solid #8d7747;border-radius:8px;background:#101a15}.ve-dropdown-menu[hidden]{display:none!important}.ve-dropdown-menu a{color:#f2eee4;padding:7px;text-decoration:none;border-radius:5px}.ve-dropdown-menu a:hover{background:#26372d}@media(max-width:640px){.ve-added-grid{grid-template-columns:1fr}}',
    '#'+ID+'{position:fixed;z-index:2147483647;top:12px;right:12px;bottom:12px;width:min(340px,calc(100vw - 24px));min-width:260px;overflow:auto;padding:14px;background:#0d1310;color:#f2eee4;border:1px solid #7a5f2c;border-radius:14px;box-shadow:0 16px 50px #0008;font:13px/1.45 system-ui,sans-serif;box-sizing:border-box;transition:width .16s ease}#'+ID+'.ve-left{right:auto;left:12px}#'+ID+'.ve-collapsed{width:52px!important;min-width:52px;padding:8px;overflow:hidden}#'+ID+'.ve-collapsed>*:not(.ve-topbar){display:none!important}#'+ID+'.ve-collapsed .ve-topbar strong,#'+ID+'.ve-collapsed .ve-topbar button:last-child{display:none!important}#'+ID+' .ve-topbar{display:flex;align-items:center;justify-content:space-between;gap:5px;position:sticky;top:-14px;z-index:2;padding:4px 0 10px;background:#0d1310}#'+ID+' .ve-topbar button{padding:7px 8px}#'+ID+' .ve-resize{position:absolute;z-index:4;top:40%;width:8px;height:120px;cursor:ew-resize;background:#c4a25266;border-radius:8px}#'+ID+'.ve-left .ve-resize{right:-2px}#'+ID+':not(.ve-left) .ve-resize{left:-2px}#'+ID+' .ve-resize-height{position:absolute;z-index:4;left:40%;right:40%;bottom:-2px;height:9px;cursor:ns-resize;background:#c4a25266;border-radius:8px}#'+ID+' .ve-resize-corner{position:absolute;z-index:5;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 45%,#c4a252 46%,#c4a252 58%,transparent 59%)}#'+ID+' .ve-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}#'+ID+' .ve-grid .ve-field{display:block;margin:5px 0}#'+ID+' .ve-grid label{display:block;margin-bottom:4px}#'+ID+' .ve-grid input{min-height:32px}',
    '#'+ID+' *{box-sizing:border-box}#'+ID+' .ve-title{margin:0;color:#e4c87c;font-size:19px;font-weight:800}#'+ID+' .ve-note{font-size:11px;color:#b5b0a0;margin:5px 0 12px}#'+ID+' .ve-row{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#'+ID+' button,#'+ID+' select{max-width:100%;border:1px solid #67542e;border-radius:7px;padding:8px 9px;color:#f2eee4;background:#182320;font:600 11px system-ui,sans-serif;cursor:pointer}#'+ID+' button.primary{background:#c4a252;color:#07100b}#'+ID+' button.danger{border-color:#8d4a43;color:#ffc9c2}#'+ID+' button.active{outline:2px solid #e4c87c}#'+ID+' .ve-label{font-weight:800;color:#e4c87c;margin:14px 0 6px}#'+ID+' .ve-field{display:grid;grid-template-columns:100px minmax(0,1fr);align-items:center;gap:8px;margin:8px 0}#'+ID+' label{font-size:11px;color:#c9c2b1}#'+ID+' input,#'+ID+' textarea{width:100%;min-width:0;border:1px solid #46564c;border-radius:6px;background:#101a15;color:#f2eee4;padding:8px;font:12px system-ui,sans-serif}#'+ID+' input[type=color]{height:34px;padding:3px}#'+ID+' textarea{min-height:64px}#'+ID+' .ve-status{font-size:11px;color:#d7cfb7;margin:10px 0;overflow-wrap:anywhere}#'+ID+' .ve-count{font-size:10px;color:#a6a08f}@media(max-width:700px){#'+ID+'{top:auto;max-height:62vh;left:8px;right:8px;bottom:8px;width:auto;min-width:0;padding:10px}#'+ID+' .ve-field{grid-template-columns:84px minmax(0,1fr)}#'+ID+' .ve-resize{display:none}#'+ID+'.ve-left{left:8px;right:8px}}'
  ].join('\n');
  document.head.appendChild(style);
  document.body.classList.add('ggmc-ve-on');

  const path = (el) => {
    if (!el) return '';
    if (el.dataset.veBlockId) return '[data-ve-block-id="'+el.dataset.veBlockId+'"]';
    if (el.id) return '#'+el.id.replace(/([^\w-])/g,'\\$1');
    const parts = []; let node = el;
    while (node && node.nodeType === 1 && node !== root && node !== document.body) {
      let n=1, sib=node; while ((sib=sib.previousElementSibling)) if (sib.tagName===node.tagName) n++;
      parts.unshift(node.tagName.toLowerCase()+':nth-of-type('+n+')'); node=node.parentElement;
      if (node && node.id) { parts.unshift('#'+node.id.replace(/([^\w-])/g,'\\$1')); break; }
    }
    return parts.join(' > ');
  };
  const all = (selector) => { try { return [...root.querySelectorAll(selector)]; } catch { return []; } };
  let serverAutosaveDraftName = 'Website draft';
  let serverAutosaveTimer = null;
  let serverAutosaveDirty = false;
  let serverAutosaveInFlight = false;
  let serverAutosavePending = false;
  let serverAutosaveConflict = false;
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); }
    catch { say('Browser storage is unavailable. Export the draft before leaving.'); }
    persistServerState();
    updateCount();
    scheduleServerAutosave();
  };
  function scheduleServerAutosave() {
    if (!serverAutosaveDirty || !serverDraftId || serverDraftStatus !== 'draft' || serverDraftVersionIsUnavailable() || serverAutosaveConflict) return;
    if (serverAutosaveInFlight) { serverAutosavePending = true; return; }
    if (serverAutosaveTimer) clearTimeout(serverAutosaveTimer);
    serverAutosaveTimer = setTimeout(() => { void autosaveServerDraft(); }, 1800);
  }
  function serverDraftVersionIsUnavailable() { return !Number.isInteger(serverVersion) || serverVersion < 1; }
  async function autosaveServerDraft() {
    serverAutosaveTimer = null;
    if (!serverDraftId || serverDraftStatus !== 'draft' || serverDraftVersionIsUnavailable() || serverAutosaveConflict) return;
    if (serverAutosaveInFlight) { serverAutosavePending = true; return; }
    const api = window.__GGMC_EDITOR_API__;
    if (!api?.getSession || !api?.saveDraft) return;
    serverAutosaveInFlight = true;
    serverAutosavePending = false;
    const draftId = serverDraftId;
    const expectedVersion = serverVersion;
    const snapshot = copy(draft);
    try {
      const session = await api.getSession();
      if (!session?.isAdmin) return;
      const result = await api.saveDraft({ id: draftId, expectedVersion, name: serverAutosaveDraftName, payload: snapshot });
      if (!result || result.id !== draftId) throw new Error('Autosave returned an unexpected draft. Use Save server draft to review the server state.');
      if (serverDraftId !== draftId) return;
      serverVersion = result.version;
      serverDraftStatus = result.status;
      persistServerState();
      const changedDuringSave = JSON.stringify(snapshot) !== JSON.stringify(draft);
      serverAutosaveDirty = changedDuringSave;
      say(changedDuringSave ? 'Server autosave saved a version; newer edits are waiting to save…' : 'Server autosaved version ' + result.version + '.');
      if (changedDuringSave) serverAutosavePending = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server autosave failed.';
      if (/version|conflict|changed since|expected/i.test(message)) {
        serverAutosaveConflict = true;
        say('Autosave paused to protect newer server changes. Refresh server drafts, load the latest version, and review your local edits before saving again.');
      } else {
        say('Server autosave could not complete: ' + message + '. Your browser draft is still saved locally.');
      }
    } finally {
      serverAutosaveInFlight = false;
      if (serverAutosavePending && !serverAutosaveConflict && serverDraftStatus === 'draft') {
        serverAutosavePending = false;
        scheduleServerAutosave();
      }
    }
  }
  const say = (text) => { if (status) status.textContent = text; };
  const updateCount = () => { if (counter) counter.textContent = Object.keys(draft.text).length+' text edits · '+Object.keys(draft.styles).length+' styled elements · '+draft.blocks.length+' added blocks · local draft'; };
  const saveHistory = () => { undo.push(copy(draft)); if (undo.length>60) undo.shift(); redo=[]; };
  const applyChange = (message) => { serverAutosaveDirty = true; persist(); refresh(); renderLayers(); if(selected) inspect(selected); say(message||'Saved locally. This is not published.'); };
  const safeUrl = (value) => { if(typeof value!=='string'||!value.trim()||/[\u0000-\u001f\\]/.test(value))return '#'; const raw=value.trim(); if(raw.startsWith('#'))return /^#[\w-]*$/.test(raw)?raw:'#'; if(raw.startsWith('/')&&!raw.startsWith('//'))return raw; try { const u=new URL(raw,location.origin); return ['https:','http:','mailto:'].includes(u.protocol)&&!u.username&&!u.password?raw:'#'; } catch { return '#'; } };
  const safeImageSrc = value => { if(typeof value!=='string'||/[\u0000-\u0020\\]/.test(value))return false; if(/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value))return true; if(/["'();{}]/.test(value))return false; if(value.startsWith('/')&&!value.startsWith('//'))return true; try{const u=new URL(value,location.origin);return u.protocol==='https:'&&!u.username&&!u.password&&/^https:\/\//i.test(value);}catch{return false;} };
  const SAFE_CSS_PROPERTIES = new Set(['color','background-color','font-size','padding','margin','border-radius','text-align','font-weight','font-style','text-decoration-line','text-transform','rotate','font-family','line-height','letter-spacing','width','height','border','box-shadow','opacity','background-size','background-position','filter','object-fit','object-position','display']);
  const safeCssValue = (prop, value) => { if(typeof value!=='string'||value.length>200||/[<>\\;{}\u0000-\u001f]/.test(value)||/(?:url\s*\(|expression\s*\(|@import|javascript\s*:|vbscript\s*:)/i.test(value))return false; if(!SAFE_CSS_PROPERTIES.has(prop))return false; try{return typeof CSS!=='undefined'&&CSS.supports(prop,value.trim());}catch{return false;} };
  async function compressImage(file){
    if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG, or WebP image.');
    const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('This browser cannot prepare the image.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.78));if(!blob||blob.size>1_100_000)throw Error('This image is still too large after compression. Choose a smaller image.');
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read this image.'));reader.readAsDataURL(blob);});
  }
  const makeBlock = (item) => {
    const el=document.createElement(item.kind==='section'?'section':'article');
    el.dataset.veBlockId=item.id;
    if(item.kind==='section'){
      el.className='ve-added-section'; const inner=document.createElement('div'); inner.className='ve-added-inner'; el.append(inner);
      if(item.title){const h=document.createElement('h2');h.textContent=item.title;inner.append(h);}
      if(item.text){const p=document.createElement('p');p.textContent=item.text;inner.append(p);}
    } else if(item.kind==='html'){
      el.className='ve-added-html';
      if(typeof window.DOMPurify?.sanitize==='function'){
        const fragment=window.DOMPurify.sanitize(String(item.html||item.text||''),{RETURN_DOM_FRAGMENT:true,ALLOWED_TAGS:['a','abbr','b','blockquote','br','caption','code','dd','del','details','div','dl','dt','em','figcaption','figure','h2','h3','h4','hr','i','img','li','ol','p','picture','pre','q','s','section','small','span','strong','sub','summary','sup','table','tbody','td','th','thead','tr','u','ul','form','label','input','button'],ALLOWED_ATTR:['alt','aria-label','class','colspan','disabled','for','height','href','id','name','placeholder','rel','required','rowspan','src','target','title','type','value','width'],FORBID_TAGS:['script','style','iframe','object','embed','base','meta','link'],FORBID_ATTR:['action','formaction','srcdoc']});el.append(fragment);
        el.addEventListener('submit',event=>{if(event.target instanceof HTMLFormElement){event.preventDefault();say('Custom forms are preview-only. No data was sent.');}},true);
      }
    } else if(item.kind==='image'){
      const img=document.createElement('img');img.className='ve-added-image';img.src=item.src;img.alt=item.alt||item.title||'Added image';el.append(img);
      if(item.title){const cap=document.createElement('p');cap.textContent=item.title;el.append(cap);}
    } else if(item.kind==='video'){
      const video=document.createElement('video');video.className='ve-added-video';video.src=item.src;video.controls=true;video.preload='metadata';video.playsInline=true;video.setAttribute('aria-label',item.title||'Added video');el.append(video);
      if(item.text){const cap=document.createElement('p');cap.textContent=item.text;el.append(cap);}
    } else if(item.kind==='spacer'){
      el.className='ve-added-spacer';el.setAttribute('aria-hidden','true');el.style.height=item.height||'48px';
    } else if(item.kind==='grid'){
      el.className='ve-added-grid';
      for(let index=0;index<2;index++){const card=document.createElement('article');card.className='ve-added-card';const h=document.createElement('h3');h.textContent=index===0?(item.title||'Column one'):'Column two';card.append(h);const p=document.createElement('p');p.textContent=index===0?(item.text||'Edit this text in the preview.'):'Select this text on the page to add your content.';card.append(p);el.append(card);}
    } else if(item.kind==='link'){
      const a=document.createElement('a');a.className='ve-added-link';a.textContent=item.title||'Learn more';a.href=safeUrl(item.href||'#contact');el.append(a);
    } else if(item.kind==='divider'){
      const hr=document.createElement('hr');hr.style.cssText='border:0;border-top:1px solid #c4a252;margin:24px 0';el.append(hr);
    } else {
      el.className='ve-added-card';
      if(item.title){const h=document.createElement('h3');h.textContent=item.title;el.append(h);}
      if(item.text){const p=document.createElement('p');p.textContent=item.text;el.append(p);}
    }
    return el;
  };
  const directTextBaselines = new WeakMap();
  const directTextNodes = (el) => [...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE);
  const directTextValue = (el) => directTextNodes(el).map(n=>n.textContent||'').join('');
  const rememberDirectText = (el) => {if(!directTextBaselines.has(el))directTextBaselines.set(el,directTextNodes(el).map(n=>n.textContent||''));};
  const setDirectText = (el,value) => {
    const nodes=directTextNodes(el);
    if(!nodes.length){
      [...el.childNodes].filter(n=>n.nodeType===Node.ELEMENT_NODE&&n.tagName==='BR').forEach(n=>n.remove());
      if(value){const next=[...el.childNodes].find(n=>n.nodeType===Node.ELEMENT_NODE);el.insertBefore(document.createTextNode(value),next||null);}
      return;
    }
    const baseline=directTextBaselines.get(el);
    if(baseline&&value===baseline.join('')){nodes.forEach((node,index)=>{node.textContent=baseline[index]||'';});return;}
    const children=[...el.childNodes],firstElement=children.findIndex(n=>n.nodeType===Node.ELEMENT_NODE),lastElement=children.findLastIndex(n=>n.nodeType===Node.ELEMENT_NODE);
    const hasLeadingText=firstElement>0&&nodes.some(node=>children.indexOf(node)<firstElement);
    const trailing=hasLeadingText
      ? nodes.map((node,index)=>({node,index,position:children.indexOf(node)})).filter(item=>item.position>lastElement)
      : [];
    const trailingText=trailing.map(item=>baseline?.[item.index]??item.node.textContent??'').join('');
    const preserveTrailing=Boolean(trailingText&&value.endsWith(trailingText));
    nodes[0].textContent=preserveTrailing?value.slice(0,-trailingText.length):value;
    nodes.slice(1).forEach(node=>{node.textContent='';});
    if(preserveTrailing)trailing[trailing.length-1].node.textContent=trailingText;
  };
  function refresh() {
    if(applying)return; applying=true;
    try {
      const wantedBlockIds = new Set(draft.blocks.map(block=>String(block.id)));
      root.querySelectorAll('[data-ve-block-id]').forEach(el=>{if(!wantedBlockIds.has(el.dataset.veBlockId||'')&&el.dataset.vePublishedBlock!=='true')el.remove();});
      draft.blocks.forEach((block) => {
        let el=root.querySelector('[data-ve-block-id="'+block.id+'"]');
        const stamp=JSON.stringify(block);
        if(el&&el.dataset.veRenderStamp!==stamp){
          const replacement=makeBlock(block);replacement.dataset.veRenderStamp=stamp;el.replaceWith(replacement);el=replacement;
        }
        if(!el){
          el=makeBlock(block);el.dataset.veRenderStamp=stamp;
          const previous=[...draft.blocks.slice(0,draft.blocks.indexOf(block))].reverse().find(b=>b.after===block.after&&root.querySelector('[data-ve-block-id="'+b.id+'"]'));
          const previousEl=previous&&root.querySelector('[data-ve-block-id="'+previous.id+'"]');
          const target=block.after?all(block.after)[0]:null;
          if(previousEl&&previousEl.parentElement)previousEl.insertAdjacentElement('afterend',el);
          else if(target&&target.parentElement)target.insertAdjacentElement('afterend',el);
          else (root.querySelector('main')||root).append(el);
        }
      });
      // Never wrap text nodes or make container elements editable. Doing either mutates
      // React-owned markup and lets a keystroke replace an entire section with plain text.
      // Only leaf elements with their own direct text are safe inline editing targets.
      [...root.querySelectorAll('*')].forEach(el=>{
        if(['SCRIPT','STYLE','SVG','PATH','INPUT','TEXTAREA','SELECT','BUTTON','OPTION','NOSCRIPT'].includes(el.tagName)||el.closest('#'+ID+',svg,[aria-hidden="true"],[data-ve-block-id]'))return;
        const nodes=directTextNodes(el),hasDirectText=nodes.some(n=>(n.textContent||'').trim());
        const key=path(el); if(!key)return;
        const text=draft.text[key],hasAppliedText=Object.hasOwn(el.dataset,'veAppliedText');
        // Keep empty text targets in the restore path: deleting their text is a
        // valid edit, and Undo must be able to put the original text back.
        if(!hasDirectText&&!text&&!hasAppliedText){el.removeAttribute('contenteditable');return;}
        if(!(el.textContent||'').trim()&&!text&&!hasAppliedText)return;
        el.dataset.veKey=key;if(el.childElementCount>0)rememberDirectText(el);if(!('veOriginal' in el.dataset))el.dataset.veOriginal=el.childElementCount===0?(el.textContent||''):directTextValue(el);
        if(text&&typeof text.after==='string'&&el!==document.activeElement){
          if(el.childElementCount===0&&el.textContent!==text.after)el.textContent=text.after;
          else if(el.childElementCount>0&&directTextValue(el)!==text.after)setDirectText(el,text.after);
          el.dataset.veAppliedText=text.after;
        }else if(!text&&el!==document.activeElement&&Object.hasOwn(el.dataset,'veAppliedText')){
          const current=el.childElementCount===0?(el.textContent||''):directTextValue(el);
          if(current===el.dataset.veAppliedText){
            if(el.childElementCount===0)el.textContent=el.dataset.veOriginal||'';
            else setDirectText(el,el.dataset.veOriginal||'');
          }
          delete el.dataset.veAppliedText;
        }
        const editable=el.childElementCount===0;
        el.contentEditable=editable&&mode==='text'?'true':'false';el.spellcheck=editable&&mode==='text';
      });
      const rememberStyle=(el,prop)=>{let map=styleBaselines.get(el);if(!map){map=new Map();styleBaselines.set(el,map);}if(!map.has(prop))map.set(prop,el.style.getPropertyValue(prop));return map.get(prop);};
      const nextAppliedStyles=[],nextAppliedImageSrc=[],nextAppliedImageAlt=[];
      const customCss={'--ve-background-image':'background-image','--ve-background-size':'background-size','--ve-background-position':'background-position','--ve-image-filter':'filter','--ve-object-fit':'object-fit','--ve-object-position':'object-position'};
      Object.entries(draft.styles).forEach(([selector,props])=>all(selector).forEach(el=>Object.entries(props).forEach(([prop,val])=>{
        if(prop==='--ve-image-src'&&el instanceof HTMLImageElement&&safeImageSrc(val)){if(!imageSrcBaselines.has(el))imageSrcBaselines.set(el,el.getAttribute('src')||'');el.src=val;nextAppliedImageSrc.push(el);}
        else if(prop==='--ve-image-alt'&&el instanceof HTMLImageElement&&typeof val==='string'){if(!imageAltBaselines.has(el))imageAltBaselines.set(el,el.alt);el.alt=val;nextAppliedImageAlt.push(el);}
        else if(prop==='--ve-link-href'&&el instanceof HTMLAnchorElement&&typeof val==='string')el.setAttribute('href',safeUrl(val));
        else {const cssProp=customCss[prop]||(!prop.startsWith('--ve-')?prop:null);if(cssProp&&((prop==='--ve-background-image'&&safeImageSrc(val))||safeCssValue(cssProp,val))){rememberStyle(el,cssProp);const cssVal=prop==='--ve-background-image'&&safeImageSrc(val)?`url("${val}")`:val;el.style.setProperty(cssProp,cssVal);nextAppliedStyles.push({el,prop:cssProp});}}
      })));
      lastAppliedImageSrc.forEach(el=>{if(!nextAppliedImageSrc.includes(el)){const base=imageSrcBaselines.get(el);if(base!==undefined)el.setAttribute('src',base);imageSrcBaselines.delete(el);}});
      lastAppliedImageAlt.forEach(el=>{if(!nextAppliedImageAlt.includes(el)){const base=imageAltBaselines.get(el);if(base!==undefined)el.alt=base;imageAltBaselines.delete(el);}});
      lastAppliedImageSrc=nextAppliedImageSrc;lastAppliedImageAlt=nextAppliedImageAlt;
      lastAppliedStyles.forEach(({el,prop})=>{if(!nextAppliedStyles.some(next=>next.el===el&&next.prop===prop)){const base=styleBaselines.get(el)?.get(prop);if(base!==undefined){if(base)el.style.setProperty(prop,base);else el.style.removeProperty(prop);}}});
      lastAppliedStyles=nextAppliedStyles;
      const nextHidden=[];
      Object.entries(draft.hidden).forEach(([selector,hide])=>{if(hide===true)all(selector).forEach(el=>{rememberStyle(el,'display');el.style.display='none';nextHidden.push(el);});});
      lastHiddenElements.forEach(el=>{if(!nextHidden.includes(el)&&!nextAppliedStyles.some(x=>x.el===el&&x.prop==='display')){const base=styleBaselines.get(el)?.get('display');if(base!==undefined){if(base)el.style.setProperty('display',base);else el.style.removeProperty('display');}}});
      lastHiddenElements=nextHidden;
      applyActions();
      if(selected&&!document.contains(selected))selected=null;
      if(selected)selected.dataset.veSelected='true';
      updateCount();
    } finally { applying=false; }
  }
  const field = (label, control) => {const wrap=document.createElement('div');wrap.className='ve-field';const l=document.createElement('label');l.textContent=label;wrap.append(l,control);return wrap;};
  const input = (type,value,placeholder) => {const i=document.createElement('input');i.type=type;i.value=value||'';if(placeholder)i.placeholder=placeholder;return i;};
  const imageFileField=(label,onReady)=>{const file=input('file','','');file.accept='image/jpeg,image/png,image/webp';file.setAttribute('aria-label',label);file.addEventListener('change',async()=>{try{say('Preparing image for this browser draft…');const data=await compressImage(file.files?.[0]);onReady(data);}catch(err){say(err?.message||'Could not prepare this image.');}finally{file.value='';}});return field(label,file);};
  const toHex = (value) => {if(/^#[0-9a-f]{6}$/i.test(value))return value;const m=(value||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);return m?'#'+m.slice(1,4).map(v=>Number(v).toString(16).padStart(2,'0')).join(''):'#ffffff';};
  const cssLength = (v) => /^(auto|0|[0-9.]+(px|rem|em|%|vw|vh))$/i.test(v.trim())?v.trim():'initial';
  function selectElement(el){if(selected)delete selected.dataset.veSelected;selected=el;if(selected)selected.dataset.veSelected='true';inspect(selected);}
  function changeStyle(prop,value){
    if(!selected)return;
    const cssProp=({'--ve-background-image':'background-image','--ve-background-size':'background-size','--ve-background-position':'background-position','--ve-image-filter':'filter','--ve-object-fit':'object-fit','--ve-object-position':'object-position'})[prop]||prop;
    if(prop==='--ve-background-image'){if(!safeImageSrc(value))return say('Use a safe HTTPS or site-relative image URL.');}
    else if(!safeCssValue(cssProp,value))return say('That CSS value is not allowed. URL-based CSS and unsupported values are blocked.');
    saveHistory();const key=path(selected);draft.styles[key]={...(draft.styles[key]||{}),[prop]:value};applyChange('Updated '+prop+'.');inspect(selected);
  }
  function inspect(el){
    if(!inspector)return;inspector.replaceChildren();
    if(!el){inspector.textContent='Choose Select element, then click a page element to inspect it.';return;}
    const title=document.createElement('div');title.className='ve-label';title.textContent='Selected: '+el.tagName.toLowerCase()+(el.id?' #'+el.id:'');inspector.append(title);
    const key=path(el),props=draft.styles[key]||{};
    const current=(p)=>props[p]||el.style.getPropertyValue(p)||getComputedStyle(el).getPropertyValue(p);
    if(el.childElementCount>0&&directTextNodes(el).some(n=>(n.textContent||'').trim())){
      const directText=document.createElement('textarea');directText.value=draft.text[key]?.after??directTextValue(el);directText.rows=3;directText.setAttribute('aria-label','Edit this text while keeping links and formatting');
      directText.addEventListener('change',()=>{serverAutosaveDirty=true;saveHistory();const before=draft.text[key]?.before??(el.dataset.veOriginal||directTextValue(el));const trailingSpace=(directTextValue(el).match(/\s+$/)||[''])[0];const value=trailingSpace&&!/\s$/.test(directText.value)?directText.value+trailingSpace:directText.value;draft.text[key]={before,after:value};setDirectText(el,value);el.dataset.veAppliedText=value;persist();say('Text updated while preserving nested markup.');});
      inspector.append(field('Edit text',directText));
    }
    if(['SECTION','ARTICLE','HEADER','FOOTER','MAIN','DIV'].includes(el.tagName)){
      const bgUrl=input('url',props['--ve-background-image']||'','HTTPS or site-relative image URL');bgUrl.setAttribute('aria-label','Background image URL');
      bgUrl.addEventListener('change',()=>{if(!safeImageSrc(bgUrl.value))return say('Use HTTPS, a site image path, or choose an image from this device.');changeStyle('--ve-background-image',bgUrl.value);});
      const bgFit=document.createElement('select');bgFit.setAttribute('aria-label','Background fit');[['cover','Fill background'],['contain','Show whole image']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;bgFit.append(o);});bgFit.value=props['--ve-background-size']||'cover';bgFit.addEventListener('change',()=>changeStyle('--ve-background-size',bgFit.value));
      const bgPosition=input('text',props['--ve-background-position']||'center center','e.g. center 40%');bgPosition.setAttribute('aria-label','Background focus');bgPosition.addEventListener('change',()=>{if(!/^(left|center|right|\d{1,3}%)(\s+(top|center|bottom|\d{1,3}%))?$/.test(bgPosition.value.trim()))return say('Use a position such as center 40% or 60% 40%.');changeStyle('--ve-background-position',bgPosition.value.trim());});
      const choose=imageFileField('Choose background image from this device',data=>changeStyle('--ve-background-image',data));
      const clear=document.createElement('button');clear.textContent='Remove background image';clear.addEventListener('click',()=>{saveHistory();delete draft.styles[key]?.['--ve-background-image'];applyChange('Background image removed from this draft.');});
      inspector.append(field('Background image URL',bgUrl),choose,field('Background fit',bgFit),field('Background focus',bgPosition),clear);
    }
    if(el instanceof HTMLImageElement){
      const imageUrl=input('url',el.getAttribute('src')||'','HTTPS or site-relative image URL');
      imageUrl.addEventListener('change',()=>{if(!safeImageSrc(imageUrl.value))return say('Use HTTPS, a site image path, or choose a JPG, PNG, or WebP image.');changeStyle('--ve-image-src',imageUrl.value);});
      const altText=input('text',el.alt,'Accessible image description');
      altText.addEventListener('change',()=>changeStyle('--ve-image-alt',altText.value));
      const fit=document.createElement('select');fit.setAttribute('aria-label','Image fit');[['cover','Fill frame'],['contain','Show whole image'],['fill','Stretch']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;fit.append(o);});fit.value=props['--ve-object-fit']||'cover';fit.addEventListener('change',()=>changeStyle('--ve-object-fit',fit.value));
      const focus=input('text',props['--ve-object-position']||'50% 50%','e.g. 60% 40%');focus.setAttribute('aria-label','Image focus (horizontal, vertical)');focus.addEventListener('change',()=>{if(!/^\d{1,3}%\s+\d{1,3}%$/.test(focus.value.trim()))return say('Use two focus values such as 60% 40%.');changeStyle('--ve-object-position',focus.value.trim());});
      const filters=document.createElement('select');filters.setAttribute('aria-label','Image look');[['none','Original'],['brightness(1.08) saturate(1.15)','Brighter'],['saturate(1.35)','More colour'],['grayscale(1)','Black and white'],['sepia(.28) saturate(1.1)','Warm tone']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;filters.append(o);});filters.value=props['--ve-image-filter']||'none';filters.addEventListener('change',()=>changeStyle('--ve-image-filter',filters.value));
      const choose=imageFileField('Replace image from this device',data=>changeStyle('--ve-image-src',data));
      inspector.append(choose,field('Image URL',imageUrl),field('Image description',altText),field('Image fit',fit),field('Image focus (horizontal, vertical)',focus),field('Image look',filters));
    }
    if(el instanceof HTMLAnchorElement){
      const href=input('url',el.getAttribute('href')||'','#section or HTTPS URL');
      href.addEventListener('change',()=>{const safe=safeUrl(href.value);saveHistory();draft.styles[key]={...(draft.styles[key]||{}),'--ve-link-href':safe};el.setAttribute('href',safe);persist();say('Link destination updated in this preview.');});
      inspector.append(field('Link URL',href));
    }
    if(el.dataset.veBlockId){
      const item=draft.blocks.find(b=>b.id===el.dataset.veBlockId);
      if(item){
        const titleField=input('text',item.title,'Block title');
        titleField.addEventListener('change',()=>{saveHistory();item.title=titleField.value;applyChange('Block title updated.');});
        inspector.append(field('Block title',titleField));
        if(['section','text','card'].includes(item.kind)){
          const body=document.createElement('textarea');body.value=item.text||'';
          body.addEventListener('change',()=>{saveHistory();item.text=body.value;applyChange('Block text updated.');});
          inspector.append(field('Block text',body));
        }
        if(item.kind==='image'){
          const src=input('url',item.src,'HTTPS image URL or /path');
          src.addEventListener('change',()=>{if(!safeImageSrc(src.value))return say('Use HTTPS, a site image path, or choose an image from this device.');saveHistory();item.src=src.value;applyChange('Image source updated.');});
          inspector.append(imageFileField('Choose image from this device',data=>{saveHistory();item.src=data;applyChange('Image added to this browser draft.');}),field('Image URL',src));
          const alt=input('text',item.alt,'Accessible description');
          alt.addEventListener('change',()=>{saveHistory();item.alt=alt.value;applyChange('Image alt text updated.');});
          inspector.append(field('Image alt text',alt));
        }
        if(item.kind==='link'){
          const href=input('url',item.href,'https://… or #section');
          href.addEventListener('change',()=>{saveHistory();item.href=safeUrl(href.value);applyChange('Link destination updated.');});
          inspector.append(field('Link destination',href));
        }
      }
    }
    const color=input('color',toHex(current('color')));color.addEventListener('change',()=>changeStyle('color',color.value));inspector.append(field('Text color',color));
    const bg=input('color',toHex(current('background-color')));bg.addEventListener('change',()=>changeStyle('background-color',bg.value));inspector.append(field('Background',bg));
    const size=input('text',current('font-size'),'e.g. 24px');size.addEventListener('change',()=>changeStyle('font-size',cssLength(size.value)));inspector.append(field('Font size',size));
    const padding=input('text',current('padding'),'e.g. 20px');padding.addEventListener('change',()=>changeStyle('padding',cssLength(padding.value)));inspector.append(field('Padding',padding));
    const margin=input('text',current('margin'),'e.g. 16px 0');margin.addEventListener('change',()=>changeStyle('margin',margin.value.split(/\s+/).every(x=>/^(auto|0|[0-9.]+(px|rem|em|%|vw|vh))$/i.test(x))?margin.value:'initial'));inspector.append(field('Margin',margin));
    const radius=input('text',current('border-radius'),'e.g. 12px');radius.addEventListener('change',()=>changeStyle('border-radius',cssLength(radius.value)));inspector.append(field('Corner radius',radius));
    const align=document.createElement('select');['left','center','right','justify'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;align.append(o);});align.value=current('text-align')||'left';align.addEventListener('change',()=>changeStyle('text-align',align.value));inspector.append(field('Text align',align));
    const choice=(label,prop,values)=>{const control=document.createElement('select');control.setAttribute('aria-label',label);values.forEach(([value,name])=>{const option=document.createElement('option');option.value=value;option.textContent=name;control.append(option);});const value=current(prop);if(values.some(([candidate])=>candidate===value))control.value=value;control.addEventListener('change',()=>changeStyle(prop,control.value));inspector.append(field(label,control));return control;};
    choice('Font weight','font-weight',[['300','Light'],['400','Regular'],['500','Medium'],['600','Semi-bold'],['700','Bold'],['800','Extra bold'],['900','Black']]);
    choice('Font style','font-style',[['normal','Normal'],['italic','Italic']]);
    choice('Text decoration','text-decoration-line',[['none','None'],['underline','Underline'],['line-through','Strike through']]);
    choice('Text case','text-transform',[['none','Original'],['uppercase','UPPERCASE'],['capitalize','Capitalize'],['lowercase','lowercase']]);
    const rotation=input('number',String(Number.parseFloat(current('rotate'))||0));rotation.min='-180';rotation.max='180';rotation.step='1';rotation.setAttribute('aria-label','Rotation in degrees');rotation.addEventListener('change',()=>{const degrees=Number(rotation.value);if(!Number.isFinite(degrees)||degrees< -180||degrees>180)return say('Choose a rotation from -180 to 180 degrees.');changeStyle('rotate',degrees+'deg');});inspector.append(field('Rotation',rotation));
    const advanced=document.createElement('details');advanced.open=false;const summary=document.createElement('summary');summary.textContent='Advanced appearance';advanced.append(summary);const grid=document.createElement('div');grid.className='ve-grid';advanced.append(grid);
    const extra=(label,prop,placeholder='')=>{const c=input('text',current(prop),placeholder||'CSS value');c.addEventListener('change',()=>changeStyle(prop,c.value));grid.append(field(label,c));};
    const fontFamily=document.createElement('select');[['Georgia, serif','Georgia / Serif'],['system-ui, sans-serif','System Sans'],['Arial, sans-serif','Arial'],['Inter, sans-serif','Inter'],['monospace','Monospace']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;fontFamily.append(o);});fontFamily.value=current('font-family')||'Georgia, serif';fontFamily.addEventListener('change',()=>changeStyle('font-family',fontFamily.value));grid.append(field('Font family',fontFamily));
    extra('Font weight','font-weight','400 / 600 / 700');extra('Line height','line-height','1.5');extra('Letter spacing','letter-spacing','0.02em');extra('Width','width','100% / 320px');extra('Height','height','auto / 240px');extra('Border','border','1px solid #c4a252');extra('Shadow','box-shadow','0 4px 18px #0003');extra('Opacity','opacity','0.0–1.0');
    const actions=document.createElement('div');actions.className='ve-row';
    const hide=document.createElement('button');hide.textContent=draft.hidden[key]?'Show':'Hide';hide.addEventListener('click',()=>{saveHistory();draft.hidden[key]=!draft.hidden[key];applyChange('Visibility updated.');inspect(el);});
    const up=document.createElement('button');up.textContent='Move up';up.addEventListener('click',()=>move(el,-1));
    const down=document.createElement('button');down.textContent='Move down';down.addEventListener('click',()=>move(el,1));
    const duplicate=document.createElement('button');duplicate.textContent='Duplicate';duplicate.addEventListener('click',()=>duplicateBlock(el));
    const reset=document.createElement('button');reset.textContent='Reset styles';reset.addEventListener('click',()=>{saveHistory();delete draft.styles[key];delete draft.hidden[key];applyChange('Styles reset.');inspect(el);});
    const remove=document.createElement('button');remove.className='danger';remove.textContent=el.dataset.veBlockId?'Remove block':'Hide element';remove.addEventListener('click',()=>{if(el.dataset.veBlockId){if(!confirm('Remove this added block from the draft?'))return;saveHistory();draft.blocks=draft.blocks.filter(b=>b.id!==el.dataset.veBlockId);selected=null;applyChange('Added block removed from the local draft.');inspect(null);}else{saveHistory();draft.hidden[key]=true;applyChange('Element hidden in the local draft.');inspect(el);}});
    actions.append(hide,up,down,duplicate,reset,remove);inspector.append(advanced,actions);
  }
  function move(el,direction){const sib=el.parentElement&&[...el.parentElement.children].filter(x=>x!==panel&&!x.dataset.veWrap);const i=sib?sib.indexOf(el):-1;const target=sib&&sib[i+direction];if(!target)return say('Cannot move further in that direction.');saveHistory();if(direction<0)el.parentElement.insertBefore(el,target);else el.parentElement.insertBefore(target,el);say('Moved in this preview. Ordering of existing website elements is preview-only; added-block order is saved in the draft.');}
  function duplicateBlock(el){
    if(!el||!el.parentElement)return;
    const title=(el.textContent||'').trim().slice(0,90)||'Duplicated block';
    const item={id:'ve-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),kind:'card',title,text:(el.textContent||'').trim(),after:path(el)};
    saveHistory();draft.blocks.push(item);applyChange('Created a duplicate content card below the selected element.');
  }
  function addBlock(kind,title,text,src,href,alt){
    if(kind==='image'&&!safeImageSrc(src))return say('Use an HTTPS image URL or a site-relative path.');
    if(kind==='video'&&!(safeImageSrc(src)&&!/^data:/i.test(src)))return say('Use an HTTPS video URL or a site-relative path.');
    if(kind==='link'&&safeUrl(href)==='#'&&href!=='#')return say('Use HTTPS, HTTP, mailto:, a site-relative path, or a #section link.');
    let sanitizedHtml='';
    if(kind==='html'){
      if(String(text||'').length>20000)return say('Custom HTML is limited to 20,000 characters.');
      if(typeof window.DOMPurify?.sanitize!=='function')return say('The HTML sanitizer is unavailable. Reload this preview before inserting HTML.');
      const fragment=window.DOMPurify.sanitize(String(text||''),{RETURN_DOM_FRAGMENT:true,ALLOWED_TAGS:['a','abbr','b','blockquote','br','caption','code','dd','del','details','div','dl','dt','em','figcaption','figure','h2','h3','h4','hr','i','img','li','ol','p','picture','pre','q','s','section','small','span','strong','sub','summary','sup','table','tbody','td','th','thead','tr','u','ul','form','label','input','button'],ALLOWED_ATTR:['alt','aria-label','class','colspan','disabled','for','height','href','id','name','placeholder','rel','required','rowspan','src','target','title','type','value','width'],FORBID_TAGS:['script','style','iframe','object','embed','base','meta','link'],FORBID_ATTR:['action','formaction','srcdoc']});
      const holder=document.createElement('div');holder.append(fragment);if(!holder.childNodes.length||!holder.textContent.trim()&&!holder.querySelector('img,hr,br,table,form,input,button'))return say('Enter valid, non-empty HTML content.');sanitizedHtml=holder.innerHTML;text=sanitizedHtml;
    }
    const item={id:'ve-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),kind,title,text,html:sanitizedHtml,src,href,alt,after:selected?path(selected.closest('section,article')||selected):null};
    saveHistory();draft.blocks.push(item);applyChange('Added a new '+kind+' block to the local preview.');
  }
  function showAddForm(kind){
    const form=document.createElement('div');form.className='ve-add-form';
    const title=input('text','','Heading or title'),text=document.createElement('textarea');text.placeholder='Description or text';
    const src=input('url','',kind==='video'?'Video URL':'Image URL'),href=input('url','#contact','Link URL'),alt=input('text','','Image alt text');
    if(kind==='html')text.placeholder='Paste HTML. Scripts, event handlers, embeds and unsafe URLs are removed.';
    form.append(field('Title',title));
    if(['section','text','card','grid','video','html'].includes(kind))form.append(field(kind==='html'?'HTML content':'Text',text));
    if(kind==='image')form.append(field('Image URL',src),field('Alt text',alt));
    if(kind==='video')form.append(field('Video URL',src));
    if(kind==='spacer')form.append(document.createTextNode('Creates a 48 px gap. Select it afterward to adjust its height.'));
    if(kind==='link')form.append(field('Link URL',href));
    const actions=document.createElement('div');actions.className='ve-row';
    const create=document.createElement('button');create.className='primary';create.textContent='Add block';create.addEventListener('click',()=>{const before=draft.blocks.length;addBlock(kind,title.value.trim(),text.value,src.value,href.value,alt.value);if(draft.blocks.length>before)form.remove();});
    const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.addEventListener('click',()=>form.remove());actions.append(create,cancel);form.append(actions);
    inspector.before(form);
  }
  function applyActions(){
    if(!draft.actions||typeof draft.actions!=='object')draft.actions={};
    root.querySelectorAll('[data-ve-inline-action]').forEach(w=>{const key=w.dataset.veActionKey,action=draft.actions[key];if(!action||w.dataset.veActionStamp!==JSON.stringify(action))w.replaceWith(document.createTextNode(w.textContent||''));});
    root.querySelectorAll('[data-ve-dropdown-menu]').forEach(menu=>{const key=menu.dataset.veActionKey,action=draft.actions[key],trigger=menu.previousElementSibling;if(!action||!((action.mode==='element'&&action.type==='dropdown')||(action.mode==='text'&&action.type==='button'&&action.items?.length))||menu.dataset.veActionStamp!==JSON.stringify(action)){menu.remove();if(trigger?.dataset?.veDropdownTrigger){delete trigger.dataset.veDropdownTrigger;delete trigger.dataset.veActionStamp;delete trigger.dataset.veActionKey;trigger.removeAttribute('aria-expanded');trigger.removeAttribute('aria-haspopup');}}});
    Object.entries(draft.actions).forEach(([key,action])=>{const el=all(key)[0];if(!el||!action||!Array.isArray(action.items))return;const stamp=JSON.stringify(action);
      if(action.mode==='text'){if([...el.querySelectorAll('[data-ve-inline-action]')].some(w=>w.dataset.veActionKey===key&&w.dataset.veActionStamp===stamp))return;const target=String(action.text||'');if(!target)return;const fullText=el.textContent||'';const start=fullText.indexOf(target);if(start<0)return;const textNodes=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node,total=0;while((node=walker.nextNode())){const len=(node.textContent||'').length;textNodes.push({node,start:total,end:total+len});total+=len;}const locate=(offset,endBias=false)=>{for(let i=0;i<textNodes.length;i++){const part=textNodes[i];if(offset<part.end||(endBias&&offset===part.end)||i===textNodes.length-1)return {node:part.node,offset:Math.max(0,Math.min((part.node.textContent||'').length,offset-part.start))};}return null;};const a=locate(start),b=locate(start+target.length,true);if(!a||!b)return;const range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);const wrap=document.createElement(action.type==='link'?'a':'button');wrap.className='ve-inline-action';wrap.dataset.veInlineAction='true';wrap.dataset.veActionKey=key;wrap.dataset.veActionStamp=stamp;if(action.type==='link')wrap.href=safeUrl(action.href||'#');else{wrap.type='button';if(action.items.length){wrap.setAttribute('aria-haspopup','true');wrap.setAttribute('aria-expanded','false');}}try{const contents=range.extractContents();wrap.append(contents);range.insertNode(wrap);}catch(error){say('Could not convert this selection. Try selecting text within one heading or paragraph.');return;}if(action.type!=='link'&&action.items.length){const menu=makeDropdownMenu(key,action,stamp);wrap.insertAdjacentElement('afterend',menu);wrap.addEventListener('click',()=>{menu.hidden=!menu.hidden;wrap.setAttribute('aria-expanded',String(!menu.hidden));});}return;}
      else if(action.mode==='element'&&action.type==='dropdown'&&(el instanceof HTMLButtonElement||el instanceof HTMLAnchorElement)){if(el.dataset.veDropdownTrigger==='true'&&el.dataset.veActionStamp===stamp)return;el.dataset.veDropdownTrigger='true';el.dataset.veActionKey=key;el.dataset.veActionStamp=stamp;el.setAttribute('aria-haspopup','true');el.setAttribute('aria-expanded','false');const menu=makeDropdownMenu(key,action,stamp);el.insertAdjacentElement('afterend',menu);el.addEventListener('click',function veToggleDropdown(e){if(el instanceof HTMLAnchorElement)e.preventDefault();menu.hidden=!menu.hidden;el.setAttribute('aria-expanded',String(!menu.hidden));});}
    });
  }
  function makeDropdownMenu(key,action,stamp){const menu=document.createElement('div');menu.className='ve-dropdown-menu';menu.dataset.veDropdownMenu='true';menu.dataset.veActionKey=key;menu.dataset.veActionStamp=stamp;menu.hidden=true;action.items.forEach(item=>{if(!item||!String(item.label||'').trim())return;const a=document.createElement('a');a.textContent=String(item.label).slice(0,100);a.href=safeUrl(String(item.href||'#'));menu.append(a);});return menu;}
  function showActionForm(mode){
    if(mode==='text'&&(!lastSelection||!lastSelection.text))return say('Select the exact text on the website first, release the mouse, then choose this action. If the selection is lost, click the text and try again.');
    const control=mode==='element'?(selected?.closest('button,a')||selected):selected;
    if(mode==='element'&&(!(control instanceof HTMLButtonElement||control instanceof HTMLAnchorElement)))return say('Select an existing button or link first.');
    const key=mode==='text'?lastSelection.key:path(control),existing=draft.actions[key]||{};const form=document.createElement('div');form.className='ve-add-form';
    const kind=document.createElement('select');[['link','Link'],['button','Button']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;kind.append(o);});kind.value=existing.type==='button'?'button':'link';
    const href=input('url',existing.href||'#contact','HTTPS URL, mailto:, or #section');const menuItems=document.createElement('textarea');menuItems.placeholder='Optional dropdown items, one per line: Label | https://example.com or #section';menuItems.value=(existing.items||[]).map(x=>x.label+' | '+x.href).join('\n');
    if(mode==='element'){kind.replaceChildren();const o=document.createElement('option');o.value='dropdown';o.textContent='Dropdown menu';kind.append(o);kind.value='dropdown';}
    form.append(field(mode==='text'?'Selected text':'Selected element',input('text',mode==='text'?lastSelection.text:(control.textContent||'').trim().slice(0,100),'Text')));if(mode==='text')form.append(field('Convert to',kind),field('Link destination',href));form.append(field('Dropdown items',menuItems));
    const actions=document.createElement('div');actions.className='ve-row';const apply=document.createElement('button');apply.className='primary';apply.textContent='Apply';apply.addEventListener('click',()=>{const items=menuItems.value.split(/\n/).map(line=>{const i=line.indexOf('|');return i<0?null:{label:line.slice(0,i).trim(),href:safeUrl(line.slice(i+1).trim())};}).filter(x=>x&&x.label&&x.href!=='#');if(mode==='text'&&kind.value==='link'&&!href.value.trim())return say('Enter a link destination.');saveHistory();draft.actions[key]=mode==='text'?{mode:'text',type:kind.value,text:lastSelection.text,href:safeUrl(href.value||'#'),items:kind.value==='button'?items:[]}:{mode:'element',type:'dropdown',items};form.remove();applyChange(mode==='text'?'Selected text converted to a '+kind.value+'.':'Dropdown menu configured for the selected control.');});const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.addEventListener('click',()=>form.remove());actions.append(apply,cancel);form.append(actions);inspector.before(form);
  }
  function exportDraft(){
    const payload=JSON.stringify({project:'Green Gemstone Mining Company',targetBranch:'preview/resource-navigation-gallery',draftOnly:true,note:'This browser-only editor export is not published. Review and apply changes to the preview branch before release.',changes:draft},null,2);
    const fallback=()=>{const a=document.createElement('textarea');a.value=payload;a.style.cssText='position:fixed;opacity:0';document.body.append(a);a.select();const ok=document.execCommand('copy');a.remove();say(ok?'Editor change package copied. Paste it into this chat for review.':'Clipboard blocked. Try again and allow clipboard access.');};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(payload).then(()=>say('Editor change package copied. Paste it into this chat for review.')).catch(fallback);else fallback();
  }
  function resetDraft(){if(!confirm('Clear all editor drafts in this browser? This does not change the website.'))return;saveHistory();draft=blank();persist();location.reload();}
  function renderLayers(){
    if(!layers)return;
    layers.replaceChildren();
    const heading=document.createElement('div');heading.className='ve-label';heading.textContent='Layers / components';layers.append(heading);
    const help=document.createElement('p');help.className='ve-note';help.textContent='Find any item by its name or text, then select it to edit. Added blocks can be dragged to reorder.';layers.append(help);
    const search=input('search',layerFilter,'Find anything on this page');search.setAttribute('aria-label','Find anything on this page');search.addEventListener('input',()=>{layerFilter=search.value;layerOffset=0;renderLayers();const next=layers.querySelector('input[aria-label="Find anything on this page"]');next?.focus();if(next)next.setSelectionRange(layerFilter.length,layerFilter.length);});layers.append(search);
    const list=document.createElement('div');list.style.cssText='display:grid;gap:5px';layers.append(list);
    const nodes=[...root.querySelectorAll('section,article,header,footer,main,h1,h2,h3,img,a,button')].filter(el=>!el.closest('#'+ID)&&!el.closest('[data-ve-block-id]'));
    const query=layerFilter.trim().toLocaleLowerCase();
    const matching=query?nodes.filter(el=>[el.tagName,el.id,el.getAttribute('aria-label'),el.getAttribute('alt'),el.textContent].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)):nodes;
    const seen=new Set();
    matching.slice(layerOffset,layerOffset+100).forEach(el=>{
      const key=path(el);if(!key||seen.has(key))return;seen.add(key);
      const row=document.createElement('button');
      row.className='ve-layer-item';
      row.textContent=(el.tagName.toLowerCase())+(el.id?' #'+el.id:'')+' — '+(el.getAttribute('aria-label')||el.getAttribute('alt')||(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,32));
      row.style.cssText='text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;font-weight:500';
      // Selecting a layer should not silently turn off text editing. Keep the
      // owner's chosen mode; text-mode users can immediately edit its text.
      row.addEventListener('click',()=>selectElement(el));list.append(row);
    });
    const resultCount=document.createElement('p');resultCount.className='ve-note';resultCount.setAttribute('aria-live','polite');resultCount.textContent=query?(matching.length?`Showing ${layerOffset+1}–${Math.min(layerOffset+100,matching.length)} of ${matching.length} matches`:'No matching items. Try a shorter search.'):`Showing ${layerOffset+1}–${Math.min(layerOffset+100,nodes.length)} of ${nodes.length} items. Search to find the rest.`;layers.append(resultCount);
    if(layerOffset+100<matching.length){const more=document.createElement('button');more.textContent='Show more results';more.addEventListener('click',()=>{layerOffset+=100;renderLayers();});layers.append(more);}
    draft.blocks.forEach(block=>{
      const el=root.querySelector('[data-ve-block-id="'+block.id+'"]');
      const row=document.createElement('button');row.textContent='▦ '+(block.kind||'block')+' — '+(block.title||'Untitled');row.draggable=true;row.style.cssText='text-align:left;width:100%;border-style:dashed';
      row.addEventListener('click',()=>{if(el)selectElement(el);});
      row.addEventListener('dragstart',e=>{e.dataTransfer?.setData('text/ggmc-block',block.id);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});
      row.addEventListener('dragover',e=>e.preventDefault());
      row.addEventListener('drop',e=>{
        e.preventDefault();const moving=e.dataTransfer?.getData('text/ggmc-block');
        const from=draft.blocks.findIndex(b=>b.id===moving),to=draft.blocks.findIndex(b=>b.id===block.id);
        if(from<0||to<0||from===to)return;
        saveHistory();const [item]=draft.blocks.splice(from,1);draft.blocks.splice(to,0,item);
        const ordered=draft.blocks.map(b=>root.querySelector('[data-ve-block-id="'+b.id+'"]')).filter(Boolean);
        ordered.forEach(n=>n.parentElement?.append(n));persist();refresh();renderLayers();say('Block order saved in this browser draft.');
      });
      list.append(row);
    });
  }
    function buildPanel(){
    panel=document.createElement('aside');panel.id=ID;panel.setAttribute('aria-label','Preview editor studio');
    const h=document.createElement('h2');h.className='ve-title';h.textContent='Preview editor studio';
    const note=document.createElement('p');note.className='ve-note';note.textContent='Edit text (including white text), style elements, add content, and preview device widths. Drafts remain in this browser until reviewed and applied to the preview branch.';
    panel.append(h,note);
    const topbar=document.createElement('div');topbar.className='ve-topbar';const compactTitle=document.createElement('strong');compactTitle.textContent='GGMC Studio';compactTitle.style.color='#e4c87c';const collapse=document.createElement('button');collapse.textContent='Collapse';collapse.addEventListener('click',()=>{panel.classList.toggle('ve-collapsed');collapse.textContent=panel.classList.contains('ve-collapsed')?'Expand':'Collapse';});const dock=document.createElement('button');dock.textContent='Dock left';dock.addEventListener('click',()=>{const toLeft=!panel.classList.contains('ve-left');panel.style.removeProperty('left');panel.style.removeProperty('right');panel.style.removeProperty('top');panel.style.removeProperty('bottom');panel.classList.toggle('ve-left',toLeft);dock.textContent=toLeft?'Dock right':'Dock left';});topbar.append(compactTitle,collapse,dock);panel.append(topbar);
    const resize=(className,title,axes)=>{const handle=document.createElement('div');handle.className=className;handle.title=title;handle.setAttribute('role','separator');handle.setAttribute('aria-label',title);handle.addEventListener('mousedown',e=>{e.preventDefault();const startX=e.clientX,startY=e.clientY,rect=panel.getBoundingClientRect();const move=ev=>{const left=panel.classList.contains('ve-left');const width=Math.max(280,Math.min(window.innerWidth*.82,rect.width+(left?ev.clientX-startX:startX-ev.clientX)));const height=Math.max(260,Math.min(window.innerHeight-24,rect.height+(startY-ev.clientY)));if(axes.includes('x'))panel.style.width=width+'px';if(axes.includes('y')){panel.style.height=height+'px';panel.style.bottom='auto';}};const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);try{localStorage.setItem('ggmc-ve-width',panel.style.width);localStorage.setItem('ggmc-ve-height',panel.style.height)}catch{}};document.addEventListener('mousemove',move,{signal:lifetime.signal});document.addEventListener('mouseup',up,{signal:lifetime.signal});});panel.append(handle);};
    resize('ve-resize','Resize width','x');resize('ve-resize-height','Resize height','y');resize('ve-resize-corner','Resize width and height','xy');
    try{const w=localStorage.getItem('ggmc-ve-width'),h=localStorage.getItem('ggmc-ve-height');if(w&&parseFloat(w)>=280)panel.style.width=w;if(h&&parseFloat(h)>=260){panel.style.height=h;panel.style.bottom='auto';}}catch{}
    const modes=document.createElement('div');modes.className='ve-row';
    [['text','Edit text'],['select','Select element']].forEach(([value,label])=>{const b=document.createElement('button');b.textContent=label;b.dataset.mode=value;b.addEventListener('click',()=>setMode(value));modes.append(b);});
    const undoB=document.createElement('button');undoB.textContent='Undo';undoB.addEventListener('click',doUndo);
    const redoB=document.createElement('button');redoB.textContent='Redo';redoB.addEventListener('click',doRedo);modes.append(undoB,redoB);panel.append(modes);
    const addRow=document.createElement('div');addRow.className='ve-row';
    const types=document.createElement('select');types.setAttribute('aria-label','Block type');
    [['section','New section'],['text','Text card'],['card','Content card'],['grid','Two-column grid'],['image','Image'],['video','Video'],['link','Button/link'],['html','Custom HTML (sanitized)'],['divider','Divider'],['spacer','Spacer']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;types.append(o);});
    const add=document.createElement('button');add.className='primary';add.textContent='Add content';add.addEventListener('click',()=>showAddForm(types.value));addRow.append(types,add);panel.append(addRow);
    const actionRow=document.createElement('div');actionRow.className='ve-row';const convertText=document.createElement('button');convertText.textContent='Selected text → button/link';convertText.addEventListener('click',()=>showActionForm('text'));const dropdown=document.createElement('button');dropdown.textContent='Add dropdown to selected button';dropdown.addEventListener('click',()=>showActionForm('element'));actionRow.append(convertText,dropdown);panel.append(actionRow);
    const aiHeading=document.createElement('div');aiHeading.className='ve-label';aiHeading.textContent='AI copy review';panel.append(aiHeading);
     const aiNote=document.createElement('p');aiNote.className='ve-note';aiNote.textContent='Generate a suggestion, review it below, then explicitly accept it to apply the edit. Nothing is applied automatically.';panel.append(aiNote);
     const aiMode=document.createElement('select');aiMode.setAttribute('aria-label','AI writing action');[['rewrite','Rewrite'],['grammar','Fix grammar only'],['expand','Expand'],['shorten','Shorten'],['seo_title','SEO title'],['meta_description','Meta description'],['alt_text','Image alt text']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;aiMode.append(o);});panel.append(field('Action',aiMode));
     const aiTone=document.createElement('select');aiTone.setAttribute('aria-label','AI writing tone');[['professional','Professional'],['friendly','Friendly'],['persuasive','Persuasive'],['technical','Technical'],['concise','Concise'],['playful','Playful'],['bold','Bold']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;aiTone.append(o);});panel.append(field('Tone',aiTone));
     const aiSource=document.createElement('textarea');aiSource.setAttribute('aria-label','Text to send for AI review');aiSource.placeholder='Select text on the page or paste text to edit';aiSource.rows=3;panel.append(field('Source text',aiSource));
     const aiGenerate=document.createElement('button');aiGenerate.className='primary';aiGenerate.textContent='Generate suggestion';
     const aiReview=document.createElement('textarea');aiReview.setAttribute('aria-label','AI suggestion review');aiReview.placeholder='Generated suggestion appears here for review';aiReview.rows=4;aiReview.readOnly=true;panel.append(aiGenerate,field('Review suggestion',aiReview));
     const aiAccept=document.createElement('button');aiAccept.textContent='Accept and apply to selected element';aiAccept.disabled=true;panel.append(aiAccept);
     aiGenerate.addEventListener('click',async()=>{try{const api=window.__GGMC_EDITOR_API__;if(!api?.aiWrite)throw Error('AI writing is not connected on this preview.');const text=aiSource.value.trim();if(!text)throw Error('Select or enter text before generating a suggestion.');if(text.length>4000)throw Error('Text is limited to 4,000 characters.');aiGenerate.disabled=true;aiReview.value='Generating suggestion…';aiAccept.disabled=true;const result=await api.aiWrite({mode:aiMode.value,tone:aiTone.value,text});aiReview.value=result;aiAccept.disabled=false;say('Suggestion ready. Review it and choose Accept and apply before the page changes.');}catch(error){aiReview.value='';say(error instanceof Error?error.message:'Could not generate an AI suggestion.');}finally{aiGenerate.disabled=false;}});
     aiAccept.addEventListener('click',()=>{if(!selected)return say('Select the page element you want to update before accepting the suggestion.');const value=aiReview.value.trim();if(!value)return say('Generate and review a suggestion before accepting it.');if(selected.dataset.veBlockId){const block=draft.blocks.find(b=>b.id===selected.dataset.veBlockId);if(!block||!['section','text','card','grid','video'].includes(block.kind))return say('AI acceptance is limited to text content blocks and page text.');saveHistory();block.text=value;applyChange('Accepted AI suggestion and applied it to the selected content block.');}else{saveHistory();const key=path(selected);const before=selected.childElementCount?directTextValue(selected):(selected.textContent||'');draft.text[key]={before:selected.dataset.veOriginal??before,after:value};applyChange('Accepted AI suggestion and applied it to the selected page text.');}aiAccept.disabled=true;});
     const serverHeading=document.createElement('div');serverHeading.className='ve-label';serverHeading.textContent='Secure server drafts';panel.append(serverHeading);
    const serverNote=document.createElement('p');serverNote.className='ve-note';serverNote.textContent='Owner sign-in required. Save creates server versions across devices. Publish records an immutable snapshot; it does not deploy code to Vercel.';panel.append(serverNote);
    const serverName=input('text','Website draft','Draft name');serverName.addEventListener('input',()=>{serverAutosaveDraftName=serverName.value.trim().slice(0,120)||'Website draft';});panel.append(field('Draft name',serverName));
    const serverEmail=input('email','','Owner email'),serverPassword=input('password','','Owner password');serverEmail.autocomplete='username';serverPassword.autocomplete='current-password';
    panel.append(field('Owner email',serverEmail),field('Password',serverPassword));
    const serverSelect=document.createElement('select');serverSelect.setAttribute('aria-label','Saved server drafts');serverSelect.style.width='100%';panel.append(serverSelect);
    const versionSelect=document.createElement('select');versionSelect.setAttribute('aria-label','Saved versions');versionSelect.style.width='100%';panel.append(field('Version history',versionSelect));
    const serverRow=document.createElement('div');serverRow.className='ve-row';
    const serverLogin=document.createElement('button');serverLogin.textContent='Sign in';serverLogin.addEventListener('click',async()=>{try{const api=window.__GGMC_EDITOR_API__;if(!api?.signIn)throw Error('Server drafts are not connected on this preview.');await api.signIn(serverEmail.value,serverPassword.value);say('Signed in as editor admin.');await loadServerDrafts();}catch(err){say(err.message||'Sign in failed.');}});
    const serverRefresh=document.createElement('button');serverRefresh.textContent='Refresh';serverRefresh.addEventListener('click',loadServerDrafts);
    const serverLoad=document.createElement('button');serverLoad.textContent='Load draft';serverLoad.addEventListener('click',async()=>{try{const api=window.__GGMC_EDITOR_API__;if(!api?.listDrafts)throw Error('Server drafts are not connected on this preview.');const rows=await api.listDrafts();const row=rows?.find(x=>x.id===serverSelect.value);if(!row)throw Error('Select a server draft first.');draft=copy(row.payload);serverDraftId=row.id;serverVersion=row.version;serverDraftStatus=row.status;serverAutosaveDirty=false;serverAutosaveConflict=false;serverName.value=row.name;serverAutosaveDraftName=row.name;persistServerState();undo=[];redo=[];persist();refresh();renderLayers();inspect(null);say('Loaded '+row.status+' version '+row.version+'.');}catch(err){say(err.message||'Could not load draft.');}});
    const serverSave=document.createElement('button');serverSave.className='primary';serverSave.textContent='Save server draft';serverSave.addEventListener('click',async()=>{try{const api=window.__GGMC_EDITOR_API__;if(!api?.getSession||!api?.saveDraft)throw Error('Server drafts are not connected on this preview.');const session=await api.getSession();if(!session?.isAdmin)throw Error('Sign in with an authorised owner account first.');let name=serverName.value.trim();if(!name||name.length>120)throw Error('Draft name must be 1–120 characters.');if(serverDraftStatus==='published'){name=(name+' (copy)').slice(0,120);serverName.value=name;}const result=await api.saveDraft({id:serverDraftStatus==='published'?null:serverDraftId,expectedVersion:serverDraftStatus==='published'?0:serverVersion,name,payload:draft});if(!result)throw Error('Server did not return the saved version.');serverDraftId=result.id;serverVersion=result.version;serverDraftStatus=result.status;serverAutosaveDirty=false;serverAutosaveConflict=false;serverAutosaveDraftName=name;persistServerState();await loadServerDrafts();say('Server draft saved as version '+result.version+'.');}catch(err){say(err.message||'Server save failed.');}});
    const serverPublish=document.createElement('button');serverPublish.className='primary';serverPublish.textContent='Publish snapshot';serverPublish.addEventListener('click',async()=>{try{if(!serverDraftId||serverVersion<1||serverDraftStatus==='published')throw Error('Save a new draft before publishing.');const api=window.__GGMC_EDITOR_API__;if(!api?.publishDraft)throw Error('Server drafts are not connected on this preview.');if(!confirm('Publish this saved snapshot? This does not deploy code to Vercel.'))return;const result=await api.publishDraft(serverDraftId,serverVersion);if(!result)throw Error('Publish returned no result.');serverDraftStatus=result.status;serverVersion=result.version;persistServerState();await loadServerDrafts();say('Published server snapshot v'+result.version+'.');}catch(err){say(err.message||'Publish failed.');}});
    const serverVersions=document.createElement('button');serverVersions.textContent='Load versions';serverVersions.addEventListener('click',async()=>{try{if(!serverDraftId)throw Error('Load or save a server draft first.');const api=window.__GGMC_EDITOR_API__;if(!api?.listVersions)throw Error('Server drafts are not connected on this preview.');const rows=await api.listVersions(serverDraftId);versionSelect.replaceChildren();(rows||[]).forEach(v=>{const o=document.createElement('option');o.value=String(v.id);o.dataset.version=String(v.version);o.textContent='v'+v.version+' · '+v.status+' · '+v.note;o.dataset.payload=JSON.stringify(v.payload);versionSelect.append(o);});say('Version history loaded.');}catch(err){say(err.message||'Version history failed.');}});
    const restoreLocalVersion=document.createElement('button');restoreLocalVersion.textContent='Restore locally';restoreLocalVersion.addEventListener('click',()=>{const opt=versionSelect.selectedOptions[0];if(!opt)return say('Select a version first.');saveHistory();draft=JSON.parse(opt.dataset.payload||'{}');serverDraftId=null;serverVersion=0;serverDraftStatus='draft';persistServerState();persist();refresh();renderLayers();say('Restored version into a local draft.');});
    const restoreServerVersion=document.createElement('button');restoreServerVersion.textContent='Restore to server draft';restoreServerVersion.addEventListener('click',async()=>{try{const opt=versionSelect.selectedOptions[0];if(!opt||!serverDraftId)throw Error('Load a server draft and select a version first.');const version=Number(opt.dataset.version);if(!Number.isInteger(version)||version<1)throw Error('Selected version is invalid.');const api=window.__GGMC_EDITOR_API__;if(!api?.restoreVersion)throw Error('Server drafts are not connected on this preview.');const restored=await api.restoreVersion(serverDraftId,version);if(!restored)throw Error('Server did not return a restored draft.');draft=copy(restored.payload);serverDraftId=restored.id;serverVersion=restored.version;serverDraftStatus=restored.status;serverAutosaveDirty=false;serverAutosaveConflict=false;serverName.value=restored.name;serverAutosaveDraftName=restored.name;persistServerState();undo=[];redo=[];persist();refresh();renderLayers();await loadServerDrafts();say('Restored version '+version+' to a new server draft. Original history is unchanged.');}catch(err){say(err.message||'Server version restore failed.');}});
    serverRow.append(serverLogin,serverRefresh,serverLoad,serverSave,serverPublish,serverVersions,restoreLocalVersion,restoreServerVersion);panel.append(serverRow);
    async function loadServerDrafts(){try{const api=window.__GGMC_EDITOR_API__;if(!api?.getSession||!api?.listDrafts)throw Error('Server drafts are not connected on this preview.');const session=await api.getSession();if(!session?.isAdmin)throw Error('Sign in with an authorised owner account first.');const rows=await api.listDrafts();serverSelect.replaceChildren();(rows||[]).forEach(row=>{const o=document.createElement('option');o.value=row.id;o.textContent=row.name+' · v'+row.version+' · '+row.status;serverSelect.append(o);});if(serverDraftId)serverSelect.value=serverDraftId;say('Loaded '+(rows||[]).length+' server draft(s).');}catch(err){say(err.message||'Could not list drafts.');}}
    const tools=document.createElement('div');tools.className='ve-row';
    const exp=document.createElement('button');exp.className='primary';exp.textContent='Export JSON';exp.addEventListener('click',exportDraft);
    const reset=document.createElement('button');reset.className='danger';reset.textContent='Reset draft';reset.addEventListener('click',resetDraft);
    const close=document.createElement('button');close.textContent='Close';close.addEventListener('click',()=>{if(!confirm('Close the editor? Your local draft remains saved.'))return;teardown();});
    tools.append(exp,reset,close);panel.append(tools);
    const label=document.createElement('div');label.className='ve-label';label.textContent='Inspector';panel.append(label);
    inspector=document.createElement('div');panel.append(inspector);
    const layerSection=document.createElement('div');panel.append(layerSection);layers=layerSection;renderLayers();
    const responsive=document.createElement('div');responsive.className='ve-label';responsive.textContent='Responsive preview';panel.append(responsive);
    const devices=document.createElement('div');devices.className='ve-row';
    [['Desktop','100%'],['Tablet','768px'],['Mobile','390px']].forEach(([label,width])=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>{if(width==='100%'){rootStyleBaseline.forEach(([prop,value,priority])=>{if(value)root.style.setProperty(prop,value,priority);else root.style.removeProperty(prop);});}else{root.style.maxWidth=width;root.style.width='100%';root.style.marginInline='auto';root.style.boxShadow='0 0 0 2px #c4a252';}root.dataset.veViewport=label;say('Canvas width: '+label+'. This adjusts canvas width; browser media-query breakpoints still follow the actual window width.');devices.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));});devices.append(b);});panel.append(devices);
    status=document.createElement('div');status.className='ve-status';status.setAttribute('aria-live','polite');panel.append(status);
    counter=document.createElement('div');counter.className='ve-count';panel.append(counter);
    document.body.append(panel);updateCount();inspect(null);
    import('/visual-editor/features/creative-studio.js').then(module => {
      if (!panel || !panel.isConnected) return;
      featureTeardown = module.mountCreativeStudio({ panel, root, getDraft: () => draft, saveHistory, applyChange, say, getSelected: () => selected, editorApi: window.__GGMC_EDITOR_API__, aiWrite: input => window.__GGMC_EDITOR_API__?.aiWrite?.(input) });
    }).catch(() => say('Creative Studio module did not load. Existing editor tools remain available.'));
  }
  function teardown(){
    if(observer){observer.disconnect();observer=null;}
    lifetime.abort();
    document.body.classList.remove('ggmc-ve-on','ggmc-ve-text','ggmc-ve-select');
    root.querySelectorAll('[data-ve-key]').forEach(el=>{el.removeAttribute('contenteditable');el.removeAttribute('data-ve-key');});
    root.querySelectorAll('[data-ve-selected="true"]').forEach(el=>el.removeAttribute('data-ve-selected'));
    rootStyleBaseline.forEach(([prop,value,priority])=>{if(value)root.style.setProperty(prop,value,priority);else root.style.removeProperty(prop);});
    if(rootViewportBaseline===undefined)delete root.dataset.veViewport;else root.dataset.veViewport=rootViewportBaseline;
    try { featureTeardown?.(); } catch {} featureTeardown = null;
    if(panel)panel.remove();style.remove();panel=null;mode='closed';selected=null;textStart=null;lastSelection=null;
    const u=new URL(location.href);u.searchParams.delete('edit');history.replaceState({},'',u);
    showPreviewTrigger();
  }
  function setMode(next){if(!panel||!panel.isConnected)return;mode=next;document.body.classList.toggle('ggmc-ve-text',mode==='text');document.body.classList.toggle('ggmc-ve-select',mode==='select');panel.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));refresh();say(mode==='text'?'Click outlined text and type. Your edits save locally.':'Click an element on the page to change its styling, visibility, or position.');}
  function flushActiveText(){const active=document.activeElement;if(active instanceof HTMLElement&&active.isContentEditable)active.blur();}
  function doUndo(){flushActiveText();if(!undo.length)return say('Nothing to undo.');redo.push(copy(draft));draft=undo.pop();serverAutosaveDirty=true;persist();refresh();renderLayers();if(selected&&document.contains(selected))inspect(selected);else inspect(null);say('Undid the previous change.');}
  function doRedo(){flushActiveText();if(!redo.length)return say('Nothing to redo.');undo.push(copy(draft));draft=redo.pop();serverAutosaveDirty=true;persist();refresh();renderLayers();if(selected&&document.contains(selected))inspect(selected);else inspect(null);say('Restored the next change.');}
  document.addEventListener('focusin',e=>{if(!panel||!panel.isConnected)return;const el=e.target;if(mode==='text'&&el instanceof HTMLElement&&el.isContentEditable&&el.dataset.veKey)textStart=copy(draft);},{signal:lifetime.signal});
  document.addEventListener('focusout',e=>{if(!panel||!panel.isConnected)return;const el=e.target;if(mode==='text'&&el instanceof HTMLElement&&el.dataset.veKey&&textStart){if(JSON.stringify(textStart)!==JSON.stringify(draft)){undo.push(textStart);if(undo.length>60)undo.shift();redo=[];}textStart=null;}},{signal:lifetime.signal});
  document.addEventListener('input',e=>{if(!panel||!panel.isConnected)return;const el=e.target;if(!(el instanceof HTMLElement)||!el.isContentEditable||!el.dataset.veKey)return;serverAutosaveDirty=true;const key=el.dataset.veKey;const prev=draft.text[key];draft.text[key]={before:prev?prev.before:(el.dataset.veOriginal||''),after:el.textContent||''};el.dataset.veAppliedText=el.textContent||'';persist();say('Text draft saved in this browser.');},{signal:lifetime.signal});
  document.addEventListener('click',e=>{if(!panel||!panel.isConnected||panel.contains(e.target))return;const targetElement=e.target instanceof Element?e.target:null;if(targetElement?.closest('[data-ve-inline-action],[data-ve-dropdown-menu],[data-ve-dropdown-trigger="true"]'))return;if(mode==='select'){const el=targetElement?.closest('#root *');if(el&&!el.closest('#'+ID)){e.preventDefault();e.stopPropagation();selectElement(el);}}else if(mode==='text'){const target=targetElement?.closest('#root [data-ve-key]');if(target&&target.childElementCount>0){e.preventDefault();e.stopPropagation();selectElement(target);inspector?.querySelector('textarea[aria-label=\"Edit this text while keeping links and formatting\"]')?.focus();}else {const el=targetElement?.closest('[data-ve-key][contenteditable=\"true\"]');if(el&&el.closest('a'))e.preventDefault();}}},{capture:true,signal:lifetime.signal});
  document.addEventListener('mouseup',e=>{if(!panel||!panel.isConnected||panel.contains(e.target))return;const s=window.getSelection();if(!s||s.isCollapsed||!s.toString().trim())return;const node=s.anchorNode?.parentElement;if(!node||!root.contains(node)||node.closest('#'+ID))return;lastSelection={key:path(node.closest('[data-ve-key]')||node),text:s.toString().trim()};},{signal:lifetime.signal});
  document.addEventListener('keyup',e=>{if(!panel||!panel.isConnected)return;if(e.target instanceof HTMLElement&&e.target.isContentEditable){const s=window.getSelection();if(s&&!s.isCollapsed&&s.toString().trim()){const node=s.anchorNode?.parentElement;if(node&&root.contains(node))lastSelection={key:path(node.closest('[data-ve-key]')||node),text:s.toString().trim()};}}},{signal:lifetime.signal});
  document.addEventListener('keydown',e=>{if(!panel||!panel.isConnected)return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?doRedo():doUndo();}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='y'){e.preventDefault();doRedo();}if(e.key==='Escape'&&mode==='select')setMode('text');},{signal:lifetime.signal});
  buildPanel();refresh();setMode('text');
  observer=new MutationObserver(()=>{if(panel&&panel.isConnected){refresh();renderLayers();}});observer.observe(root,{childList:true,subtree:true});
  say('Draft only. No website or production changes are published from this panel.');
  };
  if (params.get('edit') === '1') void startEditor(); else showPreviewTrigger();
})();

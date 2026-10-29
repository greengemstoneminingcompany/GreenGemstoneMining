/**
 * GGMC Preview Editor — Creative Studio feature module.
 * Deliberately isolated from the legacy editor shell. It receives a narrow adapter
 * and never edits the live page except through the editor's normal draft/refresh path.
 */
const LIBRARY_KEY = 'ggmc-preview-creative-library-v1';
const MAX_LIBRARY_ITEMS = 40;
const MAX_LIBRARY_BYTES = 500_000;
const BUILT_INS = [
  { id: 'mining-hero', name: 'Mining hero', description: 'Headline, supporting copy and clear next step.', block: { kind: 'section', title: 'Responsible mineral development', text: 'Build a clearer story about your operation, your standards, and the value you bring to partners.' } },
  { id: 'mission-story', name: 'Mission story', description: 'A focused section for mission and operating principles.', block: { kind: 'section', title: 'Built on responsible practice', text: 'Explain your approach, the people behind the work, and the standards that guide each decision.' } },
  { id: 'two-column', name: 'Two-column story', description: 'A balanced comparison or story grid.', block: { kind: 'grid', title: 'Our approach', text: 'Describe the first pillar of your approach.' } },
  { id: 'partner-card', name: 'Partner card', description: 'A compact content card for partners or services.', block: { kind: 'card', title: 'Work with us', text: 'Introduce the opportunity and the next step for interested partners.' } },
  { id: 'contact-cta', name: 'Contact call-to-action', description: 'A direct closing section with a safe internal link.', block: { kind: 'link', title: 'Discuss a partnership', href: '#contact' } },
];
const clone = value => JSON.parse(JSON.stringify(value));
const makeId = () => globalThis.crypto?.randomUUID?.() || 've-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
const safeText = (value, max = 3000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const readLibrary = () => {
  try {
    const value = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && item.block && typeof item.block === 'object').slice(0, MAX_LIBRARY_ITEMS) : [];
  } catch { return []; }
};
const writeLibrary = value => {
  const bounded = value.slice(0, MAX_LIBRARY_ITEMS);
  const serialized = JSON.stringify(bounded);
  if (serialized.length > MAX_LIBRARY_BYTES) throw new Error('The creative library is full. Remove an older template before saving another.');
  localStorage.setItem(LIBRARY_KEY, serialized);
};
const section = (title, description) => {
  const node = document.createElement('section');
  node.className = 've-feature-module';
  node.style.cssText = 'border-top:1px solid #3b493f;margin-top:14px;padding-top:12px';
  const heading = document.createElement('div'); heading.className = 've-label'; heading.textContent = title;
  const note = document.createElement('p'); note.className = 've-note'; note.textContent = description;
  node.append(heading, note);
  return node;
};
const button = (label, handler, primary = false) => {
  const node = document.createElement('button'); node.type = 'button'; node.textContent = label;
  if (primary) node.className = 'primary';
  node.addEventListener('click', handler); return node;
};
const field = (label, input) => {
  const wrap = document.createElement('label'); wrap.className = 've-field';
  const caption = document.createElement('span'); caption.textContent = label;
  wrap.append(caption, input); return wrap;
};
const select = (label, options) => {
  const node = document.createElement('select'); node.setAttribute('aria-label', label);
  for (const [value, text] of options) { const option = document.createElement('option'); option.value = value; option.textContent = text; node.append(option); }
  return node;
};
const textInput = (label, value = '') => {
  const node = document.createElement('input'); node.type = 'text'; node.setAttribute('aria-label', label); node.value = value; return node;
};

export function mountCreativeStudio(api) {
  const { panel, root, getDraft, saveHistory, applyChange, say, getSelected, aiWrite, editorApi } = api;
  if (!panel || !root || typeof getDraft !== 'function') return () => {};
  const originalTokens = new Map(['--ggmc-brand','--ggmc-accent','--ggmc-surface','--ggmc-copy','--ggmc-radius','--ggmc-section-space','--ggmc-content-width'].map(key => [key, root.style.getPropertyValue(key)]));
  const tokenStyle = document.createElement('style');
  tokenStyle.dataset.ggmcFeature = 'creative-studio-tokens';
  document.head.append(tokenStyle);
  const applyTokens = () => {
    const tokens = getDraft().designTokens || {};
    const color = (key, fallback) => /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(tokens[key] || '') ? tokens[key] : fallback;
    const numeric = (key, fallback, min, max) => {
      const value = Number(tokens[key]);
      return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
    };
    const values = {
      '--ggmc-brand': color('brand', '#101b15'),
      '--ggmc-accent': color('accent', '#c4a252'),
      '--ggmc-surface': color('surface', '#16231b'),
      '--ggmc-copy': color('copy', '#f2eee4'),
      '--ggmc-radius': numeric('radius', 12, 0, 48) + 'px',
      '--ggmc-section-space': numeric('sectionSpace', 64, 16, 180) + 'px',
      '--ggmc-content-width': numeric('contentWidth', 1120, 640, 1600) + 'px',
    };
    for (const [key, value] of Object.entries(values)) root.style.setProperty(key, value);
    tokenStyle.textContent = [
      '#root .ve-added-section{background:var(--ggmc-brand);color:var(--ggmc-copy);padding-block:var(--ggmc-section-space)}',
      '#root .ve-added-inner{max-width:var(--ggmc-content-width)}',
      '#root .ve-added-card,#root .ve-added-grid .ve-added-card{background:var(--ggmc-surface);color:var(--ggmc-copy);border-color:var(--ggmc-accent);border-radius:var(--ggmc-radius)}',
      '#root .ve-added-link{background:var(--ggmc-accent);border-radius:calc(var(--ggmc-radius) + 18px)}',
    ].join('\n');
  };
  const sectionDraft = section('', 'Global design tokens', 'Change the visual language for editor-added sections and cards. Values are validated and stored in this draft.');
  const palette = select('Design palette', [['heritage','Heritage gold'],['forest','Forest green'],['stone','Mineral stone'],['ocean','Deep ocean']]);
  const palettes = {
    heritage: { brand:'#101b15', accent:'#c4a252', surface:'#16231b', copy:'#f2eee4' },
    forest: { brand:'#10271f', accent:'#b9d58a', surface:'#1b392e', copy:'#f3f6ed' },
    stone: { brand:'#252723', accent:'#d0bda0', surface:'#363a34', copy:'#f4f0e8' },
    ocean: { brand:'#10232e', accent:'#d5b76a', surface:'#1b3542', copy:'#eef5f5' },
  };
  const tokens = getDraft().designTokens || {};
  const colorFields = {};
  const colors = document.createElement('div'); colors.className = 've-grid';
  for (const [key, label] of [['brand','Brand'],['accent','Accent'],['surface','Card surface'],['copy','Text']]) {
    const input = document.createElement('input'); input.type = 'color'; input.value = tokens[key] || palettes.heritage[key]; input.setAttribute('aria-label', label + ' token'); colorFields[key] = input;
    colors.append(field(label, input));
  }
  const radius = document.createElement('input'); radius.type='number'; radius.min='0'; radius.max='48'; radius.value=String(tokens.radius ?? 12); radius.setAttribute('aria-label','Card radius');
  const space = document.createElement('input'); space.type='number'; space.min='16'; space.max='180'; space.value=String(tokens.sectionSpace ?? 64); space.setAttribute('aria-label','Section spacing');
  const width = document.createElement('input'); width.type='number'; width.min='640'; width.max='1600'; width.value=String(tokens.contentWidth ?? 1120); width.setAttribute('aria-label','Content max width');
  const applyTokensButton = button('Apply design system', () => {
    const values = { brand: colorFields.brand.value, accent: colorFields.accent.value, surface: colorFields.surface.value, copy: colorFields.copy.value, radius: Number(radius.value), sectionSpace: Number(space.value), contentWidth: Number(width.value) };
    if (!Number.isFinite(values.radius) || values.radius < 0 || values.radius > 48 || !Number.isFinite(values.sectionSpace) || values.sectionSpace < 16 || values.sectionSpace > 180 || !Number.isFinite(values.contentWidth) || values.contentWidth < 640 || values.contentWidth > 1600) return say('Check design token values: radius 0–48px, section spacing 16–180px, content width 640–1600px.');
    saveHistory(); getDraft().designTokens = values; applyTokens(); applyChange('Design system applied to editor-added content and saved in the local draft.');
  }, true);
  palette.addEventListener('change', () => { const selected = palettes[palette.value]; if (!selected) return; for (const key of Object.keys(colorFields)) colorFields[key].value = selected[key]; });
  sectionDraft.append(field('Palette', palette), colors, field('Radius (px)', radius), field('Section space', space), field('Content width', width), applyTokensButton);
  panel.append(sectionDraft);
  applyTokens();

  const librarySection = section('', 'Creative library', 'Use starter layouts, browser-local templates, or secure server templates shared across your authorised preview editing sessions.');
  const starter = select('Starter template', BUILT_INS.map(item => [item.id, item.name]));
  const starterInfo = document.createElement('p'); starterInfo.className='ve-note';
  const updateStarterInfo = () => { starterInfo.textContent = BUILT_INS.find(item => item.id === starter.value)?.description || ''; };
  starter.addEventListener('change', updateStarterInfo); updateStarterInfo();
  const addStarter = button('Add starter section', () => {
    const item = BUILT_INS.find(entry => entry.id === starter.value); if (!item) return;
    saveHistory(); getDraft().blocks.push({ ...clone(item.block), id: makeId() });
    applyChange('Added "' + item.name + '" to the draft. Review it on the page before publishing.');
  }, true);
  const templateName = textInput('Template name', 'My reusable section');
  const saveSelected = button('Save selected block as template', () => {
    const selected = getSelected();
    const id = selected?.dataset?.veBlockId;
    const block = id ? getDraft().blocks.find(item => item.id === id) : null;
    if (!block) return say('Select an editor-added block on the page before saving it as a template.');
    const name = safeText(templateName.value, 80);
    if (!name) return say('Give this template a name first.');
    try {
      const library = readLibrary();
      library.unshift({ id: makeId(), name, savedAt: new Date().toISOString(), block: clone(block) });
      writeLibrary(library); renderLibrary();
      say('Saved "' + name + '" to your local creative library.');
    } catch (error) { say(error instanceof Error ? error.message : 'Could not save this template.'); }
  });
  const savedList = document.createElement('div'); savedList.style.cssText='display:grid;gap:6px;margin-top:8px';
  function renderLibrary() {
    savedList.replaceChildren();
    const items = readLibrary();
    if (!items.length) { const empty = document.createElement('p'); empty.className='ve-note'; empty.textContent='No saved templates yet. Select a block and save it here.'; savedList.append(empty); return; }
    items.forEach(item => {
      const row = document.createElement('div'); row.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:5px;align-items:center';
      const name = document.createElement('span'); name.textContent=item.name; name.style.cssText='overflow-wrap:anywhere;color:#f2eee4;font-size:11px';
      const insert = button('Insert', () => { saveHistory(); getDraft().blocks.push({ ...clone(item.block), id: makeId() }); applyChange('Inserted reusable template "' + item.name + '" as a new draft block.'); });
      const remove = button('Delete', () => { try { writeLibrary(readLibrary().filter(entry => entry.id !== item.id)); renderLibrary(); say('Removed template from this browser library. Existing page blocks are unchanged.'); } catch { say('Could not update the template library.'); } });
      row.append(name, insert, remove); savedList.append(row);
    });
  }
  const serverTemplateHeading = document.createElement('div');
  serverTemplateHeading.className = 've-label';
  serverTemplateHeading.textContent = 'Shared server templates';
  const serverTemplateNote = document.createElement('p');
  serverTemplateNote.className = 've-note';
  serverTemplateNote.textContent = 'These templates are stored in the preview database and are available across devices to authorised editor admins. Sign in to load, save, or delete them.';
  const serverTemplateList = document.createElement('div');
  serverTemplateList.style.cssText = 'display:grid;gap:6px;margin-top:8px';
  const loadServerTemplates = async () => {
    if (!editorApi?.listTemplates) return say('Shared server templates are not connected on this preview.');
    try {
      const items = await editorApi.listTemplates();
      serverTemplateList.replaceChildren();
      if (!items.length) {
        const empty = document.createElement('p'); empty.className = 've-note';
        empty.textContent = 'No shared templates saved yet.'; serverTemplateList.append(empty);
      }
      items.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:5px;align-items:center';
        const name = document.createElement('span'); name.textContent = item.name;
        name.style.cssText = 'overflow-wrap:anywhere;color:#f2eee4;font-size:11px';
        const insert = button('Insert', () => {
          if (!item.block || typeof item.block !== 'object') return say('This saved template is invalid and cannot be inserted.');
          saveHistory(); getDraft().blocks.push({ ...clone(item.block), id: makeId() });
          applyChange('Inserted shared server template "' + item.name + '" as a new draft block.');
        });
        const remove = button('Delete', async () => {
          if (!confirm('Delete the shared template "' + item.name + '"? Existing page blocks are unchanged.')) return;
          try { const removed = await editorApi.deleteTemplate(item.id); if (!removed) throw new Error('This template was already removed. Reload the shared template list.'); await loadServerTemplates(); say('Deleted shared template "' + item.name + '".'); }
          catch (error) { say(error instanceof Error ? error.message : 'Could not delete the shared template.'); }
        });
        row.append(name, insert, remove); serverTemplateList.append(row);
      });
      say('Loaded ' + items.length + ' shared server template(s).');
    } catch (error) {
      say(error instanceof Error ? error.message : 'Could not load shared server templates. Sign in with an authorised preview editor account.');
    }
  };
  const saveSelectedServer = button('Save selected block to server', async () => {
    if (!editorApi?.saveTemplate) return say('Shared server templates are not connected on this preview.');
    const selected = getSelected();
    const id = selected?.dataset?.veBlockId;
    const block = id ? getDraft().blocks.find(item => item.id === id) : null;
    if (!block) return say('Select an editor-added block on the page before saving it as a shared template.');
    const name = safeText(templateName.value, 80);
    if (!name) return say('Give this shared template a name first.');
    try {
      const saved = await editorApi.saveTemplate({ id: null, name, block: clone(block) });
      await loadServerTemplates();
      say('Saved "' + saved.name + '" to shared server templates.');
    } catch (error) { say(error instanceof Error ? error.message : 'Could not save the shared template.'); }
  }, true);
  const loadServerButton = button('Load shared templates', loadServerTemplates);
  librarySection.append(field('Starter layout', starter), starterInfo, addStarter, field('Template name', templateName), saveSelected, savedList, serverTemplateHeading, serverTemplateNote, loadServerButton, saveSelectedServer, serverTemplateList);
  panel.append(librarySection); renderLibrary();

  const aiSection = section('', 'AI section workshop', 'Turn a brief into a proposed section. AI output is review-only until you explicitly add it to the draft; no existing links or images are replaced.');
  const brief = document.createElement('textarea'); brief.rows=3; brief.setAttribute('aria-label','AI section brief'); brief.placeholder='Describe the section you want, e.g. explain our responsible sourcing approach to international partners.';
  const layout = select('Suggested section layout', [['section','Editorial section'],['card','Single content card'],['grid','Two-column layout']]);
  const tone = select('Section tone', [['professional','Professional'],['technical','Technical'],['friendly','Friendly'],['concise','Concise'],['persuasive','Persuasive']]);
  const generate = button('Generate section proposal', async () => {
    const source = safeText(brief.value, 3000); if (!source) return say('Describe the section you want before generating a proposal.');
    if (!aiWrite) return say('AI writing is not connected on this preview.');
    generate.disabled = true; review.value = 'Generating a reviewable section proposal…'; accept.disabled = true;
    try {
      const result = await aiWrite({ mode: 'section_copy', tone: tone.value, text: 'Write concise website section copy for Green Gemstone Mining Company based only on this brief. Do not invent facts, certifications, locations, statistics, reserves, or claims. Return a short headline on the first line, then a blank line, then body copy. Brief: ' + source });
      const lines = result.split('\n').map(line => line.trim()).filter(Boolean);
      proposalTitle.value = safeText((lines[0] || 'New section').replace(/^(headline|title)\s*:\s*/i,''), 120);
      review.value = lines.slice(1).join('\n') || result;
      accept.disabled = !review.value.trim();
      say('Proposal generated. Review the headline, copy and layout before adding it.');
    } catch (error) { review.value=''; say(error instanceof Error ? error.message : 'Could not generate a section proposal.'); }
    finally { generate.disabled = false; }
  }, true);
  const proposalTitle = textInput('Proposed section headline','');
  const review = document.createElement('textarea'); review.rows=5; review.setAttribute('aria-label','AI section proposal review'); review.placeholder='AI-generated copy will appear here for review.';
  const accept = button('Review accepted — add section to draft', () => {
    const title = safeText(proposalTitle.value, 120); const text = safeText(review.value, 3000);
    if (!title || !text) return say('Review and complete both the headline and copy before accepting.');
    const kind = layout.value;
    saveHistory();
    const block = kind === 'grid'
      ? { id: makeId(), kind:'grid', title, text }
      : { id: makeId(), kind, title, text };
    getDraft().blocks.push(block);
    applyChange('Added the reviewed AI section as a new draft block. Existing content, links and images were left unchanged.');
    accept.disabled = true;
  });
  accept.disabled = true;
  aiSection.append(field('Section brief', brief), field('Layout', layout), field('Tone', tone), generate, field('Proposed headline', proposalTitle), field('Review copy', review), accept);
  panel.append(aiSection);

  const compareSection = section('', 'Version comparison', 'Compare a loaded saved version with the current local draft. Restoring still creates a separate draft.');
  const compare = button('Compare selected version with draft', () => {
    const serverVersions = panel.querySelector('[aria-label="Saved versions"]');
    const selected = serverVersions?.selectedOptions?.[0];
    if (!selected?.dataset?.payload) return say('Load versions in Secure server drafts and select one first.');
    try {
      const before = JSON.parse(selected.dataset.payload);
      const after = getDraft();
      const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
      const changes = [];
      keys.forEach(key => { if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) changes.push(key); });
      say(changes.length ? 'Draft differs from selected saved version in: ' + changes.join(', ') + '. Original saved version was not changed.' : 'No differences found between this draft and the selected saved version.');
    } catch { say('Could not compare this version.'); }
  }, true);
  compareSection.append(compare);
  panel.append(compareSection);

  return () => {
    tokenStyle.remove();
    for (const [key, value] of originalTokens) { if (value) root.style.setProperty(key, value); else root.style.removeProperty(key); }
  };
}

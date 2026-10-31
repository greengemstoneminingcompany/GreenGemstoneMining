/* GGMC Builder Studio: structured pages, sections, canvas and properties.
   It deliberately writes only to the existing editor draft object; publishing
   remains governed by the editor's authenticated snapshot workflow. */
const kinds = ['hero', 'section', 'heading', 'richText', 'image', 'video', 'button', 'card', 'cardGrid', 'gallery', 'contactForm', 'map', 'divider', 'spacer'];
const id = () => globalThis.crypto?.randomUUID?.() || `builder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'untitled-page';
const component = (kind = 'section') => ({ id: id(), kind, name: kind === 'hero' ? 'Hero section' : kind === 'richText' ? 'Text' : 'Section', visible: true, props: { title: kind === 'hero' ? 'New page heading' : kind === 'section' ? 'New section' : '', text: '' }, style: {} });
const page = (name = 'Untitled page') => ({ id: id(), name, slug: slug(name), status: 'draft', seo: { title: name, description: '' }, components: [component('hero')] });
const pageTemplates = {
  landing: () => ({ name: 'Landing page', components: [{ ...component('hero'), props: { title: 'A clear reason to get in touch', text: 'Introduce the opportunity and the next step.' } }, { ...component('cardGrid'), name: 'Highlights', props: { title: 'Why work with us', text: '' } }, { ...component('button'), name: 'Call to action', props: { title: 'Start a conversation', href: '#/contact' } }] }),
  story: () => ({ name: 'Story page', components: [{ ...component('hero'), props: { title: 'Tell your story', text: 'Lead with the point that matters.' } }, { ...component('richText'), name: 'Story', props: { title: 'The details', text: 'Write the full story in your own words.' } }, { ...component('gallery'), name: 'Gallery', props: { title: 'In the field', text: '' } }] }),
  contact: () => ({ name: 'Contact page', components: [{ ...component('hero'), props: { title: 'Get in touch', text: 'Tell us how we can help.' } }, { ...component('contactForm'), name: 'Contact form', props: { title: 'Send a message', text: '' } }, { ...component('map'), name: 'Location', props: { title: 'Find us', text: '' } }] }),
};
const ensure = draft => {
  if (!draft.pageBuilder || typeof draft.pageBuilder !== 'object' || !Array.isArray(draft.pageBuilder.pages)) {
    const home = page('Home'); home.protected = true; home.slug = 'home';
    draft.pageBuilder = { version: 1, pages: [home], activePageId: home.id, updatedAt: new Date().toISOString() };
  }
  return draft.pageBuilder;
};
const el = (tag, attrs = {}, text = '') => { const node = document.createElement(tag); Object.entries(attrs).forEach(([key, value]) => { if (key === 'class') node.className = value; else if (key === 'type') node.type = value; else node.setAttribute(key, value); }); if (text) node.textContent = text; return node; };

function drawCanvas(documentModel, canvas, selectedPageId, selectedComponentId, onPick, viewport = 'desktop') {
  canvas.replaceChildren();
  const active = documentModel.pages.find(item => item.id === selectedPageId) || documentModel.pages[0];
  if (!active) return;
  const title = el('div', { class: 've-builder-canvas-head' }, `${active.name} · /#/${active.slug}`);
  const pageNode = el('article', { class: 've-builder-page' });
  active.components.filter(item => item.visible !== false).forEach(item => {
    const block = el('button', { class: `ve-builder-block ${item.id === selectedComponentId ? 'is-selected' : ''}`, type: 'button' });
    block.dataset.componentId = item.id;
    const heading = String(item.props?.title || item.name || item.kind);
    const copy = String(item.props?.text || '');
    const responsive = item.style?.responsive?.[viewport] || {};
    block.style.background = /^#[0-9a-f]{3,8}$/i.test(item.style?.background || '') ? item.style.background : '';
    block.style.color = /^#[0-9a-f]{3,8}$/i.test(item.style?.color || '') ? item.style.color : '';
    if (Number.isFinite(Number(responsive.padding))) block.style.padding = `${Math.max(0, Math.min(160, Number(responsive.padding)))}px`;
    if (Number.isFinite(Number(responsive.fontSize))) block.style.fontSize = `${Math.max(10, Math.min(120, Number(responsive.fontSize)))}px`;
    if (Number.isFinite(Number(responsive.columns))) block.dataset.columns = String(Math.max(1, Math.min(6, Number(responsive.columns))));
    if (Number.isFinite(Number(item.style?.radius))) block.style.borderRadius = `${Math.max(0, Math.min(80, Number(item.style.radius)))}px`;
    if (item.style?.shadow === true) block.style.boxShadow = '0 12px 28px rgba(4,54,39,.2)';
    block.append(el('small', {}, item.kind));
    if (item.kind === 'image' && /^https?:\/\//.test(String(item.props?.src || ''))) { const image = el('img', { src: String(item.props.src), alt: String(item.props.alt || heading) }); block.append(image); }
    else if (item.kind === 'video' && /^https?:\/\//.test(String(item.props?.src || ''))) { const video = el('video', { src: String(item.props.src), controls: 'controls' }); block.append(video); }
    else if (item.kind === 'button') block.append(el('span', { class: 've-builder-button-preview' }, heading || 'Button'));
    else if (item.kind === 'divider') block.append(el('hr'));
    else if (item.kind === 'spacer') block.append(el('div', { class: 've-builder-spacer-preview' }));
    else if (item.kind === 'gallery') { const grid = el('div', { class: 've-builder-gallery-preview' }); for (let index = 0; index < 6; index += 1) grid.append(el('i')); block.append(el('strong', {}, heading), grid); }
    else if (item.kind === 'cardGrid') { const grid = el('div', { class: 've-builder-card-grid-preview' }); for (let index = 0; index < 3; index += 1) grid.append(el('i')); block.append(el('strong', {}, heading), grid); }
    else if (item.kind === 'contactForm') block.append(el('strong', {}, heading), el('input', { placeholder: 'Name' }), el('input', { placeholder: 'Email' }), el('span', { class: 've-builder-button-preview' }, 'Send message'));
    else if (item.kind === 'map') block.append(el('strong', {}, heading), el('div', { class: 've-builder-map-preview' }, 'Map component'));
    else block.append(el('strong', {}, heading), copy ? el('span', {}, copy) : el('span', {}, 'Select to edit properties'));
    block.addEventListener('click', () => onPick(item.id)); pageNode.append(block);
  });
  canvas.append(title, pageNode);
}

export function mountBuilderStudio(api) {
  const { panel, getDraft, saveHistory, applyChange, say, undo, redo } = api;
  if (!panel || typeof getDraft !== 'function') return () => {};
  const host = el('section', { class: 've-builder-studio' });
  const heading = el('div', { class: 've-label' }, 'Builder workspace');
  const note = el('p', { class: 've-note' }, 'Create pages and sections on this protected preview. Changes remain a draft until saved and published through the existing workflow.');
  const workspace = el('div', { class: 've-builder-workspace' });
  const pagesPanel = el('div', { class: 've-builder-pane ve-builder-pages' });
  const canvas = el('div', { class: 've-builder-canvas', role: 'region', 'aria-label': 'Builder canvas' });
  const properties = el('div', { class: 've-builder-pane ve-builder-properties' });
  let selectedPageId = '', selectedComponentId = '', viewport = 'desktop';
  const change = (message) => { const doc = ensure(getDraft()); doc.updatedAt = new Date().toISOString(); applyChange(message); render(); };
  const button = (label, fn, primary = false) => { const node = el('button', { type: 'button', class: primary ? 'primary' : '' }, label); node.addEventListener('click', fn); return node; };
  const historyRow = el('div', { class: 've-row' }); historyRow.append(button('Builder undo', () => { undo?.(); render(); }, true), button('Builder redo', () => { redo?.(); render(); }), el('span', { class: 've-builder-save-state' }, 'Draft changes save locally and are included in server versions.'));
  workspace.append(pagesPanel, canvas, properties); host.append(heading, note, historyRow, workspace); panel.append(host);
  const render = () => {
    const doc = ensure(getDraft());
    if (!doc.pages.some(item => item.id === selectedPageId)) selectedPageId = doc.activePageId || doc.pages[0]?.id || '';
    const active = doc.pages.find(item => item.id === selectedPageId) || doc.pages[0];
    if (active && !active.components.some(item => item.id === selectedComponentId)) selectedComponentId = active.components[0]?.id || '';
    pagesPanel.replaceChildren(el('strong', {}, 'Pages'));
    doc.pages.forEach((item, pageIndex) => { const row = button(`${item.name}${item.protected ? ' · protected' : ''}`, () => { selectedPageId = item.id; doc.activePageId = item.id; selectedComponentId = item.components[0]?.id || ''; render(); }); row.draggable = !item.protected; row.dataset.pageId = item.id; row.addEventListener('dragstart', event => { if (item.protected) return event.preventDefault(); event.dataTransfer?.setData('application/x-ggmc-page', item.id); row.classList.add('is-dragging'); }); row.addEventListener('dragend', () => row.classList.remove('is-dragging')); row.addEventListener('dragover', event => { if (event.dataTransfer?.types.includes('application/x-ggmc-page')) { event.preventDefault(); row.classList.add('is-drop-target'); } }); row.addEventListener('dragleave', () => row.classList.remove('is-drop-target')); row.addEventListener('drop', event => { const moving = event.dataTransfer?.getData('application/x-ggmc-page'); row.classList.remove('is-drop-target'); const source = doc.pages.findIndex(pageItem => pageItem.id === moving); if (source < 0 || source === pageIndex || doc.pages[source].protected) return; event.preventDefault(); saveHistory(); const [moved] = doc.pages.splice(source, 1); doc.pages.splice(pageIndex, 0, moved); change('Reordered page by drag and drop.'); }); row.classList.toggle('active', item.id === selectedPageId); pagesPanel.append(row); });
    const pageRow = el('div', { class: 've-row' });
    pageRow.append(button('New page', () => { saveHistory(); const next = page('New page'); next.slug = uniqueSlug(doc.pages, next.slug); doc.pages.push(next); selectedPageId = next.id; selectedComponentId = next.components[0].id; change('Created a new page in the builder draft.'); }, true), button('Duplicate page', () => { if (!active) return; saveHistory(); const next = clone(active); next.id = id(); next.name = `${active.name} copy`; next.slug = uniqueSlug(doc.pages, `${active.slug}-copy`); next.protected = false; next.status = 'draft'; doc.pages.push(next); selectedPageId = next.id; selectedComponentId = next.components[0]?.id || ''; change('Duplicated page in the builder draft.'); }), button('Delete page', () => { if (!active || active.protected) return say('The protected Home page cannot be deleted.'); if (!confirm(`Delete “${active.name}” from this draft?`)) return; saveHistory(); doc.pages = doc.pages.filter(item => item.id !== active.id); selectedPageId = doc.pages[0]?.id || ''; selectedComponentId = ''; change('Deleted page from the builder draft.'); })); pagesPanel.append(pageRow);
    const templateSelect = el('select', { 'aria-label': 'Builder page template' }); Object.keys(pageTemplates).forEach(key => templateSelect.append(el('option', { value: key }, key.replace(/^./, letter => letter.toUpperCase())))); pagesPanel.append(templateSelect, button('Create from template', () => { const template = pageTemplates[templateSelect.value]?.(); if (!template) return; saveHistory(); const next = page(template.name); next.slug = uniqueSlug(doc.pages, template.name); next.components = template.components; doc.pages.push(next); selectedPageId = next.id; selectedComponentId = next.components[0]?.id || ''; change('Created page from reusable template.'); }, true));
    if (active) { const pageField = (label, value, update) => { const input = el('input', { type: 'text', 'aria-label': label }); input.value = String(value || ''); input.addEventListener('change', () => { saveHistory(); update(input.value); change(`Updated ${label.toLowerCase()}.`); }); pagesPanel.append(el('label', { class: 've-builder-field' }, label), input); }; pageField('Page name', active.name, value => { active.name = value.slice(0, 120); active.seo.title ||= active.name; }); pageField('Page slug', active.slug, value => { active.slug = uniqueSlug(doc.pages.filter(item => item.id !== active.id), value); }); pageField('SEO title', active.seo?.title, value => { active.seo ||= {}; active.seo.title = value.slice(0, 160); }); pageField('SEO description', active.seo?.description, value => { active.seo ||= {}; active.seo.description = value.slice(0, 320); }); }
    const layerHead = el('strong', {}, 'Layers'); pagesPanel.append(layerHead);
    active?.components.forEach((item, index) => { const row = el('div', { class: 've-builder-layer', draggable: item.locked ? 'false' : 'true' }); row.dataset.componentId = item.id; const pick = button(`${index + 1}. ${item.name}`, () => { selectedComponentId = item.id; render(); }); pick.classList.toggle('active', item.id === selectedComponentId); row.addEventListener('dragstart', event => { if (item.locked) return event.preventDefault(); event.dataTransfer?.setData('text/plain', item.id); row.classList.add('is-dragging'); }); row.addEventListener('dragend', () => row.classList.remove('is-dragging')); row.addEventListener('dragover', event => { event.preventDefault(); row.classList.add('is-drop-target'); }); row.addEventListener('dragleave', () => row.classList.remove('is-drop-target')); row.addEventListener('drop', event => { event.preventDefault(); row.classList.remove('is-drop-target'); const moving = event.dataTransfer?.getData('text/plain'); const source = active.components.findIndex(componentItem => componentItem.id === moving); if (source < 0 || source === index || active.components[source].locked) return; saveHistory(); const [moved] = active.components.splice(source, 1); active.components.splice(index, 0, moved); change('Reordered section by drag and drop.'); }); row.append(pick, button('↑', () => { if (index === 0 || item.locked) return; saveHistory(); [active.components[index - 1], active.components[index]] = [active.components[index], active.components[index - 1]]; change('Reordered section.'); }), button('↓', () => { if (index === active.components.length - 1 || item.locked) return; saveHistory(); [active.components[index + 1], active.components[index]] = [active.components[index], active.components[index + 1]]; change('Reordered section.'); })); pagesPanel.append(row); });
    const select = el('select', { 'aria-label': 'Builder component type' }); kinds.forEach(kind => select.append(el('option', { value: kind }, kind))); pagesPanel.append(select, button('Add section', () => { if (!active) return; saveHistory(); const next = component(select.value); active.components.push(next); selectedComponentId = next.id; change('Added component to page draft.'); }, true));
    properties.replaceChildren(el('strong', {}, 'Properties'));
    const selected = active?.components.find(item => item.id === selectedComponentId);
    if (!selected) properties.append(el('p', { class: 've-note' }, 'Select a page section to edit it.'));
    else {
      const addField = (label, value, setter) => { const wrap = el('label', { class: 've-builder-field' }); wrap.append(el('span', {}, label)); const input = el('input', { type: 'text', value: String(value || '') }); input.value = String(value || ''); input.addEventListener('change', () => { saveHistory(); setter(input.value); change(`Updated ${label.toLowerCase()}.`); }); wrap.append(input); properties.append(wrap); };
      addField('Name', selected.name, value => { selected.name = value.slice(0, 80); });
      addField('Heading', selected.props.title, value => { selected.props.title = value.slice(0, 500); });
      addField('Text', selected.props.text, value => { selected.props.text = value.slice(0, 4000); });
      addField('Background', selected.style.background, value => { selected.style.background = value; });
      addField('Text color', selected.style.color, value => { selected.style.color = value; });
      addField('Corner radius', selected.style.radius, value => { selected.style.radius = Number(value) || 0; });
      const shadow = el('input', { type: 'checkbox', 'aria-label': 'Shadow' }); shadow.checked = selected.style.shadow === true; shadow.addEventListener('change', () => { saveHistory(); selected.style.shadow = shadow.checked; change('Updated shadow.'); }); properties.append(el('label', { class: 've-builder-field' }, 'Shadow'), shadow);
      if (selected.kind === 'image' || selected.kind === 'video') {
        addField('Media URL', selected.props.src, value => { selected.props.src = value.slice(0, 2000); });
        addField('Alt text', selected.props.alt, value => { selected.props.alt = value.slice(0, 500); });
        properties.append(button('Open media library', () => window.dispatchEvent(new Event('ggmc-open-media'))));
      }
      if (selected.kind === 'button') addField('Link URL', selected.props.href, value => { selected.props.href = value.slice(0, 1000); });
      const breakpoint = el('select', { 'aria-label': 'Builder breakpoint' }); [['desktop','Desktop'],['tablet','Tablet'],['mobile','Mobile']].forEach(([value, label]) => breakpoint.append(el('option', { value }, label))); breakpoint.value = viewport; breakpoint.addEventListener('change', () => { viewport = breakpoint.value; render(); }); properties.append(el('label', { class: 've-builder-field' }, 'Responsive preview'), breakpoint);
      const responsiveStyle = () => (selected.style.responsive ||= {}, selected.style.responsive[viewport] ||= {});
      addField('Font size', responsiveStyle().fontSize, value => { responsiveStyle().fontSize = Number(value) || 0; });
      addField('Padding', responsiveStyle().padding, value => { responsiveStyle().padding = Number(value) || 0; });
      addField('Columns', responsiveStyle().columns, value => { responsiveStyle().columns = Number(value) || 1; });
      properties.append(button(selected.visible === false ? 'Show section' : 'Hide section', () => { saveHistory(); selected.visible = selected.visible === false; change('Updated section visibility.'); }), button('Delete section', () => { if (selected.locked) return say('This protected section cannot be deleted.'); if (!confirm(`Delete “${selected.name}”?`)) return; saveHistory(); active.components = active.components.filter(item => item.id !== selected.id); selectedComponentId = active.components[0]?.id || ''; change('Deleted section from page draft.'); }));
    }
    drawCanvas(doc, canvas, selectedPageId, selectedComponentId, (componentId) => { selectedComponentId = componentId; render(); }, viewport);
  };
  render();
  return () => host.remove();
}

function uniqueSlug(pages, wanted) { const base = slug(wanted); const used = new Set(pages.map(item => item.slug)); if (!used.has(base)) return base; for (let n = 2; n < 1000; n += 1) if (!used.has(`${base}-${n}`)) return `${base}-${n}`; return `${base}-${Date.now().toString(36)}`; }

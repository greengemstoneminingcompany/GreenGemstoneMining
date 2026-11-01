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
const percent = value => Math.max(0, Math.min(100, Number(value) || 0));
const mediaStyle = (image, props) => { image.style.objectFit = props.fit === 'contain' ? 'contain' : 'cover'; image.style.objectPosition = `${percent(props.focalX ?? 50)}% ${percent(props.focalY ?? 50)}%`; if (['1/1','4/3','16/9','3/4'].includes(props.aspect)) { image.style.aspectRatio = props.aspect; image.style.height = 'auto'; } };
const formFields = props => Array.isArray(props.fields) ? props.fields.slice(0, 20) : ['Name|text|required', 'Email|email|required', 'Message|textarea|required'];
const el = (tag, attrs = {}, text = '') => { const node = document.createElement(tag); Object.entries(attrs).forEach(([key, value]) => { if (key === 'class') node.className = value; else if (key === 'type') node.type = value; else node.setAttribute(key, value); }); if (text) node.textContent = text; return node; };

function drawCanvas(documentModel, canvas, selectedPageId, selectedComponentId, onPick, viewport = 'desktop') {
  canvas.replaceChildren();
  const active = documentModel.pages.find(item => item.id === selectedPageId) || documentModel.pages[0];
  if (!active) return;
  const title = el('div', { class: 've-builder-canvas-head' }, `${active.name} · /#/${active.slug}`);
  const pageNode = el('article', { class: 've-builder-page' });
  active.components.filter(item => item.visible !== false).forEach(item => {
    const block = el('div', { tabindex: '0', role: 'button', class: `ve-builder-block ${item.id === selectedComponentId ? 'is-selected' : ''}`, type: 'button' });
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
    if (item.kind === 'image' && /^https?:\/\//.test(String(item.props?.src || ''))) { const image = el('img', { src: String(item.props.src), alt: String(item.props.alt || heading) }); mediaStyle(image, item.props); block.append(image); }
    else if (item.kind === 'video' && /^https?:\/\//.test(String(item.props?.src || ''))) { const video = el('video', { src: String(item.props.src), controls: 'controls' }); block.append(video); }
    else if (item.kind === 'button') block.append(el('span', { class: 've-builder-button-preview' }, heading || 'Button'));
    else if (item.kind === 'divider') block.append(el('hr'));
    else if (item.kind === 'spacer') block.append(el('div', { class: 've-builder-spacer-preview' }));
    else if (item.kind === 'gallery') { const grid = el('div', { class: 've-builder-gallery-preview' }); for (const src of (Array.isArray(item.props.images) ? item.props.images : [])) { if (!/^https?:\/\//.test(src)) continue; const image = el('img', { src, alt: '' }); mediaStyle(image, item.props); grid.append(image); } block.append(el('strong', {}, heading), grid); }
    else if (item.kind === 'cardGrid') { const grid = el('div', { class: 've-builder-card-grid-preview' }); for (let index = 0; index < 3; index += 1) grid.append(el('i')); block.append(el('strong', {}, heading), grid); }
    else if (item.kind === 'contactForm') { block.append(el('strong', {}, heading)); formFields(item.props).forEach(field => { const [label, type] = field.split('|'); block.append(el(type === 'textarea' ? 'textarea' : 'input', { placeholder: label, disabled: 'disabled', 'aria-label': label })); }); block.append(el('span', { class: 've-builder-button-preview' }, item.props.submitLabel || 'Send message')); }
    else if (item.kind === 'map') block.append(el('strong', {}, heading), el('div', { class: 've-builder-map-preview' }, 'Map component'));
    else block.append(el('strong', {}, heading), copy ? el('span', {}, copy) : el('span', {}, 'Select to edit properties'));
    block.addEventListener('keydown', event => { if (event.target === block && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onPick(item.id); } }); block.addEventListener('click', () => { if (item.id !== selectedComponentId) onPick(item.id); }); pageNode.append(block);
  });
  const globals = documentModel.globals || {}; if (/^#[0-9a-f]{3,8}$/i.test(globals.background || '')) pageNode.style.setProperty('--builder-background', globals.background); if (/^#[0-9a-f]{3,8}$/i.test(globals.color || '')) pageNode.style.setProperty('--builder-color', globals.color); if (['system-ui','Georgia','Arial'].includes(globals.fontFamily)) pageNode.style.setProperty('--builder-font', globals.fontFamily); if (globals.headerText) pageNode.prepend(el('header', {}, globals.headerText)); if (Array.isArray(globals.navigation)) { const nav = el('nav', { 'aria-label': 'Site navigation preview' }); globals.navigation.forEach(entry => nav.append(el('span', {}, entry.split('|')[0] + ' '))); pageNode.prepend(nav); } if (globals.footerText) pageNode.append(el('footer', {}, globals.footerText)); canvas.append(title, pageNode);
}

function mountDisconnectedBuilderStudio(api) {
  const { panel, getDraft, saveHistory, applyChange, say, undo, redo } = api;
  if (!panel || typeof getDraft !== 'function') return () => {};
  const host = el('section', { class: 've-builder-studio ve-studio-shell' });
  const heading = el('div', { class: 've-label' }, 'Builder workspace');
  const note = el('p', { class: 've-note' }, 'Create pages and sections on this protected preview. Changes remain a draft until saved and published through the existing workflow.');
  const workspace = el('div', { class: 've-builder-workspace' });
  const pagesPanel = el('div', { class: 've-builder-pane ve-builder-pages' });
  const canvas = el('div', { class: 've-builder-canvas', role: 'region', 'aria-label': 'Builder canvas' });
  const properties = el('div', { class: 've-builder-pane ve-builder-properties' });
  let selectedPageId = '', selectedComponentId = '', viewport = 'desktop', pendingMedia = null;
  const pickMedia = (selected, gallery = false) => { pendingMedia = { requestId: id(), componentId: selected.id, pageId: selectedPageId, gallery, mediaType: gallery ? 'image' : selected.kind }; window.dispatchEvent(new CustomEvent('ggmc-open-media', { detail: { requestId: pendingMedia.requestId, mediaType: pendingMedia.mediaType } })); };
  const receiveMedia = event => { const detail = event.detail; if (!pendingMedia || detail?.requestId !== pendingMedia.requestId || detail.mediaType !== pendingMedia.mediaType || !/^https?:\/\//.test(detail.url)) return; const target = ensure(getDraft()).pages.find(item => item.id === pendingMedia.pageId)?.components.find(item => item.id === pendingMedia.componentId); if (!target) { pendingMedia = null; return; } saveHistory(); if (pendingMedia.gallery) target.props.images = [...new Set([...(target.props.images || []), detail.url])].slice(0, 100); else { target.props.src = detail.url; target.props.alt ||= detail.title || ''; } pendingMedia = null; change('Inserted selected library asset.'); };
  window.addEventListener('ggmc-media-selected', receiveMedia);
  const change = (message) => { const doc = ensure(getDraft()); doc.updatedAt = new Date().toISOString(); applyChange(message); render(); };
  const button = (label, fn, primary = false) => { const node = el('button', { type: 'button', class: primary ? 'primary' : '' }, label); node.addEventListener('click', fn); return node; };
  const studioBar = el('div', { class: 've-builder-studio-bar' });
  studioBar.append(el('strong', {}, 'Website builder'), el('span', { class: 've-builder-draft-state' }, 'Draft workspace'));
  const studioTabs = el('div', { class: 've-builder-tabs', role: 'tablist', 'aria-label': 'Builder tools' });
  [['Pages', pagesPanel], ['Canvas', canvas], ['Properties', properties]].forEach(([label, target]) => {
    const tab = button(label, () => { target.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    tab.setAttribute('role', 'tab'); studioTabs.append(tab);
  });
  studioBar.append(studioTabs);
  const toolDock = el('section', { class: 've-builder-tool-dock', 'aria-label': 'More edit tools' });
  toolDock.append(el('strong', {}, 'More edit tools'), el('span', {}, 'Use these tools without leaving the live workspace.'));
  const activate = (selector, message) => () => {
    const target = panel.querySelector(selector);
    if (!target) return say(`${message} is still loading. Try again in a moment.`);
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (target instanceof HTMLElement) target.focus?.();
  };
  toolDock.append(
    button('Edit text', () => panel.querySelector('[data-mode="text"]')?.click()),
    button('Style element', () => panel.querySelector('[data-mode="select"]')?.click()),
    button('Add content', () => runAction('add-content')),
    button('Company records', activate('.ve-company-records', 'Company records')),
    button('Creative Studio', activate('.ve-feature-module', 'Creative Studio')),
    button('Responsive preview', activate('[aria-label="Responsive preview"]', 'Responsive preview')),
  );
  const quickDock = el('section', { class: 've-builder-quick-dock', 'aria-label': 'Quick actions' });
  quickDock.append(el('strong', {}, 'Quick actions'));
  const runAction = action => {
    const target = panel.querySelector(`[data-studio-action="${action}"]`);
    if (!target) return say('That studio action is still loading. Try again in a moment.');
    target.click();
  };
  quickDock.append(
    button('Undo', () => { undo?.(); render(); }),
    button('Redo', () => { redo?.(); render(); }),
    button('Edit text', () => panel.querySelector('[data-mode="text"]')?.click()),
    button('Style element', () => panel.querySelector('[data-mode="select"]')?.click()),
    button('Save draft', () => runAction('save-draft'), true),
    button('Publish', () => runAction('publish'), true),
    button('Export', () => runAction('export')),
  );
  const historyRow = el('div', { class: 've-row' }); historyRow.append(button('Builder undo', () => { undo?.(); render(); }, true), button('Builder redo', () => { redo?.(); render(); }), el('span', { class: 've-builder-save-state' }, 'Draft changes save locally and are included in server versions.'));
  const layoutRow = el('div', { class: 've-row' });
  const studioLayout = button('Use compact layout', () => {
    const wide = panel.classList.toggle('ve-studio-wide');
    studioLayout.textContent = wide ? 'Use compact layout' : 'Open studio layout';
    say(wide ? 'Studio layout open: pages, canvas, and properties are shown side by side.' : 'Compact editor layout restored.');
  });
  layoutRow.append(studioLayout, el('span', { class: 've-builder-save-state' }, 'Studio layout changes the workspace only; it does not change the published page.'));
  workspace.append(pagesPanel, canvas, properties); host.append(studioBar, heading, note, quickDock, historyRow, layoutRow, workspace, toolDock);
  panel.insertBefore(host, panel.querySelector('.ve-topbar')?.nextSibling || null);
  panel.classList.add('ve-studio-wide');
  const render = () => {
    const doc = getDraft().pageBuilder;
    if (!doc || typeof doc !== 'object' || !Array.isArray(doc.pages)) {
      pagesPanel.replaceChildren(
        el('strong', {}, 'Pages'),
        el('p', { class: 've-note' }, 'Start Builder to add a structured page document to this draft. Existing editor drafts remain unchanged until you do.'),
        button('Start Builder workspace', () => {
          saveHistory();
          const created = ensure(getDraft());
          selectedPageId = created.activePageId;
          selectedComponentId = created.pages[0]?.components[0]?.id || '';
          panel.classList.add('ve-studio-wide');
          studioLayout.textContent = 'Use compact layout';
          change('Started a Builder workspace in this draft.');
        }, true),
      );
      canvas.replaceChildren(el('div', { class: 've-builder-canvas-head' }, 'Builder is ready when you start a workspace.'));
      properties.replaceChildren(el('strong', {}, 'Properties'), el('p', { class: 've-note' }, 'Start Builder to configure pages, components, and site-wide settings.'));
      return;
    }
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
        properties.append(button('Open media library', () => pickMedia(selected)));
      }
      if (selected.kind === 'image' || selected.kind === 'gallery') {
        const choice = (label, values, value, setter) => { const input = el('select', { 'aria-label': label }); values.forEach(option => input.append(el('option', { value: option }, option))); input.value = value; input.addEventListener('change', () => { saveHistory(); setter(input.value); change(`Updated ${label.toLowerCase()}.`); }); properties.append(el('label', {}, label), input); };
        choice('Image fit', ['cover','contain'], selected.props.fit || 'cover', value => { selected.props.fit = value; });
        choice('Crop aspect ratio', ['original','1/1','4/3','16/9','3/4'], selected.props.aspect || 'original', value => { selected.props.aspect = value; });
        addField('Focal point X (%)', selected.props.focalX ?? 50, value => { selected.props.focalX = percent(value); });
        addField('Focal point Y (%)', selected.props.focalY ?? 50, value => { selected.props.focalY = percent(value); });
      }
      if (selected.kind === 'gallery') {
        properties.append(button('Add image from library', () => pickMedia(selected, true)));
        (selected.props.images || []).forEach((url, index) => { properties.append(el('p', { class: 've-note' }, `Image ${index + 1}: ${url}`), button(`Remove image ${index + 1}`, () => { saveHistory(); selected.props.images.splice(index, 1); change('Removed gallery image.'); }), button(`Move image ${index + 1} up`, () => { if (!index) return; saveHistory(); [selected.props.images[index - 1], selected.props.images[index]] = [selected.props.images[index], selected.props.images[index - 1]]; change('Reordered gallery.'); })); });
      }
      if (selected.kind === 'contactForm') {
        properties.append(el('p', { class: 've-note' }, 'Fields: one per line as Label|type|required. Types: text, email, tel, textarea. Form is a layout preview; submissions are not connected.'));
        const fields = el('textarea', { 'aria-label': 'Form fields' }); fields.value = formFields(selected.props).join('\n'); fields.addEventListener('change', () => { const entries = fields.value.split('\n').filter(Boolean); if (entries.length > 20 || entries.some(line => { const [label, type, required, ...extra] = line.split('|'); return !label?.trim() || !['text','email','tel','textarea'].includes(type) || (required && required !== 'required') || extra.length; })) return say('Use up to 20 fields: Label|text/email/tel/textarea|required.'); saveHistory(); selected.props.fields = entries; change('Updated form fields.'); }); properties.append(fields); addField('Submit label', selected.props.submitLabel || 'Send message', value => { selected.props.submitLabel = value.slice(0, 100); });
      }
      if (selected.kind === 'button') addField('Link URL', selected.props.href, value => { selected.props.href = value.slice(0, 1000); });
      const breakpoint = el('select', { 'aria-label': 'Builder breakpoint' }); [['desktop','Desktop'],['tablet','Tablet'],['mobile','Mobile']].forEach(([value, label]) => breakpoint.append(el('option', { value }, label))); breakpoint.value = viewport; breakpoint.addEventListener('change', () => { viewport = breakpoint.value; render(); }); properties.append(el('label', { class: 've-builder-field' }, 'Responsive preview'), breakpoint);
      const responsiveStyle = () => (selected.style.responsive ||= {}, selected.style.responsive[viewport] ||= {});
      addField('Font size', responsiveStyle().fontSize, value => { responsiveStyle().fontSize = Number(value) || 0; });
      addField('Padding', responsiveStyle().padding, value => { responsiveStyle().padding = Number(value) || 0; });
      addField('Columns', responsiveStyle().columns, value => { responsiveStyle().columns = Number(value) || 1; });
      properties.append(button(selected.visible === false ? 'Show section' : 'Hide section', () => { saveHistory(); selected.visible = selected.visible === false; change('Updated section visibility.'); }), button('Delete section', () => { if (selected.locked) return say('This protected section cannot be deleted.'); if (!confirm(`Delete “${selected.name}”?`)) return; saveHistory(); active.components = active.components.filter(item => item.id !== selected.id); selectedComponentId = active.components[0]?.id || ''; change('Deleted section from page draft.'); }));
    }
    const globals = doc.globals || {};
    properties.append(el('strong', {}, 'Site-wide settings'));
    const globalField = (label, key) => { const wrap = el('label', { class: 've-builder-field' }, label); const input = el('input', { type: 'text', 'aria-label': label }); input.value = globals[key] || ''; input.addEventListener('change', () => { saveHistory(); doc.globals ||= {}; doc.globals[key] = input.value.slice(0, 2000); change(`Updated ${label.toLowerCase()}.`); }); wrap.append(input); properties.append(wrap); };
    globalField('Global header text', 'headerText'); globalField('Global footer text', 'footerText'); globalField('Site background', 'background'); globalField('Site text color', 'color'); globalField('Site font (system-ui, Georgia, Arial)', 'fontFamily');
    properties.append(el('p', { class: 've-note' }, 'Blank header/footer values preserve existing company content. Navigation: Label|#/page, one per line.'));
    const navigation = el('textarea', { 'aria-label': 'Global navigation' }); navigation.value = (globals.navigation || []).join('\n'); navigation.addEventListener('change', () => { const entries = navigation.value.split('\n').filter(Boolean); if (entries.length > 30 || entries.some(line => !/^[^|]{1,120}\|#\/[a-z0-9-]{1,80}$/.test(line))) return say('Use Label|#/page for each navigation entry (up to 30).'); saveHistory(); doc.globals ||= {}; doc.globals.navigation = entries; change('Updated global navigation.'); }); properties.append(navigation);
    drawCanvas(doc, canvas, selectedPageId, selectedComponentId, (componentId) => { selectedComponentId = componentId; render(); }, viewport);
  };
  // A studio must be immediately useful on first open. The previous version
  // displayed an empty state and required a second, non-obvious action before
  // the Pages, Canvas, and Properties workspace could be used.
  const initialDocument = ensure(getDraft());
  selectedPageId = initialDocument.activePageId || initialDocument.pages[0]?.id || '';
  selectedComponentId = initialDocument.pages[0]?.components[0]?.id || '';
  applyChange('Opened the website builder workspace.');
  render();
  return () => { panel.classList.remove('ve-studio-wide'); window.removeEventListener('ggmc-media-selected', receiveMedia); host.remove(); };
}

function uniqueSlug(pages, wanted) { const base = slug(wanted); const used = new Set(pages.map(item => item.slug)); if (!used.has(base)) return base; for (let n = 2; n < 1000; n += 1) if (!used.has(`${base}-${n}`)) return `${base}-${n}`; return `${base}-${Date.now().toString(36)}`; }

// The original builder above remains in the file temporarily for draft
// compatibility. It is intentionally not mounted: its synthetic pages are not
// the React website that visitors see.
const liveSiteMap = [
  { page: 'Home', route: 'home', sections: [['Hero', 'home.hero'], ['Company', 'home.company'], ['Resources', 'home.resources'], ['Mission', 'home.mission'], ['Projects', 'home.projects'], ['Gallery', 'home.gallery'], ['Contact', 'home.contact']] },
  { page: 'About', route: 'about', sections: [['Page hero', 'about.hero'], ['Company content', 'about.content'], ['Call to action', 'about.cta']] },
  { page: 'Projects', route: 'projects', sections: [['Page hero', 'projects.hero'], ['Project overview', 'projects.overview'], ['Field records', 'projects.directory'], ['Call to action', 'projects.cta']] },
  { page: 'Minerals', route: 'minerals', sections: [['Page hero', 'minerals.hero'], ['Mineral directory', 'minerals.directory'], ['Call to action', 'minerals.cta']] },
  { page: 'Gallery', route: 'gallery', sections: [['Page hero', 'gallery.hero'], ['Collection', 'gallery.collection'], ['Call to action', 'gallery.cta']] },
  { page: 'Contact', route: 'contact', sections: [['Page hero', 'contact.hero'], ['Contact details', 'contact.details'], ['Call to action', 'contact.cta']] },
];

const liveNode = (tag, attrs = {}, text = '') => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'type') node.type = value;
    else node.setAttribute(key, value);
  });
  if (text) node.textContent = text;
  return node;
};

const liveRoute = () => location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] || 'home';
const afterWebsiteRender = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export function mountBuilderStudio(api) {
  const { panel, root, say, undo, redo, selectElement, setMode, setResponsiveViewport } = api;
  if (!panel || !root) return () => {};

  const host = liveNode('section', { class: 've-live-studio', 'aria-label': 'Website editor' });
  const bar = liveNode('div', { class: 've-live-studio-bar' });
  const state = liveNode('span', { class: 've-live-draft-state', 'aria-live': 'polite' }, 'Draft changes save automatically');
  bar.append(liveNode('strong', {}, 'Website editor'), state);

  const action = (label, callback, primary = false) => {
    const button = liveNode('button', { type: 'button', class: primary ? 'primary' : '' }, label);
    button.addEventListener('click', callback);
    return button;
  };
  const runAction = key => {
    const target = panel.querySelector(`[data-studio-action="${key}"]`);
    if (!target) return say?.('That action is still loading. Try again in a moment.');
    target.click();
  };
  const actions = liveNode('div', { class: 've-live-actions', 'aria-label': 'Draft actions' });
  actions.append(action('Undo', () => undo?.()), action('Redo', () => redo?.()), action('Save draft', () => runAction('save-draft'), true), action('Publish', () => runAction('publish'), true));

  const layout = liveNode('div', { class: 've-live-layout' });
  const map = liveNode('nav', { class: 've-live-map', 'aria-label': 'Website pages' });
  const guide = liveNode('div', { class: 've-live-guide' });
  guide.append(liveNode('strong', {}, 'Edit the real website'), liveNode('p', {}, 'Choose a page and section. The live website remains visible beside this panel, where the selected section is outlined and ready to edit.'));
  const responsive = liveNode('section', { class: 've-live-responsive', 'aria-label': 'Responsive preview' });
  responsive.append(liveNode('strong', {}, 'Responsive preview'));
  [['Desktop','Desktop'],['Tablet','Tablet'],['Mobile','Mobile']].forEach(([label, mode]) => {
    const button = action(label, () => {
      setResponsiveViewport?.(mode);
      responsive.querySelectorAll('button').forEach(other => {
        const selected = other === button;
        other.classList.toggle('active', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
    });
    const isDefault = mode === 'Desktop';
    button.setAttribute('aria-pressed', String(isDefault));
    button.classList.toggle('active', isDefault);
    responsive.append(button);
  });

  const selectSection = async (route, editorId) => {
    if (liveRoute() !== route) { location.hash = `#/${route}`; await afterWebsiteRender(); }
    const target = root.querySelector(`[data-editor-id="${editorId}"]`);
    if (!target) return say?.('This section is still loading. Choose the page again and try once more.');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setMode?.('select');
    selectElement?.(target);
    state.textContent = `Editing ${editorId.replace('.', ' · ')}`;
    renderMap();
  };

  const renderMap = () => {
    const route = liveRoute();
    map.replaceChildren();
    liveSiteMap.forEach(group => {
      const page = liveNode('section', { class: 've-live-page-group' });
      const pageButton = action(group.page, () => selectSection(group.route, group.sections[0][1]));
      pageButton.classList.toggle('active', route === group.route);
      page.append(pageButton);
      if (route === group.route) {
        const sections = liveNode('div', { class: 've-live-section-list' });
        group.sections.forEach(([label, editorId]) => sections.append(action(label, () => selectSection(group.route, editorId))));
        page.append(sections);
      }
      map.append(page);
    });
  };

  guide.append(action('Edit selected section', () => { setMode?.('select'); say?.('Click any visible part of the website to open its inspector.'); }, true));
  layout.append(map, guide); host.append(bar, actions, responsive, layout);
  panel.insertBefore(host, panel.querySelector('.ve-topbar')?.nextSibling || null);
  const inspectorDock = liveNode('section', { class: 've-live-inspector-dock', 'aria-label': 'Selected section inspector' });
  const inspectorTitle = panel.querySelector('.ve-inspector-title');
  const inspector = panel.querySelector('.ve-inspector');
  const status = panel.querySelector('.ve-status');
  if (inspectorTitle) inspectorDock.append(inspectorTitle);
  if (inspector) inspectorDock.append(inspector);
  if (status) inspectorDock.append(status);
  host.append(inspectorDock);
  panel.classList.remove('ve-studio-wide'); panel.classList.add('ve-live-editor');
  const sync = () => { state.textContent = `Viewing ${liveRoute()}`; renderMap(); };
  window.addEventListener('hashchange', sync); renderMap();
  return () => { window.removeEventListener('hashchange', sync); panel.classList.remove('ve-live-editor'); host.remove(); };
}

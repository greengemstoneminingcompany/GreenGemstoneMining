/* Typed company-data controls. These edit records, never DOM selectors or free-form page overrides. */
const clone = value => JSON.parse(JSON.stringify(value));
const node = (tag, attrs = {}, text = '') => { const el = document.createElement(tag); Object.entries(attrs).forEach(([key, value]) => { if (key === 'class') el.className = value; else el.setAttribute(key, value); }); if (text) el.textContent = text; return el; };
const defaults = () => clone(window.__GGMC_COMPANY_DEFAULT_RECORDS__ || { version: 1, profile: { legalName: 'Green Gemstone Mining Company', email: '', linkedin: '', officeAddress: '', publicLocation: '', heroImage: '', companyImage: '' }, metrics: [], industrialStats: [], projects: [], minerals: [], gallery: [], timeline: [], mineralInterests: [], gemstoneInterests: [] });
const records = draft => { if (!draft.companyRecords || typeof draft.companyRecords !== 'object' || Array.isArray(draft.companyRecords)) draft.companyRecords = defaults(); const data = draft.companyRecords; const aboutDefaults = defaults().about || {}; if (!data.about || typeof data.about !== 'object' || Array.isArray(data.about)) data.about = clone(aboutDefaults); Object.entries(aboutDefaults).forEach(([key, section]) => { if (!data.about[key]) data.about[key] = clone(section); }); return data; };
const field = (label, value, onChange, type = 'text') => { const wrap = node('label', { class: 've-field' }); wrap.append(node('span', {}, label)); const input = node('input', { type, 'aria-label': label }); input.value = String(value ?? ''); input.addEventListener('change', () => onChange(input.value)); wrap.append(input); return wrap; };

export function mountCompanyRecords(api) {
  const { panel, getDraft, saveHistory, applyChange, say } = api;
  if (!panel) return () => {};
  const host = node('section', { class: 've-company-records' });
  host.append(node('div', { class: 've-label' }, 'Company records'));
  host.append(node('p', { class: 've-note' }, 'These are shared CMS records. Publishing updates every connected React view: identity, contact details, project cards and map markers, statistics, catalogue, gallery and timeline. This does not create text-selector overrides.'));
  const tabs = node('div', { class: 've-row' }); const body = node('div'); let active = 'profile'; let projectIndex = 0; let itemIndex = 0;
  const change = message => { applyChange(message); render(); };
  const mutate = (message, fn) => { saveHistory(); fn(records(getDraft())); change(message); };
  const tab = (key, label) => { const button = node('button', { type: 'button' }, label); button.addEventListener('click', () => { active = key; render(); }); tabs.append(button); return button; };
  const buttons = { profile: tab('profile', 'Profile & contact'), metrics: tab('metrics', 'Statistics'), projects: tab('projects', 'Projects & map'), catalogue: tab('catalogue', 'Catalogue'), media: tab('media', 'Gallery & timeline'), about: tab('about', 'Detailed About') };
  host.append(tabs, body); panel.append(host);
  const listInput = (title, key, hint) => { body.append(node('p', { class: 've-note' }, hint)); const area = node('textarea', { 'aria-label': title }); area.value = records(getDraft())[key].join('\n'); area.addEventListener('change', () => mutate(`Updated ${title.toLowerCase()}.`, data => { data[key] = area.value.split('\n').map(value => value.trim()).filter(Boolean).slice(0, 80); })); body.append(area); };
  const render = () => {
    Object.entries(buttons).forEach(([key, button]) => button.classList.toggle('active', key === active)); body.replaceChildren(); const data = records(getDraft());
    if (active === 'profile') {
      body.append(node('p', { class: 've-note' }, 'Company identity and office values are rendered in the header, footer, contact page and company profile. Use verified public details only.'));
      [['Legal name','legalName'],['Email','email'],['LinkedIn URL','linkedin'],['Office address','officeAddress'],['Public location','publicLocation'],['Hero image URL','heroImage'],['Company image URL','companyImage']].forEach(([label, key]) => body.append(field(label, data.profile[key], value => mutate(`Updated ${label.toLowerCase()}.`, current => { current.profile[key] = value.slice(0, 2000); }))));
    } else if (active === 'metrics') {
      const metricEditor = (title, key, cap) => { body.append(node('strong', {}, title)); data[key].forEach((metric, index) => { const row = node('div', { class: 've-grid' }); row.append(field('Value', metric.value, value => mutate(`Updated ${title.toLowerCase()}.`, current => { current[key][index].value = value.slice(0, 80); })), field('Label', metric.label, value => mutate(`Updated ${title.toLowerCase()}.`, current => { current[key][index].label = value.slice(0, 160); })), (() => { const remove = node('button', { type: 'button' }, 'Remove'); remove.addEventListener('click', () => mutate(`Removed ${title.toLowerCase()} record.`, current => current[key].splice(index, 1))); return remove; })()); body.append(row); }); const add = node('button', { type: 'button' }, `Add ${title.slice(0, -1)}`); add.addEventListener('click', () => mutate(`Added ${title.toLowerCase()} record.`, current => { if (current[key].length < cap) current[key].push({ value: '', label: '' }); })); body.append(add); };
      metricEditor('Homepage metrics', 'metrics', 12); metricEditor('Industrial statistics', 'industrialStats', 8);
    } else if (active === 'projects') {
      if (projectIndex >= data.projects.length) projectIndex = Math.max(0, data.projects.length - 1); const select = node('select', { 'aria-label': 'Project record' }); data.projects.forEach((project, index) => select.append(node('option', { value: index }, project.name || `Project ${index + 1}`))); select.value = String(projectIndex); select.addEventListener('change', () => { projectIndex = Number(select.value); render(); }); body.append(select);
      const project = data.projects[projectIndex]; if (project) { body.append(node('p', { class: 've-note' }, 'This single record drives both project directory cards and map pins. Coordinates use longitude and latitude. Findings use mineral|evidence, one per line.')); [['ID','id'],['Project name','name'],['Region key','region'],['Longitude','lon','number'],['Latitude','lat','number'],['Priority (1–3, blank none)','priority','number']].forEach(([label, key, type]) => body.append(field(label, project[key] ?? '', value => mutate(`Updated project ${String(label).toLowerCase()}.`, current => { current.projects[projectIndex][key] = type === 'number' ? (value === '' ? null : Number(value)) : value.slice(0, 160); }), type || 'text'))); const findings = node('textarea', { 'aria-label': 'Project findings' }); findings.value = (project.findings || []).map(f => `${f.mineral}|${f.evidence}`).join('\n'); findings.addEventListener('change', () => mutate('Updated project findings.', current => { current.projects[projectIndex].findings = findings.value.split('\n').map(line => line.split('|')).filter(parts => parts[0] && ['observed','reported','unverified','inferred','confirmed'].includes(parts[1])).slice(0, 30).map(([mineral, evidence]) => ({ mineral: mineral.trim().slice(0, 100), evidence })); })); body.append(findings); }
      const add = node('button', { type: 'button' }, 'Add project'); add.addEventListener('click', () => mutate('Added project record.', current => { if (current.projects.length < 100) { current.projects.push({ id: `project-${Date.now()}`, name: 'New project', region: 'awdal', lon: 43, lat: 10, priority: null, findings: [] }); projectIndex = current.projects.length - 1; } })); body.append(add);
    } else if (active === 'catalogue') {
      body.append(node('p', { class: 've-note' }, 'Mineral catalogue values update the homepage and Portfolio page. Interest lists update the detailed company profile.'));
      const select = node('select', { 'aria-label': 'Mineral record' }); data.minerals.forEach((mineral, index) => select.append(node('option', { value: index }, mineral.name || `Mineral ${index + 1}`))); select.value = String(itemIndex); select.addEventListener('change', () => { itemIndex = Number(select.value); render(); }); body.append(select); const mineral = data.minerals[itemIndex]; if (mineral) { body.append(field('Mineral name', mineral.name, value => mutate('Updated mineral name.', current => { current.minerals[itemIndex].name = value.slice(0, 120); })), field('Category', mineral.cat, value => mutate('Updated mineral category.', current => { current.minerals[itemIndex].cat = value.slice(0, 80); }))); } listInput('Mineral interests', 'mineralInterests', 'One verified interest per line.'); listInput('Gemstone interests', 'gemstoneInterests', 'One verified gemstone interest per line.');
    } else if (active === 'about') {
      body.append(node('p', { class: 've-note' }, 'Preserve verified facts and company-reported qualifications. Office details use Profile & contact. Paragraphs and equipment/list items use one entry per line.'));
      const sections = data.about || {};
      Object.entries(sections).forEach(([key, section]) => {
        const details = node('details'); details.append(node('summary', {}, key.charAt(0).toUpperCase() + key.slice(1)));
        const edit = (label, value, update, multiline = false, max = 3000) => {
          const wrap = node('label', { class: 've-field' }); wrap.append(node('span', {}, label));
          const input = node(multiline ? 'textarea' : 'input', { 'aria-label': `${key}: ${label}`, maxlength: max }); input.value = value;
          input.addEventListener('change', () => mutate(`Updated ${key} ${label.toLowerCase()}.`, current => update(current.about[key], input.value.slice(0, max)))); wrap.append(input); details.append(wrap);
        };
        ['eyebrow', 'title', 'emphasis', 'introduction', 'note'].forEach(name => edit(name, section[name], (current, value) => { current[name] = value; }, name === 'introduction' || name === 'note', ['introduction', 'note'].includes(name) ? 3000 : 180));
        section.cards.forEach((card, index) => {
          details.append(node('strong', {}, `Record ${index + 1}`));
          ['label', 'title'].forEach(name => edit(`Record ${index + 1} ${name}`, card[name], (current, value) => { current.cards[index][name] = value; }, false, 180));
          ['paragraphs', 'items'].forEach(name => edit(`Record ${index + 1} ${name}`, card[name].join('\n'), (current, value) => { current.cards[index][name] = value.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 30).map(line => line.slice(0, 3000)); }, true, 90000));
          edit(`Record ${index + 1} link label`, card.link?.label || '', (current, value) => { current.cards[index].link = { target: current.cards[index].link?.target || 'community', label: value }; }, false, 180);
          const destination = node('select', { 'aria-label': `${key}: Record ${index + 1} link destination` }); destination.append(node('option', { value: '' }, 'No section link')); Object.keys(sections).forEach(target => destination.append(node('option', { value: target }, target))); destination.value = card.link?.target || ''; destination.addEventListener('change', () => mutate(`Updated ${key} section link.`, current => { if (destination.value) current.about[key].cards[index].link = { label: card.link?.label || '', target: destination.value }; else delete current.about[key].cards[index].link; })); details.append(destination);
          const remove = node('button', { type: 'button' }, `Remove ${key} record ${index + 1}`); remove.addEventListener('click', () => mutate(`Removed ${key} record.`, current => current.about[key].cards.splice(index, 1))); details.append(remove);
        });
        const add = node('button', { type: 'button' }, `Add ${key} record`); add.addEventListener('click', () => mutate(`Added ${key} record.`, current => { if (current.about[key].cards.length < 40) current.about[key].cards.push({ label: '', title: '', paragraphs: [], items: [] }); })); details.append(add); body.append(details);
      });
    } else {
      const select = node('select', { 'aria-label': 'Gallery record' });
      data.gallery.forEach((item, index) => select.append(node('option', { value: index }, item.label || `Gallery item ${index + 1}`)));
      select.value = String(itemIndex); select.addEventListener('change', () => { itemIndex = Number(select.value); render(); });
      body.append(node('p', { class: 've-note' }, 'Gallery labels and groups are shared across both gallery pages. Asset URLs should be selected from the Media Library or be approved HTTPS/local assets.'), select);
      const item = data.gallery[itemIndex];
      if (item) {
        [['Asset URL','src'],['Label','label'],['Group','group']].forEach(([label, key]) => body.append(field(label, item[key], value => mutate(`Updated gallery ${String(label).toLowerCase()}.`, current => { current.gallery[itemIndex][key] = value.slice(0, 2000); }))));
        body.append(field('Type (image or video)', item.type, value => mutate('Updated gallery media type.', current => { current.gallery[itemIndex].type = value === 'video' ? 'video' : 'image'; })));
      }
      const add = node('button', { type: 'button' }, 'Add gallery item');
      add.addEventListener('click', () => mutate('Added gallery record.', current => current.gallery.push({ src: '', label: 'New gallery item', group: 'Company', type: 'image', width: 1200, height: 800 })));
      body.append(add, node('strong', {}, 'Timeline'));
      data.timeline.forEach((entry, index) => body.append(field(`Year ${index + 1}`, entry.year, value => mutate('Updated timeline year.', current => { current.timeline[index].year = value.slice(0, 16); }))));
    }
  };
  render(); return () => host.remove();
}

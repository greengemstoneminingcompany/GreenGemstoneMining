import {writeFile} from 'node:fs/promises';
import process from 'node:process';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const base = process.env.AUDIT_BASE_URL || 'https://green-gemstone-mining-nine.vercel.app';
const browser = await chromium.launch({ headless: true });
const records = [];
const emit = (type, data) => { const record = { type, ...data }; records.push(record); console.log('SITE_AUDIT ' + JSON.stringify(record)); };
const routes = ['/#/home', '/#/about', '/#/projects', '/#/minerals', '/#/gallery', '/#/contact', '/#/buyers', '/#/studio', '/so/#/about', '/ar/#/projects', '/zh/#/minerals'];
const safeUrl = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return value.slice(0, 180); } };
for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [], network = [], galleryRows = [];
    page.on('pageerror', e => errors.push(e.message.slice(0, 400)));
    page.on('response', async response => {
      if (response.status() >= 400) network.push({ status: response.status(), url: safeUrl(response.url()) });
      if (new URL(response.url()).pathname.endsWith('/gallery_folders') && response.ok()) {
        try { const data = await response.json(); if (Array.isArray(data)) galleryRows.push(...data); } catch {}
      }
    });
    // Public QA must not create enquiries, accounts, sessions or other backend records.
    await page.route('**/*', request => request.request().method() === 'POST' ? request.abort() : request.continue());
    try {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.locator('main').waitFor({ state: 'visible' });
      await page.waitForTimeout(700);
      await page.evaluate(async () => { await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))]); });
      for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += 700) {
        await page.evaluate(top => window.scrollTo(0, top), y); await page.waitForTimeout(30);
      }
      await page.evaluate(() => { for (const d of document.querySelectorAll('main details.research-sources, main details.research-disclosure')) d.open = true; window.scrollTo(0, 0); });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const violations = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, html: n.html.slice(0, 180), summary: n.failureSummary })) }));
      const metadata = await page.evaluate(() => ({
        title: document.title, lang: document.documentElement.lang, dir: document.documentElement.dir,
        h1: document.querySelectorAll('main h1').length,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        description: document.querySelector('meta[name="description"]')?.content,
        socialImage: document.querySelector('meta[property="og:image"]')?.content,
        alternates: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(el => el.hreflang),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scripts: Array.from(document.scripts).map(s => s.src).filter(Boolean),
        timing: performance.getEntriesByType('navigation').map(n => ({ responseMs: Math.round(n.responseStart - n.requestStart), domReadyMs: Math.round(n.domContentLoadedEventEnd - n.startTime) })),
      }));
      emit('page', { width, route, status: response?.status(), metadata, violations, incompleteContrastCount: axe.incomplete.filter(v => v.id === 'color-contrast').reduce((n,v)=>n+v.nodes.length,0), errors, network });

      if (route === '/#/home') {
        const destinations = ['#/about?section=leadership', '#/projects', '#/gallery', '#/contact'];
        for (const href of destinations) {
          const toggle = page.locator('.hdr-burger');
          if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
          const anchor = page.locator(`#main-nav a[href="${href}"]`).first();
          const parent = anchor.locator('xpath=ancestor::details[1]');
          if (await parent.count() && !await parent.evaluate(el => el.open)) await parent.locator('summary').click();
          await anchor.click();
          await page.waitForTimeout(200);
          emit('navigation', { width, href, actual: new URL(page.url()).hash, menuClosed: await toggle.getAttribute('aria-expanded') === 'false', h1: await page.locator('main h1').count() });
        }
      }
      if (route === '/#/gallery') {
        const grid = page.locator('.bw-folder-grid');
        await page.waitForFunction(() => document.querySelectorAll('.bw-folder').length > 0 || Boolean(document.querySelector('.bw-gallery [role="alert"]')), { timeout: 20000 });
        const roots = galleryRows.filter(f => f.parent_id === null);
        const byId = new Map(galleryRows.map(f => [f.id, f]));
        let longest = [];
        for (const row of galleryRows) {
          const chain = [], seen = new Set(); let cursor = row;
          while (cursor && !seen.has(cursor.id)) { seen.add(cursor.id); chain.unshift(cursor); cursor = byId.get(cursor.parent_id); }
          if (chain.length > longest.length) longest = chain;
        }
        const names = await grid.locator('.bw-folder-caption strong').allTextContents();
        const rootMissing = roots.filter(f => !names.includes(f.name)).map(f => f.name);
        const visited = [];
        for (const folder of longest) {
          await grid.getByRole('button', { name: folder.name, exact: true }).click();
          visited.push({ name: folder.name, crumb: await page.locator('.bw-crumbs button').last().textContent() });
        }
        for (let i = 1; i < longest.length; i++) await page.getByRole('button', { name: 'Back', exact: true }).click();
        await page.locator('.bw-crumbs').getByRole('button', { name: 'Gallery', exact: true }).click();
        emit('gallery', { width, rows: galleryRows.length, roots: roots.length, rootMissing, visited, rootRestored: await grid.locator('.bw-folder').count(), publishedMediaVisible: await page.locator('.bw-photo-grid button').count(), error: await page.locator('.bw-gallery [role="alert"]').allTextContents() });
      }
      if (route === '/#/contact') {
        await page.locator('.contact-form button[type="submit"]').click();
        await page.waitForTimeout(100);
        emit('formValidation', { width, errors: await page.locator('.field-error').allTextContents(), invalidFields: await page.locator('.contact-form [aria-invalid="true"]').count(), networkWritesBlocked: true });
      }
      if (route === '/#/projects') {
        const svg = page.locator('.geomap-svg');
        const controls = page.locator('.geomap-stage .map-zoom-controls');
        const initial = (await svg.getAttribute('viewBox')).split(/\s+/).map(Number);
        const bounds = await svg.boundingBox(), controlBounds = await controls.boundingBox();
        const stage = await page.locator('.geomap-stage').boundingBox(), finder = await page.locator('.geomap-finder').boundingBox();
        await controls.locator('button').first().click();
        const zoomed = (await svg.getAttribute('viewBox')).split(/\s+/).map(Number);
        const box = await svg.boundingBox();
        await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
        await page.mouse.down(); await page.mouse.move(box.x + box.width * .5 + 65, box.y + box.height * .5 + 25, { steps: 8 }); await page.mouse.up();
        const dragged = (await svg.getAttribute('viewBox')).split(/\s+/).map(Number);
        await controls.locator('button').last().click();
        const reset = (await svg.getAttribute('viewBox')).split(/\s+/).map(Number);
        await page.locator('.geomap-finder .chip-btn').first().click();
        const mineralResults = await page.locator('.finder-results').count();
        await page.locator('.gm-tab').nth(1).click();
        const region = await page.locator('.region-card h3').textContent();
        await page.locator('.geomap-toggle button').nth(1).click();
        const geology = await page.locator('.geomap-toggle button').nth(1).getAttribute('aria-pressed');
        await page.locator('.geomap-projects').first().click();
        await page.locator('.survey-controls').waitFor({ state: 'visible' });
        const surveyText = await page.locator('.survey-controls h4').textContent();
        emit('map', { width, initial, zoomed, dragged, reset, controlsAboveCanvas: controlBounds.y + controlBounds.height <= bounds.y + 2, finderGap: Math.round(finder.y - stage.y - stage.height), panMoved: dragged[0] !== zoomed[0] || dragged[1] !== zoomed[1], resetWorks: JSON.stringify(reset) === JSON.stringify(initial), mineralResults, region, geology, surveyText });
      }
    } catch (error) { emit('flowError', { width, route, error: error.message.slice(0, 1200) }); }
    finally { await page.close(); }
  }
  await context.close();
}

const qaContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const qa=await qaContext.newPage();
await qa.route('**/*',r=>r.request().method()==='POST'?r.abort():r.continue());
try {
 await qa.goto(base+'/#/home');
 const homeAccordion=qa.locator('.bv-evidence-item button');
 const homeStates=[];
 for(let i=0;i<await homeAccordion.count();i++){const b=homeAccordion.nth(i);if(await b.getAttribute('aria-expanded')==='true')await b.click();await b.click();homeStates.push(await b.getAttribute('aria-expanded')==='true');await b.click();homeStates.push(await b.getAttribute('aria-expanded')==='false');}
 await qa.goto(base+'/#/buyers');
 const buyerAccordion=qa.locator('.bw-buyer-accordions button');const buyerStates=[];
 for(let i=0;i<await buyerAccordion.count();i++){const b=buyerAccordion.nth(i);if(await b.getAttribute('aria-expanded')==='true')await b.click();await b.click();buyerStates.push(await b.getAttribute('aria-expanded')==='true');await b.click();buyerStates.push(await b.getAttribute('aria-expanded')==='false');}
 emit('accordions',{homeCount:homeStates.length/2,buyerCount:buyerStates.length/2,allPassed:[...homeStates,...buyerStates].every(Boolean)});
 await qa.goto(base+'/#/projects');
 const filters=qa.locator('.project-filters button');const filterResults=[];
 for(let i=0;i<await filters.count();i++){await filters.nth(i).click();filterResults.push({label:await filters.nth(i).textContent(),active:(await filters.nth(i).getAttribute('class')||'').includes('active'),cards:await qa.locator('.project-card').count()});}
 const svg=qa.locator('.geomap-svg');const controls=qa.locator('.map-zoom-controls');
 await controls.locator('button').first().click();const before=await svg.getAttribute('viewBox');await svg.focus();await qa.keyboard.press('ArrowRight');const after=await svg.getAttribute('viewBox');await qa.keyboard.press('Home');
 emit('keyboardMap',{moved:before!==after,reset:await svg.getAttribute('viewBox')==='0 0 966 561',filters:filterResults});
 for(const outcome of ['success','rejected','network']){
  await qa.goto(base+'/#/contact');
  await qa.unroute('**/rest/v1/leads*');
  await qa.route('**/rest/v1/leads*',r=>outcome==='network'?r.abort():r.fulfill({status:outcome==='success'?201:429,contentType:'application/json',body:outcome==='success'?'':JSON.stringify({message:'Audit fixture: request rejected',code:'P0001'})}));
  await qa.locator('#cf-name').fill('Website Audit');await qa.locator('#cf-email').fill('audit@example.invalid');await qa.locator('#cf-message').fill('This is a mocked browser test. Nothing is sent.');
  await qa.locator('.contact-form button[type="submit"]').click();
  await qa.locator(outcome==='success'?'.form-success':'.contact-form [role="alert"]').waitFor();
  emit('formOutcome',{outcome,passed:outcome==='success'?await qa.locator('.form-success').isVisible():await qa.locator('.contact-form [role="alert"]').isVisible(),recoverable:outcome==='success'||await qa.locator('#cf-message').inputValue()==='This is a mocked browser test. Nothing is sent.',mocked:true});
 }
 const layouts=[];
 for(const width of [320,768,1920]){
  await qa.setViewportSize({width,height:1000});
  for(const route of ['/#/home','/#/projects','/#/about','/#/gallery','/#/contact','/#/buyers']){
   await qa.goto(base+route);await qa.locator('main').waitFor();await qa.waitForTimeout(300);
   layouts.push(await qa.evaluate(({width,route})=>{
    const tiny=[];for(const el of document.querySelectorAll('main *')){if(el.namespaceURI.includes('svg')||!el.getClientRects().length)continue;const text=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();if(!text)continue;const size=parseFloat(getComputedStyle(el).fontSize);if(size<14)tiny.push({tag:el.tagName,cls:el.className,size,text:text.slice(0,80)});}
    return{width,route,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,tiny:tiny.slice(0,24),tinyCount:tiny.length};
   },{width,route}));
  }
 }
 emit('responsiveType',{layouts});
 await qa.setViewportSize({width:1440,height:1000});await qa.goto(base+'/#/home');
 const links=await qa.locator('a[href]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.href))].filter(h=>h.startsWith(location.origin)&&!h.includes('#')));
 const checks=[];for(const url of links){const r=await qa.request.get(url);checks.push({url,status:r.status()});}
 const response=await qa.request.get(base+'/');const headers=response.headers();
 emit('headersLinks',{links:checks,csp:headers['content-security-policy'],frame:headers['x-frame-options'],nosniff:headers['x-content-type-options'],referrer:headers['referrer-policy'],hsts:headers['strict-transport-security']});
 const assets=[];for(const p of ['/robots.txt','/sitemap.xml','/og-image.jpg']){const r=await qa.request.get(base+p);assets.push({path:p,status:r.status(),type:r.headers()['content-type'],length:(await r.body()).length});}emit('seoAssets',{assets});
} catch(error){emit('flowError',{suite:'extended',error:error.message.slice(0,1000)});}
await qaContext.close();

await browser.close();
emit('summary', { pages: records.filter(r => r.type === 'page').length, flows: records.filter(r => r.type !== 'page').length, flowErrors: records.filter(r => r.type === 'flowError').length, contrastNodes: records.filter(r => r.type === 'page').reduce((sum, r) => sum + r.violations.filter(v => v.id === 'color-contrast').reduce((n, v) => n + v.nodes.length, 0), 0) });

await writeFile('buyer-site-audit.json',JSON.stringify(records,null,2));
const bad=records.some(r=>r.type==='flowError'||(r.type==='page'&&(r.status!==200||r.errors.length||r.network.length||r.metadata.overflow>2||r.metadata.h1!==1||r.violations.length))||(r.type==='map'&&(!r.panMoved||!r.resetWorks||!r.controlsAboveCanvas||r.finderGap>32))||(r.type==='formOutcome'&&(!r.passed||!r.recoverable))||(r.type==='accordions'&&!r.allPassed)||(r.type==='responsiveType'&&r.layouts.some(l=>l.overflow>2)));
if(bad)process.exitCode=1;

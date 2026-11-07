import {writeFile} from 'node:fs/promises';
import process from 'node:process';
import { chromium, firefox, webkit } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const base = process.env.AUDIT_BASE_URL || 'https://green-gemstone-mining-nine.vercel.app';
const browser = await chromium.launch({ headless: true });
const records = [];
const emit = (type, data) => { const record = { type, ...data }; records.push(record); const log=type==='responsiveType'?{...record,layouts:record.layouts.map(({tiny,...rest})=>({...rest,tiny:tiny.slice(0,5)}))}:record; console.log('SITE_AUDIT ' + JSON.stringify(log)); };
const routes = ['/#/home', '/#/about', '/#/projects', '/#/minerals', '/#/gallery', '/#/contact', '/#/buyers', '/#/studio', '/so/#/about', '/ar/#/projects', '/zh/#/minerals'];
const safeUrl = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return value.slice(0, 180); } };
for (const theme of ['light','dark']) for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
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
      await page.evaluate(() => { for (const d of document.querySelectorAll('main details.research-sources, main details.research-disclosure, main details.geomap-sources')) d.open = true; window.scrollTo(0, 0); });
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
      emit('page', { theme, width, route, status: response?.status(), metadata, violations, incompleteContrastCount: axe.incomplete.filter(v => v.id === 'color-contrast').reduce((n,v)=>n+v.nodes.length,0), errors, network });

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
          emit('navigation', { theme, width, href, actual: new URL(page.url()).hash, menuClosed: await toggle.getAttribute('aria-expanded') === 'false', h1: await page.locator('main h1').count() });
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
        emit('gallery', { theme, width, rows: galleryRows.length, roots: roots.length, rootMissing, visited, rootRestored: await grid.locator('.bw-folder').count(), publishedMediaVisible: await page.locator('.bw-photo-grid button').count(), error: await page.locator('.bw-gallery [role="alert"]').allTextContents() });
      }
      if (route === '/#/contact') {
        await page.locator('.contact-form button[type="submit"]').click();
        await page.waitForTimeout(100);
        emit('formValidation', { theme, width, errors: await page.locator('.field-error').allTextContents(), invalidFields: await page.locator('.contact-form [aria-invalid="true"]').count(), networkWritesBlocked: true });
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
        emit('map', { theme, width, initial, zoomed, dragged, reset, controlsAboveCanvas: controlBounds.y + controlBounds.height <= bounds.y + 2, finderGap: Math.round(finder.y - stage.y - stage.height), panMoved: dragged[0] !== zoomed[0] || dragged[1] !== zoomed[1], resetWorks: JSON.stringify(reset) === JSON.stringify(initial), mineralResults, region, geology, surveyText });
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
  await qa.goto(base+'/?audit='+outcome+'#/contact');
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


const UX=await browser.newContext({viewport:{width:1440,height:900},colorScheme:'light',reducedMotion:'reduce'});
const ux=await UX.newPage();
await ux.route('**/*',route=>route.request().method()==='POST'?route.abort():route.continue());
try {
 await ux.goto(base+'/#/projects');await ux.locator('.geomap-svg').waitFor();
 const readTheme=()=>ux.locator('html').getAttribute('data-theme');
 const initial=await readTheme();const themeBtn=ux.locator('.theme-switch');await themeBtn.click();const switched=await readTheme();
 await ux.reload();const persisted=await readTheme();await themeBtn.click();const reverted=await readTheme();
 const skip=ux.locator('.skip-link');await skip.focus();await ux.keyboard.press('Enter');const skipFocus=await ux.evaluate(()=>document.activeElement?.id);
 const skipRoute=new URL(ux.url()).hash;
 const navigation=await ux.locator('#main-nav a[href^="#/"]').evaluateAll(links=>[...new Set(links.map(a=>a.getAttribute('href'))) ]);
 const brokenSections=[];
 for(const href of navigation.filter(href=>href.includes('?section='))){
  await ux.goto(base+'/'+href);const id=new URLSearchParams(href.split('?')[1]).get('section');
  try{await ux.locator('[id="'+id+'"]').waitFor({state:'attached',timeout:4000});}catch{brokenSections.push(href);}
 }
 emit('themeNavigation',{initial,switched,persisted,reverted,skipFocus,skipRoute,sections:navigation.filter(h=>h.includes('?section=')).length,brokenSections});
 await ux.goto(base+'/#/gallery');
 const gallerySearch=ux.getByRole('searchbox',{name:'Search gallery folders'});
 await gallerySearch.fill('monazite');const searchResult=ux.locator('.gallery-search-results button').filter({hasText:'Monazite'}).first();
 const trail=await searchResult.textContent();await searchResult.click();
 const galleryHeading=await ux.locator('.bw-gallery-heading h3').textContent();
 await gallerySearch.fill('unmatched-audit-query-999');const galleryNoResults=await ux.locator('.public-search [role="status"]').textContent();
 await ux.getByRole('button',{name:'Clear search'}).click();const galleryClear=await gallerySearch.inputValue();
 await ux.goto(base+'/#/minerals');const catalogue=ux.getByRole('searchbox',{name:'Search the mineral catalogue'});
 const catalogueInitial=await ux.locator('.portfolio-group .content-pill').count();
 const firstMineral=await ux.locator('.portfolio-group .content-pill').first().textContent();
 await catalogue.fill(firstMineral);const catalogueFiltered=await ux.locator('.portfolio-group .content-pill').count();
 await ux.goto(base+'/#/projects');const mapSearch=ux.getByRole('searchbox',{name:'Search minerals on the map'});
 const finderTotal=await ux.locator('.geomap-finder .chip-btn').count();
 const firstMapMineral=await ux.locator('.geomap-finder .chip-btn').first().evaluate(el=>Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim());
 await mapSearch.fill(firstMapMineral);const finderFiltered=await ux.locator('.geomap-finder .chip-btn').count();
 await ux.locator('.geomap-finder .chip-btn').first().click();
 const nestedLinks=await ux.locator('.finder-results button a').count();
 emit('search',{trail,galleryHeading,galleryNoResults,galleryClear,catalogueInitial,catalogueFiltered,finderTotal,finderFiltered,nestedLinks});
 await ux.goto(base+'/#/studio');const signIn=ux.locator('.bw-login');
 await signIn.waitFor({timeout:12000});
 emit('ownerGate',{loginVisible:await signIn.isVisible(),loginReady:await signIn.getByRole('button',{name:'Sign in'}).isEnabled(),privatePanels:await ux.locator('.bw-tabs,.bw-panel').count(),publicEditorMarker:await ux.locator('meta[name="ggmc-preview-editor"][content="enabled"]').count()});
 await ux.route('**/auth/v1/token*',r=>r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'invalid_credentials',message:'Mocked invalid credentials'})}));
 await signIn.locator('input[type=email]').fill('audit@example.invalid');await signIn.locator('input[type=password]').fill('audit-mock-password-not-a-secret');
 await signIn.getByRole('button',{name:'Sign in'}).click();await signIn.getByRole('alert').waitFor();
 emit('ownerRejected',{stayedPrivate:await ux.locator('.bw-tabs,.bw-panel').count()===0,errorShown:await signIn.getByRole('alert').isVisible(),mocked:true});
 for(const [prefix,lang,dir] of [['so','so','ltr'],['ar','ar','rtl'],['zh','zh-Hans','ltr']]){
  for(const route of ['home','buyers','gallery']){
   const res=await ux.goto(base+'/'+prefix+'/?auditLocale='+route+'#/'+route);
   await ux.waitForFunction(expected=>document.documentElement.lang===expected,lang);
   const title=await ux.locator('main h1').textContent();
   const cue=route==='home'?await ux.locator('.bv-focus .bv-label').textContent():route==='buyers'?await ux.locator('.bw-buyer-hero>span').textContent():await ux.locator('.bw-gallery-heading>span').textContent();
   emit('localized',{route,lang,status:res?.status(),dir:await ux.locator('html').getAttribute('dir'),expectedDir:dir,title,cue});
  }
 }
} catch(error){emit('flowError',{suite:'visitor upgrades',error:error.message.slice(0,1000)});}
await UX.close();

const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
try{
 const page=await touch.newPage();await page.goto(base+'/#/projects');const svg=page.locator('.geomap-svg');
 await page.locator('.map-zoom-controls button').first().tap();await svg.scrollIntoViewIfNeeded();
 const before=await svg.getAttribute('viewBox');const box=await svg.boundingBox();const cdp=await touch.newCDPSession(page);
 const x=Math.round(box.x+box.width*.5),y=Math.round(box.y+box.height*.5);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let n=1;n<=6;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+n*8,y:y+n*3}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await svg.getAttribute('viewBox');
 emit('touchMap',{moved:before!==after,before,after});
}catch(error){emit('flowError',{suite:'touch map',error:error.message.slice(0,1000)});}
await touch.close();

const perf=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
try{
 const page=await perf.newPage();
 await page.addInitScript(()=>{window.auditPerf={lcp:0,cls:0};new PerformanceObserver(list=>{for(const entry of list.getEntries())window.auditPerf.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.auditPerf.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});});
 const cdp=await perf.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.goto(base+'/#/home',{waitUntil:'networkidle',timeout:45000});await page.waitForTimeout(1200);
 const metrics=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0];const items=performance.getEntriesByType('resource');return{lcpMs:Math.round(window.auditPerf.lcp),cls:Math.round(window.auditPerf.cls*1000)/1000,domReadyMs:Math.round(nav.domContentLoadedEventEnd),sameOriginBytes:items.filter(x=>new URL(x.name).origin===location.origin).reduce((a,b)=>a+b.transferSize,nav.transferSize),resources:items.length,loadedMap:items.some(x=>/SomalilandMap/.test(x.name))};});
 emit('performanceLab',metrics);
}catch(error){emit('flowError',{suite:'performance lab',error:error.message.slice(0,1000)});}
await perf.close();

for(const [engine,launcher] of [['Firefox',firefox],['WebKit',webkit]]){
 let cross;
 try{
  cross=await launcher.launch({headless:true});const page=await cross.newPage({viewport:{width:390,height:844},colorScheme:'dark',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,200)));
  const status=[];
  for(const route of ['home','about','projects','minerals','gallery','contact','buyers','studio']){
   const res=await page.goto(base+'/?auditEngine='+engine+'&route='+route+'#/'+route);
   await page.locator('main h1').waitFor({timeout:12000});
   status.push({route,status:res?.status(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
  }
  emit('crossBrowser',{engine,status,errors});
 }catch(error){emit('flowError',{suite:engine,error:error.message.slice(0,1000)});}
 finally{await cross?.close();}
}


const fixture=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
try{
 const page=await fixture.newPage();let folderId='';
 const photoId='ee000000-0000-4000-8000-000000000001';
 const stamp='2020-01-01T00:00:00.000Z';
 const photo={id:photoId,title:'Audit image fixture',description:'Browser-only fixture',media_type:'image',storage_path:'fixture-only',public_url:base+'/brand-emblem.webp',category:'gallery',sort_order:0,is_active:true,created_at:stamp,updated_at:stamp};
 await page.route('**/*',r=>r.request().method()==='POST'?r.abort():r.continue());
 await page.route('**/rest/v1/media_uploads*',r=>r.fulfill({json:[photo]}));
 await page.route('**/rest/v1/gallery_folders*',async route=>{const response=await route.fetch();const rows=await response.json();folderId=rows.find(x=>x.parent_id===null&&x.name==='Minerals').id;await route.fulfill({response,json:rows});});
 await page.route('**/rest/v1/gallery_folder_media*',r=>r.fulfill({json:[{folder_id:folderId,media_id:photoId,sort_order:0}]}));
 await page.route('**/rest/v1/gallery_folder_covers*',r=>r.fulfill({json:[{folder_id:folderId,media_id:photoId}]}));
 await page.goto(base+'/#/gallery');
 const folder=page.locator('.bw-folder').filter({hasText:'Minerals'}).first();await folder.waitFor();
 await folder.locator('img').waitFor();await folder.click();
 const tile=page.getByRole('button',{name:/Audit image fixture/});await tile.focus();await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog',{name:'Audit image fixture'});await dialog.waitFor();
 const initialFocus=await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
 await page.keyboard.press('Tab');const focusStayed=await dialog.evaluate(el=>el.contains(document.activeElement));
 const imageLoaded=await dialog.locator('img').evaluate(async img=>{try{await img.decode();return img.naturalWidth>0;}catch{return false;}});
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 const focusRestored=await tile.evaluate(el=>el===document.activeElement);
 emit('galleryMediaFixture',{coverLoaded:true,initialFocus,focusStayed,imageLoaded,focusRestored,mocked:true});
}catch(error){emit('flowError',{suite:'gallery media fixture',error:error.message.slice(0,1000)});}
await fixture.close();

await browser.close();
emit('summary', { pages: records.filter(r => r.type === 'page').length, flows: records.filter(r => r.type !== 'page').length, flowErrors: records.filter(r => r.type === 'flowError').length, contrastNodes: records.filter(r => r.type === 'page').reduce((sum, r) => sum + r.violations.filter(v => v.id === 'color-contrast').reduce((n, v) => n + v.nodes.length, 0), 0) });

await writeFile('buyer-site-audit.json',JSON.stringify(records,null,2));
const bad=records.some(r=>r.type==='flowError'||(r.type==='page'&&(r.status!==200||r.errors.length||r.network.length||r.metadata.overflow>2||r.metadata.h1!==1||r.violations.length))||(r.type==='map'&&(!r.panMoved||!r.resetWorks||!r.controlsAboveCanvas||r.finderGap>32))||(r.type==='formOutcome'&&(!r.passed||!r.recoverable))||(r.type==='accordions'&&!r.allPassed)||(r.type==='responsiveType'&&r.layouts.some(l=>l.overflow>2))||(r.type==='themeNavigation'&&(r.initial!=='light'||r.switched!=='dark'||r.persisted!=='dark'||r.reverted!=='light'||r.skipFocus!=='main'||r.skipRoute!=='#/projects'||r.brokenSections.length))||(r.type==='search'&&(r.galleryHeading!=='Monazite'||r.galleryClear||r.catalogueFiltered<1||r.catalogueFiltered>=r.catalogueInitial||r.finderFiltered<1||r.finderFiltered>=r.finderTotal||r.nestedLinks))||(r.type==='ownerGate'&&(!r.loginVisible||!r.loginReady||r.privatePanels||r.publicEditorMarker))||(r.type==='touchMap'&&!r.moved)||(r.type==='ownerRejected'&&(!r.stayedPrivate||!r.errorShown))||(r.type==='galleryMediaFixture'&&(!r.focusStayed||!r.imageLoaded||!r.focusRestored))||(r.type==='localized'&&(r.status!==200||r.dir!==r.expectedDir))||(r.type==='crossBrowser'&&(r.errors.length||r.status.some(x=>x.status!==200||x.overflow>2))));
if(bad)process.exitCode=1;

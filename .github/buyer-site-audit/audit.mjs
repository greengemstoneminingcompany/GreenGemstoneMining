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
      const axe = await new AxeBuilder({ page }).withRules(['color-contrast', 'button-name', 'link-name', 'label', 'image-alt', 'aria-valid-attr-value']).analyze();
      const violations = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, html: n.html.slice(0, 350), summary: n.failureSummary, checks: n.any.map(c => ({ id: c.id, data: c.data })) })) }));
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
      emit('page', { width, route, status: response?.status(), metadata, violations, incompleteContrast: axe.incomplete.filter(v => v.id === 'color-contrast').flatMap(v => v.nodes.map(n => n.target)), errors, network });

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
await browser.close();
emit('summary', { pages: records.filter(r => r.type === 'page').length, flows: records.filter(r => r.type !== 'page').length, flowErrors: records.filter(r => r.type === 'flowError').length, contrastNodes: records.filter(r => r.type === 'page').reduce((sum, r) => sum + r.violations.filter(v => v.id === 'color-contrast').reduce((n, v) => n + v.nodes.length, 0), 0) });

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { applyPublishedVisualEditorPayload } from './visualEditorBridge';

describe('published visual editor payload safety', () => {
 afterEach(() => { document.body.innerHTML = ''; });
 it('updates text without deleting nested links and buttons', () => {
  document.body.innerHTML = '<div id="root"><section class="hero">Old heading <a href="/contact">Contact</a><button>Explore</button></section></div>';
  const root = document.getElementById('root')!;
  applyPublishedVisualEditorPayload({ text: { '.hero': { after: 'New heading' } } }, root);
  expect(root.querySelector('.hero')?.textContent).toContain('New heading');
  expect(root.querySelector('.hero a')?.textContent).toBe('Contact');
  expect(root.querySelector('.hero button')?.textContent).toBe('Explore');
 });
 it('updates leaf text normally', () => {
  document.body.innerHTML = '<div id="root"><h1 class="title">Old</h1></div>';
  applyPublishedVisualEditorPayload({ text: { '.title': { after: 'New title' } } }, document.getElementById('root')!);
  expect(document.querySelector('.title')?.textContent).toBe('New title');
 });
 it('ignores selectors targeting the root and editor chrome', () => {
  document.body.innerHTML = '<div id="root"><p>Keep me</p></div>';
  const root = document.getElementById('root')!;
  applyPublishedVisualEditorPayload({ text: { '#root': { after: 'Destroyed' }, 'body': { after: 'Destroyed' } } }, root);
  expect(root.querySelector('p')?.textContent).toBe('Keep me');
 });
 it('rejects CSS values containing URL and script-like constructs', () => {
  document.body.innerHTML = '<div id="root"><p class="target">Keep me</p></div>';
  const target = document.querySelector('.target') as HTMLElement;
  applyPublishedVisualEditorPayload({ styles: { '.target': { color: 'red', 'font-family': 'url(javascript:alert(1))' } } }, document.getElementById('root')!);
  expect(target.style.color).toBe('red');
  expect(target.style.fontFamily).toBe('');
 });
 it('sanitizes published custom HTML while preserving plain text and multiple roots', () => {
  document.body.innerHTML = '<div id="root"></div>';
  const root = document.getElementById('root')!;
  applyPublishedVisualEditorPayload({ blocks: [{ id: 'html-test', kind: 'html', text: '<p>First root</p><p onclick="alert(1)">Second root</p><script>bad()</script><iframe src="https://evil.example"></iframe>' }] }, root);
  const block = root.querySelector('[data-ve-block-id="html-test"]')!;
  expect(block.querySelectorAll('p')).toHaveLength(2);
  expect(block.textContent).toContain('First root');
  expect(block.textContent).toContain('Second root');
  expect(block.querySelector('script,iframe,[onclick]')).toBeNull();
 });

 it('rejects CSS-breaking characters in published background image URLs', () => {
  document.body.innerHTML = '<div id="root"><div class="background"></div></div>';
  const target = document.querySelector('.background') as HTMLElement;
  applyPublishedVisualEditorPayload({ styles: { '.background': { '--ve-background-image': 'https://evil.example/image.png");color:red' } } }, document.getElementById('root')!);
  expect(target.style.backgroundImage).toBe('');
  expect(target.style.color).toBe('');
 });

 it('accepts a safe published image URL but rejects protocol-relative image hosts', () => {
  document.body.innerHTML = '<div id="root"><img class="safe"><img class="unsafe"></div>';
  applyPublishedVisualEditorPayload({ styles: { '.safe': { '--ve-image-src': 'https://example.com/image.webp' }, '.unsafe': { '--ve-image-src': '//evil.example/image.webp' } } }, document.getElementById('root')!);
  expect((document.querySelector('.safe') as HTMLImageElement).src).toBe('https://example.com/image.webp');
  expect((document.querySelector('.unsafe') as HTMLImageElement).getAttribute('src')).toBeNull();
 });

 it('renders a published structured Builder page without HTML injection', () => {
  document.body.innerHTML = '<div id="root"><main></main></div>';
  applyPublishedVisualEditorPayload({ pageBuilder: { version: 1, activePageId: 'home', pages: [{ id: 'home', slug: 'home', components: [
   { id: 'hero', kind: 'hero', props: { title: 'Builder heading', text: '<script>bad()</script>' }, style: { background: '#123456' } },
   { id: 'link', kind: 'button', props: { title: 'Contact', href: 'javascript:alert(1)' }, style: {} },
  ] }] } }, document.getElementById('root')!);
  expect(document.querySelector('main')?.textContent).toContain('Builder heading');
  expect(document.querySelector('main')?.textContent).toContain('<script>bad()</script>');
  expect(document.querySelector('script')).toBeNull();
  expect(document.querySelector<HTMLAnchorElement>('.builder-button')?.getAttribute('href')).toBe('#');
 });

 it('uses published Builder SEO and adds safe page navigation links', () => {
  document.body.innerHTML = '<header><nav class="hdr-nav"></nav></header><div id="root"><main></main></div>';
  window.location.hash = '#/contact';
  applyPublishedVisualEditorPayload({ pageBuilder: { activePageId: 'home', pages: [
   { id: 'home', name: 'Home', slug: 'home', seo: { title: 'Builder home', description: 'Home description' }, components: [] },
   { id: 'contact', name: 'Contact us', slug: 'contact', seo: { title: 'Builder contact', description: 'Contact description' }, components: [{ id: 'heading', kind: 'heading', props: { title: 'Contact' }, style: {} }] },
  ] } }, document.getElementById('root')!);
  expect(document.title).toBe('Builder contact');
  expect(document.querySelectorAll('[data-builder-page-link]')).toHaveLength(2);
  expect(document.querySelector<HTMLAnchorElement>('[data-builder-page-link][href="#/contact"]')?.textContent).toBe('Contact us');
 });

});

it('renders configured gallery, image crop, form fields and shared chrome safely', () => {
 document.body.innerHTML = '<div id="root"><header><a class="hdr-brand"><span>Original</span></a><nav class="hdr-nav"><details class="owner-menu"><summary>Owner</summary></details><div class="lang-switch">EN</div></nav></header><main></main><footer>Existing contact</footer></div>';
 applyPublishedVisualEditorPayload({ pageBuilder: { globals: { headerText: 'Approved header', footerText: 'Approved footer', navigation: ['Home|#/home'], background: '#123456' }, pages: [{ slug: 'home', components: [
  { kind: 'image', props: { src: 'https://example.com/a.webp', aspect: '16/9', focalX: 25, focalY: 200 } },
  { kind: 'gallery', props: { images: ['javascript:alert(1)', 'https://example.com/b.webp'] } },
  { kind: 'contactForm', props: { fields: ['Phone|tel|required', 'Question|textarea', 'Bad|script'], submitLabel: 'Request contact' } },
 ] }] } }, document.getElementById('root')!);
 expect(document.querySelector<HTMLImageElement>('.builder-image img')?.style.objectPosition).toBe('25% 100%');
 expect(document.querySelector<HTMLImageElement>('.builder-image img')?.style.aspectRatio).toBe('16/9');
 expect(document.querySelectorAll('.builder-gallery-grid img')).toHaveLength(1);
 expect(document.querySelector<HTMLInputElement>('form input')?.type).toBe('tel');
 expect(document.querySelector<HTMLInputElement>('form input')?.required).toBe(true);
 expect(document.querySelectorAll('form textarea')).toHaveLength(1);
 expect(document.querySelector<HTMLButtonElement>('form button')?.disabled).toBe(true);
 expect(document.querySelector('.hdr-brand span')?.textContent).toBe('Approved header');
 expect(document.querySelector('footer')?.textContent).toBe('Existing contactApproved footer');
 expect(document.querySelectorAll('.hdr-nav a')).toHaveLength(1);
 expect(document.querySelector('.owner-menu summary')?.textContent).toBe('Owner');
 expect(document.querySelector('.lang-switch')?.textContent).toBe('EN');
 document.body.innerHTML = '';
});

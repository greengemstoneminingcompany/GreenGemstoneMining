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

});

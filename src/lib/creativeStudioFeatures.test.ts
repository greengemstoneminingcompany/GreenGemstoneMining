// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountCreativeStudio } from '../../public/visual-editor/features/creative-studio.js';

describe('modular Creative Studio', () => {
 let panel: HTMLElement;
 let root: HTMLElement;
 let draft: Record<string, any>;
 let selected: HTMLElement | null;
 let say: ReturnType<typeof vi.fn>;
 let applyChange: ReturnType<typeof vi.fn>;
 let saveHistory: ReturnType<typeof vi.fn>;
 let aiWrite: ReturnType<typeof vi.fn>;
 let dispose: (() => void) | undefined;

 beforeEach(() => {
  document.body.innerHTML = '<div id="root"><main></main></div><aside id="panel"></aside>';
  localStorage.clear();
  panel = document.getElementById('panel')!;
  root = document.getElementById('root')!;
  draft = { text: {}, styles: {}, hidden: {}, blocks: [], actions: {} };
  selected = null;
  say = vi.fn();
  applyChange = vi.fn();
  saveHistory = vi.fn();
  aiWrite = vi.fn(async () => 'Responsible operations\n\nWe explain our approach clearly and responsibly.');
  dispose = mountCreativeStudio({ panel, root, getDraft: () => draft, saveHistory, applyChange, say, getSelected: () => selected, aiWrite });
 });

 it('applies validated global tokens and inserts reusable starter layouts', () => {
  Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Apply design system')?.click();
  expect(draft.designTokens).toMatchObject({ brand: '#101b15', accent: '#c4a252', radius: 12 });
  expect(root.style.getPropertyValue('--ggmc-accent')).toBe('#c4a252');

  const starter = panel.querySelector<HTMLSelectElement>('[aria-label="Starter template"]')!;
  starter.value = 'mission-story';
  starter.dispatchEvent(new Event('change'));
  panel.querySelectorAll<HTMLButtonElement>('button').find(button => button.textContent === 'Add starter section')?.click();
  expect(draft.blocks).toHaveLength(1);
  expect(draft.blocks[0]).toMatchObject({ kind: 'section', title: 'Built on responsible practice' });
  expect(saveHistory).toHaveBeenCalledTimes(2);
  expect(applyChange).toHaveBeenCalledTimes(2);
 });

 it('requires review before applying AI section content and preserves existing blocks', async () => {
  draft.blocks.push({ id: 'existing', kind: 'image', src: 'https://example.com/keep.webp', alt: 'Keep image' });
  const brief = panel.querySelector<HTMLTextAreaElement>('[aria-label="AI section brief"]')!;
  brief.value = 'Explain our approach to responsible sourcing.';
  panel.querySelectorAll<HTMLButtonElement>('button').find(button => button.textContent === 'Generate section proposal')?.click();
  await vi.waitFor(() => expect(aiWrite).toHaveBeenCalledWith(expect.objectContaining({ mode: 'section_copy' })));
  await vi.waitFor(() => expect(panel.querySelector<HTMLTextAreaElement>('[aria-label="AI section proposal review"]')?.value).toContain('We explain our approach'));
  expect(draft.blocks).toHaveLength(1);
  const accept = panel.querySelectorAll<HTMLButtonElement>('button').find(button => button.textContent === 'Review accepted — add section to draft')!;
  expect(accept.disabled).toBe(false);
  accept.click();
  expect(draft.blocks).toHaveLength(2);
  expect(draft.blocks[0].src).toBe('https://example.com/keep.webp');
  expect(draft.blocks[1]).toMatchObject({ kind: 'section', title: 'Responsible operations', text: 'We explain our approach clearly and responsibly.' });
 });

 it('restores token styles on teardown', () => {
  root.style.setProperty('--ggmc-accent', '#abcdef');
  dispose?.();
  expect(root.style.getPropertyValue('--ggmc-accent')).toBe('');
  expect(document.querySelector('[data-ggmc-feature="creative-studio-tokens"]')).toBeNull();
 });
});

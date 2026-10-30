// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountCreativeStudio } from './creativeStudioFeatures.js';

describe('modular Creative Studio', () => {
 let panel: HTMLElement;
 let root: HTMLElement;
 let draft: { text: Record<string, unknown>; styles: Record<string, unknown>; hidden: Record<string, unknown>; blocks: Array<Record<string, unknown>>; actions: Record<string, unknown>; designTokens?: Record<string, unknown>; [key: string]: unknown };
 let selected: HTMLElement | null;
 let say: ReturnType<typeof vi.fn<(message: string) => void>>;
 let applyChange: ReturnType<typeof vi.fn<(message?: string) => void>>;
 let saveHistory: ReturnType<typeof vi.fn<() => void>>;
 let aiWrite: ReturnType<typeof vi.fn<(input: { mode: string; tone: string; text: string }) => Promise<string>>>;
 let dispose: (() => void) | undefined;

 beforeEach(() => {
  dispose?.(); dispose = undefined;
  document.querySelectorAll('[data-ggmc-feature="creative-studio-tokens"]').forEach(node => node.remove());
  document.body.innerHTML = '<div id="root"><main></main></div><aside id="panel"></aside>';
  localStorage.clear();
  panel = document.getElementById('panel')!;
  root = document.getElementById('root')!;
  draft = { text: {}, styles: {}, hidden: {}, blocks: [], actions: {} };
  selected = null;
  say = vi.fn<(message: string) => void>();
  applyChange = vi.fn<(message?: string) => void>();
  saveHistory = vi.fn<() => void>();
  aiWrite = vi.fn(async (input: { mode: string; tone: string; text: string }) => input.mode === 'section_copy' ? 'Responsible operations\n\nWe explain our approach clearly and responsibly.' : input.text);
  dispose = mountCreativeStudio({ panel, root, getDraft: () => draft, saveHistory, applyChange, say, getSelected: () => selected, aiWrite });
 });

 it('applies validated global tokens and inserts reusable starter layouts', () => {
  Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Apply design system')?.click();
  expect(draft.designTokens).toMatchObject({ brand: '#101b15', accent: '#c4a252', radius: 12 });
  expect(root.style.getPropertyValue('--ggmc-accent')).toBe('#c4a252');

  const starter = panel.querySelector<HTMLSelectElement>('[aria-label="Starter layout"]')!;
  starter.value = 'mission-story';
  starter.dispatchEvent(new Event('change'));
  Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Add starter section')?.click();
  expect(draft.blocks).toHaveLength(1);
  expect(draft.blocks[0]).toMatchObject({ kind: 'section', title: 'Built on responsible practice' });
  expect(saveHistory).toHaveBeenCalledTimes(2);
  expect(applyChange).toHaveBeenCalledTimes(2);
 });

 it('filters malformed or unsupported blocks from the browser template library', () => {
  localStorage.setItem('ggmc-preview-creative-library-v1', JSON.stringify([
   { id: 'valid', name: 'Valid card', block: { kind: 'card', title: 'Valid' } },
   { id: 'array', name: 'Invalid array', block: [{ kind: 'card' }] },
   { id: 'unsupported', name: 'Unsupported HTML', block: { kind: 'html', html: 'bad' } },
  ]));
  const isolatedPanel = document.createElement('aside'); document.body.append(isolatedPanel);
  const isolatedDispose = mountCreativeStudio({ panel: isolatedPanel, root, getDraft: () => draft, saveHistory, applyChange, say, getSelected: () => selected, aiWrite });
  try {
   expect(isolatedPanel.textContent).toContain('Valid card');
   expect(isolatedPanel.textContent).not.toContain('Invalid array');
   expect(isolatedPanel.textContent).not.toContain('Unsupported HTML');
  } finally { isolatedDispose(); isolatedPanel.remove(); }
 });

 it('requires review before applying AI section content and preserves existing blocks', async () => {
  draft.blocks.push({ id: 'existing', kind: 'image', src: 'https://example.com/keep.webp', alt: 'Keep image' });
  const brief = panel.querySelector<HTMLTextAreaElement>('[aria-label="AI section brief"]')!;
  brief.value = 'Explain our approach to responsible sourcing.';
  Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Generate section proposal')?.click();
  await vi.waitFor(() => expect(aiWrite).toHaveBeenCalledWith(expect.objectContaining({ mode: 'section_copy' })));
  await vi.waitFor(() => expect(panel.querySelector<HTMLTextAreaElement>('[aria-label="AI section proposal review"]')?.value).toContain('We explain our approach'));
  expect(draft.blocks).toHaveLength(1);
  const accept = Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Review accepted — add section to draft')!;
  expect(accept.disabled).toBe(false);
  accept.click();
  expect(draft.blocks).toHaveLength(2);
  expect(draft.blocks[0].src).toBe('https://example.com/keep.webp');
  expect(draft.blocks[1]).toMatchObject({ kind: 'section', title: 'Responsible operations', text: 'We explain our approach clearly and responsibly.' });
 });

 it('loads and saves shared server templates through the editor adapter', async () => {
  const shared = { id: 'template-1', name: 'Partner card', block: { kind: 'card', title: 'Partner with us', text: 'Start a conversation.' }, created_at: '2026-10-29T00:00:00Z', updated_at: '2026-10-29T00:00:00Z' };
  const editorApi = {
   getSession: vi.fn(async () => ({ email: 'admin@example.com', isAdmin: true })),
   listTemplates: vi.fn(async () => [shared]),
   saveTemplate: vi.fn(async () => shared),
   deleteTemplate: vi.fn(async () => true),
  };
  const serverPanel = document.createElement('aside');
  document.body.append(serverPanel);
  const serverDispose = mountCreativeStudio({ panel: serverPanel, root, getDraft: () => draft, saveHistory, applyChange, say, getSelected: () => selected, aiWrite, editorApi });
  try {
   await vi.waitFor(() => expect(editorApi.listTemplates).toHaveBeenCalledTimes(1));
   await vi.waitFor(() => expect(serverPanel.textContent).toContain('Partner card'));
   const insert = Array.from(serverPanel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Insert')!;
   insert.click();
   expect(draft.blocks[0]).toMatchObject({ kind: 'card', title: 'Partner with us' });
   draft.blocks.push({ id: 'existing', kind: 'card', title: 'Saved card', text: 'Reusable copy' });
   const selectedWrapper = document.createElement('div');
   selectedWrapper.dataset.veBlockId = 'existing';
   selected = document.createElement('span');
   selectedWrapper.append(selected);
   document.body.append(selectedWrapper);
   serverPanel.querySelector<HTMLInputElement>('[aria-label="Template name"]')!.value = 'Saved card';
   Array.from(serverPanel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Save selected block as template')!.click();
   await vi.waitFor(() => expect(editorApi.saveTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: null, name: 'Saved card', block: expect.objectContaining({ id: 'existing' }) })));

   const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
   try {
    Array.from(serverPanel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Delete')!.click();
    await vi.waitFor(() => expect(editorApi.deleteTemplate).toHaveBeenCalledWith('template-1'));
    await vi.waitFor(() => expect(serverPanel.textContent).toContain('Deleted shared template'));
   } finally { confirmSpy.mockRestore(); }
  } finally { serverDispose(); serverPanel.remove(); document.querySelector('[data-ve-block-id="existing"]')?.remove(); }
 });

 it('does not claim a shared template was deleted when the server returns false', async () => {
  const shared = { id: 'template-2', name: 'Keep me', block: { kind: 'card' }, created_at: '2026-10-29T00:00:00Z', updated_at: '2026-10-29T00:00:00Z' };
  const editorApi = { getSession: vi.fn(async () => ({ email: 'admin@example.com', isAdmin: true })), listTemplates: vi.fn(async () => [shared]), deleteTemplate: vi.fn(async () => false) };
  const serverPanel = document.createElement('aside'); document.body.append(serverPanel);
  const serverDispose = mountCreativeStudio({ panel: serverPanel, root, getDraft: () => draft, saveHistory, applyChange, say, getSelected: () => selected, aiWrite, editorApi });
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  try {
   await vi.waitFor(() => expect(serverPanel.textContent).toContain('Keep me'));
   Array.from(serverPanel.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Delete')?.click();
   await vi.waitFor(() => expect(editorApi.deleteTemplate).toHaveBeenCalledWith('template-2'));
   await vi.waitFor(() => expect(serverPanel.textContent).toContain('already removed'));
   expect(serverPanel.textContent).toContain('Keep me');
  } finally { confirmSpy.mockRestore(); serverDispose(); serverPanel.remove(); }
 });

 it('restores token styles on teardown', () => {
  root.style.setProperty('--ggmc-accent', '#abcdef');
  dispose?.();
  expect(root.style.getPropertyValue('--ggmc-accent')).toBe('');
  expect(document.querySelector('[data-ggmc-feature="creative-studio-tokens"]')).toBeNull();
 });
});

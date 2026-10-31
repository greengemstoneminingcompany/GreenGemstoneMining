import { describe, expect, it } from 'vitest';
import { createComponent, createPageBuilderDocument, duplicatePage, moveComponent, uniqueSlug } from './pageBuilder';

describe('page builder document', () => {
 it('creates a protected editable home page', () => {
  const documentModel = createPageBuilderDocument();
  expect(documentModel.pages[0]).toMatchObject({ name: 'Home', slug: 'home', protected: true });
  expect(documentModel.pages[0].components[0].kind).toBe('hero');
 });
 it('duplicates pages with distinct route identity', () => {
  const original = createPageBuilderDocument(); const next = duplicatePage(original, original.pages[0].id);
  expect(next.pages).toHaveLength(2); expect(next.pages[1].slug).not.toBe(original.pages[0].slug); expect(next.pages[1].protected).toBe(false);
 });
 it('keeps locked components in place and reorders editable components', () => {
  const locked = { ...createComponent('section'), locked: true }; const movable = createComponent('card');
  expect(moveComponent([locked, movable], locked.id, 1)).toEqual([locked, movable]);
  expect(moveComponent([locked, movable], movable.id, 0).map(item => item.id)).toEqual([movable.id, locked.id]);
 });
 it('creates a unique safe slug', () => expect(uniqueSlug([{ slug: 'about' } as never], 'About')).toBe('about-2'));
});

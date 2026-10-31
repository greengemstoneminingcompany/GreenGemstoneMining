/**
 * Structured data model for the Visual Builder.
 *
 * The editor must work with data rather than arbitrary DOM mutations: this lets
 * pages be created, reordered, versioned and safely published.  Protected
 * system components remain in the application; editable pages are composed
 * from the component records below.
 */
export const PAGE_BUILDER_VERSION = 1 as const;

export const COMPONENT_KINDS = [
  'hero', 'section', 'heading', 'richText', 'image', 'video', 'button',
  'card', 'cardGrid', 'gallery', 'contactForm', 'map', 'divider', 'spacer',
] as const;
export type ComponentKind = typeof COMPONENT_KINDS[number];

export type ResponsiveValue<T> = T | { desktop?: T; tablet?: T; mobile?: T };

export interface ComponentStyle {
  background?: string;
  color?: string;
  accent?: string;
  fontFamily?: string;
  fontSize?: ResponsiveValue<number>;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  padding?: ResponsiveValue<number>;
  margin?: ResponsiveValue<number>;
  gap?: ResponsiveValue<number>;
  radius?: number;
  columns?: ResponsiveValue<number>;
  minHeight?: ResponsiveValue<number>;
  shadow?: boolean;
  responsive?: Partial<Record<'desktop' | 'tablet' | 'mobile', { fontSize?: number; padding?: number; columns?: number }>>;
}

export interface BuilderComponent {
  id: string;
  kind: ComponentKind;
  name: string;
  locked?: boolean;
  visible?: boolean;
  props: Record<string, string | number | boolean | string[]>;
  style: ComponentStyle;
  children?: BuilderComponent[];
}

export interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  seo: { title: string; description: string };
  protected?: boolean;
  components: BuilderComponent[];
}

export interface PageBuilderDocument {
  version: typeof PAGE_BUILDER_VERSION;
  pages: BuilderPage[];
  activePageId: string;
  updatedAt: string;
  globals?: { headerText?: string; footerText?: string; navigation?: string[]; background?: string; color?: string; fontFamily?: 'system-ui' | 'Georgia' | 'Arial' };
}

const safeId = () => globalThis.crypto?.randomUUID?.() ?? `builder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const emptyStyle = (): ComponentStyle => ({});

export function createComponent(kind: ComponentKind, name: string = kind): BuilderComponent {
  return { id: safeId(), kind, name, visible: true, props: {}, style: emptyStyle(), children: kind === 'section' || kind === 'cardGrid' ? [] : undefined };
}

export function createPage(name = 'Untitled page', slug = 'untitled-page'): BuilderPage {
  return { id: safeId(), name, slug: slugify(slug), status: 'draft', seo: { title: name, description: '' }, components: [createComponent('hero', 'Hero section')] };
}

export function createPageBuilderDocument(): PageBuilderDocument {
  const home = createPage('Home', 'home');
  home.protected = true;
  return { version: PAGE_BUILDER_VERSION, pages: [home], activePageId: home.id, updatedAt: new Date().toISOString() };
}

export function slugify(input: string): string {
  const result = input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return result.slice(0, 80) || 'untitled-page';
}

export function duplicatePage(document: PageBuilderDocument, pageId: string): PageBuilderDocument {
  const source = document.pages.find((page) => page.id === pageId);
  if (!source) return document;
  const page = structuredClone(source);
  page.id = safeId(); page.name = `${source.name} copy`; page.slug = uniqueSlug(document.pages, `${source.slug}-copy`); page.status = 'draft'; page.protected = false;
  return { ...document, pages: [...document.pages, page], activePageId: page.id, updatedAt: new Date().toISOString() };
}

export function uniqueSlug(pages: BuilderPage[], preferred: string): string {
  const base = slugify(preferred); const used = new Set(pages.map((page) => page.slug));
  if (!used.has(base)) return base;
  for (let number = 2; number < 1000; number += 1) if (!used.has(`${base}-${number}`)) return `${base}-${number}`;
  return `${base}-${safeId().slice(0, 8)}`;
}

export function moveComponent(components: BuilderComponent[], id: string, targetIndex: number): BuilderComponent[] {
  const index = components.findIndex((component) => component.id === id);
  if (index < 0 || components[index].locked) return components;
  const next = [...components]; const [component] = next.splice(index, 1);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, component);
  return next;
}

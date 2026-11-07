// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Gallery from './Gallery';
import { getSupabase, type MediaUpload } from '@/lib/supabase';
vi.mock('@/lib/supabase', () => ({ getSupabase: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const uploads = [
  { id: 'photo', title: 'Field sample', media_type: 'image', public_url: 'https://example.com/sample.jpg', is_active: true },
  { id: 'video', title: 'Field video', media_type: 'video', public_url: 'https://example.com/sample.mp4', is_active: true },
  { id: 'hidden', title: 'Unpublished media', media_type: 'image', public_url: 'https://example.com/private.jpg', is_active: false },
] as MediaUpload[];
function mockGallery() {
  const tables: Record<string, unknown[]> = {
    gallery_folders: [ { id: 'samples', name: 'Samples', parent_id: null, sort_order: 0 } ],
    gallery_folder_media: [
      { folder_id: 'samples', media_id: 'photo', sort_order: 0 },
      { folder_id: 'samples', media_id: 'video', sort_order: 1 },
      { folder_id: 'samples', media_id: 'hidden', sort_order: 2 },
    ],
    gallery_folder_covers: [ { folder_id: 'samples', media_id: 'photo' } ],
  };
  const client = { from: vi.fn((name: string) => ({ select: vi.fn(() => {
    const result = { data: tables[name] ?? [], error: null };
    return name === 'gallery_folders' ? { order: vi.fn().mockResolvedValue(result) } : Promise.resolve(result);
  }) })) };
  vi.mocked(getSupabase).mockResolvedValue(client as unknown as NonNullable<Awaited<ReturnType<typeof getSupabase>>>);
}
describe('published gallery folder media', () => {
  it('shows assigned photos and videos in a folder and table, excluding unpublished media', async () => {
    mockGallery(); render(<Gallery uploads={uploads} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Samples' }));
    expect(await screen.findByRole('button', { name: 'Field sample' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Video Field video' })).toBeTruthy();
    expect(screen.queryByText('Unpublished media')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Table', exact: true }));
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Field video' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Samples' })).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });
  it('opens a video, supports Escape and restores focus', async () => {
    mockGallery(); render(<Gallery uploads={uploads} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Samples' }));
    const button = await screen.findByRole('button', { name: 'Video Field video' }); button.focus(); fireEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: 'Field video' });
    expect(dialog.querySelector('video')?.getAttribute('src')).toBe('https://example.com/sample.mp4');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });
  it('reports an unavailable gallery without inventing media', async () => {
    vi.mocked(getSupabase).mockResolvedValue(null);
    render(<Gallery uploads={uploads} />);
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Gallery folders are unavailable until Supabase is configured.');
    expect(screen.queryByText('Field sample')).toBeNull();
  });
});

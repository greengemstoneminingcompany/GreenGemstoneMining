// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import MediaPanel from './MediaPanel';

afterEach(cleanup);
it('selects an uploaded image URL and filters video assets in image selection mode', async () => {
 const rows = [
  { id: 'image', title: 'Uploaded image', media_type: 'image', public_url: 'https://example.com/photo.webp', category: 'gallery', storage_path: 'gallery/photo.webp', is_active: true },
  { id: 'video', title: 'Uploaded video', media_type: 'video', public_url: 'https://example.com/movie.mp4', category: 'gallery', storage_path: 'gallery/movie.mp4', is_active: true },
 ];
 const client = { from: () => ({ select: () => ({ order: async () => ({ data: rows, error: null }) }) }) } as unknown as SupabaseClient;
 const onSelect = vi.fn();
 render(<MediaPanel open onClose={vi.fn()} onUploaded={vi.fn()} selectionType="image" onSelect={onSelect} admin={{ client, isAdmin: true, checking: false, email: 'test@example.com', signIn: vi.fn(), signOut: vi.fn() }} />);
 fireEvent.click(await screen.findByRole('button', { name: 'Use Uploaded image' }));
 expect(onSelect).toHaveBeenCalledWith(rows[0]);
 expect(screen.queryByRole('button', { name: 'Use Uploaded video' })).toBeNull();
});

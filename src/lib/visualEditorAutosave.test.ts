import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServerAutosaveController } from './visualEditorAutosave.js';

describe('createServerAutosaveController', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  type ServerAutosaveResult = { id: string; version: number; status: 'draft' | 'published' | 'archived' };
  type ServerAutosaveState = { id: string | null; version: number; status: 'draft' | 'published' | 'archived' };
  type SaveDraft = (input: { id: string | null; expectedVersion: number; name: string; payload: unknown }) => Promise<ServerAutosaveResult>;

  function setup(saveDraft: SaveDraft = vi.fn(async (input: { id: string | null; expectedVersion: number; name: string; payload: unknown }) => ({
    id: input.id || 'draft-1',
    version: input.expectedVersion + 1,
    status: 'draft' as const,
  }))) {
    const state: ServerAutosaveState = { id: 'draft-1', version: 4, status: 'draft' };
    let draft: Record<string, unknown> = { title: 'Initial title' };
    let name = 'Exploration draft';
    let dirty = true;
    let conflict = false;
    const say = vi.fn();
    const persistServerState = vi.fn();
    const api = { getSession: vi.fn(async () => ({ isAdmin: true })), saveDraft };
    const controller = createServerAutosaveController({
      delay: 1800,
      getApi: () => api,
      getDraft: () => draft,
      getState: () => ({ ...state }),
      setId: (id: string) => { state.id = id; },
      setVersion: (version: number) => { state.version = version; },
      setStatus: (status: 'draft' | 'published' | 'archived') => { state.status = status; },
      getName: () => name,
      isDirty: () => dirty,
      setDirty: (value: boolean) => { dirty = value; },
      isConflict: () => conflict,
      setConflict: (value: boolean) => { conflict = value; },
      copySnapshot: (value: Record<string, unknown>) => JSON.parse(JSON.stringify(value)),
      persistServerState,
      say,
    });
    return {
      state, api, controller, say, persistServerState,
      getDraft: () => draft,
      setDraft: (value: Record<string, unknown>) => { draft = value; },
      setName: (value: string) => { name = value; },
      getName: () => name,
      setDirty: (value: boolean) => { dirty = value; },
      isDirty: () => dirty,
      isConflict: () => conflict,
    };
  }

  it('debounces changes and saves the current draft name with an expected version', async () => {
    const ctx = setup();
    ctx.controller.schedule();
    ctx.controller.schedule();
    expect(ctx.api.saveDraft).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1799);
    expect(ctx.api.saveDraft).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(ctx.api.saveDraft).toHaveBeenCalledTimes(1);
    expect(ctx.api.saveDraft).toHaveBeenCalledWith({
      id: 'draft-1',
      expectedVersion: 4,
      name: 'Exploration draft',
      payload: { title: 'Initial title' },
    });
    expect(ctx.state.version).toBe(5);
    expect(ctx.isDirty()).toBe(false);
    expect(ctx.say).toHaveBeenLastCalledWith('Server autosaved version 5.');
  });

  it('creates the first server draft when no server draft id exists', async () => {
    const ctx = setup(vi.fn(async (input: { id: string | null; expectedVersion: number; name: string; payload: unknown }) => ({ id: 'new-draft', version: 1, status: 'draft' as const })));
    ctx.state.id = null; ctx.state.version = 0;
    ctx.controller.schedule(); await vi.advanceTimersByTimeAsync(1800);
    expect(ctx.api.saveDraft).toHaveBeenCalledWith({ id: null, expectedVersion: 0, name: 'Exploration draft', payload: { title: 'Initial title' } });
    expect(ctx.state.id).toBe('new-draft'); expect(ctx.state.version).toBe(1);
  });

  it('does not begin a server write when disposed while the session check is pending', async () => {
    let resolveSession!: (value: { isAdmin: boolean }) => void;
    const ctx = setup();
    ctx.api.getSession.mockImplementation(() => new Promise(resolve => { resolveSession = resolve; }));
    const running = ctx.controller.run(); await Promise.resolve();
    ctx.controller.dispose(); resolveSession({ isAdmin: true }); await running;
    expect(ctx.api.saveDraft).not.toHaveBeenCalled();
    expect(ctx.persistServerState).not.toHaveBeenCalled();
  });

  it('pauses on a version conflict instead of retrying and overwriting newer work', async () => {
    const saveDraft = vi.fn(async () => { throw new Error('Draft version conflict: expected version 4'); });
    const ctx = setup(saveDraft);
    ctx.controller.schedule();
    await vi.advanceTimersByTimeAsync(1800);
    await vi.advanceTimersByTimeAsync(3600);

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(ctx.isConflict()).toBe(true);
    expect(ctx.say).toHaveBeenLastCalledWith(expect.stringContaining('protect newer server changes'));
    expect(ctx.isDirty()).toBe(true);
  });

  it('waits for a valid draft name instead of silently renaming a draft', async () => {
    const ctx = setup();
    ctx.setName('   ');
    ctx.controller.schedule();
    await vi.advanceTimersByTimeAsync(2000);
    expect(ctx.api.saveDraft).not.toHaveBeenCalled();
    expect(ctx.isDirty()).toBe(true);
  });

  it('does not save when the draft is clean or is already published', async () => {
    const ctx = setup();
    ctx.setDirty(false);
    ctx.controller.schedule();
    await vi.advanceTimersByTimeAsync(2000);
    expect(ctx.api.saveDraft).not.toHaveBeenCalled();

    ctx.setDirty(true);
    ctx.state.status = 'published';
    ctx.controller.schedule();
    await vi.advanceTimersByTimeAsync(2000);
    expect(ctx.api.saveDraft).not.toHaveBeenCalled();
  });

  it('keeps newer content and name dirty when they change during an in-flight save', async () => {
    let resolveSave!: (value: { id: string; version: number; status: 'draft' }) => void;
    const saveDraft = vi.fn(() => new Promise<{ id: string; version: number; status: 'draft' }>(resolve => { resolveSave = resolve; }));
    const ctx = setup(saveDraft);
    const running = ctx.controller.run();
    await Promise.resolve();
    await Promise.resolve();

    ctx.setDraft({ title: 'Changed while saving' });
    ctx.setName('Renamed while saving');
    ctx.controller.schedule();
    resolveSave({ id: 'draft-1', version: 5, status: 'draft' });
    await running;

    expect(ctx.isDirty()).toBe(true);
    expect(ctx.state.version).toBe(5);
    expect(vi.getTimerCount()).toBe(1);
  });
});

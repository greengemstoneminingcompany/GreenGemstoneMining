/**
 * Conflict-safe autosave coordinator for the standalone visual editor shell.
 * Keeps debounce/in-flight coordination outside the DOM-heavy editor script.
 */
export function createServerAutosaveController(options) {
  const delay = Number.isFinite(options.delay) && options.delay >= 0 ? options.delay : 1800;
  let timer = null;
  let inFlight = false;
  let pending = false;
  let disposed = false;

  const isEligible = () => {
    const state = options.getState();
    const name = options.getName();
    return !disposed && options.isDirty() &&
      state.status === 'draft' &&
      (state.id === null || typeof state.id === 'string') &&
      Number.isInteger(state.version) && state.version >= 0 &&
      (state.id !== null || state.version === 0) &&
      typeof name === 'string' && name.trim().length >= 1 && name.length <= 120 &&
      !options.isConflict();
  };

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const cancel = () => { clearTimer(); pending = false; };

  const schedule = () => {
    if (!isEligible()) return;
    if (inFlight) { pending = true; return; }
    clearTimer();
    timer = setTimeout(() => { timer = null; void run(); }, delay);
  };

  async function run() {
    clearTimer();
    if (!isEligible() || inFlight) {
      if (inFlight && isEligible()) pending = true;
      return;
    }
    const stateAtStart = options.getState();
    const draftId = stateAtStart.id;
    const expectedVersion = stateAtStart.version;
    const nameAtStart = options.getName();
    const snapshot = options.copySnapshot(options.getDraft());
    const api = options.getApi();
    if (!api?.getSession || !api?.saveDraft) {
      options.say('Server drafts are not connected on this preview. Your browser draft remains saved locally.');
      return;
    }

    inFlight = true;
    pending = false;
    try {
      const session = await api.getSession();
      if (disposed) return;
      if (!session?.isAdmin) throw new Error('Server autosave paused because this session is not an authorised editor. Sign in again; your browser draft remains saved locally.');

      const currentState = options.getState();
      if (currentState.id !== draftId || currentState.version !== expectedVersion || currentState.status !== 'draft') return;
      if (disposed) return;

      const result = await api.saveDraft({ id: draftId, expectedVersion, name: nameAtStart, payload: snapshot });
      if (disposed) return;
      if (!result || typeof result.id !== 'string' || !Number.isInteger(result.version)) {
        throw new Error('Autosave returned an unexpected draft. Use Save server draft to review the server state.');
      }
      const latestState = options.getState();
      if (latestState.id !== draftId || latestState.version !== expectedVersion) return;

      options.setId(result.id);
      options.setVersion(result.version);
      options.setStatus(result.status);
      options.persistServerState();
      const changedDuringSave = JSON.stringify(snapshot) !== JSON.stringify(options.getDraft()) || options.getName() !== nameAtStart;
      options.setDirty(changedDuringSave);
      options.say(changedDuringSave
        ? 'Server autosave saved a version; newer edits are waiting to save…'
        : 'Server autosaved version ' + result.version + '.');
      if (changedDuringSave) pending = true;
    } catch (error) {
      if (disposed) return;
      const message = error instanceof Error ? error.message : 'Server autosave failed.';
      if (/version|conflict|changed since|expected/i.test(message)) {
        options.setConflict(true);
        options.say('Autosave paused to protect newer server changes. Export or copy local edits first, then refresh server drafts and load the latest version before reconciling changes.');
      } else {
        options.say('Server autosave could not complete: ' + message + '. Your browser draft is still saved locally.');
      }
    } finally {
      inFlight = false;
      if (!disposed && pending && isEligible()) { pending = false; schedule(); }
    }
  }

  return { schedule, cancel, dispose() { cancel(); disposed = true; }, isInFlight: () => inFlight, run };
}

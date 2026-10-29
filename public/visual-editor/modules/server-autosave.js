export function createServerAutosaveController(options) {
  let timer = null;
  let inFlight = false;
  let pending = false;
  let cancelled = false;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    if (cancelled || !options.isDirty() || options.isConflict()) return;
    if (inFlight) {
      pending = true;
      return;
    }
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      void save();
    }, Math.max(250, Number(options.delay) || 1800));
  };

  const save = async () => {
    if (inFlight || cancelled || !options.isDirty() || options.isConflict()) return;
    const state = options.getState();
    if (state.status !== 'draft') return;
    const api = options.getApi();
    if (!api?.saveDraft) return;

    inFlight = true;
    pending = false;
    const payload = options.copySnapshot(options.getDraft());
    const name = options.getName();
    try {
      const session = await api.getSession?.();
      if (session?.isAdmin !== true) {
        options.say('Sign in with an authorised editor account to save changes to the server. Your local draft is preserved.');
        return;
      }
      const result = await api.saveDraft({
        id: state.id,
        expectedVersion: state.version,
        name,
        payload,
      });
      if (!result || typeof result.id !== 'string' || !Number.isInteger(result.version)) {
        throw new Error('The server returned an invalid draft response.');
      }
      options.setId(result.id);
      options.setVersion(result.version);
      options.setStatus(result.status || 'draft');
      const changedDuringSave =
        JSON.stringify(options.getDraft()) !== JSON.stringify(payload) ||
        options.getName() !== name;
      options.setDirty(changedDuringSave);
      options.persistServerState();
      options.say(changedDuringSave
        ? 'Server draft saved. Newer edits are waiting to save…'
        : 'Server autosaved version ' + result.version + '.');
      if (changedDuringSave) pending = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || 'Unknown save error');
      if (/conflict|version|concurrent|stale/i.test(message)) {
        options.setConflict(true);
        options.say('Save conflict: the server draft changed elsewhere. Your local edits are preserved; load the latest server draft before saving again.');
      } else {
        options.say('Server autosave failed. Your local edits are preserved. ' + message);
      }
    } finally {
      inFlight = false;
      if (pending && !cancelled && options.isDirty() && !options.isConflict()) schedule();
    }
  };

  return {
    schedule,
    cancel() {
      clearTimer();
      pending = false;
    },
    dispose() {
      clearTimer();
      pending = false;
      cancelled = true;
    },
    isInFlight() {
      return inFlight;
    },
  };
}

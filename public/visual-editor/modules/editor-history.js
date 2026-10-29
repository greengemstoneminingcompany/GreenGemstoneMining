export function createEditorHistory(options) {
  const undo = [];
  const redo = [];
  const pushSnapshot = snapshot => {
    undo.push(options.copy(snapshot));
    if (undo.length > 60) undo.shift();
    redo.length = 0;
  };
  const saveHistory = () => pushSnapshot(options.getDraft());

  const undoChange = () => {
    options.flushActiveText();
    if (!undo.length) return options.say('Nothing to undo.');
    redo.push(options.copy(options.getDraft()));
    options.setDraft(undo.pop());
    options.setDirty(true);
    options.persist();
    options.refresh();
    options.renderLayers();
    const selected = options.getSelected();
    if (selected && document.contains(selected)) options.inspect(selected);
    else options.inspect(null);
    options.say('Undid the previous change.');
  };

  const redoChange = () => {
    options.flushActiveText();
    if (!redo.length) return options.say('Nothing to redo.');
    undo.push(options.copy(options.getDraft()));
    options.setDraft(redo.pop());
    options.setDirty(true);
    options.persist();
    options.refresh();
    options.renderLayers();
    const selected = options.getSelected();
    if (selected && document.contains(selected)) options.inspect(selected);
    else options.inspect(null);
    options.say('Restored the next change.');
  };

  return {
    saveHistory,
    pushSnapshot,
    undo: undoChange,
    redo: redoChange,
    clear() { undo.length = 0; redo.length = 0; },
  };
}

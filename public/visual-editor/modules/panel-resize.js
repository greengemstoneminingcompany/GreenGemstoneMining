export function createPanelResizer(panel, lifetime) {
  const addHandle = (className, title, axes) => {
    const handle = document.createElement('div');
    handle.className = className;
    handle.title = title;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-label', title);
    handle.tabIndex = 0;
    handle.setAttribute('aria-orientation', axes.includes('x') ? 'vertical' : 'horizontal');

    handle.addEventListener('keydown', event => {
      const rect = panel.getBoundingClientRect();
      let changed = false;
      if (axes.includes('x') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const delta = event.key === 'ArrowRight' ? 16 : -16;
        panel.style.width = Math.max(280, Math.min(window.innerWidth * .82, rect.width + delta)) + 'px';
        changed = true;
      }
      if (axes.includes('y') && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        const delta = event.key === 'ArrowDown' ? 16 : -16;
        panel.style.height = Math.max(260, Math.min(window.innerHeight - 24, rect.height + delta)) + 'px';
        panel.style.bottom = 'auto';
        changed = true;
      }
      if (changed) {
        event.preventDefault();
        persistSize();
      }
    }, { signal: lifetime.signal });

    handle.addEventListener('mousedown', event => {
      event.preventDefault();
      const startX = event.clientX, startY = event.clientY, rect = panel.getBoundingClientRect();
      const move = ev => {
        const left = panel.classList.contains('ve-left');
        const width = Math.max(280, Math.min(window.innerWidth * .82, rect.width + (left ? ev.clientX - startX : startX - ev.clientX)));
        const height = Math.max(260, Math.min(window.innerHeight - 24, rect.height + (startY - ev.clientY)));
        if (axes.includes('x')) panel.style.width = width + 'px';
        if (axes.includes('y')) { panel.style.height = height + 'px'; panel.style.bottom = 'auto'; }
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        persistSize();
      };
      document.addEventListener('mousemove', move, { signal: lifetime.signal });
      document.addEventListener('mouseup', up, { signal: lifetime.signal });
    }, { signal: lifetime.signal });
    panel.append(handle);
  };

  const persistSize = () => {
    try {
      localStorage.setItem('ggmc-ve-width', panel.style.width);
      localStorage.setItem('ggmc-ve-height', panel.style.height);
    } catch {}
  };

  const restore = () => {
    try {
      const width = localStorage.getItem('ggmc-ve-width');
      const height = localStorage.getItem('ggmc-ve-height');
      if (width && parseFloat(width) >= 280) panel.style.width = width;
      if (height && parseFloat(height) >= 260) { panel.style.height = height; panel.style.bottom = 'auto'; }
    } catch {}
  };

  return { addHandle, restore };
}

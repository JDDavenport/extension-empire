(function() {
  if (document.getElementById('qn-sticky')) return;

  const url = window.location.href.split('?')[0];
  let noteData = { text: '', x: 20, y: 20, color: '#FFF9C4' };

  chrome.runtime.sendMessage({ type: 'GET_NOTE', url }, saved => {
    if (saved) noteData = { ...noteData, ...saved };
    createNote();
  });

  function createNote() {
    const wrapper = document.createElement('div');
    wrapper.id = 'qn-sticky';
    wrapper.innerHTML = `
      <div id="qn-header">
        <span>📝 Quick Note</span>
        <div>
          <button id="qn-minimize" title="Minimize">−</button>
          <button id="qn-close" title="Close">×</button>
        </div>
      </div>
      <textarea id="qn-textarea" placeholder="Type your note...">${noteData.text}</textarea>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #qn-sticky { position: fixed; top: ${noteData.y}px; left: ${noteData.x}px; width: 260px; min-height: 180px; background: ${noteData.color}; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.15); z-index: 2147483647; font-family: -apple-system, system-ui, sans-serif; }
      #qn-header { padding: 8px 10px; cursor: grab; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: #555; user-select: none; }
      #qn-header button { background: none; border: none; cursor: pointer; font-size: 16px; color: #888; padding: 0 4px; }
      #qn-header button:hover { color: #333; }
      #qn-textarea { width: 100%; min-height: 140px; border: none; background: transparent; resize: vertical; padding: 0 12px 12px; font-size: 13px; line-height: 1.5; color: #333; outline: none; font-family: inherit; }
      #qn-sticky.minimized #qn-textarea { display: none; }
      #qn-sticky.minimized { min-height: auto; width: auto; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(wrapper);

    // Drag
    const header = wrapper.querySelector('#qn-header');
    let dragging = false, dx, dy;
    header.addEventListener('mousedown', e => { dragging = true; dx = e.clientX - wrapper.offsetLeft; dy = e.clientY - wrapper.offsetTop; });
    document.addEventListener('mousemove', e => { if (!dragging) return; wrapper.style.left = (e.clientX - dx) + 'px'; wrapper.style.top = (e.clientY - dy) + 'px'; });
    document.addEventListener('mouseup', () => { if (dragging) { dragging = false; save(); } });

    // Save on input
    const textarea = wrapper.querySelector('#qn-textarea');
    let saveTimer;
    textarea.addEventListener('input', () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); });

    // Minimize
    wrapper.querySelector('#qn-minimize').addEventListener('click', () => wrapper.classList.toggle('minimized'));
    wrapper.querySelector('#qn-close').addEventListener('click', () => { wrapper.remove(); });

    function save() {
      chrome.runtime.sendMessage({
        type: 'SAVE_NOTE', url,
        text: textarea.value,
        x: parseInt(wrapper.style.left) || 20,
        y: parseInt(wrapper.style.top) || 20,
        color: noteData.color
      });
    }
  }
})();

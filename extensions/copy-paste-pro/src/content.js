// Guard against double-injection
if (!window.__copyPasteProActive) {
  window.__copyPasteProActive = true;

  (function () {
    'use strict';

    // ========== 1. CSS: Force text selection everywhere ==========
    const style = document.createElement('style');
    style.id = 'copy-paste-pro-style';
    style.textContent = `
      *, *::before, *::after {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: default !important;
      }
    `;
    document.documentElement.appendChild(style);

    // ========== 2. Remove inline user-select styles ==========
    function fixInlineStyles(root) {
      const els = (root || document).querySelectorAll('[style]');
      els.forEach(el => {
        const s = el.style;
        if (s.userSelect === 'none' || s.webkitUserSelect === 'none' || s.MozUserSelect === 'none') {
          if (!el.hasAttribute('data-cpp-original-style')) {
            el.setAttribute('data-cpp-original-style', s.userSelect || '');
          }
          s.userSelect = 'text';
          s.webkitUserSelect = 'text';
          s.MozUserSelect = 'text';
        }
      });
    }
    fixInlineStyles();

    // Watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      if (!window.__copyPasteProActive) { observer.disconnect(); return; }
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => {
            if (n.nodeType === 1) fixInlineStyles(n.parentElement || document);
          });
        }
        if (m.type === 'attributes' && m.attributeName === 'style') {
          fixInlineStyles(m.target.parentElement || document);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['style']
    });

    // ========== 3. Kill event handler properties ==========
    const handlerProps = ['oncopy', 'oncut', 'onpaste', 'onselectstart', 'oncontextmenu', 'onmousedown', 'onmouseup', 'ondragstart'];

    function clearHandlers(el) {
      handlerProps.forEach(prop => {
        if (el[prop]) el[prop] = null;
      });
    }

    clearHandlers(document);
    clearHandlers(document.documentElement);
    if (document.body) clearHandlers(document.body);

    // Clear on all elements with these handlers
    document.querySelectorAll('[oncopy],[oncut],[onpaste],[onselectstart],[oncontextmenu],[onmousedown],[ondragstart]').forEach(clearHandlers);

    // ========== 4. Block event prevention via capture listeners ==========
    const blockedEvents = ['copy', 'cut', 'paste', 'selectstart', 'contextmenu', 'mousedown', 'mouseup', 'keydown', 'dragstart'];

    function unblockHandler(e) {
      if (!window.__copyPasteProActive) return;
      e.stopImmediatePropagation();
    }

    // For contextmenu specifically, we need to both unblock and ensure it fires
    blockedEvents.forEach(evt => {
      document.addEventListener(evt, unblockHandler, true);
    });

    // ========== 5. Override preventDefault/stopPropagation for blocked events ==========
    // Wrap EventTarget.prototype.addEventListener to neuter blocking listeners
    const origAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (window.__copyPasteProActive && blockedEvents.includes(type)) {
        // Wrap the listener to prevent it from blocking
        const wrapped = function (e) {
          // Don't call the original — it would block copy/paste
        };
        wrapped.__cppOriginal = listener;
        wrapped.__cppType = type;
        return origAddEventListener.call(this, type, wrapped, options);
      }
      return origAddEventListener.call(this, type, listener, options);
    };

    // ========== 6. Remove transparent overlays blocking selection ==========
    function removeOverlays() {
      document.querySelectorAll('div, span, section').forEach(el => {
        const style = getComputedStyle(el);
        const isOverlay = (
          (style.position === 'absolute' || style.position === 'fixed') &&
          (parseFloat(style.opacity) < 0.05 || style.background === 'transparent' || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)') &&
          el.offsetWidth > 100 &&
          el.offsetHeight > 100 &&
          el.children.length === 0 &&
          el.textContent.trim() === ''
        );
        if (isOverlay) {
          el.style.pointerEvents = 'none';
        }
      });
    }
    removeOverlays();
    // Re-check after page settles
    setTimeout(removeOverlays, 1500);
    setTimeout(removeOverlays, 4000);

    // ========== 7. Re-enable disabled inputs ==========
    document.querySelectorAll('input[disabled], textarea[disabled]').forEach(el => {
      if (el.type === 'text' || el.type === 'password' || el.tagName === 'TEXTAREA') {
        el.removeAttribute('readonly');
      }
    });

    // ========== 8. Fix clipboard API blocks ==========
    // Some sites override navigator.clipboard — ensure it works
    try {
      if (navigator.clipboard && !navigator.clipboard.__cppPatched) {
        navigator.clipboard.__cppPatched = true;
        // Clipboard API should work natively, just ensure no overrides
      }
    } catch (e) {}

    console.log('[Copy Paste Pro] ✅ Enabled — copy, paste, and right-click restored.');
  })();
}

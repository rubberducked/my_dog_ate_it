/* ==========================================================================
   PIXEL DOG — DESTRUCTIVE TEXT EATER (src/eater.js)
   Universal text eater supporting standard inputs, password fields, protected
   elements ([data-pixel-dog-safe]), Canvas-based editors, Google Docs, Google Colab,
   CodeMirror/Monaco iframe code editors.
   ========================================================================== */

(function () {
  const perFieldBiteTimes = new WeakMap();

  // Non-text input types to skip (buttons/color/submit). Password IS explicitly allowed!
  const EXCLUDED_INPUT_TYPES = new Set([
    'hidden', 'file', 'submit', 'reset',
    'button', 'checkbox', 'radio', 'range', 'color', 'image'
  ]);

  /**
   * Snapshot candidate editable elements in the document.
   * Includes password fields, [data-pixel-dog-safe] fields, canvas editors, and iframe editors.
   */
  function findCandidates() {
    const selector = [
      'textarea',
      'input',
      'input[type="password"]',
      '[contenteditable=""]',
      '[contenteditable="true"]',
      '[data-pixel-dog-safe]',
      'canvas',
      // Google Docs Editor Selectors
      '.kix-appview',
      '.kix-page',
      '.kix-page-content',
      '.kix-canvas-tile-content',
      '.docs-editor',
      '.docs-texteventtarget-iframe',
      // Google Colab & Code Editors (CodeMirror / Monaco)
      '.cell-editor',
      '.CodeMirror',
      '.monaco-editor',
      '.cm-content',
      '.cell-element',
      '[role="textbox"]'
    ].join(', ');

    const elements = Array.from(document.querySelectorAll(selector));
    const candidates = [];

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // Extension shadow DOM check — do not eat extension's own UI elements
      const rootNode = el.getRootNode();
      if (rootNode && rootNode instanceof ShadowRoot && rootNode.host && rootNode.host.id === 'pixel-dog-root') {
        continue;
      }

      // Disabled check (Password fields and [data-pixel-dog-safe] ARE allowed)
      if (el.disabled) continue;
      if (el.tagName === 'INPUT') {
        const type = (el.type || 'text').toLowerCase();
        if (EXCLUDED_INPUT_TYPES.has(type)) continue;
      }

      // Contenteditable check: outermost editable host only (§7.1)
      if (el.isContentEditable) {
        if (el.parentElement && el.parentElement.closest('[contenteditable="true"], [contenteditable=""]')) {
          continue;
        }
      }

      // Visibility and dimensions check
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      if (rect.bottom < 0 || rect.top > viewportH || rect.right < 0 || rect.left > viewportW) continue;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      candidates.push({ element: el, rect: rect });
    }

    return candidates;
  }

  /**
   * Hit test mouth coordinates against candidate elements (§7.2).
   */
  function findElementAtMouth(mouthX, mouthY) {
    const candidates = findCandidates();
    for (let i = 0; i < candidates.length; i++) {
      const { element, rect } = candidates[i];
      if (mouthX >= rect.left && mouthX <= rect.right && mouthY >= rect.top && mouthY <= rect.bottom) {
        return element;
      }
    }
    return null;
  }

  /**
   * Perform destructive text bite on an element (20-25 character chunks).
   */
  function bite(el, now) {
    if (!el) return null;

    // Check cooldowns and bite limits
    if (now - PD_STATE.lastBiteTime < PD_CFG.biteCooldownMs) return null;
    if (PD_STATE.bitesThisRun >= PD_CFG.maxBitesPerRun) return null;

    const lastFieldBite = perFieldBiteTimes.get(el) || 0;
    if (now - lastFieldBite < PD_CFG.perFieldCooldownMs) return null;

    let eatenText = null;

    try {
      const isCustom = isCustomEditorElement(el);

      if (isCustom) {
        eatenText = biteCustomEditor(el);
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        eatenText = biteInputOrTextarea(el);
      } else if (el.isContentEditable) {
        eatenText = biteContentEditable(el);
      } else {
        eatenText = biteCustomEditor(el);
      }

      if (eatenText) {
        PD_STATE.lastBiteTime = now;
        PD_STATE.bitesThisRun++;
        perFieldBiteTimes.set(el, now);
      }
    } catch (err) {
      console.warn('Pixel Dog bite error:', err);
    }

    return eatenText;
  }

  /**
   * Check if element is a Canvas editor, Google Docs, Google Colab, or CodeMirror/Monaco editor.
   */
  function isCustomEditorElement(el) {
    if (!el) return false;
    if (el.tagName === 'CANVAS') return true;
    if (el.closest('.kix-appview, .docs-editor, .docs-texteventtarget-iframe, .kix-page, canvas')) return true;
    if (el.closest('.cell-editor, .CodeMirror, .monaco-editor, .cm-content, .cell-element')) return true;
    return false;
  }

  /**
   * Helper function to extract a word or sequence of words from text.
   * Ensures that exact eaten characters are replaced 1-to-1 with blank spaces of identical length.
   * e.g. "bang" -> eatenText: "bang", start: 13, end: 17, spaceReplacement: "    "
   */
  function extractWordTarget(text, minTarget, maxTarget) {
    if (!text || text.length === 0) return null;

    const wordRegex = /\S+/g;
    let match;
    const words = [];
    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    let startPos = 0;
    let endPos = 0;
    let eatenText = '';

    if (words.length > 0) {
      const startIndex = Math.floor(Math.random() * words.length);
      const startWord = words[startIndex];

      let endWord = startWord;
      let currentLen = startWord.word.length;

      for (let i = startIndex + 1; i < words.length; i++) {
        const nextWord = words[i];
        const candidateEnd = nextWord.end;
        const candidateLen = candidateEnd - startWord.start;
        if (candidateLen > maxTarget && currentLen >= minTarget) {
          break;
        }
        endWord = nextWord;
        currentLen = candidateLen;
        if (currentLen >= minTarget) {
          break;
        }
      }

      startPos = startWord.start;
      endPos = endWord.end;
      eatenText = text.slice(startPos, endPos);
    } else {
      const len = Math.min(text.length, Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget);
      if (len <= 0) return null;
      startPos = Math.floor(Math.random() * (text.length - len + 1));
      endPos = startPos + len;
      eatenText = text.slice(startPos, endPos);
    }

    // 1-to-1 space replacement matching exact length (preserving newlines if any)
    const spaceReplacement = eatenText.replace(/[^\r\n]/g, ' ');

    return {
      start: startPos,
      end: endPos,
      eatenText: eatenText,
      spaceReplacement: spaceReplacement
    };
  }

  /**
   * Destructive bite for <input> (including password fields) and <textarea> elements.
   * Replaces target word(s) 1-to-1 with exact blank spaces.
   */
  function biteInputOrTextarea(el) {
    const val = el.value;
    if (!val || val.length === 0) return null;

    const minTarget = PD_CFG.biteMinChars || 20;
    const maxTarget = PD_CFG.biteMaxChars || 25;

    const target = extractWordTarget(val, minTarget, maxTarget);
    if (!target || !target.eatenText) return null;

    const { start, end, eatenText, spaceReplacement } = target;
    const newVal = val.slice(0, start) + spaceReplacement + val.slice(end);

    // Caret preservation math
    let selStart = el.selectionStart;
    let selEnd = el.selectionEnd;

    // Native prototype setter
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) {
      desc.set.call(el, newVal);
    } else {
      el.value = newVal;
    }

    // Dispatch input and change events
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward'
    }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    // Restore caret position
    if (typeof selStart === 'number' && typeof selEnd === 'number') {
      try {
        el.setSelectionRange(selStart, selEnd);
      } catch (_) {}
    }

    return eatenText;
  }

  /**
   * Destructive bite for contenteditable elements.
   * Replaces target word(s) 1-to-1 with exact blank spaces.
   */
  function biteContentEditable(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.data || node.data.trim().length === 0) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    let totalLen = 0;

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      const len = currentNode.data.length;
      textNodes.push({ node: currentNode, len: len });
      totalLen += len;
    }

    if (textNodes.length === 0 || totalLen === 0) return null;

    let randomWeight = Math.random() * totalLen;
    let targetObj = textNodes[0];

    for (let i = 0; i < textNodes.length; i++) {
      if (randomWeight < textNodes[i].len) {
        targetObj = textNodes[i];
        break;
      }
      randomWeight -= textNodes[i].len;
    }

    const node = targetObj.node;
    const minTarget = PD_CFG.biteMinChars || 20;
    const maxTarget = PD_CFG.biteMaxChars || 25;

    const target = extractWordTarget(node.data, minTarget, maxTarget);
    if (!target || !target.eatenText) return null;

    const { start, end, eatenText, spaceReplacement } = target;
    const biteLen = end - start;

    if (typeof node.replaceData === 'function') {
      node.replaceData(start, biteLen, spaceReplacement);
    } else {
      node.data = node.data.slice(0, start) + spaceReplacement + node.data.slice(end);
    }

    // Dispatch input event on host
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward'
    }));

    return eatenText;
  }

  /**
   * Universal multi-strategy bite for Canvas-based editors, Google Docs, Colab, and frame editors.
   * Dispatches KeyboardEvent, InputEvent, execCommand, and prototype setters.
   */
  function biteCustomEditor(el) {
    const hiddenTextarea = el.querySelector('textarea, [contenteditable="true"], .docs-texteventtarget-iframe, canvas')
      || document.querySelector('.docs-texteventtarget-iframe iframe, iframe.docs-texteventtarget-iframe')
      || document.activeElement
      || el;

    try {
      if (hiddenTextarea && typeof hiddenTextarea.focus === 'function') {
        hiddenTextarea.focus();
      }
    } catch (_) {}

    const minTarget = PD_CFG.biteMinChars || 20;
    const maxTarget = PD_CFG.biteMaxChars || 25;
    const biteLen = Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget;

    // 1. Direct .value property slice if available (e.g. CodeMirror / Monaco hidden textareas)
    if (hiddenTextarea && hiddenTextarea.value && hiddenTextarea.value.length > 0) {
      const directEaten = biteInputOrTextarea(hiddenTextarea);
      if (directEaten) return directEaten;
    }

    // 2. Strategy A: execCommand insertText with spaces or delete
    try {
      document.execCommand('insertText', false, ' '.repeat(biteLen));
    } catch (_) {}
    for (let i = 0; i < biteLen; i++) {
      try {
        document.execCommand('delete', false, null);
      } catch (_) {}
    }

    // 3. Strategy B: InputEvent dispatching
    const inputTargets = [hiddenTextarea, document.activeElement, el, document.body];
    for (let i = 0; i < biteLen; i++) {
      inputTargets.forEach(t => {
        if (!t || typeof t.dispatchEvent !== 'function') return;
        try {
          t.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true, composed: true }));
          t.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true, composed: true }));
        } catch (_) {}
      });
    }

    // 4. Strategy C: Full Synthetic Backspace KeyboardEvent sequence (targeting window, document, canvas, and inputs)
    const keyTargets = [hiddenTextarea, document.activeElement, el, document.body, window, document];
    for (let i = 0; i < biteLen; i++) {
      const keyOpts = {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
        charCode: 0,
        bubbles: true,
        cancelable: true,
        composed: true
      };

      keyTargets.forEach(t => {
        if (!t || typeof t.dispatchEvent !== 'function') return;
        try {
          t.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
          t.dispatchEvent(new KeyboardEvent('keypress', keyOpts));
          t.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
        } catch (_) {}
      });
    }

    return '•••••••••••••••••••••';
  }

  /**
   * Spawn floating text crumb feedback at mouth position (§7.5).
   */
  function spawnCrumb(text, mouthX, mouthY, layerContainer) {
    if (!PD_CFG.showCrumbs || !text || !layerContainer) return;

    const collapsed = text.replace(/\s+/g, ' ').trim();
    if (!collapsed) return;

    const truncated = collapsed.length > 40 ? collapsed.slice(0, 37) + '...' : collapsed;

    const crumb = document.createElement('div');
    crumb.className = 'crumb';
    crumb.textContent = `-${truncated}`;
    crumb.style.left = `${mouthX}px`;
    crumb.style.top = `${mouthY}px`;

    layerContainer.appendChild(crumb);

    setTimeout(() => {
      if (crumb.parentNode) {
        crumb.parentNode.removeChild(crumb);
      }
    }, 900);
  }

  /**
   * Main eating check entrypoint called every frame of RUNNING state.
   */
  function tryEatAtMouth(mouthX, mouthY, layerContainer) {
    let el = findElementAtMouth(mouthX, mouthY);

    // Fallback: If no candidate matched exact mouth position, check if activeElement is an input/canvas/editor
    if (!el && document.activeElement && document.activeElement !== document.body) {
      el = document.activeElement;
    }

    if (!el) return null;

    const now = Date.now();
    const eatenText = bite(el, now);
    if (eatenText) {
      spawnCrumb(eatenText, mouthX, mouthY, layerContainer);
    }
    return eatenText;
  }

  // Export to shared scope
  window.PDEater = {
    findElementAtMouth: findElementAtMouth,
    bite: bite,
    tryEatAtMouth: tryEatAtMouth,
    spawnCrumb: spawnCrumb
  };
})();

/* ==========================================================================
   PIXEL DOG — OVERLAY, STATE MACHINE, DRAG-TO-FEED & RAMPAGE LOOP (src/dog.js)
   Shadow DOM overlay controller, pausable timer, cache-busting sprite loader,
   rampage movement, dev keyboard shortcuts, storage sync, and iframe support.
   ========================================================================== */

(function () {
  // Global references inside content script closure
  let hostEl = null;
  let shadowRoot = null;
  let layerEl = null;
  let dogEl = null;
  let dogWrapper = null;
  let dogImg = null;
  let bowlEl = null;
  let bowlWrapper = null;
  let bowlImg = null;
  let treatEl = null;
  let treatWrapper = null;
  let treatImg = null;
  let hintEl = null;

  let pendingTimer = null;
  let rAFId = null;
  let lastFrameTime = 0;
  let rampageWaypoints = [];
  let currentWaypointIndex = 0;

  // --------------------------------------------------------------------------
  // 1. Pausable Timer Class (§4.2 & §13)
  // --------------------------------------------------------------------------
  class PausableTimer {
    constructor(callback, delay) {
      this.callback = callback;
      this.delay = delay;
      this.remaining = delay;
      this.start = 0;
      this.timerId = null;
      this.isPaused = false;
      this.resume();
    }

    pause() {
      if (this.isPaused || !this.timerId) return;
      this.isPaused = true;
      clearTimeout(this.timerId);
      this.timerId = null;
      this.remaining -= Date.now() - this.start;
    }

    resume() {
      if (!this.isPaused && this.timerId) return;
      this.isPaused = false;
      if (this.remaining <= 0) {
        this.callback();
      } else {
        this.start = Date.now();
        this.timerId = setTimeout(() => {
          this.timerId = null;
          this.callback();
        }, this.remaining);
      }
    }

    clear() {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      this.isPaused = false;
      this.remaining = 0;
    }
  }

  // --------------------------------------------------------------------------
  // 2. GIF Cache-Busting Sprite Loader (§2.3 & §13)
  // --------------------------------------------------------------------------
  function setSprite(wrapper, img, assetPath) {
    const filename = assetPath.split('/').pop();
    wrapper.setAttribute('data-filename', filename);
    img.style.display = '';

    img.onerror = () => {
      img.style.display = 'none';
      wrapper.setAttribute('data-missing', '1');
    };
    img.onload = () => {
      wrapper.removeAttribute('data-missing');
    };

    try {
      const fullUrl = pdGetURL(assetPath) + '#t=' + Date.now();
      img.src = fullUrl;
    } catch (_) {
      img.src = assetPath + '#t=' + Date.now();
    }
  }

  // --------------------------------------------------------------------------
  // 3. Shadow DOM & Element Construction (§3.1)
  // --------------------------------------------------------------------------
  function createOverlay() {
    if (!PD_IS_TOP_FRAME) return; // Only top frame creates visual overlay
    if (document.getElementById('pixel-dog-root')) return;

    const parent = document.body || document.documentElement;
    if (!parent) return;

    hostEl = document.createElement('div');
    hostEl.id = 'pixel-dog-root';
    hostEl.style.cssText = 'all:initial!important;position:fixed!important;top:0!important;left:0!important;width:0!important;height:0!important;z-index:2147483647!important;pointer-events:none!important;contain:layout style!important;';

    parent.appendChild(hostEl);

    // Closed shadow root (§3.1)
    shadowRoot = hostEl.attachShadow({ mode: 'closed' });

    // Internal Shadow DOM CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      *, *::before, *::after {
        box-sizing: border-box;
      }
      .layer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        overflow: hidden;
        z-index: 2147483647;
      }
      #dog, #bowl, #treat {
        position: absolute;
        top: 0;
        left: 0;
        user-select: none;
        -webkit-user-drag: none;
        transform-origin: top left;
        will-change: transform;
      }
      #dog {
        pointer-events: none;
        transition: filter 0.2s ease-in-out;
      }
      #dog.glow {
        filter: drop-shadow(0 0 10px #ffb700) drop-shadow(0 0 18px #ff7700);
      }
      #bowl {
        pointer-events: auto;
        cursor: grab;
      }
      #bowl:active {
        cursor: grabbing;
      }
      #treat {
        pointer-events: none;
        display: none;
        z-index: 2147483647;
      }
      .sprite-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .sprite-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        display: block;
      }
      .sprite-wrapper[data-missing="1"] {
        border: 2px dashed #ff4444;
        background: rgba(255, 68, 68, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-family: monospace, sans-serif;
        font-size: 10px;
        font-weight: bold;
        color: #cc0000;
        padding: 4px;
        overflow: hidden;
        word-break: break-all;
      }
      .sprite-wrapper[data-missing="1"]::after {
        content: attr(data-filename);
      }
      .hint {
        position: absolute;
        font-family: 'Courier New', monospace, sans-serif;
        font-size: 12px;
        font-weight: bold;
        background: #ffffff;
        color: #111111;
        padding: 4px 8px;
        border-radius: 6px;
        border: 2px solid #111111;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        transform: translate(-50%, -100%);
        z-index: 2147483647;
      }
      .crumb {
        position: absolute;
        font-family: monospace, sans-serif;
        font-size: 11px;
        font-weight: bold;
        color: #ff3333;
        background: rgba(0, 0, 0, 0.85);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #ff3333;
        pointer-events: none;
        white-space: nowrap;
        transform: translate(-50%, -100%);
        animation: crumbFloat 0.9s ease-out forwards;
        z-index: 2147483647;
      }
      @keyframes crumbFloat {
        0% {
          opacity: 1;
          transform: translate(-50%, -100%) translateY(0);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -100%) translateY(-24px);
        }
      }
      .falling-treat {
        position: absolute;
        top: 0;
        left: 0;
        user-select: none;
        -webkit-user-drag: none;
        pointer-events: none;
        transform-origin: center center;
        z-index: 2147483646;
      }
    `;
    shadowRoot.appendChild(styleEl);

    layerEl = document.createElement('div');
    layerEl.className = 'layer';

    function buildSpriteNode(id, size) {
      const el = document.createElement('div');
      el.id = id;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      const wrapper = document.createElement('div');
      wrapper.className = 'sprite-wrapper';

      const img = document.createElement('img');
      img.alt = id;

      wrapper.appendChild(img);
      el.appendChild(wrapper);
      return { container: el, wrapper: wrapper, img: img };
    }

    const dogNode = buildSpriteNode('dog', PD_CFG.dogSize);
    dogEl = dogNode.container;
    dogWrapper = dogNode.wrapper;
    dogImg = dogNode.img;

    const bowlNode = buildSpriteNode('bowl', PD_CFG.bowlSize);
    bowlEl = bowlNode.container;
    bowlWrapper = bowlNode.wrapper;
    bowlImg = bowlNode.img;

    const treatNode = buildSpriteNode('treat', PD_CFG.treatSize);
    treatEl = treatNode.container;
    treatWrapper = treatNode.wrapper;
    treatImg = treatNode.img;

    hintEl = document.createElement('div');
    hintEl.className = 'hint';
    hintEl.textContent = 'feed me!';

    layerEl.appendChild(dogEl);
    layerEl.appendChild(bowlEl);
    layerEl.appendChild(treatEl);
    layerEl.appendChild(hintEl);
    shadowRoot.appendChild(layerEl);

    setSprite(bowlWrapper, bowlImg, PD_ASSETS.BOWL);
    setSprite(treatWrapper, treatImg, PD_ASSETS.TREAT);

    attachEventListeners();

    recomputeHomePositions();
    transitionTo('SLEEPING');
  }

  function destroyOverlay() {
    clearPendingTimer();
    stopRampageAnimation();
    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
    hostEl = null;
    shadowRoot = null;
  }

  // --------------------------------------------------------------------------
  // 4. Layout Math & Positioning (§3.3 & §3.6)
  // --------------------------------------------------------------------------
  function updateDogPos(x, y, facing) {
    PD_STATE.x = x;
    PD_STATE.y = y;
    PD_STATE.facing = facing;
    if (dogEl) {
      dogEl.style.transform = `translate(${x}px, ${y}px) scaleX(${facing})`;
    }
    if (hintEl) {
      const hintX = x + PD_CFG.dogSize / 2;
      const hintY = y - 6;
      hintEl.style.left = `${hintX}px`;
      hintEl.style.top = `${hintY}px`;
    }
  }

  function updateBowlPos(x, y) {
    PD_STATE.bowlX = x;
    PD_STATE.bowlY = y;
    if (bowlEl) {
      bowlEl.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  function updateTreatPos(clientX, clientY) {
    const half = PD_CFG.treatSize / 2;
    const tx = clientX - half;
    const ty = clientY - half;
    if (treatEl) {
      treatEl.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }

  function updateElementSizes() {
    if (dogEl) {
      dogEl.style.width = `${PD_CFG.dogSize}px`;
      dogEl.style.height = `${PD_CFG.dogSize}px`;
    }
    if (bowlEl) {
      bowlEl.style.width = `${PD_CFG.bowlSize}px`;
      bowlEl.style.height = `${PD_CFG.bowlSize}px`;
    }
    if (treatEl) {
      treatEl.style.width = `${PD_CFG.treatSize}px`;
      treatEl.style.height = `${PD_CFG.treatSize}px`;
    }
  }

  function recomputeHomePositions() {
    const dogSize = PD_CFG.dogSize;
    const bowlSize = PD_CFG.bowlSize;
    const margin = 16;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (PD_CFG.dogCorner === 'left') {
      PD_STATE.homeX = margin;
      PD_STATE.homeY = h - dogSize - margin;
      PD_STATE.bowlX = w - bowlSize - margin;
      PD_STATE.bowlY = h - bowlSize - margin;
    } else {
      PD_STATE.homeX = w - dogSize - margin;
      PD_STATE.homeY = h - dogSize - margin;
      PD_STATE.bowlX = margin;
      PD_STATE.bowlY = h - bowlSize - margin;
    }

    updateBowlPos(PD_STATE.bowlX, PD_STATE.bowlY);

    if (['SLEEPING', 'WAKING', 'ALERT', 'EATING', 'DOZING'].includes(PD_STATE.state)) {
      snapDogHome();
    } else if (PD_STATE.state === 'RUNNING' || PD_STATE.state === 'RETURNING') {
      const clampedX = Math.max(0, Math.min(w - dogSize, PD_STATE.x));
      const clampedY = Math.max(0, Math.min(h - dogSize, PD_STATE.y));
      updateDogPos(clampedX, clampedY, PD_STATE.facing);
    }
  }

  function snapDogHome() {
    updateDogPos(PD_STATE.homeX, PD_STATE.homeY, PD_STATE.facing);
  }

  function showHint(text) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.style.opacity = '1';
  }

  function hideHint() {
    if (!hintEl) return;
    hintEl.style.opacity = '0';
  }

  // --------------------------------------------------------------------------
  // 5. State Machine Control (§4)
  // --------------------------------------------------------------------------
  function clearPendingTimer() {
    if (pendingTimer) {
      pendingTimer.clear();
      pendingTimer = null;
    }
  }

  function stopRampageAnimation() {
    if (rAFId) {
      cancelAnimationFrame(rAFId);
      rAFId = null;
    }
  }

  function transitionTo(newState) {
    clearPendingTimer();
    stopRampageAnimation();
    hideHint();

    PD_STATE.state = newState;

    switch (newState) {
      case 'SLEEPING':
        PD_STATE.facing = 1;
        snapDogHome();
        setSprite(dogWrapper, dogImg, PD_ASSETS.SLEEP_LOOP);
        pendingTimer = new PausableTimer(() => transitionTo('WAKING'), PD_CFG.sleepMs);
        break;

      case 'WAKING':
        PD_STATE.facing = 1;
        snapDogHome();
        setSprite(dogWrapper, dogImg, PD_ASSETS.WAKE_LOOK);
        pendingTimer = new PausableTimer(() => transitionTo('ALERT'), PD_ONESHOT_MS.WAKE_LOOK);
        break;

      case 'ALERT':
        PD_STATE.facing = 1;
        snapDogHome();
        setSprite(dogWrapper, dogImg, PD_ASSETS.ALERT_IDLE);
        showHint('feed me!');
        pendingTimer = new PausableTimer(() => transitionTo('RUNNING'), PD_CFG.patienceMs);
        break;

      case 'RUNNING':
        startRampage();
        break;

      case 'RETURNING':
        startReturnHome();
        break;

      case 'EATING':
        snapDogHome();
        PD_STATE.facing = 1;
        setSprite(dogWrapper, dogImg, PD_ASSETS.EAT_TREAT);
        const eatDuration = PD_ONESHOT_MS.EAT_TREAT + PD_CFG.postFeedMs;
        pendingTimer = new PausableTimer(() => transitionTo('DOZING'), eatDuration);
        break;

      case 'DOZING':
        snapDogHome();
        PD_STATE.facing = 1;
        setSprite(dogWrapper, dogImg, PD_ASSETS.SLEEP_ENTER);
        pendingTimer = new PausableTimer(() => transitionTo('SLEEPING'), PD_ONESHOT_MS.SLEEP_ENTER);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // 6. Rampage Pathing & Animation Loop (§6 + Iframe Cross-Frame Messaging)
  // --------------------------------------------------------------------------
  function startRampage() {
    PD_STATE.bitesThisRun = 0;
    PD_STATE.lastBiteTime = 0;
    setSprite(dogWrapper, dogImg, PD_ASSETS.RUN_MUNCH);

    const numWaypoints = Math.floor(Math.random() * 4) + 3;
    const dogSize = PD_CFG.dogSize;
    const maxX = Math.max(0, window.innerWidth - dogSize);
    const maxY = Math.max(0, window.innerHeight - dogSize);

    rampageWaypoints = [];
    for (let i = 0; i < numWaypoints; i++) {
      rampageWaypoints.push({
        x: Math.random() * maxX,
        y: Math.random() * maxY
      });
    }
    currentWaypointIndex = 0;

    pendingTimer = new PausableTimer(() => transitionTo('RETURNING'), PD_CFG.rampageMs);

    lastFrameTime = performance.now();
    rAFId = requestAnimationFrame(rampageLoop);
  }

  function rampageLoop(timestamp) {
    if (PD_STATE.state !== 'RUNNING') return;

    let dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (dt < 0) dt = 0;
    if (dt > 50) dt = 50;

    if (currentWaypointIndex >= rampageWaypoints.length) {
      transitionTo('RETURNING');
      return;
    }

    const target = rampageWaypoints[currentWaypointIndex];
    const dx = target.x - PD_STATE.x;
    const dy = target.y - PD_STATE.y;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(dx) > 4) {
      PD_STATE.facing = dx >= 0 ? 1 : -1;
    }

    const step = (PD_CFG.runSpeed * dt) / 1000;

    if (dist <= step || dist === 0) {
      PD_STATE.x = target.x;
      PD_STATE.y = target.y;
      currentWaypointIndex++;
    } else {
      PD_STATE.x += (dx / dist) * step;
      PD_STATE.y += (dy / dist) * step;
    }

    updateDogPos(PD_STATE.x, PD_STATE.y, PD_STATE.facing);

    const dogSize = PD_CFG.dogSize;
    const mouthX = PD_STATE.x + dogSize * (PD_STATE.facing === 1 ? PD_MOUTH_ANCHOR.X_RIGHT_RATIO : PD_MOUTH_ANCHOR.X_LEFT_RATIO);
    const mouthY = PD_STATE.y + dogSize * PD_MOUTH_ANCHOR.Y_RATIO;

    // 1. Local frame eating
    PDEater.tryEatAtMouth(mouthX, mouthY, layerEl);

    // 2. Cross-iframe mouth coordinate translation & postMessage
    const iframes = document.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const rect = iframes[i].getBoundingClientRect();
        if (mouthX >= rect.left && mouthX <= rect.right && mouthY >= rect.top && mouthY <= rect.bottom) {
          const localX = mouthX - rect.left;
          const localY = mouthY - rect.top;
          iframes[i].contentWindow.postMessage({
            type: 'PD_MOU_BITE',
            mouthX: localX,
            mouthY: localY,
            topMouthX: mouthX,
            topMouthY: mouthY
          }, '*');
        }
      } catch (_) {}
    }

    rAFId = requestAnimationFrame(rampageLoop);
  }

  function startReturnHome() {
    setSprite(dogWrapper, dogImg, PD_ASSETS.RUN_MUNCH);
    lastFrameTime = performance.now();
    rAFId = requestAnimationFrame(returnHomeLoop);
  }

  function returnHomeLoop(timestamp) {
    if (PD_STATE.state !== 'RETURNING') return;

    let dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (dt < 0) dt = 0;
    if (dt > 50) dt = 50;

    const dx = PD_STATE.homeX - PD_STATE.x;
    const dy = PD_STATE.homeY - PD_STATE.y;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(dx) > 4) {
      PD_STATE.facing = dx >= 0 ? 1 : -1;
    }

    const step = (PD_CFG.runSpeed * dt) / 1000;

    if (dist <= step || dist === 0) {
      snapDogHome();
      transitionTo('DOZING');
      return;
    }

    PD_STATE.x += (dx / dist) * step;
    PD_STATE.y += (dy / dist) * step;

    updateDogPos(PD_STATE.x, PD_STATE.y, PD_STATE.facing);

    rAFId = requestAnimationFrame(returnHomeLoop);
  }

  // --------------------------------------------------------------------------
  // 7. Drag-to-Feed Interaction (§5) & Gravity Drop
  // --------------------------------------------------------------------------
  function startFallingTreat(startX, startY) {
    if (!layerEl || !treatWrapper) return;
    const fallingEl = document.createElement('div');
    fallingEl.className = 'falling-treat';
    fallingEl.style.width = `${PD_CFG.treatSize}px`;
    fallingEl.style.height = `${PD_CFG.treatSize}px`;

    const wrapper = treatWrapper.cloneNode(true);
    fallingEl.appendChild(wrapper);
    layerEl.appendChild(fallingEl);

    let currentY = startY;
    let currentX = startX;
    let vy = -80; // slight initial upward pop
    let vx = (Math.random() - 0.5) * 60; // slight horizontal drift
    let gravity = 1100; // px/s^2 acceleration
    let rotation = 0;
    let vr = (Math.random() - 0.5) * 400; // rotation deg/s
    let lastTime = performance.now();

    function animateFall(now) {
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > 0.05) dt = 0.05;

      vy += gravity * dt;
      currentY += vy * dt;
      currentX += vx * dt;
      rotation += vr * dt;

      fallingEl.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;

      if (currentY < window.innerHeight + 80) {
        requestAnimationFrame(animateFall);
      } else {
        if (fallingEl.parentNode) {
          fallingEl.parentNode.removeChild(fallingEl);
        }
      }
    }

    requestAnimationFrame(animateFall);
  }

  function attachEventListeners() {
    if (!bowlEl) return;

    bowlEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (PD_STATE.dragging) return;

      e.preventDefault();
      e.stopPropagation();

      PD_STATE.dragging = true;
      treatEl.style.display = 'block';
      updateTreatPos(e.clientX, e.clientY);

      window.addEventListener('pointermove', onPointerMove, { capture: true });
      window.addEventListener('pointerup', onPointerUp, { capture: true });
    });

    window.addEventListener('resize', () => {
      recomputeHomePositions();
    });
  }

  function onPointerMove(e) {
    if (!PD_STATE.dragging) return;
    updateTreatPos(e.clientX, e.clientY);

    const dogSize = PD_CFG.dogSize;
    const pad = 10;
    const hitLeft = PD_STATE.x - pad;
    const hitTop = PD_STATE.y - pad;
    const hitRight = PD_STATE.x + dogSize + pad;
    const hitBottom = PD_STATE.y + dogSize + pad;

    if (e.clientX >= hitLeft && e.clientX <= hitRight && e.clientY >= hitTop && e.clientY <= hitBottom) {
      dogEl.classList.add('glow');
    } else {
      dogEl.classList.remove('glow');
    }
  }

  function onPointerUp(e) {
    window.removeEventListener('pointermove', onPointerMove, { capture: true });
    window.removeEventListener('pointerup', onPointerUp, { capture: true });

    if (!PD_STATE.dragging) return;
    PD_STATE.dragging = false;

    treatEl.style.display = 'none';
    dogEl.classList.remove('glow');

    const dogSize = PD_CFG.dogSize;
    const pad = 10;
    const hitLeft = PD_STATE.x - pad;
    const hitTop = PD_STATE.y - pad;
    const hitRight = PD_STATE.x + dogSize + pad;
    const hitBottom = PD_STATE.y + dogSize + pad;

    if (e.clientX >= hitLeft && e.clientX <= hitRight && e.clientY >= hitTop && e.clientY <= hitBottom) {
      if (['WAKING', 'ALERT', 'RUNNING', 'RETURNING'].includes(PD_STATE.state)) {
        transitionTo('EATING');
      }
    } else {
      const half = PD_CFG.treatSize / 2;
      const tx = e.clientX - half;
      const ty = e.clientY - half;
      startFallingTreat(tx, ty);
    }
  }

  // --------------------------------------------------------------------------
  // 8. Visibility Change Listener (§4.2)
  // --------------------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (pendingTimer) pendingTimer.pause();
      if (rAFId) {
        cancelAnimationFrame(rAFId);
        rAFId = null;
      }
    } else {
      if (pendingTimer) pendingTimer.resume();
      if (PD_STATE.state === 'RUNNING' && !rAFId) {
        lastFrameTime = performance.now();
        rAFId = requestAnimationFrame(rampageLoop);
      } else if (PD_STATE.state === 'RETURNING' && !rAFId) {
        lastFrameTime = performance.now();
        rAFId = requestAnimationFrame(returnHomeLoop);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 9. Developer Keyboard Shortcuts (§9)
  // --------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
      if (e.key === '1' || e.code === 'Digit1') {
        e.preventDefault();
        transitionTo('WAKING');
      } else if (e.key === '2' || e.code === 'Digit2') {
        e.preventDefault();
        transitionTo('RUNNING');
      } else if (e.key === '0' || e.code === 'Digit0') {
        e.preventDefault();
        transitionTo('SLEEPING');
      }
    }
  }, { capture: true });

  // --------------------------------------------------------------------------
  // 10. Sub-Frame Message Listener (with active element fallback inside iframes)
  // --------------------------------------------------------------------------
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'PD_MOU_BITE') {
      if (typeof PDEater !== 'undefined' && PDEater.tryEatAtMouth) {
        let eaten = PDEater.tryEatAtMouth(e.data.mouthX, e.data.mouthY, null);
        if (!eaten) {
          const fallbackTarget = document.activeElement || document.querySelector('textarea, input, [contenteditable="true"], canvas, body');
          if (fallbackTarget) {
            eaten = PDEater.bite(fallbackTarget, Date.now());
          }
        }
        if (eaten && PD_IS_TOP_FRAME && layerEl) {
          PDEater.spawnCrumb(eaten, e.data.topMouthX || e.data.mouthX, e.data.topMouthY || e.data.mouthY, layerEl);
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // 11. Initialization & Settings Storage Sync (§8)
  // --------------------------------------------------------------------------
  function boot() {
    pdStorageGet(PD_DEFAULTS, (items) => {
      Object.assign(PD_CFG, items);
      if (PD_CFG.enabled && PD_IS_TOP_FRAME) {
        initOverlay();
      }
    });

    pdStorageOnChanged((changes, area) => {
      if (area !== 'local') return;

      for (const [key, change] of Object.entries(changes)) {
        PD_CFG[key] = change.newValue;
      }

      if (changes.enabled) {
        if (changes.enabled.newValue === false) {
          destroyOverlay();
        } else if (PD_IS_TOP_FRAME) {
          initOverlay();
        }
      } else if (PD_CFG.enabled && PD_IS_TOP_FRAME) {
        updateElementSizes();
        recomputeHomePositions();
      }
    });
  }

  function initOverlay() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createOverlay);
    } else {
      createOverlay();
    }
  }

  boot();
})();

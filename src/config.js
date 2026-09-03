/* ==========================================================================
   PIXEL DOG — CONFIGURATION & GLOBAL STATE (src/config.js)
   Shared scope content script. Do NOT use ES modules; do NOT attach to window.
   ========================================================================== */

// Browser API compatibility shim for Firefox (browser.*) with Chrome fallback
const pdBrowser = typeof browser !== 'undefined' ? browser : chrome;

// Top frame detection (only top frame renders overlay; sub-frames handle postMessage bites)
const PD_IS_TOP_FRAME = (window === window.top);

// --------------------------------------------------------------------------
// 1. Asset paths cavity contract (§2)
// --------------------------------------------------------------------------
const PD_ASSETS = {
  SLEEP_LOOP:  'assets/dog_sleep_loop.gif',
  WAKE_LOOK:   'assets/dog_wake_look.gif',
  ALERT_IDLE:  'assets/dog_alert_idle.gif',
  RUN_MUNCH:   'assets/dog_run_munch.gif',
  EAT_TREAT:   'assets/dog_eat_treat.gif',
  SLEEP_ENTER: 'assets/dog_sleep_enter.gif',
  BOWL:        'assets/bowl_of_treats.png',
  TREAT:       'assets/treat.png'
};

// --------------------------------------------------------------------------
// 2. One-shot GIF duration contracts (milliseconds)
// Note: Animated GIFs cannot report their duration to JS via image load events.
// State machine uses these explicit millisecond durations as transition delays.
// Documented for developers: edit these values if custom GIF lengths differ.
// --------------------------------------------------------------------------
const PD_ONESHOT_MS = {
  WAKE_LOOK: 900,
  EAT_TREAT: 1600,
  SLEEP_ENTER: 1200
};

// --------------------------------------------------------------------------
// 3. Mouth Anchor Constants
// WHY THIS LOOKS STRANGE:
// The dog authoring canvas is 192 x 192 px. The dog always faces right.
// The baseline (ground/paws) sits at y = 176 px.
// The snout/mouth anchor sits at x = 157 px, y = 119 px.
// Expressed as normalized ratios relative to the 192x192 box:
// - Mouth X ratio (facing right): 157 / 192 = 0.8177 (~0.82 across)
// - Mouth X ratio (facing left): 1.0 - 0.82 = 0.18 (when scaleX(-1) is applied)
// - Mouth Y ratio: 119 / 192 = 0.6198 (~0.62 down from top of dog container)
// These constants are used across eater.js and dog.js for biting hit-tests.
// --------------------------------------------------------------------------
const PD_MOUTH_ANCHOR = {
  X_RIGHT_RATIO: 0.82,
  X_LEFT_RATIO: 0.18,
  Y_RATIO: 0.62
};

// --------------------------------------------------------------------------
// 4. Default extension settings
// All tunable numbers live here; no magic numbers in code below.
// Updated chunk bite size: 20 to 25 characters.
// --------------------------------------------------------------------------
const PD_DEFAULTS = {
  enabled: true,
  sleepMs: 30000,
  patienceMs: 10000,
  rampageMs: 9000,
  runSpeed: 620,          // pixels per second during rampage
  biteMinChars: 20,       // minimum characters per bite (20-25)
  biteMaxChars: 25,       // maximum characters per bite (20-25)
  maxBitesPerRun: 12,
  showCrumbs: true,
  dogCorner: 'right',     // 'right' or 'left' (bowl takes opposite corner)
  dogSize: 96,            // rendered size of dog box on screen (96x96 px)
  bowlSize: 84,           // rendered size of treat bowl (84x84 px)
  treatSize: 32,          // rendered size of single treat (32x32 px)
  postFeedMs: 500,        // delay after eating finishes before dozing
  biteCooldownMs: 350,    // global cooldown between bites during rampage
  perFieldCooldownMs: 900 // per-field bite cooldown
};

// Live runtime config (initialized with defaults, updated from browser.storage.local)
const PD_CFG = Object.assign({}, PD_DEFAULTS);

// --------------------------------------------------------------------------
// 5. Shared runtime state machine object
// --------------------------------------------------------------------------
const PD_STATE = {
  state: 'SLEEPING',      // SLEEPING | WAKING | ALERT | RUNNING | RETURNING | EATING | DOZING
  x: 0,                   // current dog top-left viewport X
  y: 0,                   // current dog top-left viewport Y
  facing: 1,              // 1 = facing right, -1 = facing left (scaleX)
  dragging: false,        // true when treat drag is active
  bitesThisRun: 0,        // count of bites executed in current rampage
  lastBiteTime: 0,        // timestamp of last bite
  homeX: 0,               // dog resting home X
  homeY: 0,               // dog resting home Y
  bowlX: 0,               // bowl resting X
  bowlY: 0                // bowl resting Y
};

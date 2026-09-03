# Pixel Dog: Feed Me Or Else 🐶

A temporary Firefox extension featuring an overlay pixel-art dog that sleeps in the bottom-right corner and a bowl of treats in the bottom-left corner. Every 30 seconds the dog wakes up, stares expectantly at the user, and waits 10 seconds for a treat. If fed, he eats and goes back to sleep. If ignored, he goes on a destructive rampage across the page, eating typed text out of input fields and textareas permanently!

---

## 🚀 Installation Guide (Firefox Add-on)

1. Open Firefox browser.
2. Navigate to `about:debugging` in the address bar.
3. Click **This Firefox** on the left menu.
4. Click **Load Temporary Add-on...**
5. Select `manifest.json` from the `pixel-dog` directory.
6. The extension is now active on all open web pages!

---

## 🔄 The Product Loop & State Machine

```
[SLEEPING]  --( 30s timer )-->  [WAKING]  --( ~0.9s )-->  [ALERT]
                                                             |
            +------------------------------------------------+
            | (Drop treat)                                   | (10s unfed)
            v                                                v
        [EATING]                                         [RUNNING] (Destructive Rampage!)
            |                                                |
        [DOZING]                                         [RETURNING]
            |                                                |
            v                                                v
        [SLEEPING] <------------------------------------+ [DOZING]
```

1. **`SLEEPING`**: Dog rests curled up in his home corner (`assets/dog_sleep_loop.gif`).
2. **`WAKING`**: After 30 seconds, he opens his eyes and sits up (`assets/dog_wake_look.gif`, ~900ms).
3. **`ALERT`**: Sits expectantly with a "feed me!" speech bubble (`assets/dog_alert_idle.gif`).
4. **Feeding Interaction**: Click-and-hold the treat bowl in the opposite corner, drag a kibble treat over the dog, and release.
   - If fed during `WAKING`, `ALERT`, `RUNNING`, or `RETURNING`: enters **`EATING`** (`assets/dog_eat_treat.gif`, ~1600ms + postFeed delay), then **`DOZING`** (`assets/dog_sleep_enter.gif`, ~1200ms), and returns to **`SLEEPING`**.
5. **Rampage**: If ignored for 10 seconds, he enters **`RUNNING`** (`assets/dog_run_munch.gif`), sprinting along 3–6 random waypoints at 620 px/s with chomping jaws.
6. **Destructive Text Eating**: Any editable field (`<input>`, `<textarea>`, `contenteditable`) hit by his mouth anchor loses a contiguous chunk of 4–28 characters permanently using native prototype setters.
7. **`RETURNING`**: After finishing waypoints or 9 seconds of rampage, he trots back to his corner, dozes off, and restarts the 30-second loop.

---

## ⌨️ Developer Keyboard Shortcuts

To test state transitions without waiting 30 seconds:
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>1</kbd> — **Wake Up Now** (force transition to `WAKING`)
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>2</kbd> — **Rampage Now** (force transition to `RUNNING`)
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>0</kbd> — **Go To Sleep Now** (force transition to `SLEEPING`)

---

## 🛡️ Exclusions & Protection Rules (§7.4)

The dog will **NEVER** eat text from:
- Password input fields (`<input type="password">`)
- Excluded input types (`hidden`, `file`, `submit`, `reset`, `button`, `checkbox`, `radio`, `range`, `color`, `image`)
- Disabled or readonly fields (`disabled`, `readOnly`)
- Elements containing or inside `[data-pixel-dog-safe]`
- The extension's own Shadow DOM

---

## 🎨 Asset Cavity System

This repository contains **no art files** out of the box. Missing images are handled dynamically by rendering dashed placeholder boxes naming the required asset.

To add art, place exported sprite assets into the `assets/` directory adhering to the canvas contract in `assets/README.md`.

---

## ⚡ Limitations & Scope

- **Top frame only**: Does not cross into `<iframe>` elements (`all_frames: false`).
- **Tab Isolation**: Each open browser tab has an independent dog and timer instance.
- **Pausable Timers**: When a tab is hidden/backgrounded, timers pause so rampages never happen while away.

# Pixel Dog — Asset Cavity & Canvas Contract Specification

This folder is designed as an **asset cavity**. The extension is fully functional and testable even when this directory is empty — missing sprites render as dashed placeholder boxes with the corresponding filename.

When replacing placeholders with real art assets, all sprite graphics must adhere strictly to the canvas contract below to ensure accurate mouth hit-testing, baseline alignment, and state transitions.

---

## 1. Sprite Canvas Specs & Hit-Test Coordinates

- **Resolution & Export**:
  - All 6 Dog GIFs: **192 × 192 px**, transparent background.
  - Authored on a **48 × 48 px** grid and exported at 4× nearest-neighbour scaling.
- **Baseline Alignment**:
  - **y = 176**: Dog paws rest on ground line y = 176 in every single frame.
- **Mouth Anchor Coordinates**:
  - **x = 157, y = 119**: Snout/mouth center point (82% across, 62% down on the 192×192 canvas).
  - The biting algorithm uses this exact point (adjusted for size and horizontal flipping) to detect text field collisions.
- **Facing Direction**:
  - Dog is **always drawn facing right** in authored sprites.
  - Leftward movement is dynamically mirrored in code using `scaleX(-1)`.
- **Other Sprites**:
  - `bowl_of_treats.png`: **168 × 168 px**, transparent.
  - `treat.png`: **52 × 52 px**, transparent, single treat centered.

---

## 2. Animation & Loop Rules

- **Loop Flags**:
  - Infinite loops: `dog_sleep_loop.gif`, `dog_alert_idle.gif`, `dog_run_munch.gif`.
  - Play-once loops: `dog_wake_look.gif`, `dog_eat_treat.gif`, `dog_sleep_enter.gif`.
- **State Hard Cuts**:
  - State transitions perform hard cuts between GIF files.
  - The last frame of each play-once GIF must visually match frame 1 of the state that follows it.
- **One-Shot Timings (`PD_ONESHOT_MS` in `src/config.js`)**:
  - `WAKE_LOOK`: ~900 ms
  - `EAT_TREAT`: ~1600 ms
  - `SLEEP_ENTER`: ~1200 ms
  - *If custom GIFs of different lengths are supplied, update `PD_ONESHOT_MS` in `src/config.js` to match.*

---

## 3. Required File Names

Place the following files in this directory:

1. `dog_sleep_loop.gif` — Curled sleeping loop.
2. `dog_wake_look.gif` — Waking up, opening eyes, sitting upright (play once).
3. `dog_alert_idle.gif` — Sitting upright, staring expectantly at user.
4. `dog_run_munch.gif` — Running sprite with chomping jaws (snout at x=157, y=119).
5. `dog_eat_treat.gif` — Chewing kibble and swallowing (play once).
6. `dog_sleep_enter.gif` — Turning around, curling down to sleep (play once).
7. `bowl_of_treats.png` — Heaped treat bowl.
8. `treat.png` — Single kibble treat.

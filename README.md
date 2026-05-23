
# James' Nerf Squad

A side-scrolling pixel-art action game built entirely in vanilla HTML, CSS, and
JavaScript — no build tools, no TypeScript, no npm packages required.  Open
`index.html` in any modern browser (Edge, Chrome, Firefox, Safari) and play.

---

## Project structure

```
james-nerf-squad/
├── index.html          Entry point – loads CSS then all JS modules in order
├── README.md           This file
├── css/
│   └── style.css       Global styles, pixel-art canvas rendering, font import
└── js/
    ├── constants.js    All hard-coded data (canvas size, physics, blasters,
    │                   enemies, power-ups, level definitions, colour palettes,
    │                   default key bindings). Uses var declarations for
    │                   broad browser compatibility. No logic lives here.
    ├── utils.js        Pure helper functions (geometry, colour maths, text
    │                   rendering, star-field, background scenery, key
    │                   formatting, persistence shim).
    ├── input.js        Centralised input manager (IIFE). Maintains a boolean
    │                   'held' map updated by keydown/keyup. Exposes per-frame
    │                   movement state and one-shot "just pressed" flags.
    │                   Touch buttons write into the same structure.
    ├── sound.js        All one-shot sound effects synthesised via Web Audio API.
    │                   Exports _audioCtx global used by music.js.
    ├── music.js        Chiptune background music engine. Three themes:
    │                   'title', 'action', 'boss'. References _audioCtx from
    │                   sound.js (must load after sound.js).
    ├── particles.js    Lightweight particle system: spawnParticles(),
    │                   updateParticles(), drawParticles().
    ├── icons.js        Pixel-art icon renderers for each power-up type.
    │                   drawPowerUpIcon() is the public entry point.
    ├── player.js       Player constructor function: physics (gravity, one-way
    │                   platforms), shooting, damage/invincibility, animation,
    │                   rendering. Uses prototype methods.
    ├── enemy.js        Enemy spawn, AI update (ground + flying), rendering.
    │                   Also contains squad-member helpers.
    ├── boss.js         Boss spawn, three-phase AI, attack patterns, rendering.
    ├── hud.js          In-game HUD (hearts, score, blaster, ammo, power-up
    │                   icons) and the boss health bar.
    ├── screens.js      Pure render functions for every non-gameplay screen:
    │                   title, customise, level select, boss intro, level
    │                   complete, game over, settings, pause menu, help.
    ├── touch.js        On-screen touch control strip: button layout, drawing,
    │                   game-over / pause two-button strips, touch detection.
    ├── game.js         Game constructor + prototype: owns all state
    │                   (gs = global, ls = level), the main loop, input
    │                   dispatch, screen routing, level initialisation,
    │                   collision resolution, power-up logic.
    └── main.js         Entry point – waits for DOMContentLoaded, constructs
                        Game, loads save, starts loop.
```

---

## How to run

### Locally (no server needed)
Double-click `index.html`, or drag it onto a browser window.  All assets are
inline or served from Google Fonts over HTTPS; no local server is required.

> **Edge note:** if you open the file with `file://` and the page is blank,
> check the browser console (F12).  Edge may block Web Audio on `file://` —
> click anywhere on the page first (browser autoplay policy requires a gesture).

### GitHub Pages
1. Push the repository to GitHub.
2. In **Settings → Pages**, set the source branch to `main` / root.
3. Visit `https://<user>.github.io/<repo>/`.

---

## Controls

| Action        | Default key       |
|---------------|-------------------|
| Move left     | ← Arrow / A       |
| Move right    | → Arrow / D       |
| Jump          | ↑ Arrow / W       |
| Shoot         | Space             |
| Switch blaster| Shift             |
| Pause / menu  | Escape / P        |

All bindings are remappable in **Settings**.

Touch controls appear automatically on touchscreen devices (or can be toggled
from the title screen if detection is ambiguous).

---

## Key technical decisions

### No TypeScript / No ES6 classes
All files use `var`, constructor functions, and `prototype` methods so the
code runs in any browser without a build step. `const`/`let`/class syntax
was removed to maximise compatibility.

### Script load order
Scripts are loaded as plain `<script>` tags in dependency order:
constants → utils → input → sound → music → particles → icons →
player → enemy → boss → hud → screens → touch → game → main

Each file assumes globals from the files before it are already defined.

### Error display
`index.html` includes a small inline error handler that renders any JS error
as red text on the canvas, making debugging easier when running from file://.

### Platform collision model
Platforms are one-way (pass-through from below):
- Moving upward (vy < 0): pass straight through.
- Moving downward (vy >= 0): land on top when the bottom edge crosses the platform top.
Uses previous-frame bottom edge vs current-frame bottom edge to prevent tunnelling.

### Keyboard responsiveness
1. `keydown` sets `Input.held[key] = true`; `keyup` sets it `false`.
2. Every frame `Input.pollMovement()` maps held keys to left/right/jump/shoot.
3. One-shot actions (jump, switch) use `e.repeat` guard and are cleared each tick.
4. `e.preventDefault()` is called for all game keys.

### Audio
Web Audio API with lazy AudioContext creation (required for autoplay policy).
Sound effects are synthesised procedurally — no audio files needed.
Music is a simple step-sequencer using `setInterval`.

---

## Save data

Progress is stored via `window.persistentStorage` (sandbox API) with a
Promise-based fallback that silently no-ops in standalone Edge/Chrome.
Save key: `nerfSquadSave`. Contains completed levels, high scores, key
bindings, alt button layout flag, and appearance colours.

---

## Adding new levels

Edit the `LEVELS` array in `js/constants.js`. Each entry:

| Field          | Type       | Description                                      |
|----------------|------------|--------------------------------------------------|
| `bg`           | `string[3]`| Three CSS colours (sky, mid BG, far BG)          |
| `groundColor`  | `string`   | CSS colour for ground and platforms              |
| `enemyTypes`   | `string[]` | Subset of `['kid','drone','robot','minion']`      |
| `enemyCount`   | `number`   | Total enemies to spawn before completion         |
| `bossLevel`    | `boolean`  | Whether this level ends with a boss              |
| `bossName`     | `string`   | Boss name shown on intro and HUD                 |
| `bossSubtitle` | `string`   | Boss tagline on intro screen                     |
| `platformCount`| `number`   | Multiplied by 3 for total platform count         |
| `scrollSpeed`  | `number`   | Background parallax speed                        |
| `bgName`       | `string`   | Short name shown in the HUD                      |

`TOTAL_LEVELS` auto-derives from `LEVELS.length`.

---

## Licence

Personal / educational use. No warranty.

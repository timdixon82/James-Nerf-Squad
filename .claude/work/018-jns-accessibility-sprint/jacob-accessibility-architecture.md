# Accessibility Architecture: Work Folder 018

Jacob's architecture recommendation for the James Nerf Squad accessibility sprint, scoped to R-01 (announcer), R-02 (reduced motion), and R-06 (colour contrast). Sean builds from this. Sonja routes R-01 and R-02 to Jed for security review, and one R-02 decision to Tim, before Sean builds.

This recommendation is grounded in the actual source tree as it stands today, not the brief alone. The brief describes greenfield work for R-01 and R-02; in fact both are already substantially implemented, and one of them is implemented in a way that conflicts with what the brief asks for. The corrections below matter more than the original instructions, so read them first.

## What is already built (this changes the brief)

1. **R-01 (announcer + speech) is already implemented end to end.** `js/announcer.js` exposes `announce(msg)`; `js/speech.js` exposes the `Speech` module with `narrate(msg, priority)` and `setReducedMotion(value)`. `game.js` already calls both at every game event in the brief's list, and more besides:
   - Title / load: game.js lines 494-495, 707-708
   - Mission select: line 534
   - Boss intro: lines 603-604 (`'Warning. Boss fight: ' + cfg.bossName`)
   - Level start: lines 607-608 (`'Level ' + (idx + 1) + ': ' + cfg.bgName + '. Lives: 3.'`)
   - Life lost: lines 847-848, 859-860, 867-868 (`'Hit. Lives remaining: ' + player.lives`)
   - Power-up collected / auto-used / inventory full: lines 883-896
   - Level complete: lines 910-911
   - Game over: lines 934-935
   - Pause / resume: lines 513-514, 519-520
   - Inventory open / focus: lines 981-1014

   So R-01 is **not a build task. It is a review-and-gap task.** My review of the existing implementation, and the small gaps I found, are in section 1.

2. **R-02 (reduced motion) is already wired, but does the opposite of what R-02 asks.** `Game.prototype.start` (game.js lines 656-712) reads `matchMedia('(prefers-reduced-motion: reduce)')` and, when reduced motion is on, **never starts the game loop**: it calls `_drawReducedMotionOnce()`, announces a notice, and `return`s early (line 690). The static notice (`drawReducedMotionScreen`, screens.js lines 298-314) tells the user to turn reduced motion off to play. The brief's R-02 wants the **opposite**: keep the game playable with scroll speed forced to 0.3 and particles off. This is a genuine conflict, not a gap. It needs a decision before Sean touches it. See section 2.

3. **The `#game-announcer` div already exists** in `index.html` (lines 13-14), correctly visually hidden with an inline clip-rect style, `aria-live="polite"`, `aria-atomic="false"`. No new HTML or CSS is needed.

4. **The script load order already lists both modules** (index.html lines 43-44) but after `game.js`. This is wrong and should be corrected even though it works today. See section 1.

5. **There is no Content Security Policy meta tag** in `index.html`. R-05 step 4 ("remove the CSP entries") has nothing to remove. Not my requirement, but flagged so the team is not surprised.

## 1. Announcer module (R-01): review and gaps

### Interface, as built — assessment

- `announce(msg)` (announcer.js) blanks `textContent`, then sets it inside `requestAnimationFrame`. The clear-then-set forces a screen reader to re-announce an identical string (for example retrying the same level). The RAF defer is a reasonable way to guarantee the DOM registers the change between clear and set. **Correct. Keep it.**
- `Speech.narrate(msg, priority)` (speech.js) is support-gated (`!!window.speechSynthesis`), respects a `reducedMotionActive` mute, and offers `'high'` (cancel-and-speak) versus `'normal'` (queue one). **Correct and well-judged.** Using `'high'` for interrupts (pause, resume, boss, game over, inventory) and `'normal'` for status (level, hit, pickup) is the right call and is already how game.js uses it.

So the two-layer design the brief asks me to specify already exists and is sound. I endorse it as the project's announcer architecture.

### Gaps to close (these are the R-01 work)

1. **Script load order.** Move `speech.js` and `announcer.js` (index.html lines 43-44) to **before** `game.js` (line 42). They currently load after the module that calls them. It works today only because the calls run later, at event time, not at parse time — but it is fragile and reads wrong. Target order: `... touch.js`, `speech.js`, `announcer.js`, `game.js`, `main.js`. This is the single concrete change R-01 needs.

2. **`announce` has no defined-existence guard at its call sites, and `Speech` is referenced unguarded.** If a future load-order slip removes `Speech` before `game.js`, every event throws. Low priority given the fix above, but Sean should confirm `announce` and `Speech` are both defined before the first event can fire. The DOMContentLoaded gate in `main.js` and the corrected load order together make this safe; no code change required if the order is fixed.

3. **The brief's exact strings differ slightly from what is built.** The brief specifies, for example, "Level [N]: [name]. [enemy count] enemies. Lives: 3." The built string omits the enemy count: "Level N: bgName. Lives: 3." If Tim wants the enemy count spoken, add `cfg.enemyCount` (already on every level def in constants.js) to the level-start string at game.js lines 607-608. This is a copy decision for Tad/Sonja, not an architecture decision — I flag it so it is not lost. The data is present; wiring it is one string edit.

4. **Boss intro uses `cfg.bossName` directly** (line 603). On non-boss levels `bossName` is an empty string, so this string must only fire on `cfg.bossLevel === true`. Confirm the call is already inside the boss-level branch (the surrounding code suggests it is). If not, guard it.

No refactor of game.js routing, loop, or data model is needed. The data the announcements need (`cfg.bgName`, `cfg.bossName`, `cfg.enemyCount`, `player.lives`, `score`, `POWERUPS[type].label`) is all already on the level defs in constants.js or on the live game state, and is already being read at the existing call sites.

## 2. prefers-reduced-motion (R-02): the central decision

### The conflict

The current behaviour and the brief's R-02 are mutually exclusive:

- **Current (game.js 656-712, screens.js 298-314):** reduced motion ON -> `start()` returns early without starting the loop; a static notice is drawn; game cannot be played until the user disables reduced motion at the OS level.
- **Brief R-02:** reduced motion ON -> game stays playable, scroll speed forced to 0.3, particles disabled.

The brief's "Out of scope" list keeps "Reduced-speed accessible game mode (Q-JNS1 option C — deferred)." There is a real risk that R-02's "make it playable at 0.3" and the deferred "reduced-speed accessible mode" are the same thing wearing two hats. Sean must not build R-02 until this is resolved, or he risks building a deferred feature or undoing a deliberate design.

### Decision needed from Tim (recorded as a question below)

I will not silently overwrite the existing block-the-game behaviour. The two readings are both defensible:

- **Block-and-instruct (current):** honest about the fact that a fast side-scroller is inherently motion-heavy; tells the user how to get a playable experience. But it denies the game entirely to anyone who keeps reduced motion on system-wide (which many low-vision and vestibular users do permanently). That is a hard accessibility failure dressed as an accommodation.
- **Degrade-and-play (brief R-02):** keeps the game available to everyone, at a calmer pace with no particle bursts. This is the stronger accessibility position and matches WCAG 2.3.3 (Animation from Interactions, AAA) intent — reduce motion, do not remove function.

**Jacob's recommendation: degrade-and-play (implement R-02 as written), and retire the block-the-game screen.** Denying the whole game to reduced-motion users is the worse outcome for exactly Tim's user population. But this reverses a built, deliberate design, so it is Tim's call. Question below.

### Implementation, if degrade-and-play is chosen

The good news: the surface area is tiny because the code is already centralised.

**Scroll speed — one read site.** There is exactly one place scroll speed is consumed: game.js line 762, `ls.scrollOffset += cfg.scrollSpeed * 0.5;`. Do not mutate the `LEVELS` array (constants.js line 4 states "No logic lives here -- pure data," and the `change` event can flip the preference back, which would lose the originals). Instead, read through a one-line accessor:

```
// constants.js
var REDUCED_SCROLL_SPEED = 0.3;

// game.js, replacing line 762's cfg.scrollSpeed
var sp = this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed;
ls.scrollOffset += sp * 0.5;
```

`this.reducedMotion` already exists and is already kept current by the `change` listener at lines 671/678. Reuse it; do not add a second flag. Sean must still confirm 762 is the *only* read — my grep found only this one, but the parallax/background draw was abbreviated in the file, so verify (task below).

**Particles — seven call sites, all direct `spawnParticles(...)` calls; gate inside the function.** Confirmed callers: game.js 817, 820, 832, 837, 898; boss.js 107; player.js 135. There is no wrapper — every caller invokes `spawnParticles` directly. So the only clean gate is inside `spawnParticles` itself in particles.js: add a module flag and make the function a no-op when reduced. This catches all seven callers with zero plumbing.

```
// particles.js
var particlesReduced = false;
function setParticlesReduced(on) { particlesReduced = !!on; }
function spawnParticles(arr, x, y, color, count, speed, text) {
  if (particlesReduced) return;     // emit nothing under reduced motion
  ... existing body ...
}
```

   Then at init and in the `change` handler (game.js 664-705), call `setParticlesReduced(this.reducedMotion)` alongside the existing `Speech.setReducedMotion(...)`. The brief names the flag `particlesEnabled`; the inverted `particlesReduced` matches the single boolean already flowing through the handler. Behaviour is what matters: no emission when reduced.

   Also clear the live array when switching on at runtime so existing particles stop, not just new ones: in the handler, after `setParticlesReduced(true)`, empty `this.ls.particles` (`this.ls.particles.length = 0`), guarding for `this.ls` existing.

**Rework `start()` so the loop runs under reduced motion.** Today `start()` returns early (line 690) and never starts the loop when reduced motion is on. For degrade-and-play, `start()` must start the loop in both cases; the only difference is that `this.reducedMotion` is set, which the scroll accessor and particle gate then honour. Remove the early `return` and the `_drawReducedMotionOnce()` path, and merge the two `change` handlers (lines 671-688 and 694-704) into one that just updates `this.reducedMotion`, `Speech.setReducedMotion(...)`, and `setParticlesReduced(...)` — no loop tear-down. `drawReducedMotionScreen` and `_drawReducedMotionOnce` become dead code; delete them.

   Note: the early-return path also means there is currently NO `change` listener that turns motion *back on* gracefully without the block screen; the merged single handler fixes that too.

**Un-mute narration under reduced motion.** Today `Speech` *mutes all narration* under reduced motion (speech.js line 42, `if (reducedMotionActive) return;`). That made sense when reduced motion blocked the game; it is wrong once the game is playable, because a reduced-motion player still needs every announcement. Remove that suppression from the `narrate` path. Reduced motion should affect *visual motion*, not *audio narration*. This is a coupling bug that only surfaces once degrade-and-play is chosen. Flag to Jed and Sean. (`Speech.setReducedMotion` can stay as a no-op or be removed; the `cancel()` it does on toggle is harmless but no longer needed.)

Where the check lives: keep it in `Game.prototype.start`, which already owns `this.reducedMotion` and the `matchMedia` read. The brief floats "main.js or game.js"; the code already chose game.js and it is the right home because the flag is read in the game loop. No need to move it.

## 3. Colour contrast replacements (R-06)

WCAG 2.2 success criterion 1.4.6 (Contrast Enhanced, AAA) requires 7:1 for normal text. Replacements are hue-matched to the originals so the palette still reads as intended. Ratios use the standard WCAG relative-luminance formula. All target locations are now confirmed by grep.

### Confirmed locations and replacements

| Role | Old | Old ratio | Background | New | New ratio | Location(s) to edit |
|---|---|---|---|---|---|---|
| Rifle blaster | `#44bbff` | ~5.5:1 | `#000000` | `#79caff` | ~9.1:1 | constants.js L32 `BLASTERS.rifle.color`; screens.js L445 (hardcoded duplicate in weapon list) |
| Mega blaster | `#ff4444` | ~4.7:1 | `#000000` | `#ff8a7a` | ~8.3:1 | constants.js L33 `BLASTERS.mega.color`; screens.js L446 (hardcoded duplicate) |
| Boss health-bar name | `#ff4444` | ~4.7:1 | `#000000` | `#ff8a7a` | ~8.3:1 | hud.js L65 (`'! ' + bossName`) |
| Inactive menu items | `#aaa` | ~5.4:1 | `#050514` | `#c9c9d2` | ~9.0:1 | screens.js L38, L215 (title + game-over menus). See scoping note. |
| Game-over header | `#ff2200` | ~4.6:1 | `#050514`* | `#ff7a5c` | ~7.6:1 | screens.js L193 |

\* The game-over screen background was not separately confirmed; the four canvas-overlay screens use `#050514`. `#ff7a5c` clears 7:1 on `#050514` as well as on pure black, so it is safe either way.

### Scoping the `#aaa` change — important

`#aaa` / `#aaaaaa` appears at **roughly 20 sites** across screens.js, boss.js, enemy.js, icons.js, touch.js. **Most are NOT in scope.** R-06's target is specifically the *inactive menu item text* — that is screens.js L38 (title menu) and L215 (game-over menu), where `'#aaa'` is the unselected-item colour. Do not blanket-replace `#aaa`:

- **In scope (interactive menu item text, must hit 7:1):** screens.js L38, L215. Also consider L78 (level-row label, unfocused), L245 (key binding label, unselected), L285 (a menu colour), L456 (weapon DMG/RATE stat text), L486/L503 (enemy/powerup desc text) — these are informational text that should also meet 7:1 if they are body/UI text on the dark overlay. Sean and Carol should treat every `#aaa`/`#aaaaaa` used as **readable text** as in scope, and every `#aaa` used as a **decorative sprite pixel** (boss.js 134/137/139, enemy.js 97/176, icons.js 52, touch.js 200, the gun-barrel rects) as out of scope — sprite detail is not text and 1.4.6 does not apply.
- The safest mechanical rule for Sean: replace `#aaa`/`#aaaaaa` with `#c9c9d2` **only where it is the colour argument to `px(...)` text drawing or a readable text fill**, and leave `fillRect` sprite-detail uses alone. Carol's contrast pass validates the text uses; the sprite uses are non-text and exempt.

A single shared constant would help here: define `var UI_TEXT_DIM = '#c9c9d2';` in constants.js and use it for the in-scope text sites, so the value is named and the decorative `#aaa` sprite uses stay visibly distinct from UI text. Recommended but not required.

### Why the reds move toward coral

A fully saturated pure red on black tops out near 5.25:1 (`#ff0000`). Reaching 7:1 requires adding green/blue channel, lightening red toward salmon/coral. There is no fully saturated pure red that hits 7:1 on black. Expect the new reds to look warmer and lighter. This is a property of AAA on black, not a mistake.

### Out of scope — do not change

- constants.js L70 `HAIR_COLORS` contains `#ff4444` — a decorative player-hair swatch. Leave it.
- boss.js L84 `#ff2200` is a **projectile fill colour** (a dart), not text. Sprite detail, exempt from 1.4.6. Leave it.
- hud.js L8 and L68 `#ff4444` / `#ff0000` are health-bar **fills** (graphical meters), not text. The bar *name* at L65 is the in-scope text. Leave the fills.
- player.js L135 `#ff4444` is the "OW!" particle colour — decorative particle, exempt.
- screens.js L489 alternates `#ff4444`/`#ff8800` for a flashing "BOSSES EVERY 3 LEVELS!" caption — this **is** readable text on the dark overlay; include it (swap the `#ff4444` to `#ff8a7a`).

### Verification

After editing, run Carol's pa11y/axe pass against the served instance, and self-check each value with any 7:1 calculator before committing. The canvas levels draw over three-stop background gradients (`LEVELS[i].bg`, constants.js 56-64), some of which are very light (`#ff7043`, `#87ceeb`). The R-06 colours are all HUD/overlay text drawn over dark overlays (`#050514`) or the HUD layer, **not** over the bright level gradients — confirm this holds for the boss-bar name (hud.js L65) in particular, since the HUD draws over live gameplay. If any in-scope text actually renders over a bright gradient, stop and escalate: the fix direction reverses (the colour must go darker, not lighter).

## 4. Risks and ordering constraints for Sean

1. **R-01 is mostly done — review, do not rebuild.** The only concrete R-01 change is moving `speech.js`/`announcer.js` before `game.js` in index.html. Optional: add `enemyCount` to the level-start string (copy decision, Sonja/Tad). Do not re-architect the announcer; the two-layer design is sound and endorsed.

2. **R-02 conflicts with built behaviour — do not build until Tim decides.** The current code blocks the game under reduced motion; the brief wants it playable. See Q-JNS6 below. Build R-02 only after the answer.

3. **If R-02 is degrade-and-play: narration must NOT be muted under reduced motion.** speech.js line 42 currently suppresses all `narrate` when `reducedMotionActive`. That made sense when reduced motion blocked the game; it is wrong once the game is playable under reduced motion. Remove that suppression for the narration path. This is a coupling bug — flag to Jed.

4. **R-02 scroll speed: one read site (game.js L762). Do not mutate LEVELS.** Use `REDUCED_SCROLL_SPEED = 0.3` through `this.reducedMotion` (already exists). Confirm L762 is the only `scrollSpeed` read (parallax/background draw was abbreviated; verify).

5. **R-02 particles: gate inside `spawnParticles` (particles.js).** One flag catches all seven callers (game.js 817/820/832/837/898; boss.js 107; player.js 135). Clear `this.ls.particles` on runtime toggle so motion stops at once.

6. **R-06: scope the `#aaa` change to readable text only.** ~20 `#aaa` sites exist; most are decorative sprite pixels and are exempt from 1.4.6. Change only the `px(...)` text uses (menu items, labels, descriptions). Leave `fillRect` sprite detail alone. A named `UI_TEXT_DIM` constant is recommended.

7. **R-06: change duplicated blaster colours in both places.** `#44bbff` and `#ff4444` appear both in `BLASTERS` (constants.js 32-33) and hardcoded in the weapon list (screens.js 445-446). Update both or the screen and the canon will diverge.

8. **R-06: leave fills and projectiles alone.** boss.js L84 dart `#ff2200`, hud.js health-bar fills, player.js "OW!" particle, `HAIR_COLORS` swatch — all non-text, exempt.

9. **R-06: confirm the boss-bar name renders over a dark HUD background, not a bright gradient.** It draws over live gameplay; that is the one R-06 colour at risk of sitting over a light background.

### Recommended build order

1. **R-06 colour swaps** — lowest risk once scoped to text; unblocks Carol's contrast pass early. Build first.
2. **R-01 load-order fix** (and optional enemy-count string) — small, isolated.
3. **R-02** — only after Tim answers Q-JNS6. If degrade-and-play: accessor + particle gate + remove the block screen + un-mute narration. Jed reviews the narration-mute change.

## Open question for Sonja to put to Tim

Q-JNS6: The game already detects reduced-motion preference. Today it **blocks the game** behind a notice telling the user to turn reduced motion off to play. The sprint brief (R-02) asks instead to **keep the game playable** with scroll speed at 0.3 and particles off. These are opposite behaviours. Which do you want?

A. Keep the game playable under reduced motion (implement R-02 as written; retire the block-the-game notice). Recommended — denying the whole game to reduced-motion users is the weaker accessibility outcome, and these users include much of your audience.
B. Keep the current block-and-instruct notice; treat R-02 as already satisfied by the notice and close it.
C. Offer both: a small on-screen choice when reduced motion is detected — "Play in calm mode" or "Show me how to disable reduced motion." (More work; effectively the deferred Q-JNS1 option C.)

Jacob's lean: A. It is the stronger accessibility position, it matches the brief, and the implementation is small because scroll speed has one read site and particles can be gated in one function. Note that A requires un-muting narration under reduced motion (speech.js line 42).

<!-- TASK -->
- [ ] Confirm game.js L762 is the only read of `cfg.scrollSpeed` (the parallax/background draw was abbreviated in review); route every read through the reduced-motion accessor `priority:high` `owner:sean` `from:jacob-018-r02`
- [ ] Decide with Tad/Sonja whether the level-start announcement should include `cfg.enemyCount` per the brief's R-01 string (data is present; one string edit at game.js L607-608) `priority:low` `owner:sonja` `from:jacob-018-r01`
- [ ] Audit every `#aaa`/`#aaaaaa` use and classify each as readable text (in scope, swap to UI_TEXT_DIM) or decorative sprite pixel (out of scope, leave) before applying R-06 `priority:medium` `owner:sean` `from:jacob-018-r06`
<!-- /TASK -->

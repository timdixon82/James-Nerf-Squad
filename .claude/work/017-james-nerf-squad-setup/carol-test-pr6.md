# Test Pass: PR 6 — Boss Speed and Pickup Announcement

Tester: Carol
Date: 2026-05-24
PR: https://github.com/timdixon82/James-Nerf-Squad/pull/6
Branch: fix/boss-speed-and-pickup-announcement
Commit: 0b77c00
Work folder: 017-james-nerf-squad-setup

## Verdict

Pass.

All five check areas pass. No blocking items. Two non-blocking observations are recorded below.

---

## Scope

This test covers the two files changed in commit 0b77c00:

- js/boss.js: createBoss and updateBoss functions.
- js/game.js: powerup pickup path in _updateGameplay.

No other files were modified (confirmed by `git diff --name-only a110d62 0b77c00`).

Requirements source: PR 6 description (boss speed halving, stationary boss at level index 2, pickup announcement with count and singular/plural).

---

## Check 1: Boss speed values halved

### FT-01: vx initial value

Pass. createBoss (boss.js line 16) sets `vx: 0.75`. Prior value was 1.5. Halving confirmed.

### FT-02: speed formula in updateBoss

Pass. updateBoss (boss.js line 41) computes `var speed = 0.6 + boss.phase * 0.3`.

Original formula: `1.2 + boss.phase * 0.6`.

Halved values:
- Base: 1.2 → 0.6. Confirmed.
- Phase bonus per step: 0.6 → 0.3. Confirmed.
- Maximum (phase 2): 0.6 + 2 * 0.3 = 1.2. Original maximum was 1.2 + 2 * 0.6 = 2.4. Halved to 1.2. Confirmed.

All four numeric values from the specification are correct.

---

## Check 2: Stationary boss at level index 2

### FT-03: stationary flag set correctly in createBoss

Pass. Line 11: `var stationary = (levelIdx === 2)`.

LEVELS array (constants.js lines 55-65, zero-indexed):
- Index 2: THE DART BARON, bossLevel: true. stationary will be true. Confirmed.
- Index 5: DRONE COMMANDER, bossLevel: true. levelIdx === 2 is false; stationary will be false. Confirmed.
- Index 8: RIVAL SQUAD LEADER, bossLevel: true. levelIdx === 2 is false; stationary will be false. Confirmed.

### FT-04: startX placed at CANVAS_W * 0.75 for stationary boss

Pass. Line 13: `var startX = stationary ? CANVAS_W * 0.75 : CANVAS_W * 0.6`. CANVAS_W is 480 (constants.js line 8). Stationary start X is 360 canvas pixels; non-stationary start X is 288. The stationary boss is placed on the right side of the starting viewport as specified.

### FT-05: stationary property added to boss object

Pass. Line 29: `stationary: stationary` is present in the object literal returned by createBoss.

### FT-06: updateBoss guards horizontal movement for type 2 (flying) boss

Pass. Lines 49-56: the `boss.x += boss.vx * speed` expression and the zone-bounce block are both inside `if (!boss.stationary)`. When stationary is true neither the position update nor the direction reversal runs. The vertical bob (`boss.y = groundY - boss.h - 60 + Math.sin(boss.anim * 0.04) * 20`) is outside the guard, so a stationary type-2 boss still bobs vertically. This is the intended behaviour.

### FT-07: updateBoss guards horizontal movement for non-type-2 (grounded) boss

Pass. Line 59: `if (!boss.stationary)` guards `boss.x += boss.vx * speed`. Gravity and vertical landing (`boss.y += boss.vy`, ground clamp) remain outside the guard, so the stationary boss still falls to the ground on spawn. The zone-bounce check at line 65 is also guarded: `if (!boss.stationary && (boss.x < zoneLeft || boss.x > zoneRight))`. A stationary boss will not be bounced out of its initial position.

### FT-08: Levels 5 and 8 have no stationary flag set

Pass. Only `levelIdx === 2` evaluates to true. Levels 5 and 8 produce `stationary: false`. Their boss objects include the stationary property but it is false, so the guards in updateBoss have no effect on their movement. The gameplay at those levels is unchanged.

---

## Check 3: Pickup announcement with count and singular/plural

### FT-09: Count loop executes after push

Pass. game.js lines 862-869. The push to `ls.inventory` occurs at line 862. The count loop (lines 863-866) then iterates the full inventory (which now includes the just-pushed item), counting entries that match `pu.type`. The minimum value of typeCount after the first pickup of any type is 1.

### FT-10: Announcement string construction

Pass. Line 867: `var storedMsg = 'Stored. You now hold ' + typeCount + ' ' + label + ' powerup' + (typeCount === 1 ? '.' : 's.');`

- typeCount === 1: "Stored. You now hold 1 SHIELD powerup."
- typeCount === 2: "Stored. You now hold 2 SHIELD powerups."

Singular form omits the 's'; plural form appends 's'. Both are grammatically correct.

### FT-11: Both announce() and Speech.narrate() receive the same string

Pass. Lines 868-869:
- `announce(storedMsg);`
- `Speech.narrate(storedMsg, 'normal');`

Both receive the same `storedMsg` variable. The announcement and the speech layer are in sync, satisfying the requirement for consistent screen reader and ARIA live region output.

### FT-12: Inventory-full path is unchanged

Pass. The `else` branch at lines 871-872 is unmodified from the prior commit. "Inventory full. Use a powerup to make room." continues to fire when `ls.inventory.length >= 20`.

---

## Check 4: No regressions

### RT-01: Only the two specified files changed

Pass. `git diff --name-only a110d62 0b77c00` returns only `js/boss.js` and `js/game.js`.

### RT-02: No other pickup paths in game.js

Pass. There is only one `ls.inventory.push` in game.js (line 862). The enemy-drop powerup path (line 804) uses the same world powerup object and will be collected through the same pickup loop, so the new announcement fires for drops as well. This is correct behaviour.

### RT-03: No other boss movement paths in boss.js

Pass. All `boss.x +=` expressions in updateBoss are now guarded by `if (!boss.stationary)`. The dart-firing logic, the attack timer, and the drawing function are unaffected. The boss still fires darts when stationary, which is the intended design: the stationary boss is an accessible introductory fight, not a passive one.

### RT-04: LEVELS array integrity

Pass. constants.js was not changed by this PR. Boss level indices (2, 5, 8) remain correct.

---

## Check 5: Accessibility regression suite

Relevant checks for the static front-end stack:

S-07 (Emoji in live regions): The new storedMsg string contains no emoji. Pass.

S-08 (Assertive live region for non-urgent feedback): Both `announce()` and `Speech.narrate()` use the polite tier ('normal' priority). Pickup of a powerup is not urgent. Pass.

S-10 (Focus indicator contrast): Not applicable. No HTML focus indicators changed.

S-12 (Modal role and focus management): Not applicable. No screen changes in this PR.

The announce() pattern (live region update plus Speech.narrate) is consistent with all prior pickup and status announcements in the codebase. No new accessibility surface was introduced.

---

## Non-blocking observations

### NB-01: BACKUP! label mid-sentence

The POWERUPS constant (constants.js line 51) defines the 'squad' label as 'BACKUP!'. This produces announcement strings such as "Stored. You now hold 2 BACKUP! powerups." The exclamation mark mid-sentence is grammatically odd and a screen reader may apply elevated stress or a pause at that point. This pre-exists PR 6; the PR faithfully uses the label as defined. Flagged as a follow-on item for Tad to review the label wording (for example 'BACKUP' without the exclamation mark, or 'SQUAD BACKUP').

### NB-02: Manual VoiceOver and JAWS pass

This test pass is code inspection only. The screen-reader evidence gate in CLAUDE.md requires a manual VoiceOver pass (macOS) and a JAWS pass (Windows) before any release. As with prior PRs on this repository, the live evidence should be collected before the final merge gate. This PR does not introduce new HTML structure, so the pass can focus on confirming the new announcement text reads correctly through each screen reader.

---

## Token and tool-call record

Tool calls: 11 Read and Bash calls.
Estimated input tokens: approximately 28,000.
Estimated output tokens: approximately 2,000.

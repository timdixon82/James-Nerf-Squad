# ADR 005: Input state machine with held map, one-shot flags, and per-frame movement summary

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted; defect fix shipped (keys-sticking bug, Defects 1-3 all fixed)

## Decision

`input.js` exposes:

- `held`: a map of key strings to booleans (raw continuous state).
- `state`: a per-frame summary with `left`, `right`, `jump`, `shoot` continuous booleans and `jumpPressed`, `shootPressed`, `switchPressed` one-shot flags.
- Lifecycle calls: `pollMovement` (derive movement from `held`), `clearOneShots` (reset one-shot flags after the frame).

## Context

A real-time game needs continuous key state (is the player holding left?) and one-shot detection (did the player just press jump this frame?). The two-level approach (held map plus derived one-shots) is the standard pattern for browser games.

## Defect: keys-sticking bug

The input layer has at least three paths that can leave a key stuck as held:

1. No `window blur` or `visibilitychange` handler. If focus leaves the window between keydown and keyup, the `held` map retains the key forever.
2. Shift-key case mismatch. If Shift is held when a movement key is released, the keyup fires with the uppercase letter. The lowercase entry in `held` is never cleared.
3. Screen transitions do not clear input state.

The dominant cause is 1 (focus loss). Fixes are recorded in `docs/code-review.md` and in Jed's security review (work folder 017). Sean implements them.

## Alternatives considered

- **Event-stream approach with no held map**: rejected. A real-time game needs continuous state.
- **Per-key event subscribers**: rejected. Adds plumbing for no benefit.

## Consequences

The input layer must be hardened against focus loss, modifier-suppressed keyups, and screen transitions. Until fixed, players experience keys sticking after alt-tabbing or using system shortcuts while playing.

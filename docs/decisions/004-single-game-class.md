# ADR 004: Single Game class owning state, loop, input, and dispatch

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted

## Decision

`game.js` defines a single `Game` constructor that owns the `requestAnimationFrame` loop, the `gs` state object, the keyboard, touch, click, and resize event bindings, and the screen router (`_dispatchTap`, `_handleMenuKey`).

## Context

The game is approximately 800 lines in one file. Keeping state, loop, and event handling together is acceptable at this scale.

## Alternatives considered

- **Split screen routing into its own module**: worth doing if `game.js` grows beyond its current size. Not a blocking concern today.
- **A finite-state-machine library**: rejected. Over-engineered for nine screens and a straightforward transition model.

## Consequences

Anyone changing input handling or screen transitions edits one file. The file is long but manageable. A future refactor (at the right scale trigger) would extract screen routing into a separate module.

# Project Accessibility: James Nerf Squad

This project targets WCAG 2.2 at AAA, interpreted in the global wiki's `accessibility.md`.

This page records what is specific to James Nerf Squad: its accessibility notes, and a pointer to its exceptions.

## Project-specific notes

The entire game is rendered on a single `<canvas>` element. This is a structural choice recorded in ADR 003. It means the game world, menus, HUD, and touch controls are not in the accessibility tree.

The planned approach follows the canvas-game accessibility pattern from the global wiki:

- An off-screen ARIA live region mirrors score, lives, level number, and key game events (power-up collected, enemy hit, level complete, game over) so screen-reader users receive a running commentary.
- All menus (title, customise, level select, pause, settings, inventory, game over) are navigable by keyboard only, without a pointing device.
- A recorded exception covers the visual game canvas itself (the rendered play area is treated as decorative; the live region is the conformant representation).

These are planned features. The live region and keyboard-only menu path are open questions Q69 and Q70 respectively (see Jacob's architecture backfill, work folder 017).

## Known deferred findings

No pa11y ignore entries are active yet. Deferred findings, when added to `pa11y.json`, must each have a corresponding entry here.

## Exceptions

Documented accessibility exceptions for this project are in `exceptions/`. Every exception needs Tim's approval.

# ADR 003: HTML5 Canvas 2D for all rendering

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted with an accessibility caveat

## Decision

The game world, the HUD, the menus, and the on-screen touch buttons are all drawn into a single `<canvas>` element. There is no DOM overlay.

## Context

The pixel-art aesthetic is central to the game. All visual elements — characters, platforms, enemies, menus, touch buttons — are drawn programmatically in 2D canvas coordinates. No external image assets are used.

## Alternatives considered

- **DOM overlays for menus**: rejected. The menus are part of the pixel-art aesthetic and are drawn at canvas resolution.
- **WebGL**: rejected. Out of scale for a 2D game of this size and style.

## Accessibility consequence

In-game content is not in the accessibility tree. A canvas-rendered game does not meet WCAG 2.2 Success Criterion 1.1.1 (Non-text Content) at the canvas level. The accessibility approach follows the pattern used by Poop-Breakout (another team project): a parallel off-screen live region mirrors score, lives, level number, and key events; menus are keyboard-navigable; an exception is recorded for the canvas content itself (treated as decorative; the live region is the conformant representation). See `docs/accessibility.md`.

# Requirements: James Nerf Squad

This document records the requirements for James Nerf Squad. Initial backfill by the agent team on 2026-05-23 (work folder 017). To be expanded by Tad.

## Background

James Nerf Squad is a side-scrolling pixel-art action game built for James. It runs entirely in the browser with no server, no accounts, and no build step. The player fights through nine levels, collecting power-ups and defeating enemies and bosses.

## User stories

1. As James, I want to run and shoot through side-scrolling levels so I can defeat enemies and reach the end.
2. As James, I want to collect power-ups (shield, speed boost, mega dart, squad member, ammo) during play so I can survive harder levels.
3. As James, I want to customise my character's skin, hair, and clothing colours so the game feels personal.
4. As James, I want to see my high scores per level so I can try to beat them.
5. As James, I want to play on a touchscreen as well as a keyboard so I can use any device.
6. As Tim (parent), I want the game to respect reduced-motion preferences so James can play comfortably.

## Functional requirements

1. Nine playable levels, each with a defined theme, enemy mix, platform layout, scroll speed, and boss flag.
2. Player controls: move left/right, jump, shoot. All controls rebindable via the Settings screen.
3. Power-up system: five power-up types (shield, speed boost, mega dart, squad member, ammo). Power-ups may be auto-used or manually applied from the Inventory screen.
4. Persistence of key bindings, appearance choices, high scores per level, and completed-level flags.
5. A pause menu with Resume, Auto-use Power-ups toggle, and Exit to Menu options.
6. An Inventory screen showing collected power-ups and the active blaster.
7. On-screen touch controls for mobile play.
8. Boss encounters on designated levels, with a health bar and a named boss.

## Non-functional requirements

### Accessibility

WCAG 2.2 AAA is the target. The canvas rendering model requires a parallel accessibility approach: an off-screen live region mirroring key game events, and keyboard-only menu navigation. Documented in `docs/accessibility.md`.

### Security

OWASP Top 10 mitigations applied. No paid third-party CI tokens. All scanning uses free, self-contained tooling. Refer to `docs/coding-standards.md` and the team's global `coding-standards.md`.

### Performance

Smooth animation at the browser's native refresh rate via `requestAnimationFrame`. No specific frame-rate target is recorded.

### Data protection

No personal data is collected or processed. See `docs/privacy.md`.

## Out of scope

- Server-side components or accounts.
- Multiplayer.
- Audio asset files (audio is synthesised by Web Audio).
- A build or bundling step.

## Definition of done

- All nine levels playable start to finish.
- Keys-sticking bug resolved (blur and visibilitychange handlers in place; Shift-key case normalisation applied).
- Persistence defaults to `localStorage` (no silent save-drop on GitHub Pages).
- Accessibility live region and keyboard-only menus implemented.
- All CI checks pass (lint, accessibility, security, CodeQL).
- Carol has signed off functional, accessibility, and visual testing.

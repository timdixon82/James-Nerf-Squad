# ADR 008: Persistence via host-injectable shim, defaulting to localStorage

Date: 2026-05-23
Author: Jacob (architect)
Status: Proposed — not yet built

## Decision (proposed)

Default the `persistence` shim in `utils.js` to a `localStorage`-backed adapter wrapped in `Promise.resolve`. Allow `window.persistentStorage` to override. This is the same pattern used by Poop-Breakout (another team project).

## Context

Today the shim returns no-op promises when `window.persistentStorage` is absent. This means saves are silently dropped on the floor in any plain-browser deploy, including GitHub Pages. High scores and key bindings do not persist between sessions on the deployed site.

The shim was written for a hosting container that provides `window.persistentStorage`. The project is now deployed on GitHub Pages, which has no such container.

## Alternatives considered

- **Leave as-is and accept that saves do not persist**: rejected. A game that silently loses saves on every session is broken for users on GitHub Pages.
- **Require IndexedDB**: rejected. Overkill for save data of this size.

## Consequences

High scores, key bindings, and appearance choices persist across sessions on GitHub Pages. A future host shell can still inject its own backend by providing `window.persistentStorage`. Open question Q68 from Jacob's review.

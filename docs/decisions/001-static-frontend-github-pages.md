# ADR 001: Static front-end on GitHub Pages, no build step

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted

## Decision

Serve the game as a static page on GitHub Pages with no bundler, no transpiler, and no TypeScript. Files are committed to the repository and served as-is.

## Context

James Nerf Squad is a side-scrolling pixel-art action game built for James. Tim states the no-build posture is deliberate. The codebase is small enough (approximately 2,700 lines across fifteen files) to live without build tooling.

## Alternatives considered

- **Vite plus TypeScript**: rejected. Tim's no-build posture is deliberate; the codebase does not require typing at this scale.
- **A bundler with hot reload**: rejected. No benefit at this scale.

## Consequences

The team's static stack standards apply in full. The standing GitHub Pages security-header exception applies: server-set headers (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`) cannot be set via `<meta>` and must be recorded as a standing exception in `docs/exceptions/`. A CSP and Referrer-Policy `<meta>` can and should be added to `index.html` (see Finding 1 in `docs/security-review.md`).

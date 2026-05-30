# Project Coding Standards: James Nerf Squad

This project follows the team's stack-independent standards in the global wiki's `coding-standards.md`, and the per-stack standards in the global wiki's `stacks/`.

This page records only what is specific to James Nerf Squad: its stack, and any project-specific coding decisions.

## Stack

Static front-end: plain HTML, CSS, and JavaScript. No framework, no bundler, no transpiler. Served from the repository root via GitHub Pages (unbundled deploy).

JavaScript modules are plain script files loaded in dependency order via `<script src>` tags in `index.html`. Each module declares its public interface as a `var` at file scope (which becomes a `window` property). See ADR 002 for the load-order rationale and the open question about migration to ES modules.

## CI and security tooling

No paid third-party CI tokens are used. This is a standing team rule. Specifically:

- Semgrep runs as `semgrep scan --config p/default --error` (self-contained, free). `semgrep ci` (which requires SEMGREP_APP_TOKEN) is never used.
- Trivy runs as a filesystem scan in the security workflow.
- Dependency review runs on pull requests via `actions/dependency-review-action`.

## Project-specific notes

- All rendering is 2D canvas drawing. No WebGL. No DOM overlays for game content.
- Audio is synthesised at runtime using Web Audio oscillators. No audio asset files.
- Persistence uses a shim (`persistence` in `utils.js`) that defers to `window.persistentStorage`. See ADR 008 for the planned migration to a `localStorage` default.
- Level definitions are plain JavaScript objects in `LEVELS` in `constants.js`. See ADR 009.

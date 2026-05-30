# ADR 002: Module load order via script tags, not ES modules

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted as built; open question Q67 asks whether to migrate

## Decision

Each JavaScript file declares its symbols with `var` at file scope (making them window properties). `index.html` orders fifteen `<script src>` tags so each dependency is parsed before its dependants.

## Context

The code was built this way before the team adopted the project. The ordering is fragile: a contributor reordering tags can silently break the game, and there is no automated check that the order is valid.

## Alternatives considered

- **ES modules with `<script type="module">` and `import`/`export`**: would express the dependency order in the language itself, with no build step required. Available without contradicting the no-build posture (ADR 001). Recommended by Jacob.
- **IIFE plus a single global namespace**: rejected — the current `var` pattern is functionally the same with less ceremony.

## Open question

Q67 asks whether to migrate to ES modules in the setup branch. If yes, the fifteen `<script src>` tags are replaced with a single `<script type="module" src="js/main.js">`, and each file gains explicit `import` and `export` statements.

## Consequences

Until ES modules are adopted: any reorder of `<script>` tags breaks the game silently. The comment "Load modules in strict dependency order" in `index.html` is the only guard. A migration to ES modules would make the order explicit and machine-checkable.

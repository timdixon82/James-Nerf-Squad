# ADR 009: Level definitions as plain JavaScript objects in constants.js

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted

## Decision

Each of the nine levels is defined as a row in the `LEVELS` array in `constants.js`. Each entry is a plain JavaScript object with background colour, ground colour, enemy types, enemy count, platform count, scroll speed, and boss flags.

## Context

Nine hand-tuned levels with distinct themes. The definitions need to be human-editable and version-controlled cleanly.

## Alternatives considered

- **JSON files fetched at runtime**: rejected. Adds a fetch step and a CORS edge case when testing from a `file://` origin.
- **Procedural generation** (as used by Poop-Breakout): not appropriate. The levels have hand-tuned themes and specific boss placements that require explicit definition.

## Consequences

A new level is a code edit in `constants.js`. Diffs are clean and human-readable. No migration is needed across versions. The nine-level `LEVELS` array is the canonical source of truth for level configuration.

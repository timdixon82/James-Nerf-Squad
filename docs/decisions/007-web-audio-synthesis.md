# ADR 007: Audio synthesised at runtime with Web Audio (no audio assets)

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted

## Decision

All sound effects and music are generated on demand by `OscillatorNode` graphs in `sound.js` and `music.js`, against a lazily created `AudioContext`. There are no audio asset files in the repository.

## Context

The game has a chiptune retro aesthetic. Synthesised audio matches this style and avoids the need for audio files.

## Alternatives considered

- **Pre-recorded audio files**: rejected. Adds asset weight to the repository and a licensing surface. The chiptune aesthetic is appropriate to the pixel-art style.
- **An audio library such as Howler.js**: rejected. Adds a runtime dependency for behaviour that fits in two files (`sound.js` and `music.js`).

## Consequences

Zero audio assets. The deploy is small. The `AudioContext` is created lazily, which is necessary for browsers that block audio before a user gesture. This means the first sound may have a slight delay on the very first user interaction; acceptable for this use case.

# ADR 006: Keyboard and touch unified into a single input state

Date: 2026-05-23
Author: Jacob (architect)
Status: Accepted

## Decision

`Input.onKeyDown`, `Input.onKeyUp`, `Input.onTouchDown`, and `Input.onTouchUp` all write to the same `state` object. `pollMovement` reads it without caring about the source.

## Context

The game is played on keyboard and on touchscreen (on-screen buttons). Both input modalities must produce the same player movement and action state.

## Alternatives considered

- **Separate touch and keyboard surfaces consumed at different layers**: rejected. Causes duplication and divergence risk between the two input paths.

## Consequences

A defect in either input path (keyboard or touch) appears as a stuck or missing input identically. Debugging must distinguish the source. The unified state means clearing all input on focus loss (ADR 005 fix) correctly silences both paths at once.

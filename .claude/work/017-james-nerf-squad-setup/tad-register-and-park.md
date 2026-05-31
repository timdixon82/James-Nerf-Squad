# James-Nerf-Squad: Register and Park

Status: parked. Reason: the repository contains only a README.md. No code exists.

## Intended purpose

James-Nerf-Squad is a browser-based platform game. The player takes the role of a character called James and leads a nerf squad through a series of missions, culminating in boss fights. The full description, taken verbatim from the repository README: "A platform game where you play James and lead a nerf squad through missions and beating big bosses."

The name "James" suggests a personal or family game rather than a public-facing product. That assumption is an open question (see Q59 below).

## How this project surfaced

James-Nerf-Squad was not included in the project handoff from earlier sessions. It surfaced in this session while Sonja was preparing the backfill batch. It is recommended that Sonja add an entry for this project to the team's project registry at `docs/projects.md` under the Projects section.

## Accessibility note: canvas rendering

A platform game will almost certainly render to an HTML canvas element. Canvas-rendered content presents the same accessibility challenges already identified for the Poop-Breakout project: the canvas is a single bitmap to assistive technology, so screen-reader users, keyboard-only users, and users who need reduced motion get nothing by default.

These challenges must be addressed from the start of the design phase, not retrofitted. The design brief should include:

- A keyboard-only control scheme, with all game actions reachable without a mouse or game controller.
- A screen-reader-accessible game-state summary: score, current mission, health, and any narrative events, surfaced as live regions outside the canvas.
- A reduced-motion mode: the game should run without fast movement, flashing, or rapid transitions for players who need it.
- Consideration of whether a non-canvas (DOM-based) rendering path is feasible, which would simplify accessibility significantly.

Simon should receive this note at the start of the design phase so the WCAG 2.2 AAA bar is built in, not bolted on.

## Conditions for unparking

The work folder moves from parked to active when either of these conditions is met:

1. Real code lands on the main branch of the repository.
2. Tim asks for the project to be formally scoped, even before code exists.

## Open questions for Tim

- Q59: What is the target platform? (A) Web browser; (B) Mobile app (iOS or Android); (C) Desktop application; (D) Console; (E) Other (free text).
- Q60: What rendering approach is intended? (A) HTML canvas; (B) DOM-based HTML and CSS; (C) WebGL; (D) A game engine such as Phaser or Unity; (E) Not yet decided.
- Q61: Is James-Nerf-Squad a personal or family game, built for a specific person called James, or is it intended for a wider public audience? (A) Personal or family game; (B) Wider public audience; (C) Both.

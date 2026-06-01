# Change record: requirements update for work folder 020

Date: 2026-06-01
Agent: Tad
File changed: `docs/requirements.md`

## What was changed

- Updated the document header to record that sprint 020 requirements were added by Tad on 2026-06-01 (work folder 020).
- Added a new "Sprint 020 requirements" section above the Definition of Done, containing:
  - R-01 (020): Fix auto-use powerups hint label. Acceptance criteria require that the hint on the AUTO POWERUPS pause menu item reads `'ENTER'` and that no other item is changed.
  - R-02 (020): Persist auto-use powerups across level starts and sessions. Acceptance criteria cover moving the property from `this.ls` to `this.gs`, updating all read sites, wiring `save()` and `load()`, and verifying persistence across level transitions and browser refresh.
  - R-03 (020): Easy/Hard game speed in Settings. Acceptance criteria cover the Settings screen toggle, announcer calls, runtime application of the 0.5 multiplier to the five speed parameters, Hard mode regression check, no mutation of `constants.js`, and localStorage persistence.
- Added a "Sprint 020 additions" block to the Definition of Done section, with one checkbox per deliverable matching the brief.

## What was not changed

- The header, user stories, functional requirements, non-functional requirements, Out of scope section, and all sprint 018 content are unchanged.
- The original Definition of Done and sprint 018 Definition of Done blocks are unchanged.

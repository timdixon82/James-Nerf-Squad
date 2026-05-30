# Project Wiki: Glossary: James Nerf Squad

Domain terms specific to James Nerf Squad, defined as the team meets them. Terms that apply across every project are in the global wiki's glossary.

- **Blaster**: a weapon variant the player can equip. Each blaster has a different dart pattern, fire rate, and ammo capacity. Defined in `constants.js`.
- **Boss**: a large enemy that appears at the end of certain levels. Each boss has a health bar and a name.
- **Dart**: the projectile fired by the player's blaster.
- **HUD** (heads-up display): the on-screen overlay showing lives, score, current blaster, ammo count, and active power-ups.
- **Inventory**: the screen where the player selects their active blaster and reviews collected power-ups. Formerly called "Loadout".
- **Level**: one of nine themed stages, each defined as a plain JavaScript object in `LEVELS` in `constants.js`.
- **Persistence shim**: the `persistence` object in `utils.js` that wraps save and load operations. Defers to `window.persistentStorage` if present, otherwise silently no-ops. See ADR 008.
- **Power-up**: a collectible that grants a temporary ability (shield, speed boost, mega dart, squad member, or extra ammo).
- **Squad member**: a companion fighter that follows the player and attacks enemies. Activated by collecting the Squad power-up.

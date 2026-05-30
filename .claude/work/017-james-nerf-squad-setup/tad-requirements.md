# James' Nerf Squad: Business Analysis Requirements

Prepared by Tad, 2026-05-23. Backfill from working-tree source; no commit exists beyond the initial commit 9d6eb02.

## 1. What the project is

James' Nerf Squad is a side-scrolling pixel-art action game that runs in any modern browser with no installation. The player controls a character who moves across nine progressively harder levels, shooting foam-dart blasters at enemy kids, drones, robots, and minions, and facing a boss at the end of levels 3, 6, and 9. The game is built in plain HTML, CSS, and JavaScript with no build tools or external packages. It opens by loading index.html directly in the browser. Save data, key bindings, and appearance choices are stored locally between sessions.

## 2. Functional requirements

### FR-01: Load and start the game

As a player, I want the game to load and start when I open index.html in a modern browser, so that I can play without any installation or configuration.

Acceptance criteria:

- [ ] Opening index.html in Edge, Chrome, Firefox, or Safari displays the title screen within two seconds on a typical broadband connection.
- [ ] No npm install, build step, or local server is required.
- [ ] Any JavaScript error during load renders as red text on the canvas rather than a silent black screen.

### FR-02: Navigate the title screen

As a player, I want to navigate the title screen menu using keyboard or touch, so that I can start the game, access settings, or get help.

Acceptance criteria:

- [ ] The title screen shows five menu items: Play Game, Customise, Help, Settings, and (on devices where touch detection is ambiguous) a Touch toggle.
- [ ] Pressing the Up and Down arrow keys moves the menu selection; pressing Enter activates the selected item.
- [ ] The selected item is visually highlighted with a flashing indicator.
- [ ] On a touchscreen, tapping a menu item activates it.

### FR-03: Play a level

As a player, I want to run, jump, and shoot through a scrolling level, so that I can defeat the required number of enemies and complete the level.

Acceptance criteria:

- [ ] The player can move left and right at a consistent speed and can jump with one-way platform collision (pass through platforms from below, land on top from above).
- [ ] The player can fire the active blaster by pressing the shoot key; the blaster respects its defined fire rate.
- [ ] Enemies spawn, move, and shoot at the player according to their type definitions.
- [ ] The level ends when the required enemy count is reached (or the boss is defeated, if bossLevel is true).
- [ ] A particle effect plays when an enemy is destroyed.

### FR-04: Select and switch blasters

As a player, I want to switch between unlocked blasters during a level, so that I can adapt my tactics to different enemy types.

Acceptance criteria:

- [ ] Four blasters are defined: Starter Pistol (always available), Rapid Rifle (unlocked from level 2), Mega Blaster (level 5), and Scatter Shot (level 8).
- [ ] The player can cycle through unlocked blasters by pressing the switch key.
- [ ] The current blaster name, icon, and remaining ammo are shown in the HUD.
- [ ] Switching blaster is a one-shot action and does not repeat if the key is held.

### FR-05: Collect power-ups

As a player, I want to collect power-ups that appear during a level, so that I gain temporary advantages.

Acceptance criteria:

- [ ] Five power-up types exist: Shield (blocks one hit), Speed (faster movement for 10 seconds), Mega Dart (next shot is lethal), Backup Squad (squad members join for 15 seconds), and Ammo Refill.
- [ ] Walking over a power-up collects it automatically.
- [ ] A timed power-up shows its remaining duration visually in the HUD.
- [ ] Power-up icons are drawn using the pixel-art icon renderer.

### FR-06: Face and defeat a boss

As a player, I want to fight a unique boss at the end of boss levels (3, 6, and 9), so that completing the level feels like a meaningful challenge.

Acceptance criteria:

- [ ] A boss-intro screen shows the boss name and subtitle before the boss fight begins.
- [ ] The boss has three phases with distinct attack patterns.
- [ ] A boss health bar is displayed in the HUD during the fight.
- [ ] Defeating the boss triggers a level-complete screen.

### FR-07: Track lives, score, and HUD

As a player, I want to see my remaining lives, current score, and active blaster at all times during a level, so that I know my game state.

Acceptance criteria:

- [ ] The HUD shows heart icons for remaining lives (up to three), the current score, the active blaster name and ammo count, and any active power-up icon.
- [ ] The player has 90 frames of invincibility after taking a hit, shown by a visual flash.
- [ ] The game-over screen appears when all lives are lost, offering a retry option and showing the final score.

### FR-08: Select a level

As a player, I want to select any level I have previously completed, or the next unlocked level, from a level-select screen, so that I can replay levels or continue from where I left off.

Acceptance criteria:

- [ ] The level-select screen lists all nine levels with their background names.
- [ ] Completed levels are visually distinguished from locked levels.
- [ ] High scores are shown per level.
- [ ] Selecting a level and pressing Enter or tapping starts that level.

### FR-09: Pause and resume

As a player, I want to pause the game and resume from the same point, so that I can stop playing at any time without losing progress.

Acceptance criteria:

- [ ] Pressing Escape or P pauses the game and shows a pause menu.
- [ ] The pause menu offers options to resume, go to settings, or return to the title screen.
- [ ] Resuming restores the exact game state at the point of pause.

### FR-10: Customise character appearance

As a player, I want to choose my character's skin colour, hair colour, and clothing colour, so that the character feels personal to me.

Acceptance criteria:

- [ ] The customise screen lets the player cycle through six skin colours, six hair colours, and eight clothing colours.
- [ ] The selected colours are applied to the player sprite on the title screen and in game.
- [ ] Choices are saved and restored between sessions.

### FR-11: Remap key bindings

As a player, I want to remap the game's controls in Settings, so that I can use keys that work for me.

Acceptance criteria:

- [ ] The Settings screen lists the six bindable actions: move left, move right, jump, shoot, switch blaster, and pause.
- [ ] Selecting an action and pressing any key (other than Escape) assigns that key to the action.
- [ ] Pressing Escape during a rebind cancels the rebind and keeps the existing key.
- [ ] New bindings take effect immediately and are saved to persistent storage.

### FR-12: Use touch controls on touchscreen devices

As a player on a touchscreen device, I want on-screen buttons for all game actions, so that I can play without a physical keyboard.

Acceptance criteria:

- [ ] Touch controls appear automatically when a touchscreen is detected.
- [ ] On devices where detection is ambiguous, a Touch toggle on the title screen lets the player enable or disable touch controls manually.
- [ ] Touch buttons write into the same input state as keyboard events.
- [ ] An alternative button layout option is available in settings and saved between sessions.

### FR-13: Save and restore progress

As a player, I want my completed levels, high scores, key bindings, and appearance choices to be saved automatically, so that I do not have to start from scratch each session.

Acceptance criteria:

- [ ] Save data is written to persistent storage under the key nerfSquadSave after any change to key bindings, appearance, or level completion.
- [ ] On load, all saved values are restored before the game starts.
- [ ] If save data is missing or corrupted, the game starts with default values without crashing.

### FR-14: Respond to audio context policy

As a player, I want the game's audio to start correctly after my first interaction, so that sound effects and music play as expected by the browser's autoplay rules.

Acceptance criteria:

- [ ] The audio context is created lazily on the first user gesture.
- [ ] Sound effects are synthesised via the Web Audio API without needing audio files.
- [ ] Three music themes (title, action, boss) play during the appropriate screens and levels.

### FR-15: Scale to any screen size

As a player on any screen size, I want the game canvas to scale and centre to fill the available viewport, so that I get the best possible pixel-art presentation on my device.

Acceptance criteria:

- [ ] The canvas scales using the largest integer pixel multiplier that fits within the viewport.
- [ ] Scaling accounts for device pixel ratio so pixel art is sharp on high-density screens.
- [ ] On resize, the canvas recalculates and recentres without restarting the game.

## 3. Defects observed

### DEF-01: Keys appear to stick during gameplay

Tim has reported that keys appear to stick: a direction or action continues after the key is released. This is a defect observed by Tim and is to be diagnosed and fixed during the setup build.

Likely causes identified in the source code are:

- In js/input.js: the keyup handler updates the state map directly for left, right, jump, and shoot, but the held map for that key is also set to false. If the player's current binding has been remapped after a keydown event, the keyup event fires with the new binding key and may not match the original held entry, leaving the old entry stuck as true.
- In js/game.js: the keyup listener is registered on window unconditionally, including during the rebinding flow. A key pressed to confirm a rebind fires keydown (which is intercepted and used as the new binding) and then keyup (which calls Input.onKeyUp with the same key), but if the binding has already changed at that point the held state for the original key is never cleared.
- In js/touch.js: touch buttons write directly into the input state but the touchcancel path calls the same onTouchUp path as touchend, which is correct. However, if the window loses focus while a touch is held, no touchend fires and the state stays true.
- The focus-loss case is not handled: there is no blur or visibilitychange listener that clears the held map when the window loses focus, which is a common cause of stuck keys on keyboard input as well.

Sean is to diagnose, reproduce, and fix this defect as part of the chore/project-setup branch.

## 4. Out-of-scope items

The following items are outside the scope of the setup build. They remain for future consideration.

- Game-design changes: level changes, mechanic changes, enemy balance changes, art changes. The setup adopts the game as it is.
- Migration to a build tool or to TypeScript. Vanilla JavaScript with no build step is the project's stated posture and is out of scope.
- Multiplayer or networking of any kind.
- Adding new assets: audio files, sprite sheets, or additional levels beyond the nine already defined.
- Server-side components, user accounts, or leaderboards.

## 5. Open questions for Tim

The following questions need Tim's input before the build can proceed on the items they cover. Q-numbers start at Q67 as requested; Q59 through Q66 are already taken.

Q67 — The game's README says personal and educational use with no warranty. Does Tim want a specific licence file (for example, MIT, or a custom personal-use licence) added to the repository as part of the setup build?

Q68 — The game currently has no visible version number in the browser (no footer, no about screen). The team's coding standards require the version to appear somewhere the user can reach. Should a small version note be added to the pause screen, the title screen, or an about screen, or does Tim prefer a different placement?

Q69 — The game uses Google Fonts over HTTPS (loaded by css/style.css). This means the browser makes a network request to Google's servers, which may conflict with a strict Content Security Policy. Should the team self-host the font, remove the font import, or add an exception for Google Fonts in the Content Security Policy?

Q70 — The canvas-game accessibility posture (recording that keyboard-only play is possible but that the canvas itself has no screen-reader alternative) needs to be documented in the project wiki, as was done for the Poop-Breakout project. Is Tim happy for the team to use the same posture document shape as Poop-Breakout, or does he want a different approach?

## 6. What good looks like

The setup build is complete when: the game runs in any modern browser without errors; the keys-sticking bug is fixed and verified; all nine levels, the boss fights, and all five power-up types work as described in this requirements document; save data persists correctly between sessions; the canvas scales and centres correctly at all viewport sizes; the team's standard repository items (VERSION file, expanded README, security headers, GoatCounter, linter, workflow files) are in place; and Carol has signed off a full functional and accessibility test pass.

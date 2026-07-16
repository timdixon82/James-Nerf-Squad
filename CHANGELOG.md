# Changelog

## [1.3.1](https://github.com/timdixon82/James-Nerf-Squad/compare/v1.3.0...v1.3.1) (2026-07-16)


### Bug Fixes

* accessibility announcements and core structural bugs ([00d7c3e](https://github.com/timdixon82/James-Nerf-Squad/commit/00d7c3efe3eb3bcec94a80b423deffeea46e97d6))
* add dependabot cooldown block to satisfy semgrep dependabot-missing-cooldown rule ([#31](https://github.com/timdixon82/James-Nerf-Squad/issues/31)) ([34fc2e9](https://github.com/timdixon82/James-Nerf-Squad/commit/34fc2e9544c79c15c45bdbcce51707a15df85bff))

## [1.3.0](https://github.com/timdixon82/James-Nerf-Squad/compare/v1.2.0...v1.3.0) (2026-06-01)


### Features

* sprint 020 R-01, R-02, R-03 (auto-use hint, persistence, Easy/Hard speed) ([#18](https://github.com/timdixon82/James-Nerf-Squad/issues/18)) ([173f6ac](https://github.com/timdixon82/James-Nerf-Squad/commit/173f6ace38b52eef2cb0318e544e318e979b5c99))

## [1.2.0](https://github.com/timdixon82/James-Nerf-Squad/compare/v1.1.0...v1.2.0) (2026-06-01)


### Features

* accessibility and housekeeping sprint 018 (partial — R-02 pending) ([#16](https://github.com/timdixon82/James-Nerf-Squad/issues/16)) ([cb4ac0e](https://github.com/timdixon82/James-Nerf-Squad/commit/cb4ac0ecb8a833ee984ca8665ebd757e52f72051))

## [1.1.0](https://github.com/timdixon82/James-Nerf-Squad/compare/v1.0.0...v1.1.0) (2026-05-31)


### Features

* **a11y:** keys-sticking fix, reduced-motion screen, live-region announcer, speech narration ([7881c10](https://github.com/timdixon82/James-Nerf-Squad/commit/7881c106c33e5f70fd6f7b465bee79cc67026489))
* pause fix, auto-use powerup toggle, inventory rename ([#7](https://github.com/timdixon82/James-Nerf-Squad/issues/7)) ([c961c67](https://github.com/timdixon82/James-Nerf-Squad/commit/c961c67d765d29a6768700aeef47407da159122e))
* powerup accumulation and loadout selection screen ([a110d62](https://github.com/timdixon82/James-Nerf-Squad/commit/a110d62844d8f16223fc014160a48c3bb3b5ce1f))
* powerup accumulation and loadout selection screen ([b479b29](https://github.com/timdixon82/James-Nerf-Squad/commit/b479b296648e3c549065b54992613936ccd7ddee))
* replace prototype with Tim's first version of the game ([3f04e84](https://github.com/timdixon82/James-Nerf-Squad/commit/3f04e844b75b58711e75d0e922dd764489e6a779))
* **scripts:** add next-q.sh for session Q-number display ([044d4f7](https://github.com/timdixon82/James-Nerf-Squad/commit/044d4f70615c30469858959c856d56eccc268a89))
* **scripts:** add next-q.sh so session-start displays the next Q-number ([639bfbe](https://github.com/timdixon82/James-Nerf-Squad/commit/639bfbe91a638d4b38a44f562e37f35793d69ece))
* **touch:** add generalised menu nav strip for all non-gameplay screens ([0df20a0](https://github.com/timdixon82/James-Nerf-Squad/commit/0df20a0197bc9ec58cbd12658d08549d49677ee6))
* **touch:** wire menu nav strip into all screens in game.js ([75ba829](https://github.com/timdixon82/James-Nerf-Squad/commit/75ba829dac433439f685db896d986efb8c63175c))
* v0.1 playable prototype ([#1](https://github.com/timdixon82/James-Nerf-Squad/issues/1)) ([2620f41](https://github.com/timdixon82/James-Nerf-Squad/commit/2620f41acbdfca254278ba1d3e55214112ee1ff7))


### Bug Fixes

* **a11y:** announce power-up collection and level-select transition ([28a0e56](https://github.com/timdixon82/James-Nerf-Squad/commit/28a0e56b5386b86897dbf17014179d5fd27063f4))
* arrow icons on touch buttons, powerups on boss level ([9610bad](https://github.com/timdixon82/James-Nerf-Squad/commit/9610bad85d7a49772517aa7c4330001021c83f3e))
* arrow icons on touch buttons, powerups on boss level, accessibility announcements ([b1d62a9](https://github.com/timdixon82/James-Nerf-Squad/commit/b1d62a9ff5df8e1af1124889fc63b54a712ef8af))
* **boss:** anchor roaming zone to camX so boss follows player across scrolling world ([072dc83](https://github.com/timdixon82/James-Nerf-Squad/commit/072dc83b3e25a873ac31c02c5759f81369d83f08))
* correct tap offset, filter locked weapons from loadout, fix AMMO typo ([8404e27](https://github.com/timdixon82/James-Nerf-Squad/commit/8404e27f93bb20a23d307b8cb6ea1e769237ada5))
* halve boss speed, first boss stationary, update pickup announcement ([a90a88c](https://github.com/timdixon82/James-Nerf-Squad/commit/a90a88cb734feffc6be41c6bad6dfaa67ae0aefa))
* halve boss speed, make first boss stationary, update pickup announcement ([0b77c00](https://github.com/timdixon82/James-Nerf-Squad/commit/0b77c00be099b155a49555faabe063c2003a79d8))
* **level:** distribute platforms across three height tiers to prevent shelf stacking ([3d63ef9](https://github.com/timdixon82/James-Nerf-Squad/commit/3d63ef930c3eca0956fb90bc54eb8c1b559c0cc8))
* **security:** patch pre-tool-use.sh — six safety-hook vulnerabilities ([f528471](https://github.com/timdixon82/James-Nerf-Squad/commit/f528471e4aa8898dee96594a22de8e8a5232ef0b))
* **security:** patch pre-tool-use.sh — six safety-hook vulnerabilities ([c0d7eb9](https://github.com/timdixon82/James-Nerf-Squad/commit/c0d7eb951fac0ed88eef90c128d2e41bc14a04f1))
* **security:** patch pre-tool-use.sh — six safety-hook vulnerabilities ([30f6f00](https://github.com/timdixon82/James-Nerf-Squad/commit/30f6f00b8b03408e66fad3eb2ba9e43ffb4dc1b8))
* touch buttons, shelf overlap, and gameplay dynamics ([838ba15](https://github.com/timdixon82/James-Nerf-Squad/commit/838ba15cd8e277a4c7bd858e6f214c39c6ea891f))
* touch buttons, shelf overlap, and gameplay dynamics ([838ba15](https://github.com/timdixon82/James-Nerf-Squad/commit/838ba15cd8e277a4c7bd858e6f214c39c6ea891f))
* **touch:** correct stale 42 px hit-test to 44 px in _tapGameOver and _tapPause ([bbfbdf7](https://github.com/timdixon82/James-Nerf-Squad/commit/bbfbdf763e8195c955a7302f8bfe6520fc7b50e3))
* **touch:** persist touch button held state across frames via touchHeld map ([fd5a341](https://github.com/timdixon82/James-Nerf-Squad/commit/fd5a341c825cbe9f7319bead9a8f32304f1b3871))

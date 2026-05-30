# Privacy: James Nerf Squad

This document records the privacy posture for James Nerf Squad. Reviewed by Jed on 2026-05-23.

## Analytics

No analytics are currently active. GoatCounter self-hosted analytics are planned (noted in the setup brief). When added, this page must be updated to record what data is collected, whether cookies or local storage are used, and whether a self-hosted or cloud instance is in use. A UK GDPR privacy review is required at that point.

## Data collection statement

James Nerf Squad collects no personal data. Save data (key bindings, appearance colours, high scores, and completed-level flags) is stored locally in the browser using the persistence shim (`utils.js`) and is never transmitted. No accounts, no contact forms, no server.

## Third-party services

**Google Fonts** (`fonts.googleapis.com`): `css/style.css` imports the Press Start 2P font from Google Fonts. This sends the user's IP address to Google's servers on every page load. No personal data is transmitted intentionally, but the IP address is a personal data point under UK GDPR. Self-hosting the font is the preferred alternative (open question from Jed's review). Until the font is self-hosted, this is an accepted privacy consideration documented here.

## UK GDPR obligations

The current codebase processes no personal data. The only network request is the Google Fonts CSS import; this is a standard web-platform privacy consideration but does not create UK GDPR obligations on the project operator, provided no further analytics or tracking are added.

When GoatCounter analytics are added, this section must be reviewed and a lawful basis recorded.

# Brawl Helper Feature Roadmap

## Product language

The product UI and authored content are English-first. All user-facing strings must be kept separate from application logic so additional locales can be added later without rewriting features.

Initial locale: `en`

Future locale candidates: `it`, `es`, `de`, `fr`.

## Brawler Guide — Phase 1

Every Brawler detail page should expose:

- role and short gameplay identity
- strengths and weaknesses
- best modes and map contexts
- recommended Gadget with a plain-English explanation of when to use it
- recommended Star Power with a plain-English explanation of when to use it
- recommended Gears
- Hypercharge / Buffies when applicable
- build alternatives for different modes
- counters and synergies when evidence exists
- owned vs missing components from the player's profile
- "Why this build?" explanation
- source and freshness timestamp

Components should open into a compact detail panel explaining what they do and how they affect gameplay.

## Meta pipeline — Phase 1

Use a controlled provider registry instead of scraping the whole web.

Pipeline:

1. Collect current observations from selected providers.
2. Normalize Brawler, mode, map and build identifiers.
3. Attach source, capture time and sample size.
4. Detect stale or conflicting observations.
5. Calculate confidence.
6. Publish only records passing validation gates.
7. Keep the previous valid snapshot if the new snapshot fails validation.
8. Expose the update timestamp in the app.

## Player-specific recommendations — Phase 1

The recommendation engine combines:

- current external meta context
- the player's owned Brawlers
- Power Level
- available Gadgets / Star Powers / Gears / Hypercharges
- Brawler experience
- mode/map context

The engine must explain recommendations instead of presenting unexplained scores.

## Popup Companion — Phase 2

Deferred until the core guide is stable.

Target UX:

1. User launches Brawl Stars.
2. A lightweight companion surface becomes available if the OS and store policies permit the implementation.
3. It opens on the first Brawler requiring attention.
4. User can move left/right through the priority queue.
5. Each Brawler shows:
   - what to change
   - what to buy/unlock
   - what to equip
   - why
   - current ownership state
6. Completing one Brawler advances to the next.
7. The surface can be dismissed at any time.

Important technical constraint: do not assume that a normal Android app can freely draw over another app. The final implementation must use only platform-supported APIs, explicit user permission where required, and store-compliant behavior. If overlay access is not appropriate, provide an in-app "Upgrade Queue" that reproduces the same workflow.

## Monetization — Phase 1

Default strategy:

- restrained banner in low-friction areas
- no onboarding ads
- no loading ads
- no ads while reading a guide
- limited interstitials only at natural navigation boundaries
- optional rewarded ads only for non-essential convenience
- remote kill switch and frequency caps

Do not enable monetization until privacy, consent, provider configuration and store declarations are aligned.

## Community data — Phase 3

Optional opt-in aggregate statistics:

- most-used Brawlers among Brawl Helper users
- most-equipped builds
- most-requested guides
- trend changes over time

Never expose an individual user's Player Tag or profile through community statistics.

## Multi-language — Phase 2

Keep all strings and authored content locale-aware from the start. Do not translate by replacing strings directly in business logic.

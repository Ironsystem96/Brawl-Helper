# Brawl Helper Feature Roadmap

## Product language

The product UI and authored content are English-first. All user-facing strings must be kept separate from application logic so additional locales can be added later without rewriting features.

Initial locale: `en`

Future locale candidates: `it`, `es`, `de`, `fr`.

## Brawler Guide — Phase 1

The Brawler Guide is the core product surface.

Required:
- full Brawler catalog and search;
- one detail page per Brawler;
- clear account state: EQUIPPED / OWNED / BUY / UNKNOWN;
- clear action state: READY / EQUIP / BUY / CHECK / POWER;
- component icons with stable category fallbacks;
- component detail modal;
- Brawler description and gameplay context;
- recommended build with source and freshness;
- no fabricated build when data is missing.

The MVP navigation is intentionally reduced to Home, Brawler Browser and Upgrade Queue.

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

The recommendation engine should prioritize actionable progression rather than opaque scores.

Inputs:
- owned Brawler;
- Power Level;
- equipped components from the public profile;
- manually confirmed ownership for components that are not equipped;
- validated community build data;
- validated meta context when available.

The output is a short ordered queue:
1. Power progression;
2. BUY actions for confirmed missing components;
3. EQUIP actions for confirmed owned components;
4. CHECK actions for unknown ownership.

Do not label an item BUY merely because it is absent from the profile response.

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

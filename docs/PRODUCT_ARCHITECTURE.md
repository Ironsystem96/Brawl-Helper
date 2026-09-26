# Brawl Helper — Product Architecture

## Product
Brawl Helper is an unofficial Brawl Stars companion/guide. The production app has one active Player Tag per browser/device. Player data is fetched on demand through the backend and cached locally for resilience.

## Core principles
- No Brawl Stars API token in the client.
- No global/current-player state on the server.
- Player cache is keyed by normalized Player Tag.
- Public game/content data is separated from user/profile data.
- Content is data-driven so descriptions, builds, images, meta and guides can be updated without rebuilding the mobile app.
- Collect the minimum analytics required for product improvement and monetization.
- Ads are the initial passive monetization model. Supercell's current Fan Content Policy permits ad monetization but restricts charging for fan-content features unless expressly approved.
- The app must clearly identify itself as unofficial and link to the Fan Content Policy.

## Content layers
1. Game catalog: brawlers, abilities, gears, hypercharges/buffies, modes, maps.
2. Guide content: descriptions, mechanics, tips, counters, synergies, recommended builds.
3. Meta: mode/map recommendations, build usage, confidence, source and freshness.
4. Player layer: owned brawlers, power, trophies and personal recommendations.
5. Optional aggregate layer: anonymized/consented usage statistics and global rankings.

## User safety and privacy
- Player Tag is treated as a game identifier, not as authentication.
- Do not request Supercell credentials, passwords, cookies or session tokens.
- Do not expose server secrets to the app.
- Do not store more profile data than necessary.
- Provide privacy information in-app and on a public URL before store release.
- If an actual Brawl Helper account is introduced later, implement account deletion in-app and through a web endpoint before publishing.
- Analytics and advertising SDKs must be reviewed separately for data collection, consent and store declarations.

## Monetization
Phase 1: non-intrusive banner/interstitial/rewarded advertising only where compatible with store and Supercell policies.
Phase 2: optional creator-program/premium opportunities only after confirming that the exact commercial model is permitted.
Do not build paid fan-content features into the MVP.

## Store strategy
- Android: package as a PWA-compatible/native wrapper or dedicated Android client after the web product is stable.
- iOS: package as a native-capable client; App Store review requirements must be checked again at submission time.
- Store listing must state that the app is unofficial and not endorsed by Supercell.
- Privacy policy, data disclosures, support contact, account/data deletion process (if accounts are introduced), and advertising disclosures must match the implementation.

## Roadmap
### A — Foundation
- Production profile flow
- Secure backend
- Content manifest
- Legal/privacy surfaces
- Remove test profile data from production build

### B — Guide
- Complete brawler catalog
- Images for every brawler and component
- Italian descriptions
- Gadget/star power/gear/hypercharge explanations
- Builds and situational builds
- Search and filters
- Mode/map guide
- On-demand detail pages

### C — Personal advisor
- Account ownership matrix
- Upgrade priorities
- Personal build recommendations
- Mode/map recommendations
- "Why this recommendation?" explanations

### D — Live meta
- Provider ingestion
- Source attribution
- Freshness/confidence
- Meta changelog
- Automated validation before publication

### E — Monetization and analytics
- Consent-aware analytics
- Ad SDK integration
- Ad placement controls
- Crash/error monitoring
- Store privacy/data-safety declarations

### F — Community aggregate
- Opt-in usage telemetry
- Aggregated build usage
- Top-used builds/brawlers
- Global trends
- Anti-abuse/rate limiting
- Never expose another player's private app data

### G — Store release
- Android production build
- iOS production build
- Store assets
- Privacy/legal review
- Security review
- Closed testing
- Production rollout

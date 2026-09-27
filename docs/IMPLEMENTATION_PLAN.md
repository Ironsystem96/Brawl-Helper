# Brawl Helper Implementation Plan

This is the execution plan for the product. Work should proceed in parallel where dependencies allow it.

## Track A — Stability and data foundation
1. Keep the connected Player Tag as the only production account.
2. Keep BlackShark only as a development fixture.
3. Keep the catalog separate from account data.
4. Make BrawlAPI the catalog/asset source and keep source timestamps in generated data.
5. Add local asset generation for portraits and component icons with CDN fallback.
6. Validate generated JSON before publication.
7. Preserve the previous valid snapshot if a provider sync fails.

Exit condition: the app can display the full current catalog with real images and never depends on a user's profile snapshot for catalog completeness.

## Track B — Meta database
1. Collect global Brawler statistics.
2. Collect mode-level statistics.
3. Add map-level statistics only when a source provides a verifiable map observation.
4. Store source, URL, capturedAt, sampleSize, confidence and patch/content version.
5. Normalize raw provider observations before calculating derived Brawl Helper scores.
6. Keep raw observations distinct from derived meta score.
7. Use mode -> global fallback when a map/mode record is missing.
8. Run automated quality gates before publishing.

Exit condition: data/meta.json is a documented, timestamped snapshot rather than an empty placeholder or an undocumented score.

## Track C — Build database and recommendation engine
1. Store gadget/star power/gear usage separately from the Brawler meta signal.
2. Track sample size and provider for every build observation.
3. Combine meta fit, build usage, confidence and account readiness into a documented recommendation priority.
4. Never infer BUY from an absent component.
5. Explain every BUY/EQUIP/CHECK action.
6. Keep recommendation logic in a dedicated module rather than burying it in UI rendering.

Exit condition: Home and Brawler detail can explain why an action appears in the queue.

## Track D — Visual system
1. Replace placeholder symbols with downloaded component assets wherever a real asset exists.
2. Standardize icon sizes, crop rules and loading behavior.
3. Improve the first-use Player Tag onboarding for contrast and hierarchy.
4. Improve Brawler cards with stronger visual grouping and clearer state chips.
5. Improve Brawler detail with a more game-like hero and component grid.
6. Keep dark graphite surfaces with high-contrast text; avoid pure-black and low-contrast gray-on-gray UI.
7. Add skeleton/loading states and clear error states.
8. Add subtle transitions without reducing readability.

Exit condition: no core component slot relies on a symbol when an asset is available.

## Track E — Product features
1. Home: account summary, next upgrades, recent sync state.
2. Brawler Browser: search, filters, current account state, meta/build context.
3. Brawler Guide: mechanics, strengths, weaknesses, recommended builds, matchup/context data.
4. Modes: mode/map meta with freshness and confidence.
5. Upgrade Queue: short actionable list.
6. Later: opt-in aggregate community statistics, history, notifications and companion surfaces.

Exit condition: a user can open the app and reach a useful recommendation in two taps or fewer.

## Track F — Store readiness
1. Privacy policy and data-flow review.
2. Data Safety declarations based on actual SDKs and network calls.
3. Fan-content notice and trademark-safe presentation.
4. Ad SDK integration only after privacy and consent flow is complete.
5. Android packaging and internal testing.
6. iOS packaging after the web/PWA product is stable.

## Parallel work rule
Changes that touch different files should be implemented together. Changes that depend on generated data should run after the data contract is updated. Do not ask for approval for each internal implementation step; stop only when a real product decision is required.

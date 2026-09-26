# Brawl Helper — Security, Privacy, Monetization & Store Readiness

## Security objective
Brawl Helper should be hardened against common accidental data leakage, secret exposure, abuse of public endpoints, content tampering and unsafe third-party SDK integration. Absolute security cannot be guaranteed; the objective is least privilege, minimal data collection, secure defaults and rapid recovery.

## Trust boundaries
- Client: untrusted. Never place API keys, private credentials or administrative secrets here.
- Brawl Helper backend: trusted application boundary, but all client input is untrusted.
- Brawl Stars API: external dependency. Treat responses as untrusted external data.
- Content CDN/providers: external dependencies. Validate/allowlist sources and fail safely.
- Advertising/analytics SDKs: third parties with separate data-processing implications.

## Backend rules
- Normalize and validate Player Tags server-side.
- Never trust a client-supplied player identity for authorization.
- Cache entries by normalized Player Tag; never use one global current-player object.
- Never log full player responses, API tokens or sensitive request headers.
- Apply rate limiting per IP/client fingerprint without using persistent hardware identifiers.
- Set request timeouts, payload limits and bounded caches.
- Return generic errors to clients; keep detailed diagnostics server-side.
- Restrict CORS to known production origins.
- Keep Brawl Stars API token only in server environment variables/secrets.
- Rotate secrets if exposure is suspected.
- Add security headers and HTTPS-only production deployment.
- Validate all remote content before rendering it as HTML; escape user/API text.
- Never execute remote JavaScript from content providers.
- Use allowlisted image/content hosts where practical.
- Maintain dependency updates and vulnerability checks.

## Client privacy
Current product should avoid accounts unless genuinely required.
Store only:
- normalized Player Tag;
- cached profile data needed for offline UX;
- app preferences;
- consent states where required.

Do not request:
- Brawl Stars password;
- Supercell authentication cookies/tokens;
- contacts;
- microphone;
- camera;
- precise location;
- SMS/call data;
- device identifiers for advertising unless a platform/SDK requirement is explicitly reviewed.

## Analytics
Analytics should be privacy-minimized and event-based.
Preferred events:
- app_open;
- guide_open;
- brawler_open;
- recommendation_view;
- build_view;
- search;
- ad_impression;
- ad_interaction;
- crash/error category.

Avoid sending:
- raw Player Tag unless explicitly required and disclosed;
- full player response;
- names or unrelated personal information;
- exact location;
- unnecessary device identifiers.

Aggregate community statistics should be computed from opt-in telemetry and reported only at aggregate thresholds. Never expose one user's private profile through community features.

## Advertising strategy
Ads are a secondary monetization layer, not the product.

Placement rules:
1. No ad before first meaningful app interaction.
2. No ad immediately after every tap.
3. No ad on the Player Tag onboarding screen.
4. No ad while a profile is loading.
5. No ad inside dense guide text where it damages readability.
6. Prefer a single small banner in low-friction screens.
7. Use interstitials only at natural task boundaries and with strict frequency caps.
8. Rewarded ads, if introduced, must be genuinely optional and must not be required to read the guide.
9. Never use deceptive buttons, fake system dialogs or ad-like UI.
10. Disable ad requests when consent is required but not granted.
11. Keep an internal remote configuration for ad frequency so placements can be reduced without shipping a new app build.

Recommended first configuration:
- Home: one restrained banner, subject to final SDK review.
- Brawler detail: no interstitial while reading.
- After a completed navigation/task boundary: occasional interstitial, frequency-capped.
- Guide browsing: no forced ad between every item.
- Rewarded: optional future feature only.

Google Play prohibits unexpected disruptive interstitial behavior and repeated interstitials that distract users. Ads must also comply with applicable developer and advertising policies. See the current Google Play ads policy before release.

## Monetization policy
For Supercell fan content, ads are generally an allowed monetization route under the current Fan Content Policy. Charging for fan-content features is generally restricted unless expressly authorized. Therefore MVP monetization is advertising rather than paid Brawl Helper functionality.

Do not:
- sell Brawl Stars accounts;
- sell boosts;
- facilitate cheats, bots, mods or exploits;
- show political, gambling, weapons, drugs or other prohibited advertising/content;
- imply endorsement by Supercell.

## Content and IP
Use only assets and sources that are permitted under the current Fan Content Policy and applicable licenses. Keep source metadata for externally supplied assets. Do not scrape or republish private or unreleased information.

Every production surface using Supercell assets should expose the required unofficiality notice in a legible location.

## Privacy policy requirements
Before store submission, the privacy page must identify:
- developer/data controller identity;
- contact details;
- categories of data;
- purposes;
- legal bases where applicable;
- local storage;
- backend processing;
- third-party providers;
- advertising SDKs;
- analytics;
- retention/deletion;
- user rights;
- international transfers where applicable;
- consent management;
- complaint/contact process;
- policy version and effective date.

The public privacy URL must be stable, accessible without login and kept synchronized with the actual implementation.

## Store release checklist
Android:
- Play Console Data Safety completed from actual SDK behavior.
- Privacy policy URL active.
- Ads declaration completed if applicable.
- Target SDK/current platform requirements checked.
- Closed testing completed.
- Crash/error monitoring enabled.
- Account deletion flow only if the app introduces accounts.

iOS:
- App Store privacy details completed from actual implementation.
- Privacy policy linked in App Store Connect and in-app.
- ATT/consent requirements evaluated if advertising/analytics require tracking.
- App Review metadata accurately describes the actual app.
- No hidden or undocumented functionality.

## Release gates
A release should not ship if:
- a secret exists in client code;
- a test profile is bundled in production;
- CORS is open unintentionally;
- privacy policy does not match actual data processing;
- advertising SDK behavior is not documented;
- content source/license is unknown;
- Player A can receive Player B's cached response;
- production endpoints lack rate limiting;
- critical dependency vulnerabilities remain unresolved.

## Incident response
If a secret or personal data is exposed:
1. revoke/rotate the secret;
2. disable affected endpoint or feature if necessary;
3. identify affected data scope;
4. preserve relevant security logs without collecting unnecessary personal data;
5. patch and redeploy;
6. assess notification/legal obligations;
7. document the incident and corrective action.

## Product principle
The user should feel that Brawl Helper is fast, useful and quiet:
- useful information first;
- ads second;
- no unnecessary registration;
- no unnecessary permissions;
- no hidden data collection;
- recommendations explained rather than opaque;
- content updated independently from the app binary.

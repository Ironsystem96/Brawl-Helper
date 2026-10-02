# Brawl Helper — Development Status

## Product architecture
- [x] PWA foundation
- [x] Brawler catalog and account ownership layer
- [x] Gadget and Star Power catalog
- [x] Gear catalog and recommendation signals
- [x] Overdrive catalog
- [x] Buffie catalog with Gadget / Star / Hyper categories
- [x] Compact account dashboard Home
- [x] Brawler detail page
- [x] Component detail popups
- [x] Attack / Super detail popups
- [x] Mode / map statistics popups
- [~] Complete asset recovery and visual fallback coverage
- [~] Hypercharge data coverage
- [ ] Mode and map catalog
- [ ] Full meta provider layer
- [ ] Final mobile UX pass
- [ ] Account/API reliability hardening
- [ ] Capacitor Android project generation
- [ ] Android device QA
- [ ] Release APK/AAB
- [ ] Store packaging

## Development rule

Normal implementation decisions are made autonomously. A user decision is required only when a choice materially changes product behavior, privacy, monetization, account/authentication, or release policy.

## Current mobile pipeline

Capacitor 8 configuration is present. The repository can prepare a dedicated www bundle and generate an Android project with npx cap add android. A GitHub Actions workflow builds a debug APK artifact from the main branch.

## Asset policy

Use synchronized IDs and public Brawlify/BrawlAPI asset URLs when an authoritative asset exists. Never invent a game asset or component effect. When an asset is unavailable, render a deliberate semantic fallback instead of a broken-image placeholder.

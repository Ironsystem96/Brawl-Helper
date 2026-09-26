# Brawl Helper — UX Architecture v2

## Product question

The app should answer one question immediately:

> What should I do next with my Brawlers?

Everything else supports that question.

## Primary navigation

Only three persistent destinations are user-facing in the MVP:

1. Home
2. Brawler Browser
3. Upgrade Queue

The former Meta page is an internal/data surface, not a primary user destination.
The former Play page is a secondary Modes surface and should not compete with the upgrade workflow until a validated meta snapshot exists.

## Home

Home is a dashboard, not a catalog.

Order:
1. Account identity and core stats.
2. Three icon actions:
   - Upgrade
   - Brawlers
   - Modes
3. Next upgrades, maximum three.
4. A compact state legend.
5. Brawler Browser CTA.

Do not show a highly developed Brawler merely because it has a high personal score.

## State model

The interface must never collapse different concepts into one label.

- EQUIPPED: reported by the player profile.
- OWNED: manually confirmed by the user.
- BUY: manually confirmed as not owned.
- UNKNOWN: ownership cannot be inferred safely.
- EQUIP: the user owns the recommended component but it is not equipped.
- READY: the recommended component is already equipped.
- POWER: Power Level progression is required.
- DATA PENDING: no validated build/content exists yet.

The public profile must not be treated as a complete ownership inventory when it only exposes the active/equipped selection for a Brawler. The app therefore uses a small local ownership matrix for precise BUY/EQUIP guidance.

## Brawler Browser

The Browser contains the full current catalog, not only owned Brawlers.

Each card answers:
- Do I own this Brawler?
- What Power Level is it?
- What is the next action?
- What does the recommended build look like?
- Can I open the full guide?

Filters:
- All
- Power 11
- Upgrade next
- Needs review

The card itself is the navigation target.

## Brawler detail

A Brawler detail page is the main content unit.

Order:
1. Brawler identity.
2. At a glance / next action.
3. Your equipped setup.
4. Recommended build.
5. Component explanation.
6. Brawler description and gameplay context.
7. Progression map.

Every component is interactive and opens a compact detail modal.

Recommended components must show:
- image or category fallback symbol;
- name;
- description;
- status;
- action;
- manual ownership controls when required.

## Component categories

The data model must be extensible for:
- Gadget
- Star Power
- Gear
- Hypercharge
- Buffie
- Overdrive
- future game-specific upgrade types

If an asset is unavailable, show a stable category symbol rather than an empty/broken image.

## What is deferred

The following are not MVP navigation priorities:
- Android overlay companion.
- Community rankings based on Brawl Helper users.
- Advertising.
- Multi-account management.
- Full social features.
- Provider administration UI.
- Technical meta/database dashboards.

They can be implemented after the core guide and upgrade loop are stable.

## Data truth rules

Never invent:
- a missing build;
- an ownership state;
- an equipped state;
- an image URL;
- a meta ranking.

If data is unavailable, the UI must say so.

## Target user flow

Open app → see next upgrade → tap Brawler → understand current setup → compare recommended build → confirm missing ownership → receive precise BUY/EQUIP queue → return to Upgrade Queue.

The app should feel like a checklist, not a statistics dashboard.

# Brawl Helper Data Pipeline

## Objective

Keep the app useful after game updates without requiring an APK rebuild for normal content and meta changes.

## Source hierarchy

1. Official Brawl Stars API for player/account/progression data.
2. Selected battle-stat providers for meta observations.
3. Selected community-build providers for Gadget, Star Power and Gear usage.
4. Reference/catalog providers for supplementary metadata and event context.
5. Brawl Helper editorial layer for explanations and recommendations.

## What gets stored

Each published record should retain:

- `source`
- `capturedAt`
- `updatedAt`
- `sampleSize` when available
- `confidence`
- `contentVersion`
- normalized Brawler/mode/map IDs

## Editorial layer

Statistics alone are not enough for a guide. Each Brawler should have authored fields for:

- gameplay identity
- strengths
- weaknesses
- recommended situations
- Gadget explanations
- Star Power explanations
- Gear explanations
- alternative builds
- matchup notes
- practical tips

These fields must never be presented as official Supercell recommendations.

## Failure behavior

If a refresh fails:

- retain the last valid snapshot
- mark the snapshot stale
- do not replace good data with empty data
- do not fabricate missing recommendations
- surface the last successful update time

## Update cadence

Meta: daily.

Catalog/reference data: on game patch and at least weekly validation.

Editorial content: whenever a relevant balance/gameplay change occurs.

## Quality gate

A refresh is publishable only when:

- JSON/schema validation passes
- no duplicate canonical Brawler IDs exist
- required fields are present
- source timestamps are valid
- stale records are identified
- confidence is within expected range
- no future/unpublished content is introduced
- the generated report contains no fatal validation errors

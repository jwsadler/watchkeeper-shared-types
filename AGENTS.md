# AGENTS.md — watchkeeper-shared-types

## What this repo is
TypeScript type definitions shared across watch-admin, watchlock, and watchkeeper-extractors. Pinned by SHA in each downstream repo's package.json.

## Rules for Claude Code tasks

1. **James merges every PR here personally.** Do NOT enable auto-merge. Open the PR and stop.
2. **Every PR MUST include rebuilt `dist/*.d.ts`.** Run `npm run build` and commit the regenerated files.
3. **Verify only `.d.ts` + `.d.ts.map` change.** Baseline-diff dist/ against pre-change main to confirm no `.js` files changed; the package is type-only.
4. **Bump `package.json` version** on every PR (patch for additive optional fields, minor for new types or non-additive changes). Use semver.
5. **Downstream repos pin by SHA**, so after James merges, the merged main commit SHA is what downstream admin/watchlock PRs reference.

## Commands
- Build: `npm run build`
- Typecheck: `npx tsc --noEmit`
- No test suite in this repo.

## Where things live
- `src/*.ts` — type definitions. One file per domain object (WatchBrand.ts, WatchReference.ts, CalibreTier.ts, etc.).
- `dist/` — generated, committed.
- `package.json` — version is the only field downstream repos care about.

## Known trap
- Field name collisions on `WatchBrand`: `shopifyEnabled` / `isShopifyBrand` / `showProductLinks` / `ecommercePlatform` are all distinct — see watch-admin's AGENTS.md for the semantic map.

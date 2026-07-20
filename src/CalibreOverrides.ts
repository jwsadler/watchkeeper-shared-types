import type { CalibreTierOverrides } from './CalibreTier';

/**
 * Per-reference overrides layered on top of a {@link WatchReference}'s
 * `calibreCache`. Used when a specific reference legitimately diverges from
 * its linked calibre (e.g. a modified movement with a different rotor). Any
 * field set here wins over the `calibreCache` equivalent at render time.
 *
 * This is an ALIAS of {@link CalibreTierOverrides} — a per-ref override and a
 * tier override target the exact same confirmed override-eligible field set,
 * so they share one schema. Keeping them aliased means expanding
 * `CalibreTierOverrides` automatically expands the per-ref override surface
 * too, with no risk of the two drifting apart.
 */
export type CalibreOverrides = CalibreTierOverrides;

/**
 * Auto-populated snapshot of a linked calibre's EFFECTIVE spec — the base
 * {@link CalibreData} with any tier overrides (per the ref's `calibreTierId`)
 * already applied. Stored inline on a {@link WatchReference} as `calibreCache`
 * and kept fresh by the ref-write cache trigger.
 *
 * This is a full mirror of the overridable + display fields of `CalibreData`,
 * i.e. everything a consumer might render. It deliberately EXCLUDES:
 * - `tiers[]` — tier list belongs on the calibre doc, not per-ref.
 * - `alsoKnownAs` / aliases — catalog metadata, not render spec.
 * - family / manufacturer metadata beyond the deep-link ids below.
 *
 * Consumers read from here directly; there is no need to re-compute the tier
 * overlay at render time. `undefined` on refs without a `calibreId`.
 *
 * All fields optional (a snapshot only carries what the source calibre defines).
 *
 * NOTE on date typing: the admin app writes Firestore Timestamp for `updatedAt`;
 * the RN app converts to `Date`. This shared type uses `Date`, matching the
 * convention on {@link CalibreEntry} / {@link ElectronicModule}.
 */
export interface CalibreCacheSnapshot {
  // ── Identity display ──────────────────────────────────────────────
  /** Canonical calibre name for display (e.g. "Sellita SW200-1"). */
  canonicalName?: string;
  /** FK back to the source manufacturer, for deep-linking. */
  manufacturerId?: string;
  /**
   * Brand this calibre resolves to, derived at cache time from the
   * manufacturer's effective brand set (see manufacturer-first-brand design).
   */
  brandId?: string;

  // ── Movement type ─────────────────────────────────────────────────
  movementType?: string;
  baseMovement?: string;

  // ── Numeric specs ─────────────────────────────────────────────────
  jewels?: number;
  powerReserveHours?: number;
  frequencyVph?: number;
  diameter?: number;
  height?: number;
  positionsAdjusted?: number;
  accuracyLowerSecPerDay?: number;
  accuracyUpperSecPerDay?: number;
  batteryLifeYears?: number;
  shockResistanceG?: number;
  antiMagneticAm?: number;
  antiMagneticGauss?: number;

  // ── Boolean specs ─────────────────────────────────────────────────
  hacking?: boolean;
  manualWinding?: boolean;
  quickSetDate?: boolean;
  isChronograph?: boolean;
  isGMT?: boolean;
  columnWheel?: boolean;
  doubleBarrel?: boolean;
  accuracySymmetric?: boolean;

  // ── Certifications ────────────────────────────────────────────────
  isChronometer?: boolean;
  isCosc?: boolean;
  isGlashuetteRegulation?: boolean;
  isGenevaSeal?: boolean;
  isGrandSeikoStandard?: boolean;
  isMETAS?: boolean;
  isInHouse?: boolean;

  // ── String specs ──────────────────────────────────────────────────
  windingDirection?: string;
  antiShockSystem?: string;
  escapement?: string;
  regulatorSystem?: string;
  hairspring?: string;
  rotorType?: string;
  batteryType?: string;

  // ── Arrays ────────────────────────────────────────────────────────
  date?: string[];
  hands?: string[];
  chronograph?: string[];
  astronomical?: string[];
  acoustic?: string[];
  additionals?: string[];

  // ── Cache metadata ────────────────────────────────────────────────
  /** Which tier was applied when building this snapshot (for badging). */
  tierId?: string;
  /** Display name of the applied tier (for badging). */
  tierName?: string;
  /** When this snapshot was last recomputed. See date-typing note above. */
  updatedAt?: Date;
}

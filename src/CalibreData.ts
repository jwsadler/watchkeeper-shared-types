import type { CalibreImage } from './CalibreImage';
import type { CalibreTier } from './CalibreTier';

/**
 * Technical specifications for a watch calibre/movement.
 *
 * Unified superset used by both admin and RN apps.
 */
export interface CalibreData {
  // Core specs
  movementType?: string;
  frequencyVph?: number;
  jewels?: number;
  powerReserveHours?: number;

  /**
   * Number of positions the calibre is regulated in (e.g. 3, 5, 6).
   * Higher = tighter regulation. Distinct from pocket-watch `adjustments`
   * lookup which mixes positions + temperatures for antiques.
   */
  positionsAdjusted?: number;

  /**
   * Lower bound of daily accuracy in seconds per day. Signed:
   * negative = slow. E.g. COSC lower is -4.
   */
  accuracyLowerSecPerDay?: number;

  /**
   * Upper bound of daily accuracy in seconds per day. Signed:
   * positive = fast. E.g. COSC upper is +6.
   */
  accuracyUpperSecPerDay?: number;

  /**
   * Interpretation flag for `accuracyLowerSecPerDay` / `accuracyUpperSecPerDay`.
   *
   * When `false` or unset (default), the two accuracy fields are SIGNED bounds
   * of an asymmetric range (e.g. COSC: lower=-4, upper=+6). Renders as a signed
   * pair like "-4/+6 sec/day".
   *
   * When `true`, the fields represent a symmetric-range spec: `lower` is the
   * best-case spread (unsigned, `lower <= upper`), `upper` is the worst-case
   * spread. Single symmetric specs collapse `lower === upper` (e.g. ±20 s/day);
   * otherwise renders as a range like "±10 to ±12 sec/day". Either field may
   * still be left undefined.
   */
  accuracySymmetric?: boolean;

  diameterMm?: number;
  heightMm?: number;

  // Winding & regulation
  hacking?: boolean;
  manualWinding?: boolean;
  quickSetDate?: boolean;
  windingDirection?: string;
  manualWindingDirection?: string;
  baseMovement?: string;

  // Certifications
  isCosc?: boolean;
  isGlashuetteRegulation?: boolean;
  isGenevaSeal?: boolean;
  isGrandSeikoStandard?: boolean;
  isMETAS?: boolean;
  isChronometer?: boolean;

  // Complications
  isGMT?: boolean;
  isChronograph?: boolean;
  chronograph?: string[];
  functions?: string[];
  date?: string[];
  hands?: string[];
  additionals?: string[];
  astronomical?: string[];
  acoustic?: string[];

  /**
   * When true, this calibre is a movement-family placeholder rather than a
   * specific calibre reference (e.g. "Felsa Bidynator" covers the
   * 690/692/694/1560/1700 series; "Glashütte Spezimatic" covers GUB Cal
   * 74/75/etc.). Family-marked calibres act as catch-alls for vague historical
   * attributions where the specific reference isn't known. They participate in
   * the catalog normally (AKAs, brand, ref count) but allow consumers to
   * differentiate "I know it's THIS calibre" from "I know it's in this family".
   * Defaults to false/absent — existing calibres are reference-level.
   *
   * @deprecated Renamed to {@link isPlaceholder}. Kept for backward compat —
   * migration to `isPlaceholder` happens in the admin phase. New code should
   * write `isPlaceholder`; readers should tolerate either (`isPlaceholder ??
   * isFamily`) until migration completes.
   */
  isFamily?: boolean;

  /**
   * Marks this calibre as a placeholder / catch-all entry rather than a specific
   * model. Used when refs reference a generic calibre name we haven't broken
   * down into a real entry yet (e.g. "Felsa Bidynator" covering the
   * 690/692/694/1560/1700 series). Renamed from {@link isFamily} (kept for
   * backward compat) — see migration plan in the admin phase. New code should
   * write `isPlaceholder`; readers tolerate either until migration completes.
   */
  isPlaceholder?: boolean;

  // Construction & manufacture
  liftAngleDegrees?: number;
  isInHouse?: boolean;
  countryOfManufacture?: string;
  antiShockSystem?: string;
  rotorType?: string;
  columnWheel?: boolean;
  doubleBarrel?: boolean;
  escapement?: string;
  serviceIntervalYears?: number;
  lignes?: string;
  regulatorSystem?: string;
  casingDiameterMm?: number;
  hairspring?: string;

  /**
   * Balance-wheel type/material (e.g. Glucydur, screw balance, free-sprung).
   * Backed by the `lookup_balance_type` lookup — store the lookup slug.
   */
  balanceType?: string;

  /**
   * Movement construction architecture (e.g. full bridge, three-quarter plate,
   * modular, integrated). Backed by the `lookup_movement_architecture` lookup —
   * store the lookup slug.
   */
  movementArchitecture?: string;

  /**
   * Automatic self-winding architecture (full rotor, micro-rotor, peripheral,
   * bumper/hammer, dual rotor, oscillating weight). Backed by the
   * `lookup_winding_architecture` lookup — stores the lookup slug. Only
   * meaningful when `movementType` carries the `isAuto` property; absent on
   * manual/quartz calibres. Base-movement property — not overridden by tiers.
   */
  windingArchitecture?: string;

  /** Number of going/train bridges in the movement. Precise count — omit unless verified. */
  numberOfBridges?: number;

  /** Number of mainspring barrels (e.g. 1, 2). Precise count — omit unless verified. */
  barrelCount?: number;

  // Decoration & finishing
  /**
   * Degree of openworking / skeletonisation.
   * - `'full'` — fully skeletonised (bridges + mainplate cut away).
   * - `'partial'` — open-heart / partial aperture exposing part of the movement.
   * - `'none'` — solid, no openworking.
   * Omit when unknown rather than defaulting.
   */
  skeletonization?: 'full' | 'partial' | 'none';

  /**
   * Overall level/quality of movement finishing (e.g. industrial, decorated,
   * haute horlogerie). Backed by the `lookup_movement_finishing` lookup — store
   * the lookup slug.
   */
  movementFinishing?: string;

  /**
   * Specific decorative techniques present on the movement (e.g. `perlage`,
   * `cotes-de-geneve`, `anglage`, `blued-screws`, `engraving`, `guilloche`).
   * Backed by the `lookup_movement_decoration` lookup (multi-select) — store
   * lookup slugs. Free-form array; the dedicated `rhodiumPlated` / `giltFinish`
   * booleans below intentionally duplicate two of these values so they remain
   * individually queryable/facetable.
   */
  decorations?: string[];

  /** True when the movement's components carry a rhodium plating/finish. */
  rhodiumPlated?: boolean;

  /** True when the movement carries a gilt (gilded) finish. */
  giltFinish?: boolean;

  // Battery-powered movement fields
  batteryType?: string;
  batteryLifeYears?: number;

  // Durability
  /** Shock resistance in G-force (e.g., 5000) */
  shockResistanceG?: number;
  /** Anti-magnetic rating in A/m (e.g., 4800) */
  antiMagneticAm?: number;
  /** Anti-magnetic rating in Gauss (e.g., 60) */
  antiMagneticGauss?: number;

  /** Calibre images (also stored at entry level) */
  images?: CalibreImage[];

  /** Tier variants (e.g. base / Elaboré / Top / Chronometer). When absent or empty, this calibre has no tiers. */
  tiers?: CalibreTier[];

  /**
   * Display name for the synthetic "base" row in the admin tier list.
   * The calibre's top-level spec IS the base tier; this string is just
   * its display label (e.g. "Base", "Standard", "Grade 0"). Only meaningful
   * when the calibre has entries in `tiers[]` — otherwise there's no tier
   * list to head. Default display is "Base" when unset.
   */
  baseTierName?: string;
}

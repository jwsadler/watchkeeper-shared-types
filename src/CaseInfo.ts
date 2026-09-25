/**
 * Case details for a watch reference.
 *
 * Unified superset of admin `CaseInfo` and RN `WatchReferenceCase`.
 * Includes alternate field-name variants used across Firebase docs.
 */
export interface CaseInfo {
  material?: string;
  /** Case size (alternate field) */
  sizeMm?: number;
  /** String fallback (e.g., "100m", "10 ATM") */
  waterResistance?: string;
  waterResistanceM?: number;
  crystal?: string;
  code?: string;
  widthMm?: number;
  caseBack?: string;
  /** Alternate casing used in some Firebase docs */
  caseback?: string;
  diameter?: number;
  diameterMm?: number;
  /** Alternate for heightMm in some Firebase docs */
  thickness?: number;
  heightMm?: number;
  shape?: string;
  lugWidth?: number;
  lugWidthMm?: number;
  lugToLug?: number;
  lugToLugMm?: number;
  /**
   * Resistance to LOW pressure — a sealed case that stays sealed as ambient
   * pressure DROPS, which is the opposite direction from `waterResistance`.
   *
   * A BOOLEAN AND NOT A RATING, and that was measured rather than assumed.
   * Sinn is the source that publishes it, and across 207 archive references
   * and 14 live ones it is always the bare phrase `Low pressure resistant` —
   * 197 occurrences, one phrasing, never a number. Every figure on the same
   * line is WATER pressure (`Pressure-resistant up to 20 bar`), which belongs
   * to `waterResistance`. The store's own facet list carries it as a named
   * filter value, so it is a boolean in the source's data model too.
   *
   * The absence of a number is meaningful rather than an omission: Sinn
   * quantifies the ratings it can, publishing `Magnetic Field Protection up to
   * 80,000 A/m` and a `-45 °C` to `+80 °C` temperature range in the same
   * specification block. Should a source ever state an altitude or an hPa
   * figure, that is a NEW field beside this one, not a widening of it.
   *
   * NOT a complication, so it is emphatically not a `functions` entry: that
   * vocabulary is chronograph / GMT / moon phase, and admin renders it as
   * complications.
   */
  isLowPressureResistant?: boolean;
  /** Case surface finish (e.g., "Polished", "Brushed") */
  finish?: string;
  /** Case coating (e.g., "DLC", "PVD") */
  coating?: string;
  weightG?: number;
}

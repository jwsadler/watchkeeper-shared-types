/**
 * Dial and hands details for a watch reference.
 *
 * Unified superset of admin `DialAndHandsInfo` and RN `DialReference`.
 */
export interface DialInfo {
  color?: string;
  /** Dial material (e.g., "Lacquer", "Enamel") */
  material?: string;
  /** e.g., "Sunburst", "Matte", "Glossy" */
  finish?: string;
  /** e.g., "Arabic", "Roman", "Indices" */
  indexes?: string;
  /** Alternate field for indexes (multi-select in management app) */
  numerals?: string;
  /** e.g., "Dauphine", "Baton", "Mercedes" */
  hands?: string;
  handsColor?: string;
  /**
   * Comma-joined index color slugs, e.g. "white, gold". Multi-select
   * field backed by `lookup_index_colors`. Mirrors `handsColor`
   * convention. Separate from `color` (the dial background color)
   * and from lume color (planned Phase 2 of dial & hands expansion).
   */
  indexColor?: string;
  /**
   * Comma-joined hand type slugs, e.g. "hour, minute, seconds, gmt".
   * Captures which hand functions are present on the watch. Multi-select
   * field backed by `lookup_hand_types`. Separate from `hands` (the hand
   * STYLE — Dauphine/Baton/Mercedes) and from `handsColor` (the hand
   * COLOR).
   */
  handTypes?: string;
  /** Whether the dial has luminous markers (RN variant) */
  lume?: boolean;
  /** Whether the dial has Luminova (admin variant) */
  luminova?: boolean;
  /** Number of subdials (for chronographs) */
  subdials?: number;
}

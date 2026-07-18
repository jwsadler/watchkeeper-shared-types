/**
 * Pocket-watch-specific fields on a watch reference. Populated when the
 * reference's watchType lookup has the `showPocketWatch` property.
 *
 * Most values are lookup slugs — resolved through the corresponding
 * `lookup_pocket_watch_*` Firestore collection at render time.
 */
export interface PocketWatchInfo {
  /** Free-text grade designation (e.g. "Vanguard", "992B", "Father Time"). Not a lookup — grades are brand-specific. */
  grade?: string;

  /** Key-wound vs stem-wound. */
  isKeyWound?: boolean;

  /** Case style. Slug against lookup_pocket_watch_case_style. */
  caseStyle?: string;

  /** Escapement type. Slug against lookup_pocket_watch_escapement. */
  escapement?: string;

  /** Jewel bearing material. Slug against lookup_pocket_watch_jewel_bearing. */
  jewelBearing?: string;

  /** Lancashire watch size. Slug against lookup_pocket_watch_movement_size. */
  movementSize?: string;

  /** Fusée present. */
  isFusee?: boolean;

  /** Position/temperature adjustments (multi-select). Slugs against lookup_pocket_watch_adjustments. */
  adjustments?: string[];
}

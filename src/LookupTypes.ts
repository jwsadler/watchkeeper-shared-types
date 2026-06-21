/**
 * Lookup types — shared vocabulary/taxonomy collections used across the
 * admin and RN apps (e.g., materials, complications, dial colors).
 *
 * Firestore path: lookups/{collectionId}
 */
export interface LookupValue {
  id: string;
  value: string;
  displayName: string;
  isActive: boolean;
  sortOrder?: number;
  synonyms?: string[];
  metricLabel?: string;
  imperialLabel?: string;
  description?: string;
  /**
   * When true, this value is omitted from AI-enrichment prompt token rendering
   * (the `{{LOOKUP_*}}` substitution in watch-admin functions). Defaults to
   * false / absent — value is included. Does not affect app visibility (see
   * `isActive`).
   */
  excludeFromAI?: boolean;
  /**
   * Small italic muted qualifier line shown under the acquisition entry in the
   * RN explore app (rendered by AcquisitionRelationships), only when present.
   * Used to surface non-typical relationship structure (e.g. "via parent
   * group", "rename, not acquisition"). When undefined/empty, the RN app
   * renders no qualifier line — appropriate for the clean direct-to-direct
   * cases.
   *
   * Currently consumed only by `lookup_acquisition_directness` values; lives on
   * the shared `LookupValue` shape (like `metricLabel`/`excludeFromAI`) because
   * lookup documents have no per-collection interface. Optional for backwards
   * compatibility — existing Firestore documents won't have it.
   */
  rnQualifier?: string;
  group?: string;
  grouping?: string;
  category?: string;
  properties?: string[];
  metadata?: Record<string, any>;
}

export interface LookupCollection {
  id: string;
  name: string;
  description?: string;
  values: LookupValue[];
  version?: number;
  isActive: boolean;
  supportsSynonyms: boolean;
  supportsMeasurement: boolean;
  isMultiSelect: boolean;
  supportsGrouping: boolean;
  lastUpdated?: Date;
  cacheExpiryHours?: number;
}

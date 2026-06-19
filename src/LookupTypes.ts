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

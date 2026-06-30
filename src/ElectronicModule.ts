/**
 * An electronic module entry in the electronic modules database.
 * Path: electronicModules/{docId}
 *
 * First-class entity for the electronics of a digital watch (module number,
 * display, battery, light, sensors …), analogous to {@link CalibreEntry} for
 * mechanical/quartz movements. A {@link WatchReference} links to a module via
 * `moduleId`; the ref keeps a denormalized `electronics` cache that triggers
 * keep fresh from this doc (the module doc is the source of truth).
 *
 * Unified type used by both admin and RN apps.
 * Admin app uses Firestore Timestamp for date fields;
 * RN app converts to Date.
 */
export interface ElectronicModule {
  id: string;
  /** Canonical module name / number (e.g., "UTD-8000", "3200") */
  name: string;
  /**
   * FK into movement_manufacturers — the primary "made by" attribution
   * (populated by the admin app). Mirrors {@link CalibreEntry.manufacturerId}.
   */
  manufacturerId?: string;
  /**
   * Denormalized manufacturer display name, snapshotted from the linked
   * manufacturer doc for cheap reads/search. Source of truth is
   * {@link manufacturerId}; this is kept fresh alongside it.
   */
  manufacturer?: string;
  /** Module generation / revision label (e.g., "Gen 2") */
  generation?: string;
  /**
   * Display technology slug (e.g., "lcd", "oled", "e-ink", "mip").
   * Lookup-backed where applicable.
   */
  displayType?: string;
  /** LCD sub-type slug (e.g., "stn", "negative", "positive"). Lookup-backed. */
  lcdType?: string;
  /** Battery type slug (e.g., "cr2032", "ctl1616"). Lookup-backed. */
  battery?: string;
  /** Rated battery life in months. */
  batteryLifeMonths?: number;
  /** Full-charge time in hours (rechargeable modules). */
  chargeTimeHours?: number;
  /**
   * Backlight / illumination type slug (e.g., "backlight", "eln", "led").
   * Lookup-backed.
   */
  lightType?: string;
  /**
   * On-board sensors (e.g., "altimeter", "barometer", "gps", "compass").
   * Lookup-backed multi-select.
   */
  sensors?: string[];
  /** Rich, manually-authored description: history, notable references. */
  description?: string;
  /** AI-generated module description (populated from enrichment). */
  aiDescription?: string;
  /** Concatenated searchable text (for Algolia). */
  searchText?: string;
  /** Number of references currently linked to this module via `moduleId`. */
  referenceCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

import type { CalibreImage } from './CalibreImage';

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
   * The manufacturer's display name is resolved from this FK at read time (no
   * denormalized snapshot, matching calibre).
   */
  manufacturerId?: string;
  /**
   * IDs of additional manufacturers who co-developed this module with the
   * primary (`manufacturerId`). Used for joint authorship — the module shows
   * up under EACH manufacturer's module list in the RN app and admin.
   *
   * Excludes the primary manufacturerId (don't list a manufacturer in both).
   *
   * Mirrors {@link CalibreEntry.additionalManufacturerIds}.
   */
  additionalManufacturerIds?: string[];
  /**
   * Alternative names / numbers for this module (e.g., Casio 593 → "QW-593").
   * Mirrors {@link CalibreEntry.alsoKnownAs}.
   */
  alsoKnownAs?: string[];
  /** Module generation / revision label (e.g., "Gen 2") */
  generation?: string;
  /**
   * Display technology slug (e.g., "lcd", "oled", "e-ink", "mip").
   * Lookup-backed where applicable.
   */
  displayType?: string;
  /** LCD sub-type slug (e.g., "stn", "negative", "positive"). Lookup-backed. */
  lcdType?: string;
  /**
   * LCD / screen background colour slug. Lookup-backed via
   * `lookup_display_colors`. Default; refs may override at
   * `WatchReference.electronics.displayColor`.
   */
  displayColor?: string;
  /**
   * Segment / text colour slug. Lookup-backed via `lookup_text_colors`.
   * Default; refs may override at `WatchReference.electronics.textColor`.
   */
  textColor?: string;
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
  /**
   * Display layout / segment arrangement of the module's screen (e.g.
   * single-line, multi-line, dual-display). Slug, lookup-backed via
   * `lookup_display_layout`.
   */
  displayLayout?: string;
  /**
   * Optimal viewing angle characteristic of the display panel (e.g. wide,
   * standard). Slug, lookup-backed via `lookup_viewing_angle`.
   */
  viewingAngle?: string;
  /**
   * Daylight-saving-time handling of the module (e.g. manual, automatic,
   * none). Slug, lookup-backed via `lookup_dst_support`.
   */
  dstSupport?: string;
  /**
   * Calendar mechanism type (e.g. auto-calendar, full-auto, perpetual).
   * Slug, lookup-backed via `lookup_calendar_type`.
   */
  calendarType?: string;
  /**
   * Stopwatch / chronograph measuring precision (e.g. 1/100 sec, 1/1000 sec).
   * Slug, lookup-backed via `lookup_stopwatch_precision`.
   */
  stopwatchPrecision?: string;
  /**
   * Primary power source of the module (e.g. battery, solar, kinetic).
   * Slug, lookup-backed via `lookup_power_source`.
   */
  powerSource?: string;
  /**
   * Time synchronisation source (e.g. radio, GPS, Bluetooth, none).
   * Slug, lookup-backed via `lookup_sync_source`.
   */
  syncSource?: string;
  /**
   * Supported time systems / formats (e.g. 12-hour, 24-hour, world time).
   * Multi-select slugs, lookup-backed via `lookup_time_systems`.
   */
  timeSystems?: string[];
  /**
   * Supported alarm types (e.g. daily, snooze, countdown, signal).
   * Multi-select slugs, lookup-backed via `lookup_alarm_types`.
   */
  alarmTypes?: string[];
  /** Rich, manually-authored description: history, notable references. */
  description?: string;
  /** AI-generated module description (populated from enrichment). */
  aiDescription?: string;
  /** Concatenated searchable text (for Algolia). */
  searchText?: string;
  /** Number of references currently linked to this module via `moduleId`. */
  referenceCount?: number;
  /** Data source (e.g., "casio-module-list", "manual"). Mirrors {@link CalibreEntry.source}. */
  source?: string;
  /** URL where module data was sourced from. Mirrors {@link CalibreEntry.sourceUrl}. */
  sourceUrl?: string;
  /** Module images. Mirrors {@link CalibreEntry.images}. */
  images?: CalibreImage[];
  createdAt?: Date;
  updatedAt?: Date;
}

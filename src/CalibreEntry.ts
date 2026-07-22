import type { CalibreData } from './CalibreData';
import type { CalibreImage } from './CalibreImage';

/**
 * A calibre entry in the custom calibres database.
 * Path: custom_calibres/{docId}
 *
 * Unified type used by both admin and RN apps.
 * Admin app uses Firestore Timestamp for date fields;
 * RN app converts to Date.
 */
export interface CalibreEntry {
  id: string;
  /** Canonical calibre name (e.g., "ETA Caliber 2824-2") */
  name: string;
  /** Brand that manufactures or uses this calibre */
  brandName?: string;
  /**
   * FK into `watchBrands` — the brand associated with this calibre, when one
   * is known (e.g. a brand-specific standalone entry, or the brand a calibre
   * is derived-brand-linked to). Distinct from the free-text {@link brandName}.
   * Used as the sensible default when reclassifying a standalone calibre into a
   * brand-specific tier of another calibre.
   */
  brandId?: string;
  /**
   * FK into movement_manufacturers — the primary "made by" attribution
   * (populated by the admin app). Canonical maker; never overridden by an
   * additional co-developer.
   */
  manufacturerId?: string;
  /**
   * IDs of additional manufacturers who co-developed this calibre with the
   * primary (`manufacturerId`). Used for joint authorship — the calibre shows
   * up under EACH manufacturer's calibre list in the RN app and admin.
   *
   * Excludes the primary manufacturerId (don't list a manufacturer in both).
   *
   * Example: UWD 33.1 has manufacturerId="uwd" and additionalManufacturerIds=["sinn"].
   */
  additionalManufacturerIds?: string[];
  /**
   * FK to CalibreFamily. Optional — in-house calibres often don't belong to a
   * family.
   */
  familyId?: string;
  /** Alternative names/aliases (e.g., "Elaboré grade", "SW200-1") */
  alsoKnownAs?: string[];
  /** Rich description: history, notable references, technical significance */
  description?: string;
  /** Technical specifications */
  data: CalibreData;
  /** Data source (e.g., "calibrecorner", "manual") */
  source?: string;
  /** URL where calibre data was sourced from */
  sourceUrl?: string;
  /** Calibre images */
  images?: CalibreImage[];

  /**
   * Soft-delete / alias flag. When true this calibre has been reclassified as a
   * brand-specific tier of another calibre (see {@link redirectToCalibreId}) and
   * must be hidden from pickers, search, explore and admin lists unless a "show
   * deprecated" affordance is toggled on. The document is NEVER hard-deleted —
   * the redirect is a permanent alias so any lingering pointer still resolves.
   * Defaults to false/absent.
   */
  deprecated?: boolean;

  /**
   * When {@link deprecated} is true, the calibre these reads should resolve to.
   * Consumers that fetch a calibre by ID must follow this pointer (one hop — the
   * migration guarantees the target is itself live, so chains never form) and
   * use the target calibre in its place.
   */
  redirectToCalibreId?: string;

  /**
   * When {@link deprecated} is true, the tier ON the {@link redirectToCalibreId}
   * target that this calibre's data now lives as (the brand-specific tier created
   * during reclassification). Pairs with `redirectToCalibreId` to form the full
   * (calibre, tier) redirect target.
   */
  redirectToTierId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Watch Brand — shared across admin app and WatchKeeper RN app.
 *
 * Firestore path: watchBrands/{brandId}
 */
export interface WatchBrand {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  /** AI-generated brand description (populated from enrichment) */
  aiDescription?: string;
  alternativeNames?: string[];
  abbreviations?: string[];
  windingDirections?: string[];
  logo?: string;
  country?: string;
  founded?: number;
  /** Primary website (admin uses mainWebsite, RN uses website — both supported) */
  website?: string;
  mainWebsite?: string;
  mainAddress?: string;
  information?: string;
  /** Parent organization (e.g., "Swatch Group", "LVMH", "Richemont") */
  parentOrg?: string;
  /** Hero/scenic image for brand detail (storage path or URL) */
  heroImage?: string;
  /** When true, always show hero image instead of map even if address exists */
  useHeroImage?: boolean;
  /** Whether this is a microbrand */
  isMicroBrand?: boolean;
  // Shopify integration
  shopifyEnabled?: boolean;
  shopifyUrl?: string;
  excludedProductTypes?: string[];
  lastImportedAt?: Date;
  /**
   * Phase 3 — brand ↔ manufacturer relationship.
   *
   * Final list of manufacturer IDs associated with this brand.
   * Computed server-side as: `(manufacturerIdsDerived ∪ manufacturerIdsManualInclude) \ manufacturerIdsManualExclude`.
   * Clients should read this, not recompute.
   */
  manufacturerIds?: string[];
  /**
   * Derived from ref data — recomputed by Cloud Function trigger as refs are
   * written. Read-only from the client perspective. Source of truth for the
   * "what manufacturers do this brand's calibres come from" question.
   */
  manufacturerIdsDerived?: string[];
  /** Admin-curated additions to the derived set. */
  manufacturerIdsManualInclude?: string[];
  /** Admin-curated removals from the derived set. */
  manufacturerIdsManualExclude?: string[];
  /**
   * Counter aggregation: how many of this brand's refs resolve to each
   * manufacturerId via their calibre. The trigger bumps these on ref write
   * and derives `manufacturerIdsDerived` from non-zero keys. Internal —
   * not intended for direct client read.
   */
  manufacturerCounts?: { [manufacturerId: string]: number };
  createdAt?: Date;
  updatedAt?: Date;
}

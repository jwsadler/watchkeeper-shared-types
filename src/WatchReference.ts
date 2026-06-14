import type { CaseInfo } from './CaseInfo';
import type { DialInfo } from './DialInfo';
import type { ElectronicsInfo } from './ElectronicsInfo';
import type { ImageInfo } from './ImageInfo';
import type { MovementInfo } from './MovementInfo';
import type { ProductionInfo } from './ProductionInfo';
import type { StrapInfo } from './StrapInfo';
import type { WatchLink } from './WatchLink';

/**
 * Which import pipeline produced a reference doc. Mirrors the admin
 * `ImportSourceKind` set (`shopify` / `generic` / `json-feed` / `manual`) plus
 * `ai_curation` for AI-assembled refs. `'shopify'` is the only value that
 * changes doc-identity semantics (composite product+variant id keys); all
 * others keep ref-string-derived identity.
 */
export type ReferenceSource =
  | 'shopify'
  | 'generic'
  | 'json_feed'
  | 'manual'
  | 'ai_curation';

/**
 * Canonical watch reference document stored in Firestore.
 * Path: watchBrands/{brandId}/references/{referenceId}
 *
 * Unified superset of admin `WatchReference` and RN `WatchReferenceDocument`.
 */
export interface WatchReference {
  id: string;
  brandId: string;
  /** Original reference string (e.g., "1675/3") */
  reference: string;
  /** Normalized for search (e.g., "16753") */
  referenceNormalized?: string;
  model: string;
  collection?: string;
  productName?: string;
  description?: string;
  /** AI-generated reference description (populated from enrichment) */
  aiDescription?: string;
  calibre?: string;
  /** Movement type (e.g., "Automatic", "Manual") */
  movementType?: string;
  movement?: MovementInfo;
  nickname?: string;
  specialEdition?: boolean;
  knownDiscontinuation?: boolean;
  series?: string;
  /** e.g., "Analog", "Digital", "Smartwatch" */
  watchType?: string;
  /** Bezel material */
  bezel?: string;
  /** Bezel type (e.g., "Unidirectional", "Bidirectional") */
  bezelType?: string;
  /** Crown type (e.g., "Screw-down", "Push-pull") */
  crownType?: string;
  color?: string;
  glass?: string;
  crystal?: string;
  /** Top-level dial color (synced with dialAndHands.color) */
  dial?: string;
  case?: CaseInfo;
  production?: ProductionInfo;
  strap?: StrapInfo;
  dialAndHands?: DialInfo;
  /** Electronics/module details for digital watches */
  electronics?: ElectronicsInfo;
  /** Separate from features, maps to watch functions */
  functions?: string[];
  /** Key features (e.g., "Chronograph", "Date") */
  features?: string[];
  /** Storage paths requiring resolution */
  images?: ImageInfo[];
  galleryImages?: ImageInfo[];
  /** Direct URLs (already resolved) */
  imageUrls?: string[];
  links?: WatchLink[];
  source?: { url?: string };
  /**
   * Dedicated source product-page URL, surfaced as the "View product page"
   * link on the RN explore reference detail screen. Set at import time (bulk
   * import), editable in the admin ReferenceEditor, and backfilled from the
   * legacy `links[]` "Product Page" entry by the admin Backfill Product URLs
   * tool. This is the ONLY source the RN link reads — `source.url` is
   * unreliable on older scraped refs (it stored an API URL) and is
   * deliberately not consulted.
   */
  productUrl?: string;
  /**
   * Provenance of this reference doc — which import pipeline created it.
   *
   * Drives doc-identity rules: `'shopify'` docs are keyed by composite
   * Shopify product+variant id (see {@link shopifyProductId} /
   * {@link shopifyVariantId}) and may share a non-unique `reference` SKU with
   * sibling Shopify docs; every other source keeps ref-string-derived identity.
   *
   * NOTE: distinct from the legacy `source?: { url?: string }` field above
   * (a source *URL* object, not a provenance tag). Absent on docs written
   * before this field existed.
   */
  sourceType?: ReferenceSource;
  /**
   * Shopify product id (numeric, as a string) this doc was imported from.
   * Set only when {@link sourceType} is `'shopify'`. Present on both variant
   * docs and the synthetic parent doc of a multi-variant product. Combined with
   * {@link shopifyVariantId} it forms the doc's composite, ref-string-independent
   * identity (`shopify__{productId}__{variantId}`; parent: `shopify__{productId}__parent`).
   */
  shopifyProductId?: string;
  /**
   * Shopify variant id (numeric, as a string) this doc was imported from.
   * Set on Shopify variant / standalone docs; ABSENT on the synthetic parent
   * doc (a parent spans all variants of a product). See {@link shopifyProductId}.
   */
  shopifyVariantId?: string;
  /**
   * Doc id of this reference's PARENT ref, when this doc is a variant.
   *
   * Variants are Shopify-product variations of one canonical model — strap
   * size, dial colour, movement option — imported as their own ref docs but
   * grouped under a single parent (the variant-aware Shopify importer sets this
   * on each child). Semantics:
   * - **Absent / undefined** → this doc IS a parent, or a non-variant
   *   standalone (the default for every pre-existing ref and every non-Shopify
   *   brand). Indexed in Algolia and visible to all consumer surfaces.
   * - **Set** → this doc is a variant. It is NOT indexed in Algolia and is
   *   invisible to Explore / My Watches / AI search; consumer search surfaces
   *   only its parent. Variants are addressed directly from Firestore by
   *   `parentReferenceId == <parentId>` (marketplace, future).
   */
  parentReferenceId?: string;
  /**
   * Variant-distinguishing field values aggregated onto a PARENT ref from its
   * variants, so consumer search/filter still works even though the variant
   * docs themselves are not indexed in Algolia. Set by the variant-aware
   * Shopify importer when (and only when) the variants actually differ on that
   * field — if every variant shares one value the parent's own field already
   * covers it and the array is omitted. Each array holds canonical (lookup-
   * resolved) values, same shape a single-value field would. Absent on
   * standalones and non-variant parents.
   */
  dialColorVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct calibres across the variants. */
  movementVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct strap types/materials across the variants. */
  strapTypeVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct case materials across the variants. */
  caseMaterialVariants?: string[];
  /** Whether this reference has a custom/curated image */
  usingCustomImage?: boolean;
  /** Concatenated searchable text */
  searchText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

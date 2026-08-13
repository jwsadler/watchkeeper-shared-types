import type { CalibreCacheSnapshot } from './CalibreCacheSnapshot';
import type { CalibreOverrides } from './CalibreOverrides';
import type { CaseInfo } from './CaseInfo';
import type { DialInfo } from './DialInfo';
import type { ElectronicsInfo } from './ElectronicsInfo';
import type { ImageInfo } from './ImageInfo';
import type { MovementInfo } from './MovementInfo';
import type { PocketWatchInfo } from './PocketWatchInfo';
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
  /**
   * Snapshot of `description` captured immediately before the first AI rewrite
   * overwrites it. Fill-empty-only and write-once: populated by AI-rewrite
   * paths (single-ref editor + bulk description/enrich tools) when they replace
   * `description`, and never overwritten thereafter. Preserves the pre-AI source
   * text for future enrichment context / audit. Not populated at import time and
   * not backfilled — refs that are never AI-rewritten simply lack this field.
   */
  originalDescription?: string;
  /** AI-generated reference description (populated from enrichment) */
  aiDescription?: string;
  calibre?: string;
  /**
   * Optional tier variant of the linked calibre. Only meaningful when
   * the calibre has `tiers[]` defined. `undefined` = tier unspecified.
   */
  calibreTierId?: string;
  /**
   * Foreign key to the linked calibre in the `custom_calibres` collection.
   * When set, `calibreCache` will be auto-populated by the ref-write cache
   * trigger with the effective calibre spec (base + tier overrides applied).
   *
   * Non-breaking coexistence with the legacy `calibre` string field —
   * refs without `calibreId` continue to render from `movement.*` strings.
   * Refs WITH `calibreId` prefer `calibreCache` over legacy strings.
   */
  calibreId?: string;
  /**
   * Auto-populated snapshot of the linked calibre's EFFECTIVE spec — the
   * base calibre with tier overrides (per `calibreTierId`) already applied.
   * Populated by the ref-write cache trigger. Consumers read from here
   * directly; no need to re-compute the tier overlay at render time.
   *
   * Mirror of the base CalibreData spec shape (excluding tiers/aliases/
   * metadata — those don't apply per-ref). Full field set for future-proofing.
   * Undefined when `calibreId` is not set.
   */
  calibreCache?: CalibreCacheSnapshot;
  /**
   * Per-reference overrides layered on top of `calibreCache`. Use when
   * this specific reference legitimately diverges from its linked calibre
   * (e.g. this ref uses a modified movement with a different rotor). Any
   * field set here wins over the calibreCache equivalent at render time.
   * Populated during the calibres-as-modules migration for refs whose
   * legacy `movement.*` values didn't match the linked calibre.
   */
  calibreOverrides?: CalibreOverrides;
  /** Movement type (e.g., "Automatic", "Manual") */
  movementType?: string;
  movement?: MovementInfo;
  nickname?: string;
  specialEdition?: boolean;
  knownDiscontinuation?: boolean;
  series?: string;
  /** e.g., "Analog", "Digital", "Smartwatch" */
  watchType?: string;
  /**
   * Bezel MATERIAL (`lookup_bezel_material`). Named `bezel` rather than
   * `bezelMaterial` for history — it predates the lookup and every reader (the
   * RN app, the brand portal, the dedup differ) is on this key, so the name
   * stays and the lookup is what changed. Single-select: a bezel has one
   * primary material, with a `mixed` slug for two-tone / insert-on-metal cases.
   */
  bezel?: string;
  /** Bezel type (e.g., "Unidirectional", "Bidirectional") */
  bezelType?: string;
  /**
   * Bezel COLOURS — MULTI-VALUE (`lookup_bezel_colors`). A bezel routinely has
   * more than one: a GMT-Master "Pepsi" insert is `["red", "blue"]`, a
   * "Kermit" is `["green", "black"]`. Stored as an array of slugs (the
   * `crownType` / `crystal` / `dialAndHands.indexes` convention), NOT the
   * comma-joined string `handsColor` / `indexColor` use.
   *
   * Distinct from `bezel` (the material) and from `dialAndHands.color` — an
   * all-black ceramic bezel over a white dial carries `["black"]` here.
   */
  bezelColors?: string[];
  /**
   * Case COLOURS — MULTI-VALUE (`lookup_case_colors`). The colour of the case
   * body itself, distinct from `case.material` (what it is made of) and
   * `case.finish` (how the surface is treated): a G-Shock in yellow resin and
   * the same reference in black resin share a material and a finish and differ
   * only here.
   *
   * Array for the same reason `bezelColors` is one — two-tone cases are
   * ordinary (a steel case with a gold bezel-side, a black case with a red
   * accent ring) and forcing a single value would make the second colour
   * unrepresentable.
   *
   * NAMED PLURAL, deliberately, matching `bezelColors`. The singular/plural
   * split is not cosmetic here: an indexer reading `data.bezelColor` — a field
   * that never existed — left that attribute empty on ~87K records for weeks
   * without anything failing, because a missing field and an unauthored one are
   * indistinguishable downstream. One convention for multi-value colours
   * removes the guess.
   *
   * SCORING: the AI identify scorers compare this against a colour read off the
   * photo, and treat an absent value as NEUTRAL rather than a mismatch. That is
   * what makes authoring the control: populate it on references where case
   * colour distinguishes siblings (digital watches, most obviously), leave it
   * blank elsewhere, and the slot simply does not participate.
   */
  caseColors?: string[];
  /**
   * Crown type — MULTI-VALUE (`lookup_crown_types`). A crown is routinely
   * several things at once: an attachment method AND a sealing system AND a
   * shape (Rolex's is `["screw_down", "twinlock"]`). Stored as an array of
   * slugs since v1.53.0; before that it was a scalar, and an import could cram
   * the whole marketing phrase into it ("Screw-down, Twinlock double
   * waterproofness system"). Readers must accept `string` too until the
   * `migrateCrownTypeCrystal` sweep has run everywhere.
   */
  crownType?: string[];
  color?: string;
  glass?: string;
  /**
   * Crystal — MULTI-VALUE (`lookup_crystal_materials`). Holds the material AND
   * its features in one list (`["sapphire_crystal", "cyclops_lens"]`): a
   * deliberate single-vocabulary choice rather than a material/feature split.
   * Same v1.53.0 scalar → array story as `crownType` above.
   */
  crystal?: string[];
  /** Top-level dial color (synced with dialAndHands.color) */
  dial?: string;
  /**
   * Dial STYLE / pattern — a single canonical `lookup_dial_styles` slug
   * (e.g. `panda`, `reverse_panda`, `sunburst`, `gilt`, `salmon`). Deliberately
   * separate from `dial`/`dialAndHands.color`: a "Panda" dial carries the colors
   * (`dialAndHands.color: "white, black"`) AND the style (`dialStyle: "panda"`),
   * so the stylistic distinction (Panda vs Reverse Panda, Sunburst, Tropical …)
   * is preserved rather than collapsed into the color set. Single-value, set on
   * any ref. Resolved to a display name via `lookup_dial_styles`.
   */
  dialStyle?: string;
  case?: CaseInfo;
  production?: ProductionInfo;
  strap?: StrapInfo;
  dialAndHands?: DialInfo;
  /**
   * Pointer to the linked electronic module (`electronicModules/{moduleId}`),
   * the source of truth for this digital watch's electronics. Analogous to a
   * calibre link for mechanical/quartz refs. When set, the inline
   * {@link electronics} object below is an auto-synced cache of that module
   * doc. Absent on non-digital refs.
   */
  moduleId?: string;
  /**
   * Auto-synced cache of the linked `electronicModules/{moduleId}` doc. Source
   * of truth lives on the module entity ({@link ElectronicModule}); these
   * fields are kept fresh via a Cloud Function trigger when {@link moduleId}
   * changes or the module doc updates (mirror of the brand/calibre cache
   * pattern). Do not write directly — write to the module doc instead.
   */
  electronics?: ElectronicsInfo;
  /** Pocket-watch-specific fields. Populated when watchType is pocket_watch (or the watchType lookup has showPocketWatch). */
  pocketWatch?: PocketWatchInfo;
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
   * True when this doc is a child variant of another reference — i.e. exactly
   * when {@link parentReferenceId} is set. Denormalised at write time purely so
   * server-side queries can separate parents from variants.
   *
   * Exists because Firestore's `where('parentReferenceId', '==', null)` does NOT
   * match docs where the field is ABSENT, which is how parents and standalones
   * are actually written. Without this flag, callers must over-fetch and filter
   * client-side, which wrecks pagination for brands with many Shopify variants.
   *
   * Invariant: `isVariant === (parentReferenceId != null)`. Every write path
   * (Shopify importer, admin edit, callables) MUST set it explicitly — the two
   * fields are only ever updated together.
   *
   * Optional solely to cover the pre-backfill window: docs written before this
   * field existed have it absent. Backfilled universally by the
   * `backfillIsVariant` callable, after which absence means "stale doc", not
   * "not a variant". Do not read it as `!isVariant` on unbackfilled data.
   * See project_isvariant_flag memory.
   */
  isVariant?: boolean;
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
  /** See {@link parentReferenceId} aggregation note — distinct `electronics.displayColor` values (digital twin of {@link dialColorVariants}) across the variants. */
  displayColorVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct `electronics.textColor` values (digital twin of segment/text colour) across the variants. */
  textColorVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct calibres across the variants. */
  movementVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct strap types/materials across the variants. */
  strapTypeVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct case materials across the variants. */
  caseMaterialVariants?: string[];
  /** See {@link parentReferenceId} aggregation note — distinct dial styles ({@link dialStyle}) across the variants. */
  dialStyleVariants?: string[];
  /**
   * See {@link parentReferenceId} aggregation note — distinct dial FINISHES
   * (`dialAndHands.finish`, e.g. `sunburst`, `matte`, `gilt`) across the
   * variants, resolved via `lookup_dial_finish`. Distinct from
   * {@link dialStyleVariants}: a finish is a surface treatment, a style is a
   * themed pattern (Panda, Pepsi). Emitted only when ≥2 distinct finishes exist.
   */
  dialFinishVariants?: string[];
  /**
   * Per-field MANUAL-OVERRIDE flags for the aggregated `*Variants` arrays
   * above. Set on a PARENT ref by the admin "Variant Aggregates" editor.
   *
   * - `true`  → the array was hand-edited; the `variantAggregates` propagation
   *   trigger / backfill callable MUST NOT recompute or touch that field.
   * - `false` / absent → the field is auto-managed: every variant write
   *   recomputes it from the parent + its variants (the default for every ref).
   *
   * Each key mirrors an aggregate array name so a single map gates each
   * independently (e.g. a curator can pin `dialColorVariants` while leaving
   * `movementVariants` auto-managed). Absent on standalones and on every parent
   * that has never been manually edited.
   */
  aggregateOverrides?: {
    dialColorVariants?: boolean;
    dialStyleVariants?: boolean;
    dialFinishVariants?: boolean;
    movementVariants?: boolean;
    strapTypeVariants?: boolean;
    caseMaterialVariants?: boolean;
    displayColorVariants?: boolean;
    textColorVariants?: boolean;
  };
  /** Whether this reference has a custom/curated image */
  usingCustomImage?: boolean;
  /** Concatenated searchable text */
  searchText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

import type { TimelineEvent, TimelineEventImage } from './TimelineEvent';
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
    /** Brand logo — canonical URL in our own Firebase Storage (re-uploaded from the source). */
    logo?: string;
    /** Optional attribution — external URL the logo was sourced from (shown in RN). */
    logoSourceUrl?: string;
    /**
     * Short textual description of the brand's dial glyph — the visual mark that
     * appears on the watch face in place of, or in addition to, the brand name.
     * Used by the AI identify extraction prompt to help identify brands whose
     * dials lack prominent brand text (e.g. Christopher Ward's twin flags,
     * Grand Seiko's shield emblem, Cartier's four dots).
     *
     * Kept concise (one sentence). Should describe visual features an AI vision
     * model can recognise — shapes, arrangement, distinctive markings — not
     * marketing prose. A single field rather than a list: where a brand uses
     * more than one glyph, cover them in the one description (e.g. "Four dots
     * surrounding the hands (Santos, Panthère) or CARTIER wordmark below 12
     * (Ballon Bleu, Tank)").
     */
    glyphDescription?: string;
    /**
     * Optional image URL of the brand's dial glyph. Reserved for future
     * multi-image AI vision workflows (Phase 2). Not consumed by extraction yet.
     */
    glyphImageUrl?: string;
    country?: string;
    founded?: number;
    /** Primary website (admin uses mainWebsite, RN uses website — both supported) */
    website?: string;
    mainWebsite?: string;
    mainAddress?: string;
    information?: string;
    /** Parent organization (e.g., "Swatch Group", "LVMH", "Richemont") */
    parentOrg?: string;
    /**
     * FK to the owning organization in `parent_organizations/{parentOrgId}`.
     * Lives alongside the free-text {@link WatchBrand.parentOrg} through the
     * parent-org migration; Phase 5 drops the string field. The legacy
     * `parent_organization` lookup collection is separate and stays alive
     * indefinitely for older clients. Nothing reads or writes this yet.
     */
    parentOrgId?: string;
    /** Hero/scenic image for brand detail (storage path or URL) */
    heroImage?: string;
    /** Optional attribution — URL the hero image was sourced from (shown in RN). */
    heroImageSourceUrl?: string;
    /** When true, always show hero image instead of map even if address exists */
    useHeroImage?: boolean;
    /**
     * When true, render the brand logo over the hero image with no background
     * card — just the glyph on the photo. Default (undefined/false) keeps the
     * existing opaque white card behind the logo. Curator opt-in: only safe
     * when the logo asset itself has transparency and reads clearly on the
     * particular hero image. No automatic detection — the curator decides.
     */
    logoHeroTransparent?: boolean;
    /** Whether this is a microbrand */
    isMicroBrand?: boolean;
    shopifyEnabled?: boolean;
    shopifyUrl?: string;
    excludedProductTypes?: string[];
    lastImportedAt?: Date;
    /**
     * Admin-curated brand ↔ manufacturer link overrides, applied on top of the
     * runtime rollup that resolves a brand's manufacturers from its references.
     * Include forces a link; exclude suppresses one.
     */
    manufacturerIdsManualInclude?: string[];
    manufacturerIdsManualExclude?: string[];
    /**
     * Denormalised count of the brand's LISTABLE references — parents and
     * standalones, i.e. `isVariant === false`. Variants (those carrying a
     * `parentReferenceId`) are excluded, matching the admin references listing and
     * the `referenceCount` semantics on `CustomCalibre` / `ElectronicModule`.
     *
     * SERVER-MAINTAINED — written only by the watchlock Cloud Functions
     * `maintainWatchBrandReferenceCount` trigger (on every ref create/delete/
     * variant-flip under the brand) and the one-shot
     * `recomputeAllWatchBrandReferenceCounts` callable. Never write it from a
     * client; a brand edit that does a full-document `set()` without merging will
     * wipe it until the next ref write or recompute sweep repairs it.
     *
     * Exists so the brands listing can render per-brand counts from the brand docs
     * it already loaded, instead of firing one aggregation query per brand
     * (~200 `runAggregationQuery` calls per page open).
     *
     * Absent on brands that pre-date the field and have not been swept yet — treat
     * `undefined` as "not yet computed", not as zero.
     */
    parentReferenceCount?: number;
    /**
     * Chronological history, rendered as a timeline in both the admin and RN.
     * Curator-authored and/or AI-enriched; absent or empty means the RN renders
     * no timeline section at all rather than a placeholder. See
     * {@link TimelineEvent} for why `date` is a string and `description` is
     * rich-text HTML.
     *
     * The brand-level counterpart of {@link MovementManufacturer.history}, and the
     * phase-2 consumer that `TimelineEvent` was given its own module for. Same
     * type, same semantics, same editor — a brand and a manufacturer differ in
     * what they have a history OF, not in how it is stored.
     */
    history?: TimelineEvent[];
    /**
     * Standalone hero banner image for the history timeline call-to-action.
     * Overrides the default, which is to fall back to the first event's image —
     * so a timeline whose opening event has no image, or whose opening image is
     * a poor banner, can still lead with something deliberate. Absent means use
     * that fallback.
     *
     * Reuses {@link TimelineEventImage} rather than declaring its own shape: it
     * is the same kind of thing, stored the same way, uploaded by the same
     * editor, and it carries the same `aiSuggestion` affordance for a curator who
     * has not sourced a banner yet.
     */
    historyHeroImage?: TimelineEventImage;
    /**
     * Links to records in external data sources (e.g. the Microbrand Atlas
     * reviewer import flow). All optional and additive.
     */
    externalRefs?: {
        microbrandAtlas?: {
            id: string;
            slug: string;
            fetchedAt: Date;
        };
    };
    /**
     * Per-field provenance stamp. Keyed by the WatchBrand field path
     * (e.g. "country", "founder.name"). `rawValue` preserves whatever the
     * source gave us before any normalisation.
     */
    fieldSources?: Record<string, {
        source: string;
        importedAt: Date;
        rawValue: unknown;
    }>;
    /**
     * Headquarters geolocation. Separate from {@link WatchBrand.mainAddress},
     * which is a free-text postal address.
     */
    location?: {
        lat: number;
        lng: number;
    };
    /**
     * True when the brand's own storefront runs on Shopify.
     *
     * NOT the same thing as {@link WatchBrand.shopifyEnabled} /
     * {@link WatchBrand.shopifyUrl}: those control WK's own Shopify
     * product-import for the brand's catalogue, not "the brand's website is a
     * Shopify store". Do not fold this into `shopifyEnabled` — doing so would
     * silently enable product imports for every Shopify-hosted brand.
     */
    isShopifyBrand?: boolean;
    /**
     * Normalised ecommerce platform from Microbrand Atlas (shopify |
     * woocommerce | wix | squarespace | bigcommerce | magento | custom | …).
     * An open `string`, not a union — the upstream list is not closed.
     *
     * Overlaps {@link WatchBrand.isShopifyBrand} for the Shopify case: a brand
     * imported before this field existed can carry `isShopifyBrand: true` with
     * no `ecommercePlatform`, so consumers checking for Shopify should accept
     * either.
     */
    ecommercePlatform?: string;
    /**
     * Founder / primary person. `name` is a single string — co-founders arrive
     * packed into one string from upstream sources and are not split into an
     * array. `lastEditAt` mirrors the upstream `last_founder_edit`, an ISO-8601
     * string that is only ever displayed, never compared — hence `string`
     * rather than `Date`.
     */
    founder?: {
        name?: string;
        managed?: boolean;
        lastEditAt?: string;
    };
    /**
     * Brand's Instagram profile URL. Flat field to mirror the upstream shape
     * and keep the type tiny; a future `socialLinks` object can supersede it.
     */
    instagramUrl?: string;
    /** Primary headquarters city. Free text. */
    city?: string;
    /**
     * Sub-national region of the headquarters — US state, UK county, Canadian
     * province, etc. Free text; no fixed vocabulary.
     */
    stateRegion?: string;
    /**
     * Where the watches are assembled. Free text at country/city granularity.
     * Can differ from {@link WatchBrand.country}, which is where the brand is
     * based.
     */
    assemblyLocation?: string;
    /** Where the watches are designed. Free text. */
    designLocation?: string;
    /**
     * True when a curator has researched and locked {@link WatchBrand.country}.
     * Downstream UIs disable overwrites of the country while this is set, so an
     * import cannot clobber a verified value.
     */
    countryVerified?: boolean;
    /**
     * Lifecycle state. Missing/undefined is treated as `'active'`.
     *
     * - `active`   — currently producing watches.
     * - `dormant`  — the brand exists but has not released in years.
     * - `defunct`  — out of business, no longer producing.
     * - `revived`  — relaunched and producing again; see
     *   {@link WatchBrand.yearRevived} and {@link WatchBrand.predecessorBrand}.
     * - `absorbed` — folded into, or continued under, another brand.
     *
     * Pairs with the admin's `acquisitions[]`, which captures who absorbed the
     * brand. That array lives on the admin's own WatchBrand extension, not in
     * this package.
     *
     * The five values match the admin's existing local `BrandStatus` alias
     * exactly, and `absorbed` is deliberate — existing brand documents already
     * carry it, so it must not be renamed.
     */
    status?: 'active' | 'dormant' | 'defunct' | 'revived' | 'absorbed';
    /**
     * Year the brand was revived under its modern incarnation (4-digit). Only
     * meaningful when `status === 'revived'`.
     */
    yearRevived?: number;
    /**
     * Ownership structure. `subsidiary` implies {@link WatchBrand.parentOrg} and
     * {@link WatchBrand.parentOrgId} are set.
     */
    ownershipType?: 'independent' | 'family-owned' | 'private-equity' | 'public' | 'subsidiary';
    /**
     * When today's brand is a revival of an earlier distinct brand, the name of
     * that predecessor. Free text, not a brand id.
     */
    predecessorBrand?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=WatchBrand.d.ts.map
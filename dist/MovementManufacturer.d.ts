import type { TimelineEvent, TimelineEventImage } from './TimelineEvent';
/**
 * Movement Manufacturer — first-class entity for movement makers
 * (ETA, Sellita, Miyota, in-house manufactures, etc.).
 *
 * Shared across admin app and WatchKeeper RN app.
 *
 * Firestore path: movement_manufacturers/{manufacturerId}
 *
 * The document ID IS the slug (lowercase, dashes, alnum-only),
 * matching the WatchBrand convention — there is no separate `slug` field.
 */
export interface MovementManufacturer {
    /** Slug-style id, e.g. "eta", "miyota", "kenissi". Doc ID == this. */
    id: string;
    /** Canonical full name, e.g. "ETA SA Manufacture Horlogère Suisse". */
    name: string;
    /** Short display name, e.g. "ETA". */
    displayName?: string;
    description?: string;
    /** AI-generated description (populated from enrichment). */
    aiDescription?: string;
    /**
     * Alternative spellings / historical names — used for matching
     * during backfill and future imports.
     */
    alternativeNames?: string[];
    abbreviations?: string[];
    /** Storage path or URL for manufacturer logo. */
    logo?: string;
    /** Optional attribution — URL the logo was sourced from (shown in RN). */
    logoSourceUrl?: string;
    /** Hero/scenic image for manufacturer detail (storage path or URL). */
    heroImage?: string;
    /** Optional attribution — URL the hero image was sourced from (shown in RN). */
    heroImageSourceUrl?: string;
    country?: string;
    /** Year founded. */
    founded?: number;
    website?: string;
    /** Parent organization, e.g. "Swatch Group". */
    parentOrg?: string;
    /**
     * FK to the owning organization in `parent_organizations/{parentOrgId}`.
     * Lives alongside the free-text {@link MovementManufacturer.parentOrg}
     * through the parent-org migration; Phase 5 drops the string field. The
     * legacy `parent_organization` lookup collection is separate and stays alive
     * indefinitely for older clients. Nothing reads or writes this yet.
     */
    parentOrgId?: string;
    /**
     * True for generic / third-party movement makers (ETA, Sellita, Miyota,
     * Ronda, Soprod, etc.). False for in-house manufactures whose movements
     * are exclusive to a single brand.
     */
    isGeneric?: boolean;
    /**
     * Parent manufacturer for historical sub-brands (e.g. Valjoux, Peseux,
     * Unitas, Lemania rolled up under ETA). Phase 4 will wire reads;
     * the field exists on the entity from Phase 2.
     */
    parentManufacturerId?: string;
    /**
     * Maintained array of every ancestor manufacturer's ID (parentManufacturerId,
     * grandparent's id, great-grandparent's id, etc.) — closest ancestor first.
     * Server-computed by an onWrite trigger when parentManufacturerId changes.
     * Used by the RN explore to query the full descendant tree of a manufacturer
     * (`where('manufacturerIdAncestors', 'array-contains', X)`) in a single read
     * instead of walking the chain level-by-level. Mirrors the brand
     * acquiredByBrandIds pattern. Default: empty/absent for root manufacturers
     * with no parent.
     */
    manufacturerIdAncestors?: string[];
    /**
     * Admin-curated allowlist of brands that may link to this manufacturer via
     * derivation. Consulted by the derivation gate only when `isGeneric` is
     * falsy AND `admin_config/derivation_settings.enforceInHouseBrandConstraint`
     * is true. An empty/missing list means "no brand is allowed to derive a
     * link to this in-house manufacturer" — the gate skips the credit.
     *
     * Generic manufacturers bypass this gate entirely.
     */
    brandIdsManualInclude?: string[];
    /**
     * Auto-populated brand set derived from actual ref usage — for each
     * ref that uses a calibre from this manufacturer, that ref's brand
     * gets added here. Populated by the `deriveManufacturerBrands`
     * callable. Complements `brandIdsManualInclude` (manual curation).
     *
     * Effective brand set for this manufacturer = union(manual, derived) - exclusions.
     * Undefined = never populated / no ref data available.
     */
    brandIdsDerivedFromRefs?: string[];
    /**
     * The primary brand this manufacturer is most associated with. Used
     * for "single answer" needs (deep-link default, primary badge, etc.).
     * Must be one of `brandIdsManualInclude` or `brandIdsDerivedFromRefs`.
     * When multiple brands apply, this disambiguates.
     */
    primaryBrandId?: string;
    /**
     * Brand IDs to EXCLUDE from the effective brand set — dismisses false
     * positives from `brandIdsDerivedFromRefs`. Rarely needed; explicit
     * escape hatch for when derivation surfaces a wrong link (e.g. an
     * ambiguous ref that misidentified the maker).
     */
    brandExclusions?: string[];
    /**
     * Chronological history, rendered as a timeline in both the admin and RN.
     * Curator-authored and/or AI-enriched; absent or empty means the RN renders
     * no timeline section at all rather than a placeholder. See
     * {@link TimelineEvent} for why `date` is a string and `description` is
     * rich-text HTML.
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
     * When true, the manufacturer's timeline link is NOT shown from its primary
     * brand's pages. Absent/undefined means false — the link is shown. Only
     * meaningful alongside {@link MovementManufacturer.primaryBrandId}; it
     * suppresses one surface and does not hide the timeline anywhere else.
     */
    hideTimelineFromPrimaryBrand?: boolean;
    /**
     * Founder / primary person. Minimal shape mirroring {@link WatchBrand.founder}:
     * `name` is a single string — co-founders packed into one string, not an array.
     * Most movement manufacturers have no single founder (they emerged out of
     * mergers of older ebauche houses), so this field is often absent.
     */
    founder?: {
        name?: string;
    };
    /** Primary headquarters city. Free text. */
    city?: string;
    /**
     * Sub-national region of the headquarters — Swiss canton, Japanese prefecture,
     * US state, German state, etc. Free text; no fixed vocabulary.
     */
    stateRegion?: string;
    /**
     * Where the movements are actually assembled — the main manufacturing site,
     * free text at country or city granularity. Often differs from a mailing
     * address (ETA: Grenchen; Miyota: Kaizuka; Sellita: La Chaux-de-Fonds).
     */
    assemblyLocation?: string;
    /**
     * Manufacturer's Instagram profile URL. Flat field, mirroring
     * {@link WatchBrand.instagramUrl}. Many manufacturers do not have one.
     */
    instagramUrl?: string;
    /**
     * Lifecycle state. Missing/undefined is treated as `'active'`.
     *
     * - `active`   — currently producing.
     * - `dormant`  — still exists but has released nothing in years.
     * - `defunct`  — out of business, no longer producing.
     * - `revived`  — relaunched and producing again; see
     *   {@link MovementManufacturer.yearRevived} and
     *   {@link MovementManufacturer.predecessorManufacturer}.
     * - `absorbed` — folded into, or continued under, another manufacturer
     *   (Valjoux, Peseux, Unitas, Lemania are classic examples).
     *
     * Values intentionally match {@link WatchBrand.status} exactly, so the admin's
     * local `BrandStatus` alias can be reused for both entities.
     */
    status?: 'active' | 'dormant' | 'defunct' | 'revived' | 'absorbed';
    /**
     * Year the manufacturer was revived under its modern incarnation (4-digit).
     * Only meaningful when `status === 'revived'`.
     */
    yearRevived?: number;
    /**
     * Year the manufacturer ceased trading or was folded in (4-digit). Only
     * meaningful when `status === 'defunct'` or `status === 'absorbed'`.
     *
     * Mirrors the admin's local extension of the same name — hoisted into shared
     * types so the AI-enrichment output validator can share the field semantics
     * with the client. {@link WatchBrand} deliberately does NOT carry `yearCeased`:
     * absorbed/defunct brands rarely have a clean cease year, where manufacturers
     * (Valjoux, Peseux, Unitas, Lemania) do.
     */
    yearCeased?: number;
    /**
     * Ownership structure. Values intentionally match
     * {@link WatchBrand.ownershipType} so the admin can reuse one enum for both.
     * `subsidiary` implies {@link MovementManufacturer.parentOrg} /
     * {@link MovementManufacturer.parentOrgId} are set.
     */
    ownershipType?: 'independent' | 'family-owned' | 'private-equity' | 'public' | 'subsidiary';
    /**
     * When today's manufacturer is a revival of an earlier distinct manufacturer
     * (not just a rename), the name of that predecessor. Free text, not an id.
     * Mirrors {@link WatchBrand.predecessorBrand}.
     */
    predecessorManufacturer?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=MovementManufacturer.d.ts.map
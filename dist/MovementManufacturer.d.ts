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
    /** Hero/scenic image for manufacturer detail (storage path or URL). */
    heroImage?: string;
    country?: string;
    /** Year founded. */
    founded?: number;
    website?: string;
    /** Parent organization, e.g. "Swatch Group". */
    parentOrg?: string;
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
     * Brand IDs known to use this manufacturer's movements.
     * Final list — mirrors `WatchBrand.manufacturerIds` on the other side.
     * Populated by the Phase 3 trigger.
     */
    brandIds?: string[];
    /**
     * Derived from ref data — recomputed by the Cloud Function trigger as
     * refs are written. The Phase 3 trigger has no per-manufacturer manual
     * override surface (overrides live on the brand side); `brandIds` is
     * currently equivalent to `brandIdsDerived`, but the field is kept for
     * symmetry with `WatchBrand.manufacturerIdsDerived` and to leave room
     * for future per-manufacturer overrides.
     */
    brandIdsDerived?: string[];
    /**
     * Counter aggregation: how many refs (across all brands) resolve to this
     * manufacturer per brand. The trigger bumps these on ref write; the
     * derived set is `{ k | brandCounts[k] > 0 }`. Internal.
     */
    brandCounts?: {
        [brandId: string]: number;
    };
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
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=MovementManufacturer.d.ts.map
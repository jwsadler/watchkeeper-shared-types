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
    /** Optional attribution — URL the hero image was sourced from (shown in RN). */
    heroImageSourceUrl?: string;
    /** When true, always show hero image instead of map even if address exists */
    useHeroImage?: boolean;
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
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=WatchBrand.d.ts.map
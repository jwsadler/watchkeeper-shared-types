/**
 * One named tier in a manufacturer's own grading vocabulary — e.g. Sellita's
 * Standard / Elaboré / Top / Chronometer ladder, or a brand-specific variant
 * such as Atowak's SW200 gold-rotor tier.
 *
 * Lives in two places with the same shape:
 *
 * - {@link MovementManufacturer.tierVocabulary} — the manufacturer-wide list.
 * - {@link CalibreFamily.tierVocabulary} — additions/overrides layered on top
 *   of the manufacturer's list for one family.
 *
 * This is vocabulary only: it names tiers and their spellings. The per-calibre
 * spec differences still live on {@link CalibreTier}.
 */
export interface TierVocabularyEntry {
    /** Stable slug/uuid minted by the admin on create. */
    id: string;
    /** The manufacturer's own spelling, e.g. "Elaboré", "Premium". */
    canonicalName: string;
    /**
     * Other spellings and synonyms, including localized variants
     * (e.g. "Elabore", "Elaborated"). Empty array when there are none.
     */
    akas: string[];
    /**
     * Optional position on the manufacturer's ladder: 0 = base grade,
     * ascending. Absent means the tier is unranked.
     */
    rank?: number;
    /** One-sentence summary of what the tier is. */
    description?: string;
    /**
     * FK into `watchBrands`. When set, this is a brand-specific tier (e.g.
     * Atowak's SW200 gold-rotor variant); absent means a general
     * manufacturer grade.
     */
    brandId?: string;
}
//# sourceMappingURL=TierVocabularyEntry.d.ts.map
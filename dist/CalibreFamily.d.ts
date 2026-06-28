/**
 * A grouping of calibres under a single manufacturer (e.g. Sellita SW200 family).
 * Calibres reference a family via CalibreEntry.familyId. The base calibre is the
 * family's structural root (e.g. SW200-1 for the SW200 family); other members are
 * variations.
 *
 * Inspired-by captures cross-manufacturer lineage (e.g. Sellita SW200 inspired by
 * ETA 2824). Points at another family OR a specific calibre — usually a family.
 *
 * Unified type used by both admin and RN apps.
 * Admin app uses Firestore Timestamp for date fields; RN app converts to Date.
 */
export interface CalibreFamily {
    /** Firestore doc id */
    id?: string;
    /** FK → MovementManufacturer */
    manufacturerId: string;
    /** Unique per manufacturer (e.g. "SW200") */
    name: string;
    /** e.g. "SW200 Family" */
    displayName: string;
    slug: string;
    description?: string;
    /** FK → CalibreEntry, the family's structural root */
    baseCalibreId?: string;
    inspiredBy?: CalibreFamilyInspiredBy;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Cross-manufacturer lineage pointer for a CalibreFamily. Points at another
 * family OR a specific calibre — usually a family.
 */
export interface CalibreFamilyInspiredBy {
    type: 'family' | 'calibre';
    /** When type === 'family' */
    familyId?: string;
    /** When type === 'calibre' */
    calibreId?: string;
    /** Always set, for display label */
    manufacturerId: string;
}
//# sourceMappingURL=CalibreFamily.d.ts.map
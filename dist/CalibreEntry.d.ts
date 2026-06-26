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
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=CalibreEntry.d.ts.map
/**
 * Image associated with a calibre entry.
 */
export interface CalibreImage {
    /** Firebase Storage path */
    storagePath?: string;
    /** Direct URL (legacy, pre-Storage migration) */
    url?: string;
    /** Image source (e.g., "calibrecorner", "manual", "brand") */
    source: string;
    /** Optional caption */
    caption?: string;
}
//# sourceMappingURL=CalibreImage.d.ts.map
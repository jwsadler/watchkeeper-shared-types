/**
 * Image stored in Firebase Storage for a reference.
 *
 * Unified superset of admin `ImageInfo` and RN `WatchReferenceImage`.
 */
export interface ImageInfo {
    /** e.g., "brands/omega/references/<docId>/image-1.jpg" */
    storagePath: string;
    /** e.g., "image/jpeg" */
    contentType: string;
    /** Display order */
    index: number;
    tags?: string[];
}
//# sourceMappingURL=ImageInfo.d.ts.map
/**
 * Dial and hands details for a watch reference.
 *
 * Unified superset of admin `DialAndHandsInfo` and RN `DialReference`.
 */
export interface DialInfo {
    color?: string;
    /** Dial material (e.g., "Lacquer", "Enamel") */
    material?: string;
    /** e.g., "Sunburst", "Matte", "Glossy" */
    finish?: string;
    /** e.g., "Arabic", "Roman", "Indices" */
    indexes?: string;
    /** Alternate field for indexes (multi-select in management app) */
    numerals?: string;
    /** e.g., "Dauphine", "Baton", "Mercedes" */
    hands?: string;
    handsColor?: string;
    /** Whether the dial has luminous markers (RN variant) */
    lume?: boolean;
    /** Whether the dial has Luminova (admin variant) */
    luminova?: boolean;
    /** Number of subdials (for chronographs) */
    subdials?: number;
}
//# sourceMappingURL=DialInfo.d.ts.map
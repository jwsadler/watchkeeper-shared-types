/**
 * Case details for a watch reference.
 *
 * Unified superset of admin `CaseInfo` and RN `WatchReferenceCase`.
 * Includes alternate field-name variants used across Firebase docs.
 */
export interface CaseInfo {
    material?: string;
    /** Case size (alternate field) */
    sizeMm?: number;
    /** String fallback (e.g., "100m", "10 ATM") */
    waterResistance?: string;
    waterResistanceM?: number;
    crystal?: string;
    code?: string;
    widthMm?: number;
    caseBack?: string;
    /** Alternate casing used in some Firebase docs */
    caseback?: string;
    diameter?: number;
    diameterMm?: number;
    /** Alternate for heightMm in some Firebase docs */
    thickness?: number;
    heightMm?: number;
    shape?: string;
    lugWidth?: number;
    lugWidthMm?: number;
    lugToLug?: number;
    lugToLugMm?: number;
    /** Case surface finish (e.g., "Polished", "Brushed") */
    finish?: string;
    /** Case coating (e.g., "DLC", "PVD") */
    coating?: string;
    weightG?: number;
}
//# sourceMappingURL=CaseInfo.d.ts.map
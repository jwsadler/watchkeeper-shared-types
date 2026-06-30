/**
 * Electronics/module details for digital watches.
 *
 * Unified superset of admin `ElectronicsInfo` and RN `ElectronicsReference`.
 */
export interface ElectronicsInfo {
    /** Module number (e.g., "3200") */
    module?: string;
    /** Display type (e.g., "Negative", "Positive") */
    display?: string;
    /** LCD type (e.g., "LCD", "STN") */
    lcdType?: string;
    /** Backlight type (e.g., "Electro Luminescence (EL)", "LED") */
    lightType?: string;
    /** Battery type (e.g., "CTL1616") */
    battery?: string;
    /** Battery life info (e.g., "Rechargeable") */
    batteryLife?: string;
    /** Charge time (e.g., "2.5 hours", "About 2 hours") */
    chargeTime?: string;
    /** Timekeeping type (e.g., "Digital", "Analog") */
    timekeeping?: string;
    /**
     * Per-ref display background colour for digital watches — the digital
     * equivalent of the dial background (`DialInfo.color`). e.g. the green-grey
     * of a classic LCD or the black of an OLED panel. Lives on the ref (lookup-
     * backed via `lookup_display_colors`), not on the shared module doc.
     */
    displayColor?: string;
    /**
     * Per-ref segment / text colour for digital watches — the digital equivalent
     * of `DialInfo.handsColor`. The colour of the digits/segments rendered on the
     * display. Lives on the ref (lookup-backed via `lookup_text_colors`), not on
     * the shared module doc.
     */
    textColor?: string;
}
//# sourceMappingURL=ElectronicsInfo.d.ts.map
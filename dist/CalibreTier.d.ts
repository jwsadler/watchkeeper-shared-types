/**
 * A tier variant of a base calibre. Manufacturers often tier calibres
 * (e.g. Sellita SW200-1 base / Elaboré / Top / Chronometer) with
 * different regulation grades, component materials, and specs.
 *
 * `overrides` is a partial view of the base calibre's technical spec
 * (see {@link CalibreData}) restricted to fields that admin considers
 * legitimately overridable at the tier level. Identity fields (the
 * canonical name and manufacturer on the CalibreEntry, and
 * baseMovement / movementType on CalibreData) can never be overridden.
 */
export interface CalibreTier {
    /** Stable ID for this tier — used to reference from WatchReference. */
    id: string;
    /** Display name (e.g. "Elaboré", "Top", "Chronometer"). */
    name: string;
    /** Optional short description of what makes this tier distinct. */
    description?: string;
    /**
     * What kind of tier this is:
     *
     * - `'general'` — a grade/decoration level defined by the movement
     *   *manufacturer* (e.g. Sellita's Standard / Elaboré / Top / Chronometer).
     *   Universal: applies across every brand that uses the base calibre.
     * - `'brand-specific'` — a modification a specific *brand* applies on top of
     *   the base movement (e.g. Mühle Glashütte's SW200 mod, a Rolex-adjusted
     *   ETA 2892). Scoped to that brand's references only; `brandId` is required.
     *
     * Absent/undefined is treated as `'general'` by consumers for backward
     * compatibility — tiers created before this field existed are all general
     * grades. New code should always set it explicitly.
     */
    tierType?: 'general' | 'brand-specific';
    /**
     * FK into `watchBrands` — the brand that owns this modification. REQUIRED
     * when `tierType === 'brand-specific'`, and must be absent for general tiers
     * (a general grade belongs to the manufacturer, not a brand). Enforced at
     * the application layer, not the type layer.
     */
    brandId?: string;
    /** Field overrides for this tier. Applied on top of the base calibre. */
    overrides: CalibreTierOverrides;
}
/**
 * Subset of CalibreData fields that a tier can override. Structured as a
 * separate type (rather than Partial<CalibreData>) to make the whitelist
 * explicit and enforceable at compile time.
 */
export interface CalibreTierOverrides {
    isChronometer?: boolean;
    isCosc?: boolean;
    isGlashuetteRegulation?: boolean;
    isGenevaSeal?: boolean;
    isGrandSeikoStandard?: boolean;
    isMETAS?: boolean;
    regulatorSystem?: string;
    hairspring?: string;
    rotorType?: string;
    /**
     * Anti-shock protection system override (e.g. "incabloc", "kif").
     * String reference to the shock_protection lookup — same shape as
     * the base `CalibreData.antiShockSystem` field.
     */
    antiShockSystem?: string;
    escapement?: string;
    jewels?: number;
    powerReserveHours?: number;
    hacking?: boolean;
    quickSetDate?: boolean;
    /** Number of positions the tier is regulated in (e.g. 3, 5, 6). */
    positionsAdjusted?: number;
    /** Lower bound of daily accuracy in seconds per day (signed; negative = slow). */
    accuracyLowerSecPerDay?: number;
    /** Upper bound of daily accuracy in seconds per day (signed; positive = fast). */
    accuracyUpperSecPerDay?: number;
    /**
     * Interpretation flag for `accuracyLowerSecPerDay` / `accuracyUpperSecPerDay`.
     *
     * When `false` or unset (default), the two accuracy fields are SIGNED bounds
     * of an asymmetric range (e.g. COSC: lower=-4, upper=+6).
     *
     * When `true`, the fields represent a symmetric-range spec: `lower` is the
     * best-case spread (unsigned, `lower <= upper`), `upper` is the worst-case
     * spread. Single symmetric specs collapse `lower === upper` (e.g. ±20 s/day).
     */
    accuracySymmetric?: boolean;
}
//# sourceMappingURL=CalibreTier.d.ts.map
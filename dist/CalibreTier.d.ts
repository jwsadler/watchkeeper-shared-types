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
}
//# sourceMappingURL=CalibreTier.d.ts.map
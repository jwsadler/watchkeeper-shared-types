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
     * Rotor / oscillating weight material for this tier (e.g. `steel`,
     * `18k-rose-gold`, `platinum`, `tungsten`). Backed by the
     * `lookup_rotor_material` lookup (single-select) — store the lookup slug,
     * same shape as the base `CalibreData.rotorMaterial` field. REPLACES the
     * base value when set: a Top tier fitted with a gold rotor over the base's
     * steel one sends `'18k-rose-gold'`. Absent means no change from base.
     */
    rotorMaterial?: string;
    /**
     * Bridge (and, where they share a material, mainplate) material for this
     * tier (e.g. `german-silver`, `nickel-silver`, `brass`, `18k-rose-gold`).
     * Backed by the `lookup_bridge_material` lookup (single-select) — store the
     * lookup slug, same shape as the base `CalibreData.bridgeMaterial` field.
     * REPLACES the base value when set — the common case for a tier that swaps
     * rhodium-plated brass bridges for German silver or solid gold. Absent
     * means no change from base.
     */
    bridgeMaterial?: string;
    /**
     * Case materials this TIER is offered in (e.g. `18k-rose-gold`,
     * `platinum`). Backed by the `lookup_case_material` lookup (multi-select) —
     * store lookup slugs, same shape as the base
     * `CalibreData.caseMaterialsAvailable` field. REPLACES the base list
     * wholesale rather than merging into it, so list the tier's FULL set: a
     * precious-metal-only tier of a calibre otherwise sold in steel sends
     * `['18k-rose-gold', 'platinum']`, not just the additions. Absent means no
     * change from base; an empty array strips the base restriction entirely.
     */
    caseMaterialsAvailable?: string[];
    /**
     * REPLACES the base `balanceType` list wholesale for this tier — same shape
     * as base, list the tier's FULL balance attribute set (not just the
     * additions). Example: ETA 2824 Top tier upgrades from base `['glucydur']`
     * to `['glucydur', 'free-sprung']` — send both slugs. Absent means no
     * change from base; empty array strips the base's balance metadata.
     */
    balanceType?: string[];
    /**
     * Anti-shock protection system override (e.g. "incabloc", "kif").
     * String reference to the shock_protection lookup — same shape as
     * the base `CalibreData.antiShockSystem` field.
     */
    antiShockSystem?: string;
    escapement?: string;
    /**
     * Whether this tier carries a date complication, overriding the base
     * calibre's `date[]` presence. `true` — the tier adds a date the base
     * lacks; `false` — the tier drops the date the base carries (a no-date
     * Rolex 3230 against the dated 3235, the subseconds-only Panerai P.9000
     * variants). Absent leaves the base `date[]` untouched, and `true` on a
     * base that already carries `date[]` is a no-op. Coarse presence only —
     * it cannot name the date TYPE, so a tier that adds a date the base has
     * no entry for renders as an unqualified date.
     */
    hasDate?: boolean;
    /**
     * Primary mainplate finishing treatment for this tier (e.g. `sunburst`,
     * `frosted`, `sandblasted`, `perlage-mainplate`,
     * `cotes-de-geneve-mainplate`). Backed by the `lookup_plate_finishing`
     * lookup (single-select) — store the lookup slug, same shape as the base
     * `CalibreData.plateFinishing` field. REPLACES the base value when set;
     * absent means no change from base. Names the one defining treatment —
     * every other technique the tier adds belongs in `decorations` below.
     */
    plateFinishing?: string;
    /**
     * Decorative techniques this tier carries (e.g. `perlage`,
     * `cotes-de-geneve`, `anglage`, `blued-screws`). Backed by the
     * `lookup_movement_decoration` lookup (multi-select) — store lookup slugs,
     * same shape as the base `CalibreData.decorations` field. REPLACES the
     * base array wholesale rather than merging into it, so list the tier's
     * full set: NOMOS 1TSDP carries everything the plain 1TS does plus its
     * added finishing. An empty array strips the base decoration entirely.
     */
    decorations?: string[];
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
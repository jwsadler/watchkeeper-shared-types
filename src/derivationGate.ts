/**
 * Brand ↔ manufacturer derivation gate.
 *
 * Single source of truth for the rule that decides whether a brand may be
 * linked to a movement manufacturer. Every consumer (the watchlock on-write
 * trigger, the watchlock recount callable, the watchlock RN chip-strip filter,
 * and the watch-admin backfill) MUST call this predicate rather than
 * re-implementing the logic inline.
 *
 * The predicate is pure (no I/O). Callers resolve the manufacturer document
 * however they like — a live Firestore read, a prefetched map, an Algolia
 * record, or an already-hydrated client object — and pass its relevant fields
 * in. The "manufacturer document does not exist" case is expressed by passing
 * `manufacturer = null`, which the gate treats as allowed (matching the legacy
 * behaviour of both the trigger and the recount callable).
 */

/**
 * The subset of a `movement_manufacturers/{id}` document the gate inspects.
 * Pass `null` when the manufacturer document could not be found.
 */
export interface BrandManufacturerGateData {
  /** `true` for generic / third-party makers (ETA, Sellita…). Generics bypass the gate. */
  isGeneric?: boolean;
  /**
   * Admin-curated allowlist of brandIds permitted to link to this in-house
   * manufacturer. Consulted only when the manufacturer is non-generic and the
   * constraint is enforced.
   */
  brandIdsManualInclude?: string[];
}

/** Mirrors `admin_config/derivation_settings`. */
export interface BrandManufacturerGateOptions {
  /**
   * When `true`, a non-generic (in-house) manufacturer only links to brands on
   * its `brandIdsManualInclude` allowlist. When `false`, the gate is a no-op
   * and every link is allowed.
   */
  enforceInHouseBrandConstraint: boolean;
}

/**
 * Decide whether `brandId` may be linked to the manufacturer identified by
 * `manufacturerId`.
 *
 * Order of checks (matches the legacy trigger and recount implementations):
 *  1. Missing `manufacturerId` → not allowed.
 *  2. Brand-self link (`brandId === manufacturerId`) → allowed. In-house brands
 *     own a manufacturer doc with the same docId (rolex/rolex, ap/ap), so this
 *     link must not depend on `brandIdsManualInclude` being curated.
 *  3. Constraint disabled → allowed (gate is a no-op).
 *  4. Manufacturer document missing (`manufacturer === null`) → allowed; let
 *     downstream missing-doc handling decide.
 *  5. Generic manufacturer → allowed.
 *  6. Otherwise → allowed only if `brandId` is on `brandIdsManualInclude`.
 */
export function isBrandManufacturerLinkAllowed(
  brandId: string,
  manufacturerId: string | null | undefined,
  manufacturer: BrandManufacturerGateData | null | undefined,
  options: BrandManufacturerGateOptions,
): boolean {
  if (!manufacturerId) return false;
  if (brandId === manufacturerId) return true;
  if (!options.enforceInHouseBrandConstraint) return true;
  if (!manufacturer) return true;
  if (manufacturer.isGeneric === true) return true;
  const include = Array.isArray(manufacturer.brandIdsManualInclude)
    ? manufacturer.brandIdsManualInclude
    : [];
  return include.includes(brandId);
}

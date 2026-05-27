/**
 * Server-side derivation settings.
 *
 * Firestore path: admin_config/derivation_settings
 *
 * Controls the brand ↔ manufacturer derivation pipeline. The flag is read by
 * the watchlock Cloud Functions trigger + recount callable each time they
 * credit (or recount) a brand→manufacturer link.
 */
export interface DerivationSettings {
  /**
   * When true, the derivation gate refuses to credit a brand→manufacturer
   * link unless the manufacturer is marked `isGeneric` OR the brandId is
   * present in the manufacturer's `brandIdsManualInclude`.
   *
   * Default `true`. When false, all derived links are credited as in
   * Phase 3 — the gate becomes a no-op.
   */
  enforceInHouseBrandConstraint: boolean;
}

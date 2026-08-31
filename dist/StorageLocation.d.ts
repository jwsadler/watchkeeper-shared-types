/**
 * Physical storage location taxonomy for an owned watch.
 *
 * Backs the RN app's 8-category structured storage picker — there is no free
 * text entry. Slugs are the canonical vocabulary and match the document ids of
 * the `lookup_storage_locations` Firestore collection, so display labels,
 * ordering and icons are resolved from Firestore rather than hardcoded in
 * either client.
 *
 * Which categories carry extra behaviour is NOT decided here. Each
 * `lookup_storage_locations` value carries an opt-in `properties` flag list —
 * `isOffSite` (the watch is not physically with its owner), `hasAppliance`
 * (the category links to a catalogued {@link UserWinder} instance) and
 * `hasLocationDetails` (the category offers the free-text
 * {@link StorageLocationDetails} block). That keeps those decisions in the
 * Lookup Manager, where a new category can declare its own answers, rather
 * than in slug lists a new category would silently fall out of. This union is
 * the type-level source of truth for which slugs are LEGAL, and nothing more.
 *
 * See also {@link WatchStorageFields} for the fields these values land on, and
 * {@link UserWinder} for the per-user appliance instance referenced when the
 * category carries `hasAppliance`.
 */
export type StorageLocationCategory = 'bank_vault' | 'personal_safe' | 'winder' | 'display_case' | 'worn' | 'in_transit' | 'at_service' | 'other';
/**
 * All storage categories in canonical display order.
 *
 * Useful for exhaustiveness checks and for seeding / validating the
 * `lookup_storage_locations` collection. Runtime display order and labels come
 * from that lookup collection — this array is the type-level source of truth
 * for which slugs are legal, not a presentation concern.
 *
 * `at_service` sits beside `in_transit` because the two are the off-site pair,
 * and `other` stays last because it is the fallback rather than a peer.
 */
export declare const STORAGE_LOCATION_CATEGORIES: StorageLocationCategory[];
//# sourceMappingURL=StorageLocation.d.ts.map
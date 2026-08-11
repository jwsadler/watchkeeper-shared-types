/**
 * Physical storage location taxonomy for an owned watch.
 *
 * Backs the RN app's 7-category structured storage picker — there is no free
 * text entry. Slugs are the canonical vocabulary and match the document ids of
 * the `lookup_storage_locations` Firestore collection, so display labels,
 * ordering and icons are resolved from Firestore rather than hardcoded in
 * either client.
 *
 * See also {@link WatchStorageFields} for the fields these values land on, and
 * {@link UserWinder} for the per-user winder instance referenced when the
 * category is `winder`.
 */
export type StorageLocationCategory =
  | 'bank_vault'
  | 'personal_safe'
  | 'winder'
  | 'display_case'
  | 'worn'
  | 'in_transit'
  | 'other';

/**
 * All storage categories in canonical display order.
 *
 * Useful for exhaustiveness checks and for seeding / validating the
 * `lookup_storage_locations` collection. Runtime display order and labels come
 * from that lookup collection — this array is the type-level source of truth
 * for which slugs are legal, not a presentation concern.
 */
export const STORAGE_LOCATION_CATEGORIES: StorageLocationCategory[] = [
  'bank_vault',
  'personal_safe',
  'winder',
  'display_case',
  'worn',
  'in_transit',
  'other',
];

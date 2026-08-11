"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_LOCATION_CATEGORIES = void 0;
/**
 * All storage categories in canonical display order.
 *
 * Useful for exhaustiveness checks and for seeding / validating the
 * `lookup_storage_locations` collection. Runtime display order and labels come
 * from that lookup collection — this array is the type-level source of truth
 * for which slugs are legal, not a presentation concern.
 */
exports.STORAGE_LOCATION_CATEGORIES = [
    'bank_vault',
    'personal_safe',
    'winder',
    'display_case',
    'worn',
    'in_transit',
    'other',
];
//# sourceMappingURL=StorageLocation.js.map
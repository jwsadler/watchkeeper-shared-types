"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATCH_STORAGE_FIELD_KEYS = void 0;
/**
 * The storage field keys, as a runtime value.
 *
 * Lets the RN serializer for shares and bookmarks strip the same keys at
 * runtime that {@link OmitWatchStorageFields} strips at compile time, without
 * restating the list — the two levers stay in lockstep because they read from
 * here.
 *
 * ⚠️ EVERY new member of {@link WatchStorageFields} must be added here in the
 * same commit. A field declared above but missing here is stripped by the
 * compiler and NOT by the runtime backstop, which is the exact gap an
 * `any`-typed serializer or a cloud function payload slips through.
 */
exports.WATCH_STORAGE_FIELD_KEYS = [
    'storageLocation',
    'winderUserRef',
    'winderSlot',
    'storageLocationDetails',
];
//# sourceMappingURL=WatchStorageFields.js.map
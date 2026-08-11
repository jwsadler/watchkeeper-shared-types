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
 */
exports.WATCH_STORAGE_FIELD_KEYS = [
    'storageLocation',
    'winderUserRef',
    'winderSlot',
];
//# sourceMappingURL=WatchStorageFields.js.map
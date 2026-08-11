import type { StorageLocationCategory } from './StorageLocation';
/**
 * The physical-storage fields carried by an owned watch document.
 * Path: users/{uid}/watches/{watchId}
 *
 * The owned-watch type itself lives in the watchlock (RN) repo, not in this
 * package — it is not shared with watch-admin, which treats watch documents as
 * opaque and never decrypts them. This interface is the shared mirror of just
 * the storage block, so the field names have a single source of truth across
 * repos: watchlock's watch type extends it, and this package's
 * {@link OmitWatchStorageFields} strips exactly these keys.
 *
 * ENCRYPTED AT REST: all three fields live inside watchlock's encrypted watch
 * blob (WatchEncryptionService), which encrypts the whole document rather than
 * a field allowlist — so these fields are covered without registration. They
 * are opaque ciphertext to Firestore rules, cloud functions and watch-admin.
 * Treat the declared types as the plaintext shape the RN app sees after
 * decryption.
 *
 * All three are also stripped from every shared, bookmarked and non-owner
 * exported projection — see {@link OmitWatchStorageFields}. The owner-generated
 * insurance and general PDF exports consume the full watch type and DO render
 * them.
 */
export interface WatchStorageFields {
    /**
     * Where the watch physically lives. One of the 7 structured categories —
     * no free text. ENCRYPTED at rest.
     */
    storageLocation?: StorageLocationCategory | null;
    /**
     * FK to `users/{uid}/winders/{winderId}` — the owner's own
     * {@link UserWinder} instance, NOT the `winders/{id}` admin catalog entry.
     * Named `winderUserRef` rather than `winderId` to keep that direction
     * unambiguous. Set when `storageLocation === 'winder'`. ENCRYPTED at rest.
     */
    winderUserRef?: string | null;
    /**
     * 1-indexed slot within a multi-slot winder. Optional even when
     * `winderUserRef` is set — a user may record the winder without the slot.
     * ENCRYPTED at rest.
     */
    winderSlot?: number | null;
}
/**
 * The storage field keys, as a runtime value.
 *
 * Lets the RN serializer for shares and bookmarks strip the same keys at
 * runtime that {@link OmitWatchStorageFields} strips at compile time, without
 * restating the list — the two levers stay in lockstep because they read from
 * here.
 */
export declare const WATCH_STORAGE_FIELD_KEYS: readonly ["storageLocation", "winderUserRef", "winderSlot"];
/** Union of the storage field names. */
export type WatchStorageFieldKey = (typeof WATCH_STORAGE_FIELD_KEYS)[number];
/**
 * Strips the storage fields from a watch-shaped type.
 *
 * Generic because the owned-watch type lives in watchlock; that repo applies it
 * as `type SharedWatch = OmitWatchStorageFields<Watch>` and types every
 * bookmark write, share write and non-owner export as `SharedWatch`. That makes
 * it impossible at compile time to smuggle a storage location into a shared
 * surface. A runtime omit in the serializer (keyed off
 * {@link WATCH_STORAGE_FIELD_KEYS}) backstops any path the type system doesn't
 * cover, such as a cloud function.
 */
export type OmitWatchStorageFields<T> = Omit<T, WatchStorageFieldKey>;
//# sourceMappingURL=WatchStorageFields.d.ts.map
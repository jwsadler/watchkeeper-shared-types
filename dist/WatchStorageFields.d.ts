import type { StorageLocationCategory } from './StorageLocation';
/**
 * The free-text record of WHERE a storage location actually is, and who to ask
 * about it.
 *
 * The category says a watch is in a bank vault; this says which bank, which
 * box, and who to call. That is the half an insurer and an executor need and
 * the app had nowhere to put — a catalogued appliance ({@link UserWinder})
 * answers it for a winder or a safe, but a vault, a watchmaker's bench or a
 * loan to a family member has no catalogue entity behind it and never will.
 *
 * ENTIRELY VOLUNTARY. Every field is optional and none is ever required to
 * save a storage location; a category on its own stays a complete answer. The
 * block is offered only on categories whose `lookup_storage_locations` value
 * carries the `hasLocationDetails` property, so which categories ask is data,
 * not code.
 *
 * ⚠️ This is the most sensitive thing on a watch document. A street address
 * plus a box number plus a contact name is a burglary brief, which is why it
 * is a {@link WatchStorageFields} member: it inherits the whole storage
 * block's protections at once — encrypted at rest inside watchlock's watch
 * blob, and stripped from every shared, bookmarked and non-owner projection by
 * {@link OmitWatchStorageFields} and {@link WATCH_STORAGE_FIELD_KEYS}. It is
 * rendered ONLY on the owner's insurance PDF, never on the shareable details
 * PDF.
 */
export interface StorageLocationDetails {
    /**
     * The institution or premises, as its owner would name it — "Barclays,
     * Kensington High St", "Master Watchmakers Ltd".
     *
     * Separate from {@link StorageLocationDetails.address} because it is the line
     * an underwriter actually reads, and because a name is often all the owner
     * knows or is willing to record.
     */
    locationName?: string;
    /** Street address, free text and multi-line. */
    address?: string;
    /** Who to ask for — a vault manager, a watchmaker, the family member holding it. */
    contactName?: string;
    /**
     * A number to call. Free text, deliberately unvalidated: international
     * formats, extensions and "ask for the service desk" are all legitimate, and
     * an executor needs whatever the owner would have dialled.
     */
    contactPhone?: string;
    /**
     * The reference that identifies THIS watch's place there — a safe deposit box
     * number, a service job number, a loan agreement reference.
     */
    referenceNumber?: string;
    /** Anything the fields above have no room for. */
    notes?: string;
}
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
 * ENCRYPTED AT REST: all four fields live inside watchlock's encrypted watch
 * blob (WatchEncryptionService), which encrypts the whole document rather than
 * a field allowlist — so these fields are covered without registration, nested
 * objects included. They are opaque ciphertext to Firestore rules, cloud
 * functions and watch-admin. Treat the declared types as the plaintext shape
 * the RN app sees after decryption.
 *
 * All four are also stripped from every shared, bookmarked and non-owner
 * exported projection — see {@link OmitWatchStorageFields}. The owner-generated
 * insurance PDF consumes the full watch type and DOES render them; the
 * shareable details PDF deliberately does not.
 */
export interface WatchStorageFields {
    /**
     * Where the watch physically lives. One of the 8 structured categories —
     * no free text. ENCRYPTED at rest.
     */
    storageLocation?: StorageLocationCategory | null;
    /**
     * FK to `users/{uid}/winders/{winderId}` — the owner's own
     * {@link UserWinder} instance, NOT the `winders/{id}` admin catalog entry.
     * Named `winderUserRef` rather than `winderId` to keep that direction
     * unambiguous. ENCRYPTED at rest.
     *
     * ⚠️ THE NAME IS HISTORICAL AND IS NOT BEING CHANGED. It now points at any
     * catalogued storage appliance — safes and display cases included — see
     * {@link WinderEntry.applianceKind}. Set when the watch's category carries
     * the `hasAppliance` property (today `winder`, `personal_safe` and
     * `display_case`). Renaming
     * it would mean decrypting, rewriting and re-encrypting every watch document
     * in every collection to buy nothing but a better word.
     */
    winderUserRef?: string | null;
    /**
     * 1-indexed slot within a multi-slot winder. Optional even when
     * `winderUserRef` is set — a user may record the winder without the slot.
     * ENCRYPTED at rest.
     *
     * Winders only. A safe holds N watches with no slot identity, so this stays
     * null when the referenced appliance is one.
     */
    winderSlot?: number | null;
    /**
     * Free-text detail about the location itself — see
     * {@link StorageLocationDetails}. ENCRYPTED at rest, and the most sensitive
     * member of this block.
     *
     * Cleared when `storageLocation` changes: a vault's address is not merely
     * stale once the watch is in a display case, it is wrong.
     */
    storageLocationDetails?: StorageLocationDetails | null;
}
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
export declare const WATCH_STORAGE_FIELD_KEYS: readonly ["storageLocation", "winderUserRef", "winderSlot", "storageLocationDetails"];
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
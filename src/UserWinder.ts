/**
 * A winder instance owned by a specific user.
 * Path: users/{uid}/winders/{winderId} — owner reads/writes only.
 *
 * Sits between the admin catalog and the user's watches: the user picks a
 * {@link WinderEntry} from the `winders/*` catalog, then adds their own
 * nickname / serial / purchase details here. A watch stored on a winder
 * references THIS document's id via {@link WatchStorageFields.winderUserRef},
 * never the catalog id directly — so two users owning the same catalog model
 * keep entirely separate instances.
 *
 * ENCRYPTED AT REST: `serialNumber`, `purchaseLocation` and `notes` are
 * encrypted client-side by the RN app before write (PR 4). They are opaque
 * ciphertext to Firestore rules, cloud functions and watch-admin, none of which
 * decrypt. Treat the declared types as the plaintext shape the RN app sees
 * after decryption.
 *
 * Unified type used by both admin and RN apps.
 * Admin app uses Firestore Timestamp for date fields;
 * RN app converts to Date.
 */
export interface UserWinder {
  /** Client-generated document id. */
  id: string;
  /** Owning user's uid. Mirrors the `{uid}` path segment; enforced by rules on create/update. */
  ownerUid: string;
  /** FK to `winders/{id}` — the admin catalog entry this instance is a copy of. */
  winderCatalogId: string;
  /** User's own label (e.g., "Living room winder"). */
  nickname?: string;
  /** Serial number. ENCRYPTED client-side. */
  serialNumber?: string;
  /** ISO 8601 date string (client clock). */
  purchaseDate?: string;
  /** Purchase price in `purchaseCurrency`. */
  purchasePrice?: number;
  /** ISO 4217 currency code for `purchasePrice` (e.g., "GBP"). */
  purchaseCurrency?: string;
  /** Where it was bought (dealer / retailer / city). ENCRYPTED client-side. */
  purchaseLocation?: string;
  /** Free-form owner notes. ENCRYPTED client-side. */
  notes?: string;
  /**
   * Number of slots on this instance. Seeded from
   * {@link WinderEntry.slotCount}; the user may override it (catalog data can
   * be wrong or the model may ship in multiple configurations).
   */
  slotCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

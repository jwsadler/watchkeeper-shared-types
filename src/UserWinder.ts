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
  /**
   * How much of {@link purchaseDate} the owner actually knew.
   *
   * A purchase date is routinely remembered as a year, or a month and a year,
   * and nothing narrower. The date itself is always stored as a full ISO
   * string, so without this a year-only answer is indistinguishable from the
   * 1st of January — the reader has no way to tell a real day from a padded
   * one, and re-rendering promotes the guess into a fact.
   *
   * Mirrors the same pairing on an owned watch's purchase details. Absent means
   * the date was never narrowed, and consumers should treat it as a full date.
   */
  purchaseDateFormat?: 'year' | 'month-year' | 'full-date';
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

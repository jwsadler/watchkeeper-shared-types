import type { TimelineEvent, TimelineEventImage } from './TimelineEvent';

/**
 * Parent Organization — first-class entity for the legal entities that OWN
 * brands or movement manufacturers as portfolio assets: holding companies,
 * foundations, conglomerates, PE portfolios (Swatch Group, LVMH, Richemont,
 * Hans Wilsdorf Foundation). NOT movement suppliers, and NOT brand-under-brand
 * relationships.
 *
 * Shared across admin app and WatchKeeper RN app.
 *
 * Firestore path: parent_organizations/{parentOrgId}
 *
 * The document ID IS the slug (lowercase, dashes, alnum-only), matching the
 * WatchBrand and MovementManufacturer convention — there is no separate `slug`
 * field.
 *
 * Phase 1 of the parent-org first-class-entity migration: the shape only.
 * Nothing reads or writes this collection yet. Brands and manufacturers point
 * at it via `parentOrgId`, which lives alongside their legacy free-text
 * `parentOrg` string until Phase 5 drops the string.
 *
 * The legacy `parent_organization` LOOKUP collection is a separate source and
 * stays alive indefinitely for older RN clients. The two are NOT auto-synced —
 * exactly as `lookup_movement_manufacturer` survives alongside
 * `movement_manufacturers` — so nothing should assume one mirrors the other.
 */
export interface ParentOrganization {
  /** Slug-style id, e.g. "swatch-group", "lvmh". Doc ID == this. */
  id: string;
  /** Canonical full name, e.g. "The Swatch Group Ltd". */
  name: string;
  /** Short display name, e.g. "Swatch Group". */
  displayName?: string;
  description?: string;
  /**
   * Alternative spellings / historical names — used for matching the legacy
   * free-text `parentOrg` strings during backfill and future imports.
   */
  alternativeNames?: string[];
  abbreviations?: string[];
  /** Storage path or URL for the organization logo. */
  logo?: string;
  /** Optional attribution — URL the logo was sourced from (shown in RN). */
  logoSourceUrl?: string;
  country?: string;
  /** Year founded. */
  founded?: number;
  website?: string;
  /**
   * Parent organization that owns THIS organization, for nested ownership
   * (e.g. Rolex SA under the Hans Wilsdorf Foundation). Same field name and
   * meaning as `parentOrgId` on WatchBrand and MovementManufacturer: "the
   * organization that owns this".
   */
  parentOrgId?: string;
  /**
   * Maintained array of every ancestor organization's ID (parentOrgId,
   * grandparent's id, etc.) — closest ancestor first. Intended to be
   * server-computed when parentOrgId changes, so a full descendant tree can be
   * queried with `where('parentOrgIdAncestors', 'array-contains', X)` in a
   * single read. Mirrors {@link MovementManufacturer.manufacturerIdAncestors}.
   * Empty/absent for root organizations.
   */
  parentOrgIdAncestors?: string[];
  status?: 'active' | 'defunct' | 'divested';
  /**
   * Chronological narrative history, rendered as a timeline — same type,
   * semantics and editor as {@link WatchBrand.history} and
   * {@link MovementManufacturer.history}.
   */
  history?: TimelineEvent[];
  /**
   * Standalone hero banner image for the history timeline call-to-action —
   * same field, meaning and editor as {@link WatchBrand.historyHeroImage} and
   * {@link MovementManufacturer.historyHeroImage}. Overrides the default, which
   * is to fall back to the first event's image; absent means use that fallback.
   *
   * Reuses {@link TimelineEventImage} rather than declaring its own shape, for
   * the same reasons the brand and manufacturer fields do: the same kind of
   * thing, stored the same way, uploaded by the same editor.
   */
  historyHeroImage?: TimelineEventImage;
  /**
   * Structured ownership facts — acquisitions, divestitures, absorptions, and
   * the takeovers and spin-outs this organization was itself the subject of —
   * with foreign keys to the entities involved. Deliberately separate from
   * {@link ParentOrganization.history}: `history` is curated narrative,
   * `ownershipEvents` is queryable data. Stored as an array on this document,
   * not a subcollection, like `history`.
   */
  ownershipEvents?: ParentOrgOwnershipEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * One ownership fact in a {@link ParentOrganization}'s portfolio history.
 *
 * STORED INLINE in {@link ParentOrganization.ownershipEvents}. There are no
 * per-event `createdAt`/`updatedAt` fields on purpose: Firestore's
 * `serverTimestamp()` cannot be written inside array elements, so the parent
 * document's timestamps are the only reliable ones.
 *
 * `date` follows the same free-form rules as {@link TimelineEvent.date} —
 * `"1988"`, `"circa 1985"`, `"Between 1943 and 1948"` — and is never a JS
 * `Date`.
 *
 * There is no `direction` field: `type` already carries it. This organization
 * is the ACTOR in `acquired` and `divested`, and the SUBJECT of `acquired_by`
 * and `divested_from`; `founded` and `renamed` are about the organization
 * itself. Every event is read from this organization's side.
 */
export interface ParentOrgOwnershipEvent {
  /** Stable id within the array, so an event can be edited without relying on its index. */
  id: string;
  /** Free-form date string. NOT a JS `Date` — see {@link TimelineEvent.date}. */
  date: string;
  /**
   * What happened, read from this organization's side.
   *
   * - `acquired` — this organization took control of the target.
   * - `divested` — this organization sold or spun off the target.
   * - `acquired_by` — this organization ITSELF was taken over. The target is
   *   the buyer.
   * - `divested_from` — this organization ITSELF was sold off or spun out. The
   *   target is the former parent it left.
   * - `absorbed` — the target was merged in and ceased to exist separately.
   * - `founded` — this organization created the target.
   * - `renamed` — the target changed name.
   *
   * A change of control is never `other`: an inbound takeover is `acquired_by`
   * and a spin-out is `divested_from`.
   */
  type:
    | 'acquired'
    | 'divested'
    | 'acquired_by'
    | 'divested_from'
    | 'founded'
    | 'absorbed'
    | 'renamed'
    | 'other';
  /** Which collection {@link ParentOrgOwnershipEvent.targetId} points into. */
  targetType: 'brand' | 'manufacturer' | 'parentOrg';
  /**
   * FK into `watchBrands`, `movement_manufacturers` or `parent_organizations`,
   * per `targetType`.
   *
   * It is always the OTHER party to the event, except for the two types that
   * are about the organization itself (`founded`, `renamed`), where it is the
   * organization's own id. So on `acquired_by` it is the buyer and on
   * `divested_from` it is the former parent — both `parentOrg` — rather than
   * this organization. There is deliberately no `newOwnerId`: one field holds
   * the counterparty whichever way the deal ran.
   */
  targetId: string;
  /**
   * FK to the prior owner in `parent_organizations`, when known — whoever held
   * the target immediately before this event.
   *
   * On `acquired_by` the target is the buyer, so this is who held THIS
   * organization before them, not the buyer. On `divested_from` the target
   * already IS the former parent, so it adds nothing and is normally absent.
   */
  previousOwnerId?: string;
  description?: string;
  /** URL the event was sourced from — provenance for a factual claim. */
  sourceUrl?: string;
  /**
   * Model confidence, 0..1, when this event came from AI enrichment. Absent on
   * curator-authored events. Same semantics as {@link TimelineEvent.aiConfidence}.
   */
  aiConfidence?: number;
  /** Optional image for the event. */
  image?: TimelineEventImage;
}

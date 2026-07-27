/**
 * Roadmap — project backlog items surfaced in the admin "Roadmap" panel.
 *
 * Items were previously trapped in orchestrator memory files; this model moves
 * them into Firestore so the admin app can list, filter and comment on them.
 *
 * Firestore paths:
 *   roadmap/{itemId}
 *   roadmap/{itemId}/comments/{commentId}
 *   roadmap/{itemId}/attachments/{attachmentId}
 *
 * Every mutation funnels through super-admin-gated callables
 * (saveRoadmapItem / addRoadmapComment / listRoadmapItems) — the callable I/O
 * shapes below are the contract between the admin client and those functions.
 *
 * Admin app uses Firestore Timestamp for date fields; RN app converts to Date.
 */

/** Lifecycle state of a roadmap item. */
export type RoadmapStatus = 'active' | 'backlog' | 'shipped' | 'dropped';

/** Relative urgency. P0 = drop everything, P3 = someday. */
export type RoadmapPriority = 'P0' | 'P1' | 'P2' | 'P3';

/** Who is on the hook for delivering the item. */
export type RoadmapOwner = 'james' | 'orchestrator' | 'both';

/** Rough t-shirt sizing of the work. */
export type RoadmapScope = 'S' | 'M' | 'L' | 'XL';

/** Who wrote a comment (also used for the `actor` hint on mutations). */
export type RoadmapAuthor = 'james' | 'orchestrator';

export interface RoadmapItem {
  /** Firestore doc id */
  id: string;
  title: string;
  description: string;
  /**
   * Long-form markdown detail — the body of the originating memory file, or
   * whatever has been typed into the editor since. `description` stays the
   * one-line summary that grid rows and kanban cards render; this is the full
   * write-up, shown only inside the editor modal.
   *
   * Optional because it post-dates the first seed: items written before
   * v1.41.0 carry no such field.
   */
  detailedContent?: string;
  status: RoadmapStatus;
  priority: RoadmapPriority;
  tags: string[];
  owner: RoadmapOwner;
  /** null when not yet sized */
  estimatedScope: RoadmapScope | null;
  /**
   * Originating orchestrator memory file, e.g. 'project_calibre_enhancements.md'.
   * Doubles as the upsert key when re-seeding from memory. null for items
   * authored directly in the admin panel.
   */
  sourceMemoryFile: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: 'seed' | 'james' | 'orchestrator';
}

export interface RoadmapComment {
  /** Firestore doc id */
  id: string;
  author: RoadmapAuthor;
  text: string;
  createdAt?: Date;
}

/**
 * An image attached to a roadmap item.
 *
 * The bytes live in Firebase Storage; this doc is the metadata index over
 * them, so a listing never has to walk the bucket. Uploads go straight to
 * Storage from the admin client (Storage rules gate on `isAdmin()`), then this
 * doc is written. Deletes must funnel through the `deleteRoadmapAttachment`
 * callable so the object and the doc go away together — a client-side delete
 * can half-fail and strand one or the other.
 *
 * Images only for now: the admin uploader accepts `image/*` and caps files at
 * 25 MB. `contentType` is stored rather than inferred so a future non-image
 * kind can be told apart without re-reading the object.
 */
export interface RoadmapAttachment {
  /** Firestore doc id; also the Storage object's basename. */
  id: string;
  /** Original filename as chosen on the uploader's machine, e.g. 'shot-01.png'. */
  filename: string;
  /** MIME type reported by the browser, e.g. 'image/png'. */
  contentType: string;
  /** Size in bytes. */
  size: number;
  /** Full Storage path, e.g. 'roadmap/{itemId}/attachments/{id}.png'. */
  storagePath: string;
  /**
   * Tokenised Firebase download URL, captured once at upload time.
   *
   * Persisted rather than re-derived per render so a thumbnail grid costs no
   * `getDownloadURL` round-trips. Note this URL bypasses Storage rules for
   * anyone holding it — acceptable here because roadmap content is internal
   * planning notes behind a super-admin-only panel.
   */
  downloadUrl: string;
  uploadedAt?: Date;
  uploadedBy: RoadmapAuthor;
}

// ---------------------------------------------------------------------------
// Callable I/O
// ---------------------------------------------------------------------------

/**
 * Input to `saveRoadmapItem`.
 *
 * Create vs update resolution, in order:
 *   1. `id` present            → update that doc
 *   2. `sourceMemoryFile` set  → upsert on the matching doc, if any
 *   3. otherwise               → create
 */
export interface SaveRoadmapItemInput {
  /** Present → update this doc. Absent → create or upsert. */
  id?: string;
  /**
   * Required when creating. On update, omit to leave the existing title
   * unchanged — this is what lets a kanban drag send `{ id, status }` alone.
   */
  title?: string;
  description?: string;
  /** Omit to leave the stored body unchanged; '' clears it. */
  detailedContent?: string;
  status?: RoadmapStatus;
  priority?: RoadmapPriority;
  tags?: string[];
  owner?: RoadmapOwner;
  estimatedScope?: RoadmapScope | null;
  sourceMemoryFile?: string | null;
  /**
   * Who is performing the write. Stamped into `createdBy` on create.
   * Defaults to 'james' when omitted.
   */
  actor?: RoadmapAuthor | 'seed';
}

export interface SaveRoadmapItemOutput {
  id: string;
  /** true when a new doc was created, false when an existing doc was updated */
  created: boolean;
}

export interface AddRoadmapCommentInput {
  roadmapId: string;
  author: RoadmapAuthor;
  text: string;
}

export interface AddRoadmapCommentOutput {
  id: string;
}

export interface ListRoadmapItemsInput {
  status?: RoadmapStatus[];
  priority?: RoadmapPriority[];
  tags?: string[];
  /** Defaults to 500, hard-capped at 1000. */
  limit?: number;
}

export interface ListRoadmapItemsOutput {
  items: RoadmapItem[];
}

export interface DeleteRoadmapAttachmentInput {
  roadmapId: string;
  attachmentId: string;
}

export interface DeleteRoadmapAttachmentOutput {
  /**
   * false when the Storage object could not be removed (already gone, or the
   * delete failed) but the metadata doc was still deleted. The doc going away
   * is what the UI cares about; a stranded object is logged server-side.
   */
  storageDeleted: boolean;
}

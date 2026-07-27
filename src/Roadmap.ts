/**
 * Roadmap — project backlog items surfaced in the admin "Roadmap" panel.
 *
 * Items were previously trapped in orchestrator memory files; this model moves
 * them into Firestore so the admin app can list, filter and comment on them.
 *
 * Firestore paths:
 *   roadmap/{itemId}
 *   roadmap/{itemId}/comments/{commentId}
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

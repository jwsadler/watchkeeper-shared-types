/**
 * Extraction — the contract between the `watchkeeper-extractors` Cloud Run
 * service and the admin app.
 *
 * Firestore paths:
 *   extraction_jobs/{jobId}
 *   extraction_jobs/{jobId}/runs/{runId}      (attempt history)
 *
 * Bulk payloads do NOT live on the job doc — a full brand crawl is megabytes,
 * well past Firestore's 1 MiB limit. The extractor writes the ExtractionResult
 * as a JSON object in Cloud Storage and records the path in
 * ExtractionJob.resultPath; the job doc carries only counts.
 *
 * DESIGN LINE — the extractor returns RAW STRUCTURED DATA and nothing else.
 * Every scalar below is a `string`, verbatim from the page ("40mm", "38 hours",
 * "28,800 vph"). No unit parsing, no lookup-slug canonicalisation, no AI, no
 * doc-id minting, no image fetching. All of that is the admin's job, post-scrape,
 * where the lookup collections and the enrichReference callable already live.
 * This mirrors the admin's ScrapedWatchEntry shape (also all-strings), which
 * is what BulkImport actually consumes.
 *
 * HARD REQUIREMENT — brand slug parity with admin. The extractor must produce
 * brandId values that bit-exact match admin's existing slug algorithm (e.g.
 * "Glashütte Original" -> "glashtte-original", ü dropped not transliterated).
 * If you write helper functions here, mirror admin's `buildBrandSlug` verbatim.
 */

/**
 * Registered extractor modules. Deliberately a CLOSED union: the admin renders
 * a typed dropdown from it, and adding a module is a shared-types version bump
 * + SHA re-pin. That friction is the point — makes "one shared type, enforced
 * by build" true rather than aspirational.
 */
export type ExtractorId = 'watchbase' | 'omega';

/** Descriptor an admin uses to render the extractor dropdown + defaults. */
export interface ExtractorDescriptor {
  id: ExtractorId;
  displayName: string;
  /** brandIds this module can scrape, or 'all' for multi-brand sources. */
  supportedBrands: readonly string[] | 'all';
  /** Human-readable summary shown in the admin picker. */
  description: string;
}

/** Lifecycle state of an extraction job. */
export type ExtractionJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Machine-readable failure class. Drives retry policy and admin display. */
export type ExtractionErrorCode =
  | 'nav_timeout'
  | 'http_403'
  | 'http_404'
  | 'http_5xx'
  | 'selector_miss'
  | 'parse_error'
  | 'blocked'
  | 'cancelled'
  | 'internal';

/** One failure. Item-level failures never abort a run; they accumulate here. */
export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  url?: string;
  httpStatus?: number;
  attempts?: number;
  at: Date;
}

/** Brand-level metadata scraped from the source's brand landing page. */
export interface ExtractedBrandInfo {
  website?: string;
  /** Multi-line, `\n`-separated. */
  address?: string;
  /** Brand display name exactly as the source renders it, diacritics intact. */
  displayName?: string;
}

/** Movement/calibre spec scraped from a dedicated calibre page. */
export interface ExtractedCalibre {
  sourceUrl: string;
  calibre?: string;
  base?: string;
  movementType?: string;
  display?: string;
  diameter?: string;
  jewels?: string;
  powerReserve?: string;
  frequency?: string;
  date?: string[];
  hands?: string[];
  chronograph?: string;
  isChronograph?: boolean;
  /** Every other labelled row on the calibre page. Lossless catch-all. */
  additional?: Record<string, string[]>;
}

/**
 * One watch, as scraped. Field names deliberately mirror admin's
 * ScrapedWatchEntry (BulkImport.tsx). Only `sourceUrl` and `reference` are
 * guaranteed; everything else is best-effort.
 */
export interface ExtractedWatch {
  sourceUrl: string;
  reference: string;
  model?: string;
  collection?: string;
  productName?: string;
  description?: string;
  /** Absolute URL of the primary product image. Extractor does NOT fetch bytes. */
  imageUrl?: string;
  /**
   * Additional product images, best first, `images[0]` matching `imageUrl`.
   *
   * Absolute URLs only, and the extractor does NOT fetch the bytes — same
   * contract as `imageUrl`, which this supplements rather than replaces. A
   * source that offers only one shot sets `imageUrl` and omits this.
   *
   * Intended for the AI corpus, where several angles of one reference are worth
   * more than one canonical render. Extractors cap what they emit; five is the
   * working ceiling.
   */
  images?: string[];

  // Movement
  movement?: string;
  movementType?: string;
  jewels?: string;
  powerReserve?: string;
  frequency?: string;

  // Case
  caseMaterial?: string;
  caseSize?: string;
  caseHeight?: string;
  caseShape?: string;
  caseBack?: string;
  lugWidth?: string;
  lugToLug?: string;
  waterRes?: string;
  crystal?: string;
  glass?: string;
  bezel?: string;
  bezelType?: string;
  crownType?: string;

  // Dial & hands
  dialColor?: string;
  dialFinish?: string;
  dialIndexes?: string;
  dialMaterial?: string;
  hands?: string;
  handsColor?: string;

  // Strap
  strapMaterial?: string;
  strapColor?: string;

  // Other
  functions?: string[];
  productionYears?: string;
  calibre?: ExtractedCalibre;

  /**
   * References of the watches that are this one in a different finish — the
   * same base model differing only in dial, bezel, bracelet, material or case
   * size.
   *
   * Entries are `reference` values, so they join directly against the
   * `reference` of the sibling rows in the same `ExtractionResult`. They are NOT
   * "you may also like" recommendations, and they do not span models.
   *
   * PRESENT-AND-EMPTY AND ABSENT MEAN DIFFERENT THINGS. An empty array is a
   * positive statement that the source was asked and reported no siblings;
   * absent means the extractor had no variant data to offer, either because the
   * source publishes none or because that lookup failed on this run. Ingest
   * should not collapse the two — the first is safe to act on, the second is
   * not.
   *
   * This is an ANNOTATION, not a grouping. Extractors still emit one row per
   * variant; deciding whether to aggregate them into a single product is the
   * consumer's call, and this field is what makes it possible without a
   * re-crawl.
   */
  variantRefs?: string[];

  /** Lossless passthrough of every label/value pair the source exposed. */
  rawSpecs: Record<string, string>;
}

/** Statistics gathered during a run. */
export interface ExtractionStats {
  brandsProcessed: number;
  familiesProcessed: number;
  watchesFound: number;
  watchesEmitted: number;
  watchesSkipped: number;
  calibresFound: number;
  pageFetches: number;
  fetchErrors: number;
}

/** Result artifact stored in Cloud Storage — the payload the admin ingests. */
export interface ExtractionResult {
  jobId: string;
  extractorId: ExtractorId;
  brandId: string;
  brandInfo?: ExtractedBrandInfo;
  watches: ExtractedWatch[];
  stats: ExtractionStats;
  errors: ExtractionError[];
  startedAt: Date;
  completedAt: Date;
  /** Version of the extractor module that produced this. */
  extractorVersion: string;
}

/** One attempt at running a job. Multiple runs when a job is retried. */
export interface ExtractionRun {
  runId: string;
  attempt: number;
  status: ExtractionJobStatus;
  startedAt: Date;
  completedAt?: Date;
  errors: ExtractionError[];
}

/** Options an operator can set when creating a job. */
export interface ExtractionJobOptions {
  /**
   * Skip the first N discovered refs before `limit` is applied. Defaults to 0.
   *
   * Order is discovery -> offset -> limit -> detail crawl, so
   * `{ offset: 50, limit: 50 }` crawls refs 51-100. Batching a brand this way
   * assumes the source's discovery order is stable between runs; if the
   * catalogue changes underneath you, the batch boundaries shift with it.
   */
  offset?: number;
  /** Cap on watches to emit — useful for smoke tests. */
  limit?: number;
  /** Restrict to specific families (source-dependent slugs). */
  familySlugs?: readonly string[];
  /** Concurrency for parallel detail-page fetches. Defaults per-module. */
  concurrency?: number;
  /** Override module default politeness delay (ms). */
  politenessDelayMs?: number;
}

/** Firestore doc at `extraction_jobs/{jobId}`. */
export interface ExtractionJob {
  jobId: string;
  extractorId: ExtractorId;
  brandId: string;
  /** Source-specific brand identifier (e.g. WatchBase slug). */
  brandSlug: string;
  options: ExtractionJobOptions;
  status: ExtractionJobStatus;
  /** 0-100. */
  progressPercent?: number;
  /** Human-readable current activity. */
  progressLabel?: string;
  stats?: ExtractionStats;
  errors: ExtractionError[];
  /** GCS path to the ExtractionResult JSON when status=completed. */
  resultPath?: string;
  /** Operator-driven cancellation flag. */
  cancelRequested?: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/** Callable I/O for creating a job. */
export interface CreateExtractionJobInput {
  extractorId: ExtractorId;
  brandId: string;
  brandSlug: string;
  options?: ExtractionJobOptions;
}

export interface CreateExtractionJobOutput {
  jobId: string;
}

"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=Extraction.js.map
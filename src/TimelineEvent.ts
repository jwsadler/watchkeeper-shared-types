/**
 * A single dated event in an entity's history, rendered as a chronological
 * timeline. Phase 1 hangs these off {@link MovementManufacturer.history}; the
 * type is deliberately entity-agnostic because brand-level history is a planned
 * phase-2 consumer of the SAME shape, which is also why it lives in its own file
 * rather than inside `MovementManufacturer.ts`.
 *
 * STORED AS AN ARRAY ON THE PARENT DOCUMENT, not a subcollection. A timeline is
 * 5–30 events, so one read gets the whole thing and there is no pagination
 * story to build. If a timeline ever outgrows that, moving it is a migration
 * rather than a type change.
 *
 * `date` IS A FREE-FORM STRING AND NEVER A JS `Date`, which is the single most
 * important thing about this type. Historical horology dates are frequently
 * imprecise, and the imprecision is itself the fact: `"1912"`, `"1930s"`,
 * `"circa 1885"`, `"Q3 2019"`, `"Between 1943 and 1948"`. Coercing those into a
 * `Date` would invent a day and a month the source never stated, and coercing
 * them into a number would discard the hedge a curator deliberately wrote.
 * Consumers sort by pulling the leading four-digit year out of the string and
 * sending anything un-parseable to the end; that helper is NOT exported from
 * this package today, because it is a value rather than a type and both the
 * admin and the RN app want their own tests around it.
 *
 * `description` IS A RICH-TEXT HTML STRING, the same serialisation every other
 * rich-text field in the admin uses — TipTap's `getHTML()`, not a ProseMirror
 * JSON tree. It carries inline entity links of the form
 * `<a href="watchkeeper://open/reference/rolex/126610LN" data-wk-entity=…>`,
 * which is how an event cross-links to a brand, calibre, reference or another
 * manufacturer WITHOUT this type needing `linkedCalibreId`-style fields. Note
 * that nothing here distinguishes a rich-text string from a plain one — the
 * neighbouring `MovementManufacturer.description` is plain text and also typed
 * `string` — so a renderer that assumes plain text will show markup, and the
 * RN side needs an HTML renderer for this field specifically.
 *
 * Events populated by AI enrichment carry {@link TimelineEvent.aiConfidence} so
 * a curator can filter on it at apply time. A timeline event is a SPECIFIC
 * FACTUAL CLAIM and therefore far easier for a model to fabricate than prose,
 * which is what `sourceUrl` and the confidence score are both for.
 */
export interface TimelineEvent {
  /**
   * Free-form date string. NOT a JS `Date` and not a number — see the note on
   * imprecision above. Examples: `"1912"`, `"1930s"`, `"Q3 2019"`,
   * `"circa 1885"`.
   */
  date: string;
  /** Short title, ≤10 words. e.g. "Founded in Bienne, Switzerland". */
  title: string;
  /**
   * Rich-text HTML string (TipTap `getHTML()` output), typically 2–3 sentences.
   * May contain inline `watchkeeper://` entity links.
   */
  description: string;
  /** Event category, used for grouping and per-category iconography. */
  category?:
    | 'founding'
    | 'product'
    | 'milestone'
    | 'acquisition'
    | 'absorption'
    | 'closure'
    | 'other';
  /** URL the event was sourced from — provenance for a factual claim. */
  sourceUrl?: string;
  /** Optional image for the event. */
  image?: TimelineEventImage;
  /**
   * Model confidence, 0..1, when this event came from AI enrichment. Absent on
   * curator-authored events. Kept on the document so a curator can filter an
   * enrichment result before applying it.
   */
  aiConfidence?: number;
}

/**
 * Image attached to a {@link TimelineEvent}. Mirrors {@link CalibreImage} in
 * shape and in storage convention — uploads live under
 * `manufacturers/{id}/timeline/` the same way the calibre gallery does, and
 * `storagePath` is preferred over `url`.
 *
 * `aiSuggestion` is the field that is easy to misread: it is a DESCRIPTION OF
 * THE IMAGE THE EVENT NEEDS, written for a curator to go and find, and it is
 * explicitly NOT a URL. Enrichment is allowed to say "a photograph of the
 * original Bienne workshop exterior" and is never asked for an image address,
 * because a model asked for one will produce a plausible URL that does not
 * resolve. An event carrying `aiSuggestion` with neither `storagePath` nor
 * `url` is the signal that a curator still has work to do.
 */
export interface TimelineEventImage {
  /** Firebase Storage path. Preferred over {@link TimelineEventImage.url}. */
  storagePath?: string;
  /** Direct URL, for images that genuinely live off-platform. */
  url?: string;
  /** Human-readable caption. e.g. "Founder Eva Leube, circa 2011". */
  caption?: string;
  /**
   * Provenance tag. Conventionally `'brand'`, `'manufacturer'` or
   * `'watchkeeper'` (curator-supplied), but UNCONSTRAINED on purpose, exactly
   * as {@link CalibreImage.source} is: legacy provenance values are already in
   * the data, and a union that also admits `string` would collapse to `string`
   * anyway while looking like a constraint it is not. The admin owns the
   * picker; this package records what was written.
   */
  source: string;
  /**
   * AI-generated description of the image this event needs, for a curator to
   * fulfil. NOT a URL — see the note above.
   */
  aiSuggestion?: string;
}

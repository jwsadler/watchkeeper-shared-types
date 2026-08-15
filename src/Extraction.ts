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
 *
 * THESE ARE MODULE IDS, NOT BRAND SLUGS, and `glashutte-original` is where that
 * distinction stops being pedantic: the brand doc admin's slug derivation
 * produces for "Glashütte Original" is `glashtte-original` — no `u`, because
 * the ü is DROPPED rather than transliterated (see the HARD REQUIREMENT note at
 * the top of this file). The module id keeps the readable spelling; the two
 * strings are one character apart and mean different things.
 *
 * `breitling` is the counter-example that makes the rule legible: no
 * diacritics, no ampersand, nothing for the slug derivation to strip, so its
 * module id and its brand doc id are the same string. Most brands are like
 * this; `glashutte-original` is the one that is not. `richard-mille` is the
 * same easy case as `breitling` — a two-word name with nothing to strip, and so
 * is `audemars-piguet`.
 *
 * `jacob-and-co` is the SECOND case after `glashutte-original` where the module
 * id and the brand doc id come apart, and here it is an ampersand rather than a
 * diacritic that does it. The brand writes itself "Jacob & Co.", and admin's
 * derivation strips both the `&` and the `.` — `buildBrandSlug('Jacob & Co.')`
 * is `jacob-co`, with the "and" gone entirely. The module id spells the "and"
 * out so the dropdown reads as the brand does.
 *
 * `iwc` is the case that inverts the warning above, and it is the more
 * dangerous shape precisely because the two strings COINCIDE. The brand doc is
 * `watchBrands/iwc` and the module id is `iwc`, so nothing here looks unusual —
 * but the name the source publishes everywhere (`<title>`, `h1`, and JSON-LD
 * `brand.name` on every product page) is "IWC Schaffhausen", and
 * `buildBrandSlug('IWC Schaffhausen')` is `iwc-schaffhausen`, which is a
 * `movement_manufacturers` document, NOT a brand. Deriving the slug from the
 * displayed name therefore writes a full catalogue to the wrong collection
 * without erroring. The module hard-codes `supportedBrands: ['iwc']` for this
 * reason; see `docs/iwc-port-plan.md` §11 in the extractors repo.
 *
 * `nomos-glashuette` is the THIRD divergent case and the closest repeat of the
 * first: same Saxon town, same umlaut, same single missing character.
 * `buildBrandSlug('NOMOS Glashütte')` is `nomos-glashtte`, so the module id and
 * the brand doc id come apart exactly as they do for `glashutte-original`. Note
 * that the two brands are unrelated despite sharing a town and a trap. The URL
 * slug NOMOS itself uses — `nomos-glashuette`, transliterating the umlaut where
 * admin's derivation drops it — is what the module id mirrors, and it is a
 * third distinct spelling of the same name; the module hard-codes
 * `supportedBrands: ['nomos-glashtte']` rather than deriving any of them. See
 * `docs/nomos-glashuette-port-plan.md` §9 in the extractors repo.
 *
 * `christopher-ward` returns to the `breitling` shape after three divergent
 * cases in a row, and it is worth naming as such so the exception stops looking
 * like the rule. "Christopher Ward" carries no diacritic, no ampersand and no
 * period, so `buildBrandSlug('Christopher Ward')` is `christopher-ward` — the
 * module id and the brand doc id are the same string, and the derivation has
 * nothing to strip. See `docs/christopher-ward-port-plan.md` §8 in the
 * extractors repo.
 *
 * `muehle-glashuette` is the FOURTH divergent case, the second Glashütte umlaut
 * in three modules, and the first to lose TWO characters to the derivation. The
 * brand publishes itself as "Mühle-Glashütte" — hyphenated; `og:site_name` and
 * JSON-LD `name` agree on every product page — and
 * `buildBrandSlug('Mühle-Glashütte')` is `mhle-glashtte`, with both umlauts
 * dropped rather than transliterated. Mühle-Glashütte is an independent family
 * firm unrelated to BOTH `glashutte-original` and `nomos-glashuette` despite
 * the shared town, so three brands from one Saxon village now sit in this
 * union, each carrying its own spelling of the same trap. The module id mirrors
 * the brand's own domain (muehle-glashuette.de), which transliterates the
 * umlaut where admin's derivation strips it — a third spelling, and a fourth if
 * you count the WordPress theme directory, `muhle-glashutte`, which drops the
 * diacritics without transliterating. The module hard-codes
 * `supportedBrands: ['mhle-glashtte']` rather than deriving any of them. See
 * `docs/muehle-glashuette-port-plan.md` §8 in the extractors repo.
 *
 * `swatch` is the `breitling`/`christopher-ward` shape again — no diacritic, no
 * ampersand, no period, so `buildBrandSlug('Swatch')` is `swatch` and the
 * module id, the brand doc id and the derived slug are one string. The trap
 * here is not the slug, it is the NEIGHBOURS, and there are two.
 *
 * First, `swatch.com` also serves 52 Flik Flak products, and Flik Flak is a
 * different brand with its own domain and its own sitemap entry in the same
 * `robots.txt`; `buildBrandSlug('Flik Flak')` is `flik-flak`, which is not this
 * id. The module filters on the source's own `brand` field rather than on the
 * origin, or it writes 52 children's watches into `watchBrands/swatch`.
 *
 * Second, and more tempting: Swatch Group owns `omega`, plus Longines, Tissot
 * and others. NOTHING in this module may infer a manufacturer or parent
 * relationship from that — the group structure is invisible on this origin, and
 * the brand docs are unrelated peers. See `docs/swatch-port-plan.md` §§4.1, 9
 * in the extractors repo.
 *
 * `tutima` is the FOURTH Glashütte brand in this union and the first of them
 * whose name survives the derivation intact: "Tutima" carries no diacritic, no
 * ampersand and no period, so `buildBrandSlug('Tutima')` is `tutima` and the
 * module id, the brand doc id and the derived slug are one string. It is
 * independent of `glashutte-original`, `nomos-glashuette` and
 * `muehle-glashuette` despite the shared town.
 *
 * The trap is the name the brand actually publishes. Every page titles itself
 * "Tutima Glashütte/Sa." — that is `og:site_name`, the `<title>` suffix and the
 * WordPress site name — and `buildBrandSlug('Tutima Glashütte/Sa.')` is
 * `tutima-glashttesa`, with the umlaut dropped and the slash and period
 * stripped. The derivation is therefore safe only as long as it is never handed
 * the displayed name; the module hard-codes `supportedBrands: ['tutima']`.
 *
 * The second thing to know is the `iwc` shape rather than the slug shape.
 * Tutima is a manufacture and every calibre it fits is its own
 * (`Tutima 310`…`Tutima 800`, eleven across the catalogue), so
 * `movement_manufacturers/tutima` is exactly the kind of document that may
 * already exist under this id. That is a different collection and a collision
 * there is not a slug bug, but it is unconfirmed at the time of writing and
 * worth settling before a first live job. See `docs/tutima-port-plan.md` §13 in
 * the extractors repo.
 *
 * The five `casio-*` ids are the first entries in this union that are NOT one
 * id per brand. casio.com serves five watch lines off one AEM instance — 742
 * products on the `ca-en` locale, of which G-Shock is 434 — and they share an
 * endpoint shape so completely that a line slug is the only variable between
 * them. They are five ids because an operator wants to run Baby-G without
 * re-crawling G-Shock, not because they are five sources.
 *
 * `casio-gshock` is implemented. `casio-babyg`, `casio-edifice`,
 * `casio-protrek` and `casio-collection` are RESERVED — they name lines that
 * exist and are already reachable through the same two endpoints, and they are
 * added now so that filling one is a `LineConfig` literal in the extractors
 * repo rather than another round-trip through this union. Until then they sit
 * in `UnimplementedExtractorId` in `src/core/registry.ts` beside `lang-heyne`,
 * which is what keeps the registry's exhaustiveness check honest.
 *
 * `casio-collection` is the line the site itself files under `/watches/casio/`
 * — 228 refs, the non-G-Shock Casio-branded watches. The id spells out
 * "collection" because a bare `casio` id sitting next to a `casio` BRAND id
 * would read as the whole marque rather than as one line of it.
 *
 * ON THE SLUG this is the `breitling` / `christopher-ward` shape, and the
 * derivation has nothing to strip: `buildBrandSlug('Casio')` is `casio`, which
 * is the brand doc all five lines point at for now. Each line declares it on
 * its OWN `supportedBrands` rather than sharing one entry, because admin's
 * `brandOverrides` map is keyed by DECLARED BRAND ID and not by extractor id —
 * so five lines declaring one string would be re-pointed by one override, all
 * together, and Baby-G could never be moved off `casio` without dragging
 * G-Shock with it.
 *
 * THE TRAP IS THE NAME THE SOURCE PUBLISHES, and it is the `iwc` shape rather
 * than a diacritic. Every G-Shock page calls the brand "G-SHOCK" — that is
 * `brandDisp` on all 358 rows of the catalogue feed, the `<title>`, and
 * `productBrandTitle` in the page model — and `buildBrandSlug('G-SHOCK')` is
 * `g-shock`, a different document from `casio` and one that may well exist.
 * Deriving the slug from the displayed name therefore writes 434 watches to the
 * wrong brand WITHOUT ERRORING, exactly as IWC would have. Every `casio-*`
 * module hard-codes its `supportedBrands` for this reason. See
 * `docs/casio-port-plan.md` §§3, 11 in the extractors repo.
 *
 * `vacheron-constantin` needs nothing from the derivation: no diacritic, no
 * ampersand and no period, so `buildBrandSlug('Vacheron Constantin')` is
 * `vacheron-constantin` and the module id, the brand doc id and the derived
 * slug are one string — the `breitling` / `christopher-ward` /
 * `audemars-piguet` shape rather than the Glashütte one. The name IS accented
 * in the brand's own French prose, but never in the places a slug could reach:
 * the `<title>`, `og:site_name` and the domain all spell it unaccented. The
 * diacritics on this source are all in PRODUCT names (`Égérie`,
 * `Métiers d'Art`), which never touch the brand slug.
 *
 * The trap here is not the name but the SPEC TABS, and it is worth recording
 * because it fails silently at a 100% fill rate. VC publishes `Reference`,
 * `Diameter` and `Thickness` in BOTH of its two spec panels — the watch's and
 * the movement's — so a flat label map puts the CALIBRE in `reference` and the
 * movement's dimensions in the case's, with nothing missing to notice. It is
 * the `movement`-is-not-`module` failure from v1.80.0 wearing a different hat:
 * a full column of semantically wrong values. Every spec read in the module is
 * scoped to its `<vac-tab-panel>` first.
 *
 * Ported from `audemars-piguet` — the same AEM + server-rendered-Vue origin,
 * the same two-phase crawl, no bot protection that bites. 175 watches, 177
 * requests, no browser. See `src/modules/vacheron-constantin/README.md` in the
 * extractors repo; there is no separate port-plan doc for this one.
 */
export type ExtractorId =
  | 'omega'
  | 'lang-heyne'
  | 'rolex'
  | 'cartier'
  | 'glashutte-original'
  | 'breitling'
  | 'richard-mille'
  | 'audemars-piguet'
  | 'jacob-and-co'
  | 'iwc'
  | 'nomos-glashuette'
  | 'christopher-ward'
  | 'muehle-glashuette'
  | 'swatch'
  | 'tutima'
  | 'casio-gshock'
  | 'casio-babyg'
  | 'casio-edifice'
  | 'casio-protrek'
  | 'casio-collection'
  | 'vacheron-constantin';

/**
 * How much of a source's catalogue a run asks for.
 *
 * `full`      every product the source publishes. The quarterly rebase.
 * `new-only`  just what the source itself flags as a new release. Cheap enough
 *             to run often, which is what keeps the watch DB fresh in between.
 *
 * Only meaningful where the SOURCE draws the distinction. A module cannot
 * synthesise `new-only` by diffing against a previous run — that is the admin's
 * job, post-ingest, where the previous run actually exists.
 */
export type ExtractorMode = 'full' | 'new-only';

/** Descriptor an admin uses to render the extractor dropdown + defaults. */
export interface ExtractorDescriptor {
  id: ExtractorId;
  displayName: string;
  /** brandIds this module can scrape, or 'all' for multi-brand sources. */
  supportedBrands: readonly string[] | 'all';
  /** Human-readable summary shown in the admin picker. */
  description: string;
  /**
   * Modes this module accepts on `ExtractionJobOptions.mode`.
   *
   * UNDEFINED MEANS `['full']` — the module runs whole-catalogue crawls and
   * nothing else. That convention, rather than a required field, is what makes
   * this addition non-breaking for the modules that predate it: Omega leaves
   * it unset because its source publishes no new-releases view to read, so
   * there is no second mode for it to honour.
   *
   * The admin should offer a mode picker only when this is set and holds more
   * than one entry, and should not send a `mode` a module has not declared.
   */
  supportedModes?: readonly ExtractorMode[];
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
 * The tag vocabulary an extractor may put on an image.
 *
 * Mirrors `GALLERY_IMAGE_TAGS` in admin's ReferenceEditor.tsx VERBATIM, and is
 * a closed union for the same reason `ExtractorId` is: admin renders these as
 * toggleable chips, so a tag outside the list arrives on a reference the curator
 * can neither see nor clear.
 *
 * `primary` / `hero` are deliberately ABSENT. Admin assigns those itself at
 * enrichment-call time (PRIMARY_TAGS in functions/src/enrichImageSelection.ts);
 * they are not curator-assignable, so an extractor emitting one would write a
 * chip the gallery cannot render. An extractor signals its primary shot the way
 * it always has — `imageUrl`, and position 0 of the array.
 */
export type ImageTag =
  | 'dial'
  | 'caseback'
  | 'crown'
  | 'movement'
  | 'bracelet'
  | 'clasp'
  | 'bezel'
  | 'lume'
  | 'strap'
  | 'side'
  | 'wrist'
  | 'box'
  | 'papers';

/**
 * One product image with whatever the extractor could infer about its content.
 *
 * Structurally a superset of the `{ url, tags }` admin's
 * `selectImagesByPriority` consumes, so it can be handed to the enrichment path
 * unchanged; `autoTagged` is extra context that side ignores.
 *
 * These tags are GUESSES and the field name says so. They exist to save the
 * curator keystrokes, and to let the enrichment prompt route a field at the
 * image that actually shows it — never as ground truth. A curator's edit wins.
 */
export interface TaggedImage {
  /** Absolute URL. Same contract as `imageUrl`: the extractor does NOT fetch bytes. */
  url: string;
  /**
   * Inferred tags, possibly several, possibly none. Empty means "no signal on
   * this page identified this image" — an explicit "please tag me", not a gap.
   */
  tags: ImageTag[];
  /**
   * True when the extractor put at least one tag here, i.e. exactly
   * `tags.length > 0`. Redundant by construction and kept anyway, because it is
   * what makes the ABSENCE of tags legible downstream: `autoTagged: false` reads
   * as "the extractor looked and found nothing", where a bare empty array reads
   * as "something forgot to populate this".
   */
  autoTagged: boolean;
}

/**
 * One sibling SKU of a watch, with whatever the source could say about how it
 * differs from it.
 *
 * WHY THIS EXISTS BESIDE `variantRefs`. That field says a watch has eighteen
 * siblings and stops. To learn what any one of them actually IS — 41 mm or
 * 36 mm, Everose Rolesor or Oystersteel, fluted bezel or diamond-set — a
 * consumer has to find that sibling's own row and read it, eighteen times, and
 * hope every one of them was crawled. On a `new-only` run most of them were
 * not. This carries the differentiating facets on the row that names the
 * sibling, so an "Also available with" table renders off one record.
 *
 * EVERY FACET IS OPTIONAL AND ABSENCE IS NOT A CLAIM. A missing `bezel` means
 * the source does not publish one at catalogue level, not that the watch has no
 * bezel. An extractor populates what its source gives it and leaves the rest
 * out; Rolex, the first source to emit this, fills everything below except
 * `calibre`, which nothing in its catalogue API names.
 */
export interface ExtractedWatchVariant {
  /**
   * The sibling's `reference`, in the same spelling as the sibling's own row.
   *
   * REQUIRED, and the join key: this matches the `reference` of another row in
   * the same `ExtractionResult` exactly as a `variantRefs` entry did, so a
   * consumer that already joins on one joins on the other unchanged.
   */
  reference: string;
  /**
   * The source's own primary key for this SKU, where it has one distinct from
   * the reference — Rolex's rmc (`m126334-0037`), Cartier's SFCC id. Worth
   * keeping because it is what an upstream aggregation pass would join on, and
   * it is free at scrape time and expensive to backfill.
   */
  sku?: string;
  /** Model name, `Datejust 41`. What distinguishes a case-size sibling. */
  model?: string;
  /** Case size, verbatim: `41 mm`. */
  size?: string;
  /** Case material, verbatim: `Yellow Rolesor`, `Oystersteel`. */
  material?: string;
  /** Dial, verbatim: `Green ombré`. */
  dialColor?: string;
  /** Bezel, verbatim: `Fluted`, `Brilliant diamond-set`. */
  bezel?: string;
  /** Bracelet or strap, verbatim: `Jubilee`, `Oysterflex`. */
  bracelet?: string;
  /** Calibre, verbatim. Unset by every extractor so far. */
  calibre?: string;
  /**
   * The axes this sibling differs from the subject on, in the SOURCE'S OWN
   * vocabulary — Rolex publishes `material`, `bezel`, `dial`, `bracelet` and
   * `size`, and a sibling can be on more than one.
   *
   * Deliberately not normalised into this schema's field names: it is the
   * source's own statement about its own catalogue, and translating it would
   * turn a quotation into a claim. It is also the one thing no facet-by-facet
   * comparison can reconstruct, since two siblings may both omit the facet they
   * actually differ on.
   */
  differsBy?: string[];
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
  /**
   * The same shots as `images`, in the same order, carrying inferred content
   * tags. ADDITIVE — `images` stays populated and authoritative for ordering, so
   * a consumer that has not been taught about tags keeps working unchanged.
   *
   * Read this in preference to `images` when present; fall back to `images`
   * when it is absent, which is what every extractor that has not implemented
   * inference yet emits.
   */
  taggedImages?: TaggedImage[];

  // Movement
  /**
   * The CALIBRE STRING, and the name undersells how load-bearing that is.
   *
   * This field is what admin's bulk importer means by a calibre: its
   * `ScrapedWatchEntry.movement` is commented "caliber string, e.g.
   * `Seiko NH35A`", its AI field map routes `calibre -> 'movement'`, and the
   * import wizard's Check Calibres step scans this value RAW and offers
   * match-or-create against the calibre database.
   *
   * So anything put here becomes a calibre. An electronic module number put
   * here becomes a calibre named `5611` — see {@link module}, which is where it
   * belongs.
   */
  movement?: string;
  /**
   * Electronic module identifier — the digital counterpart of {@link movement},
   * NOT a spelling of it.
   *
   * A digital or analog-quartz watch has an electronic module where a
   * mechanical one has a calibre, and WatchKeeper models the two as separate
   * first-class entities: a module resolves to an `electronicModules/{id}` doc
   * and hangs off `WatchReference.moduleId`, where a calibre resolves to
   * `custom_calibres` and hangs off `calibreId`. Mirrors
   * `ScrapedWatchEntry.module` ("Digital-watch module identifier (electronic
   * equivalent of a calibre), e.g. Casio `3229`"), so the importer needs no new
   * vocabulary for it.
   *
   * THE MISTAKE THIS FIELD EXISTS TO PREVENT, because it has already been made
   * once: the Casio extractor put module numbers on `movement`, which was
   * populated correctly, looked entirely sensible at a 100% fill rate, and
   * quietly manufactured calibres out of 81 module numbers. A fill-rate check
   * cannot catch a field that is full and semantically wrong.
   *
   * Casio is the shape to reason from — it publishes NO calibre anywhere in the
   * G-Shock catalogue. Measured across 434 references: 49 distinct raw spec
   * labels, none of them naming a calibre, jewel count, frequency or
   * escapement, and all 434 carrying a numeric module. Analog quartz is not the
   * exception people expect — those references carry a module too and nothing
   * else. So an extractor emitting this should usually leave `movement` and
   * `calibre` UNSET rather than filling them with the same value.
   */
  module?: string;
  /**
   * Display/form category HINT — `ana-digi`, `digital`, `analog`, `smartwatch`,
   * `pocket watch` — and deliberately NOT a canonical slug.
   *
   * Admin resolves it against the `lookup_watch_types` collection
   * (`resolveWatchType`), so the spelling only has to match that lookup's
   * value, display name or synonyms; an unresolved hint passes through
   * unchanged rather than being dropped. This mirrors the manual extractor's
   * `ExtractedProduct.watchType`, whose own comment calls it "a loose
   * display/form-category HINT … NOT a canonical slug", and extractors should
   * emit the same vocabulary rather than inventing slugs.
   *
   * WHY IT IS WORTH EMITTING AT ALL. Absent this, admin derives the category
   * from the fields it does have, and the derivation reads an electronic module
   * with no `hands` as a pure-digital watch. That is right for most sources and
   * wrong for Casio, which fits module numbers to analog quartz as well: 35
   * analog G-Shock references classify as `digital` on that heuristic, and the
   * 227 analog-digital ones do too, because the derivation's text match looks
   * for `analog-digital` and the source says `digital-analog`.
   *
   * A source that publishes its own display type — Casio's `displayType` facet
   * is 100% filled and single-valued — should say so here rather than leave a
   * heuristic to guess. Where a source publishes nothing, leave this UNSET and
   * let the derivation do its job; an absent hint and a guessed one are
   * different things.
   */
  watchType?: string;
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
  /**
   * Date complication, as scraped. One slug per field, mirroring
   * `DialInfo.dateDisplay` / `dateWindowPosition` / `dateWindowFrame` /
   * `dateWheelColor` / `dateWheelTextColor` — the importer writes them straight
   * through to `dialAndHands`. Extractors that don't yet emit them simply omit
   * them.
   *
   * `dateWheelTextColor` is the only multi-select of the five and arrives
   * comma-joined (`"black, red"`), matching how it is stored — the disc's
   * printed numerals are commonly two colours on a day-date.
   */
  dateDisplay?: string;
  dateWindowPosition?: string;
  dateWindowFrame?: string;
  dateWheelColor?: string;
  dateWheelTextColor?: string;

  // Strap
  /**
   * The three strap fields are FLAT MIRRORS of `StrapInfo`, not a nested
   * object, and that is the established convention on this interface rather
   * than an accident:
   *
   *     ExtractedWatch.strapMaterial    ->  WatchReference.strap.material
   *     ExtractedWatch.strapColor       ->  WatchReference.strap.color
   *     ExtractedWatch.strapBuckleType  ->  WatchReference.strap.buckleType
   *
   * `DialInfo` is mirrored the same way (`dialColor`, `dialFinish`, the five
   * `date*` fields), so a nested `strap?: StrapInfo` here would be the odd one
   * out AND would sit next to two flat siblings describing the same object.
   *
   * `strapBuckleType` is admin's own name for this pair — `bulkEnrichFields.ts`
   * declares `strField('strapBuckleType', 'Buckle type', … 'strap.buckleType')`
   * and the enrichment prompt lists `strapBuckleType` among the strap fields —
   * so the importer needs no new mapping to route it.
   *
   * Deliberately NOT called `clasp`: nothing in the data model uses that word,
   * and a top-level `clasp` would have no home in `WatchReference`.
   */
  strapMaterial?: string;
  strapColor?: string;
  strapBuckleType?: string;

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
   *
   * PREFER `variantDetails` WHERE IT IS PRESENT. It carries the same references
   * plus what each sibling differs by. This field stays for the sources that
   * can name their siblings and say nothing more about them.
   */
  variantRefs?: string[];
  /**
   * The same siblings as `variantRefs`, each with the facets that distinguish
   * it — material, bezel, bracelet, dial, size — so a consumer can render an
   * "Also available with" table without looking up eighteen other rows.
   *
   * READ THIS IN PREFERENCE TO `variantRefs` WHEN PRESENT, and fall back to
   * `variantRefs` when it is absent. `variantDetails[].reference` holds exactly
   * what `variantRefs` holds, in the same order, so the fallback is lossless in
   * the direction that matters: a consumer reading only references can read
   * either field and get the same answer.
   *
   * An extractor emits ONE of the two, not both — carrying both would put two
   * spellings of one relationship in every row. Rolex emits this; Cartier emits
   * `variantRefs`, because its siblings come from a page-level cross-link modal
   * with no catalogue record behind them to enrich from.
   *
   * The `variantRefs` distinction between PRESENT-AND-EMPTY and ABSENT governs
   * this field identically, and for the same reason.
   */
  variantDetails?: ExtractedWatchVariant[];

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
  /**
   * Calibres discovered this run, deduplicated across the catalogue.
   *
   * Optional and additive: modules that only ever see a calibre in the context
   * of a watch — one calibre page read per reference — leave this unset and
   * nest `ExtractedWatch.calibre` instead. Modules whose source
   * publishes calibres as their own collection (Lang & Heyne's `/caliber`
   * endpoint) populate both — the nested copy so a single watch stays
   * self-describing, and this array so the set is emitted once rather than
   * repeated per watch.
   *
   * NOT INGESTED YET. The admin's `extractionToEntries` adapter maps watches
   * onto ScrapedWatchEntry and drops calibres entirely, so this rides along in
   * the Cloud Storage artifact waiting for an ingest path to exist. It is
   * populated now because the data is free at scrape time and re-crawling
   * later to backfill it would not be.
   */
  calibres?: ExtractedCalibre[];
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
  /**
   * How much of the catalogue to crawl. Defaults to `full`.
   *
   * Only honoured by modules that declare `supportedModes`; everything else
   * ignores it and crawls the whole catalogue, which is what an unset value
   * means anyway. Applied at DISCOVERY, before `offset` and `limit`, so
   * `{ mode: 'new-only', limit: 5 }` is the first five new releases rather
   * than the new releases among the first five products.
   */
  mode?: ExtractorMode;
}

/** Firestore doc at `extraction_jobs/{jobId}`. */
export interface ExtractionJob {
  jobId: string;
  extractorId: ExtractorId;
  brandId: string;
  /** Source-specific brand identifier (the source's own brand slug). */
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

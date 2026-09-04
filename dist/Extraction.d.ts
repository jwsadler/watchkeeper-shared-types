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
 *
 * `longines` is the fourth Swatch Group brand this union can name — after
 * `omega`, `swatch` itself and the group's ownership of Tissot and Hamilton,
 * which have no module — and NOTHING may infer a parent relationship from that.
 * The group structure is invisible on longines.com, and `watchBrands/longines`
 * is a peer of `watchBrands/omega`, not a child of `watchBrands/swatch`. The
 * `swatch` module's own comment above says the same thing from the other side.
 *
 * The slug is the easy shape: no diacritic, no ampersand, no period, so
 * `buildBrandSlug('Longines')` is `longines` and the module id, the brand doc id
 * and the derived slug are one string — the `tutima` case, where the name
 * survives the derivation intact.
 *
 * THE TRAP IS THAT NO LOCALE CARRIES THE WHOLE CATALOGUE, and it is the Swatch
 * divergence again but worse: the union across longines.com's 40 locales is 979
 * watches, the best single locale has 843, and the two large English ones differ
 * in BOTH directions (`en-us \ en-gb` = 68, `en-gb \ en-us` = 70). Worse still,
 * a slug a locale does not carry answers HTTP 200 with an EMPTY payload rather
 * than 404, so a single-locale crawl is not merely short — it cannot even
 * discover what it is missing. The module unions the English locale sitemaps and
 * fetches each slug from the first locale that actually serves it.
 *
 * `a-lange-soehne` IS THE MOST SEVERE SLUG DIVERGENCE IN THIS UNION, and it is
 * the only one whose derived slug is not a word:
 *
 *     buildBrandSlug('A. Lange & Söhne') -> 'a-lange-shne'
 *
 * The period and the ampersand are stripped — the `jacob-and-co` -> `jacob-co`
 * shape — and then the umlaut is DROPPED rather than transliterated, because
 * the derivation keeps `[^a-z0-9\s-]` and `ö` is neither transliterated to `oe`
 * nor folded to `o`. It simply disappears, leaving `söhne` as `shne`. So the
 * module id spells the umlaut out as `oe` in the German manner while the brand
 * document cannot, and the two are NOT the same string. This is the
 * `glashutte-original` / `nomos-glashuette` / `muehle-glashuette` family taken
 * to its limit, and the failure mode of "correcting" `a-lange-shne` to
 * something that looks right is not an error but a successful write to a brand
 * document nobody reads.
 *
 * It is also the first id in this union whose brand document was VERIFIED IN
 * FIRESTORE before the module was written rather than after — `watchBrands/
 * a-lange-shne` exists in `watchlock-1e53d` with `name` and `displayName` both
 * `A. Lange & Söhne`. Vacheron and Longines both shipped with that check still
 * outstanding.
 *
 * THE TRAP IS THAT THE SPECIFICATIONS ARE PUBLISHED TWICE, under two class
 * prefixes one word apart: `.technical-details__` is a 3-row "Highlights"
 * decoy and `.technical-details-panel__` is the real 14-row set, both
 * server-rendered in the same response. A substring selector reads both and a
 * naive one reads only the decoy — the `vacheron-constantin` spec-tab failure
 * in a new costume, silent at a 100% fill rate either way. Two further
 * accidents are worth naming here because they are invisible downstream: the
 * URL drops the reference suffix on 59 of 369 watches (`-410-038` for
 * "410.038 E"), and two family slugs that reached production are plainly CMS
 * mistakes (`foobar`, 71 watches, and `lange1`, 1) — routed, never dropped.
 *
 * `full` ONLY. The source publishes no newness signal at all: sitemap
 * `<lastmod>` is a bulk re-publish (three consecutive days in April 2025 cover
 * 56% of the catalogue), and the brand's own `novelties` page is a curated
 * marketing selection rather than a date, so a `new-only` backed by it would
 * not mean what `new-only` means anywhere else in this fleet. `heritage` is
 * declined for the same reason the definition above gives: the 71 archive
 * references share one sitemap, one catalogue and one URL space with the
 * current line, so there is no separate archival boutique to point at.
 *
 *
 * `seiko` IS THE TRIVIAL SLUG, and it is recorded here precisely because the
 * check was run rather than assumed:
 *
 *     buildBrandSlug('Seiko') -> 'seiko'
 *
 * No diacritic to drop, no ampersand to strip, no period to lose — the opposite
 * end of this union's range from `a-lange-shne`. `watchBrands/seiko` EXISTS in
 * `watchlock-1e53d` with `name` and `displayName` both `Seiko`, verified before
 * the module was written, as Lange was and as Vacheron and Longines were not.
 *
 * IT IS SEIKO-BRANDED ONLY, AND GRAND SEIKO'S EXCLUSION IS THE SOURCE'S OWN
 * RULING rather than a judgement made here. The watchfinder configuration
 * directs visitors to the separate Grand Seiko site, no Grand Seiko reference
 * appears in any watchfinder payload, and Firestore already holds
 * `watchBrands/grand-seiko` as a document distinct from `watchBrands/seiko` —
 * also verified live. If Grand Seiko is ever crawled it is a second id against
 * that second document, never a widening of this one.
 *
 * THE TRAP IS THAT NO MARKET CARRIES THE CATALOGUE, and it is the `longines`
 * locale divergence again, worse by a wide margin. Nine English markets union
 * to 1219 references; `ca-en`, the market this module was commissioned against,
 * publishes 205 of them — 17% — and omits Lukia, Coutura and Seiko Premier
 * entirely. The union is safe to take because slugs are market-independent: of
 * the 191 references shared between `ca-en`, `uk-en` and `us-en` the slug is
 * identical on 191 and divergent on zero, so the nine payloads dedupe cleanly
 * and `ca-en` supplies the `sourceUrl` for everything it carries.
 *
 * Two further accidents are worth naming because both are silent. A MISSING
 * PRODUCT ANSWERS HTTP 200 WITH A "404 PAGE NOT FOUND" BODY — full chrome,
 * ~64.7 KB, `response.ok` true — which is the Longines empty-payload trap in a
 * new costume and must be guarded on content, never on status. And THE
 * REFERENCE IS NOT THE `<h1>`: the heading reads `SPB155` where the printed
 * product code is `SPB155J1`, differing on 97 of 244 sampled pages. That is the
 * exact INVERSE of the Lange accident above, where the URL was the short form
 * and the page was right.
 *
 * `full` AND `new-only`, and `new-only` IS HONEST HERE — the first in this
 * fleet for some time. Every watchfinder record carries Seiko's own `IsNew`
 * flag, which agrees with the PDP's scoped `_new` badge on 71 of 71 sampled
 * pages and flags 62 of the 1219. That is a flag the source sets, not a
 * synthesised diff. `heritage` is declined after a specific investigation, not
 * by omission: the watchfinder's complete eight-group facet tree contains no
 * heritage, legacy, archive, discontinued or release-year facet, and six
 * candidate archive URLs are 404s. A split COULD be synthesised from the real
 * `data-dsta` launch date, and is not, because that is what the definition
 * below forbids in terms.
 *
 * Discovery is one JSON call per market — every filter parameter the API
 * accepts is applied client-side over one fixed payload — and extraction is
 * server-rendered HTML. No browser, no stealth, no proxy; robots.txt is
 * thirteen bytes with no `Disallow`. See `src/modules/seiko/README.md` in the
 * extractors repo.
 * 369 references, 369/369 HTTP 200 from plain Node — Akamai Bot Manager is in
 * front and never challenges. See `src/modules/a-lange-soehne/README.md` in the
 * extractors repo.
 *
 *
 * `citizen` IS THE TRIVIAL SLUG AGAIN, checked rather than assumed:
 *
 *     buildBrandSlug('Citizen') -> 'citizen'
 *
 * Nothing to strip — the `breitling` / `christopher-ward` shape, where the
 * module id and the brand document id are the same string. `watchBrands/citizen`
 * is the confirmed document id, checked before the module was written. The
 * inverted IWC trap does not arise here, but its guard is kept anyway:
 * `supportedBrands` is hard-coded rather than derived, because the source
 * displays `CITIZEN` in upper case everywhere including the JSON-LD
 * `brand.name`. `buildBrandSlug('CITIZEN')` also gives `citizen`, so the
 * hard-coding costs nothing and removes the question.
 *
 * IT IS THE FIRST MODULE IN THIS FLEET TO DECLARE ALL THREE MODES, and each one
 * is a category Citizen merchandises itself rather than anything synthesised
 * here:
 *
 *     full       mens + womens + collabs      583 references
 *     new-only   new-arrivals                  53
 *     heritage   archive                      276 (275 unique)
 *
 * `new-only` IS A REAL CATEGORY, and the absence of a facet was established
 * rather than assumed: the grid's complete refinement set is seven filters,
 * none of them about newness, and the one place the word appears is
 * `srule=new-arrival-storefront` — a SORT ORDER, which reorders all 466 men's
 * references rather than filtering them. A module that mistook it for a filter
 * would crawl the whole catalogue and report it as new.
 *
 * `heritage` WIDENS WHAT THE MODE MEANS, and the widening should be read
 * deliberately. Longines, the mode's first caller, publishes 48 INDIVIDUAL
 * pre-owned watches carrying serial numbers, production dates and condition
 * grades under a thinner and differently-shaped spec set — the argument there
 * was that two kinds of claim do not belong in one table. Citizen's archive is
 * 276 discontinued REFERENCES: identical spec table, identical gallery markup,
 * parsed by the same code with no branch anywhere in the module. So the
 * justification here is not schema incompatibility. It is that these watches
 * cannot be bought, and whether that belongs in the same ingest is a consumer's
 * decision to make. The source agrees they are separate — `robots.txt` singles
 * the archive out for a `Disallow` under `User-agent: Googlebot` while leaving
 * every other collection page crawlable. No production year is read, and none
 * is available to read, which is what keeps this the source's ruling rather
 * than the synthesised split the definition below forbids.
 *
 * ONE MARKET, AND THE OTHER ONE IS NOT A LOCALE SWAP. This is where Citizen
 * parts company with `seiko` directly above. Seiko's nine English markets are
 * one catalogue served nine ways, and they union cleanly on a market-independent
 * slug. Citizen's `/us/en` answers HTTP 200 with about 1 MB and is A DIFFERENT
 * STOREFRONT: no `Sites-…-Site` id anywhere in the body, zero product links in
 * the category grid, and PDP URLs that redirect to drop the `.html`. It would
 * need its own parser, so the 858 references on `ca/en` are the whole of this
 * id by decision rather than by omission.
 *
 * THE TRAP IS A SITEMAP THAT LIES WITH A 200. `citizenwatch.com/sitemap.xml`
 * is a SOFT 404 — HTTP 200, `content-type: text/html`, and an 877 KB body that
 * is the homepage, with no `<urlset>` and not one `<loc>`; `sitemap_index.xml`
 * returns the identical body. A crawler that trusted the status code would
 * parse the homepage, find the 78 products the global nav happens to link — 9%
 * of the catalogue — and look like it had succeeded. Discovery is the SFCC grid
 * controller instead, one `Search-UpdateGrid` call per category at `sz=500`.
 *
 * A second accident is worth naming because it is silent in the other
 * direction. The spec drawer renders TWO tables, and the second is not the
 * narrow-screen duplicate that its `d-none d-lg-table` class makes it look
 * like: it carries `Functions`, which appears in the first table on no page at
 * all. Reading only the first emits a complete-looking watch with no
 * complications on 99% of the catalogue, and nothing flags it.
 *
 * NO PRICE, NO STOCK — DELIBERATELY OMITTED, and on this source that is a
 * REFUSAL rather than an absence. Citizen publishes three price surfaces per
 * reference and merchandises a `sale` category, and the JSON-LD block this
 * module declines to parse carries `offers.price`, `offers.priceCurrency` and
 * `offers.availability` on 61 of the 61 pages that have it. The refusal is
 * structural — the module's detail type has no field a price could land in —
 * and the run log reports `priceSurfacesDeclined` so the omission stays legible.
 *
 * Server-rendered SFCC throughout: no browser, no stealth, no proxy. Every page
 * loads PerimeterX and it never fires — 858/858 HTTP 200 from plain Node at
 * concurrency 5 in 190 seconds, zero challenges and no `_px` cookie set. That
 * is a measurement with a shelf life rather than a property of the origin; bulk
 * 403s would mean it has been switched from monitor to block, and the fix then
 * is stealth Playwright, not a slower crawl. A missing reference answers an
 * honest 404, which is the exact opposite of Seiko and is why this module
 * guards on status rather than on content. See `src/modules/citizen/README.md`
 * in the extractors repo.
 *
 *
 * `chopard` IS THE TRIVIAL SLUG, run rather than assumed:
 *
 *     buildBrandSlug('Chopard') -> 'chopard'
 *
 * No diacritic to drop, no ampersand to strip, no period to lose — the
 * `breitling` / `christopher-ward` / `citizen` shape, where the module id and
 * the brand document id are the same string. `buildBrandSlug('CHOPARD')` gives
 * the same result, so the casing the source uses cannot move it, and the
 * inverted IWC trap does not arise: Chopard's markup, its analytics payload and
 * its breadcrumb all name the brand `Chopard` and nothing longer.
 * `supportedBrands` is hard-coded regardless, as every id here now is.
 *
 * `watchBrands/chopard` IS NOT YET CONFIRMED in Firestore. The derivation is
 * certain; the document is a production read the module has not made. This is
 * the open item Tutima, Vacheron and Longines all shipped with, and Lange,
 * Seiko and Citizen did not — worth settling before the first live job.
 *
 * THE SITEMAP IS THE GOOD SOURCE HERE, AND THAT INVERTS `citizen` DIRECTLY
 * ABOVE. 451 references under `/en-ca/watch/` against 275 from the fully-paged
 * grid, with the grid contributing nothing the sitemap lacks. The grid carries
 * `prefn1=status&prefv1=enabled` and is therefore filtered by construction; the
 * 176 it withholds are live pages that answer 200. Citizen's soft-404 sitemap
 * is a property of that deployment, not of SFCC, and carrying the prior across
 * would have cost 39% of this catalogue.
 *
 * ALL 43 LOCALES ARE BYTE-IDENTICAL — 2123 product paths each, `en-ca`, `en-us`
 * and `en-gb` differing pairwise by zero. So the market union that `longines`
 * and `seiko` both needed buys nothing at all here, and `en-ca` is the whole of
 * this id rather than a slice of it. The check is cheap and belongs before any
 * multi-market assumption.
 *
 * TWO GRID TRAPS ARE WORTH NAMING because either one silently ends a crawl in
 * the wrong place. `robots.txt` disallows `/*?start=*&sz=*` and then Allows
 * exactly `sz=32` at 32-step offsets, so Citizen's `sz=500` sweep is FORBIDDEN
 * here and page one must be the bare category URL. And past the last page the
 * grid SERVES PAGE ONE AGAIN — full body, HTTP 200, the same 32 products — so
 * page-until-empty never terminates and page-until-short never starts. The
 * module stops on the first page contributing no new reference.
 *
 * `full` AND `new-only`. `item_is_new` is a BOOLEAN CHOPARD PUBLISHES PER
 * PRODUCT in the analytics payload of both the grid and every PDP, true on 25
 * references today; it is a flag the source sets, not a diff, which is the
 * distinction the definition below draws. It is read from the grid, so the mode
 * costs nine requests rather than 451. `heritage` is ABSENT AFTER A SEARCH IN
 * THREE PLACES — all 202 category paths this market publishes, the cross-locale
 * category list, and the `L.U.C` line where a brand with this history would
 * plausibly keep one — and is omitted rather than aliased onto something
 * approximate.
 *
 * THE CASE SIZE NEEDS THE BREADCRUMB, and the obvious substitute is a decoy.
 * `Case Diameter` is present on 61% of references; the last breadcrumb crumb,
 * Chopard's own composed descriptor, supplies 164 more and takes it to 98%. The
 * analytics `item_variant` reads `33 mm`, looks like exactly the answer, and
 * covers the same 59% — the `vacheron-constantin` spec-tab failure in yet
 * another costume, wrong at a fill rate that reads as fine.
 *
 * `movement` HAS TWO DECOYS AROUND IT, and this is the v1.80.0
 * module-is-not-calibre incident with the names shuffled. The analytics
 * `movement` key is a WINDING TYPE spelled eight ways for four concepts and
 * reads `ethical rose gold` on one reference. `Type of Winding` is that same
 * fact said properly and maps to `movementType`. The `Movement` SPEC ROW is the
 * calibre and is the only thing that may reach `movement`.
 *
 * TEN REFERENCES BEGIN WITH A LITERAL `@` (`@10A065-1100`, `%40` in the URL),
 * so the reference is taken from `data-pid` and the analytics
 * `productReference`, never from the URL slug. And the variations rail is a
 * TRUNCATION: three thumbnails plus a "13 more variations" button, with the
 * full list in a modal rendered into the same document. Reading the rail alone
 * was wrong by ten siblings and looked complete. The sibling edges are the
 * source's own and survive the IWC cross-model test — 2029 edges, all sharing
 * the reference base, all present in the sitemap.
 *
 * IMAGES ARE TAGGED ON 99.9%, THE BEST IN THIS FLEET, ahead of Lange's 95.3%.
 * The `alt` is a closed seven-value view vocabulary (`Front view`, `Back view`,
 * `Clasp closed view`, a lower-case `worn view`) rather than the product
 * descriptor Rolex publishes; the model name shares the string, so everything
 * before the last `Watch` is discarded first, and gallery assets are filtered to
 * the page's OWN reference because a page-wide CDN sweep returns ~11.6 assets
 * against a true gallery of 4.4.
 *
 * NO PRICE, NO STOCK — DELIBERATELY OMITTED, and as on `citizen` that is a
 * REFUSAL rather than an absence. Chopard publishes a price on every page
 * TWICE, in the analytics payload and on every variant tile, alongside
 * `availability`. The refusal is structural: the module's detail type has no
 * field a price could land in.
 *
 * NO BOT MANAGER IN THE PATH AT ALL — roughly 700 requests across
 * characterisation, zero challenges and zero 403s, from plain Node `fetch` at
 * concurrency 5. That is softer than Citizen, where PerimeterX loads and never
 * fires, and it is a measurement with a shelf life rather than a property of
 * the origin. A fabricated reference answers an honest 404, so this module
 * guards on status like Citizen and unlike Seiko. 451 emitted, 0 errors. See
 * `src/modules/chopard/README.md` in the extractors repo.
 *
 *
 * `bulova` AND `caravelle` ARE ONE CODE MODULE AND TWO IDS, and they enter this
 * union together in one bump because splitting them would only create a version
 * where half of that module can be registered. `casio-gshock` and its four
 * siblings are the precedent for one factory behind several ids, but those five
 * are lines of ONE brand family; these two are SEPARATELY REGISTERED BRANDS —
 * `watchBrands/bulova` and `watchBrands/caravelle` are distinct documents — sold
 * out of one Salesforce Commerce Cloud storefront at `bulova.com/ca/en`.
 * Caravelle is Bulova's value line and is merchandised inside the same `mens`
 * and `womens` categories rather than anywhere of its own.
 *
 * A SINGLE MULTI-BRAND MODULE IS NOT EXPRESSIBLE, and that is a schema fact
 * rather than a preference. `brandId` is a property of the JOB: it enters on
 * `CreateExtractionJobInput`, is stored on `ExtractionJob`, is copied to
 * `ExtractionResult` and decides the artifact path. `ExtractedWatch` has
 * forty-nine fields and not one of them is a brand, so one run emits one brand
 * for every watch in it and a module routing per reference would have nowhere to
 * put the decision. The two modules differ in `ownsReference` and nothing else.
 *
 * BOTH SLUGS ARE TRIVIAL AND BOTH DOCUMENTS WERE CONFIRMED, run rather than
 * assumed:
 *
 *     buildBrandSlug('Bulova')    -> 'bulova'
 *     buildBrandSlug('Caravelle') -> 'caravelle'
 *
 * `buildBrandSlug('BULOVA')` gives the same string, so the upper case the source
 * uses cannot move it. Unlike `tutima`, `vacheron-constantin`, `longines` and
 * `chopard`, both brand documents were READ IN FIRESTORE before the module was
 * written — and that read is the premise of the whole split, since if
 * `watchBrands/caravelle` did not exist the right answer would have been one
 * module.
 *
 * THE BRAND SIGNAL IS THE REFERENCE PREFIX — 43/44/45 Caravelle, 96/97/98
 * Bulova — because every obvious signal is wrong and each was tried. The JSON-LD
 * `brand.name` reads `BULOVA` on 606/606 pages INCLUDING every Caravelle one
 * (`43B151` is named "Caravelle Dress"), and no other brand attribute exists
 * anywhere in the markup. Eleven references in the source's own caravelle
 * collection carry no brand token in their name at all, and that collection
 * covers the current line only — zero of the archive's 72 Caravelle references.
 * The prefix was checked as a SET EQUALITY against that collection, the same 67
 * references with no disagreement in either direction. 663 references split 524
 * `bulova` / 139 `caravelle`.
 *
 * DISCOVERY IS PAGINATED AND `sz` IS NOT HONOURED, which inverts `citizen` on
 * the same cartridge. `mens` returns 47 tiles whether asked for 12 or 1000
 * against a real total of 278, answering HTTP 200 with a complete-looking 936 KB
 * body — so Citizen's single `sz=500` sweep silently yields 17% of the category,
 * while `womens` honours `sz` and would have looked correct. Tiles are read from
 * `data-pid` rather than hrefs: the men's grid renders 231 product links that
 * are not results of the query, and its page-one href set happens to equal the
 * paginated union, so an href reader is right today by accident. The source
 * states no total anywhere, so the per-page walk is logged rather than
 * cross-checked the way Citizen's can be.
 *
 * SAME SFCC CARTRIDGE AS `citizen`, so both of that module's spec-drawer traps
 * apply byte-identically: `Functions` lives only in the `d-none d-lg-table`
 * second table (662/663 references), and its value list is the one row whose
 * class carries a utility suffix. But FOUR OF THE NINE LABELS ARE RENAMED
 * despite identical markup — `Band Type`, `Water-Resistance`, `Movement
 * Technology`, `Lug Width (mm)` — so Citizen's constants lifted verbatim read
 * four rows as empty, losing the calibre, movement type, strap material, water
 * resistance and lug width, while the other five fill perfectly and the run
 * looks healthy. Inheriting a sibling module's selectors is the cheap move here
 * and it is wrong in a way nothing flags.
 *
 * `full`, `new-only` AND `heritage`. `heritage` is `archive`, an unlinked `cgid`
 * the grid controller serves that appears in no navigation at all, and all 261
 * of its references appear in no other category; no year is published and none
 * is read. It is also where the prefix classifier does real work, since 72 of
 * the 261 are Caravelle and the source publishes no caravelle collection for the
 * archive. Per brand, full / new-only / heritage: `bulova` 335 / 35 / 189,
 * `caravelle` 67 / 16 / 72.
 *
 * IMAGES ARE TAGGED ON 79.8% (2542/3184) off `data-slide-name`, with the
 * `alternateImageNURL` family left untagged on purpose and
 * `productMarketingVideo` dropped as not a photograph of the watch. There is no
 * sibling rail to read — `data-swatchable-attributes` is declared and zero
 * swatches render, sampled over 83 references — so variants are DERIVED on model
 * plus calibre plus diameter: 335 groups, mean 1.98, max 9.
 *
 * `strapBuckleType` IS AN ABSENCE, NOT A REFUSAL, and it is worth naming because
 * `citizen` fills it at 100% off the row that looks like this one. Citizen's
 * `Band` is [type, material, clasp]; Bulova's `Band Type` is a fixed TWO on
 * 663/663 and no clasp appears on the page. `dialFinish` is omitted for the same
 * measured reason — `Dial[1]` is a features list, the shape that would have been
 * wrong on 217 of Citizen's 220.
 *
 * NO PRICE, NO STOCK — DELIBERATELY OMITTED, and as on `citizen` and `chopard`
 * that is a REFUSAL rather than an absence: three price surfaces per reference.
 * It is structural — the module's detail type has no field a price could land in
 * — and the run log reports `priceSurfacesDeclined`.
 *
 * Server-rendered SFCC throughout: no browser, no stealth, no proxy. A missing
 * reference answers HTTP 410 Gone rather than Citizen's 404, so this module
 * guards on status but not on a single code. Measured end to end over both
 * brands and both catalogue modes: 663 emitted, 0 fetch errors, 0 skipped, 90
 * distinct calibres. See `src/modules/bulova/README.md` in the extractors repo. *
 * `parmigiani-fleurier` — WORDPRESS + WOOCOMMERCE at parmigiani.com/en (Yoast,
 * Polylang, Carbon Fields, Impreza), server-rendered throughout, 71 English
 * references. IT NEEDS A BROWSER AND NOT FOR RENDERING: Cloudflare answers a
 * 103-byte HTTP 403 in ~40 ms to plain Node `fetch`, to `fetch` carrying a full
 * desktop-Chrome header set with Client Hints, and to curl, on every HTML and
 * XML path — `robots.txt` alone answers 200, which is what makes the block look
 * like a dead origin. It is a fingerprint rule with no interstitial and no
 * clearance cookie to earn, and the existing stealth fingerprint clears it on
 * 76 of 76 requests with no retry and no proxy. Two Playwright traps follow:
 * `page.request` is a SEPARATE HTTP CLIENT that 403s like bare `fetch`, and
 * `page.content()` returns an EMPTY STRING for XML, so the module reads
 * `response.text()` and cannot use the shared `fetchHtml`.
 *
 * DISCOVERY IS THE OPEN WOOCOMMERCE STORE API — one call with `?lang=en` gives
 * all 71 WITH THE SKU, which neither the sitemap nor `wp/v2/product` carries.
 * Three structures name the catalogue and disagree (Store API 71, sitemap 71,
 * grid 69) and the grid is the weakest and most deceptive: `page/2` and `page/3`
 * serve page one verbatim with HTTP 200, and every card is rendered up to four
 * times — 241 card elements over 72 distinct ids, which reported 46 novelties
 * where there are 13. FOUR INDEX TRAPS: the Store API OMITS THE `Legacy`
 * CATEGORY, returning `categories: []` for the three watches `wp/v2` places in
 * it, so family comes from `wp/v2`; the post `slug` IS NOT the permalink slug
 * and diverges on 11 of 71, four of them named `new-watch-1` or `510869`, so the
 * two APIs join on the numeric post id; six products carry a CHILD term with no
 * parent, so family is the tree ROOT and 65/71 becomes 71/71; and the CMS
 * taxonomy labels are drifted, with `bracelet_material` labelled "Collections"
 * and `watch_type` labelled "Watch Size" while being a size bucket, so the term
 * VALUES are read and the labels ignored.
 *
 * THE SPEC SURFACE IS THE CLEANEST IN THE FLEET: the theme renders every custom
 * field with ITS OWN CMS KEY IN THE CLASS ATTRIBUTE, so extraction is KEYED
 * rather than label-matched and neither Vacheron's duplicate-label problem nor
 * Mühle's German-label problem can arise. Two things still bite — the movement
 * panel is rendered twice and the calibre three times, once as `Calibre: PF703`,
 * so first-occurrence-wins is load-bearing; and there are TWO TEMPLATES plus one
 * bespoke page with no spec block at all, with 6 of 71 stating NO REFERENCE
 * ANYWHERE, which is why identity comes from the index and only the
 * specification from the page.
 *
 * `full` AND `new-only`, NO `heritage`. `new-only` reads a `Novelty` badge off
 * the grid in one request, 13 references. `Legacy` is the one heritage candidate
 * and fails the test: three pieces INSIDE the same 71 rather than a second
 * catalogue, and Kalpa, Bugatti, Pershing and Toric Chronomètre are not on the
 * site in any form.
 *
 * IMAGE TAGGING IS 59% (165/278) AND THE CEILING IS THE SOURCE: every `alt`
 * attribute in every gallery on every page is EMPTY, so the only signal is a
 * filename suffix — and each was decided by DOWNLOADING THE IMAGES AND LOOKING
 * AT THEM. The bare `{REF}.png` is the watch front (`dial`); `-v` and `-r` are
 * BOTH BARE MOVEMENT SHOTS, rotor side and dial side, with no case in frame, so
 * neither is a caseback and the DOM agrees, since both are background-images
 * inside the movement panel. `-p1` and `-p2` ship untagged because the obvious
 * rule was FALSIFIED on sampling. Every watch with a photograph gets a `dial`,
 * 68 of 68. The gallery must be SCOPED BY FILENAME: one page carries 159 upload
 * URLs and names twelve other watches, because the foot-of-page rail is static
 * navigation rendered identically on all 71 pages.
 *
 * VARIANTS ARE DERIVED AND LABELLED AS DERIVED — the source publishes no
 * declination list — grouping on the six-character model code in the reference,
 * adopted only after measuring it: 12 of 15 multi-member groups share an
 * identical calibre AND diameter, and the 3 that differ are anniversary or COSC
 * sub-variants of one model line. The run re-checks and logs that count. 350
 * edges across 65 watches.
 *
 * NO BEZEL DATA OF ANY KIND EXISTS on this source — no field, no row, no term —
 * and the word appears only inside marketing prose about incision counts, so
 * `bezel` and `bezelType` are deliberately unset rather than mined. NO PRICE, NO
 * CURRENCY, NO STOCK — a REFUSAL rather than an absence: every Store API record
 * hands over a `prices` object, a `price_html`, an `is_in_stock` and an
 * `add_to_cart` unasked, so the record is read through a declared ALLOWLIST
 * rather than spread, and the run log reports 141 declined surfaces. Measured
 * end to end: 71 emitted, 0 errors, 76 fetches, 21 distinct calibres, 4
 * collections, 0 family gaps. See `src/modules/parmigiani-fleurier/README.md` in
 * the extractors repo.
 *
 * `ball-watch` — OPENCART 3.x ON LITESPEED/PHP at ballwatch.com/en,
 * server-rendered throughout with no SPA, no client-rendered grid and no XHR to
 * wait for, so the module OPENS NO BROWSER. THERE IS NO BOT MANAGER AT ALL:
 * several hundred requests from plain Node `fetch` returned HTTP 200 every
 * time, with no challenge, no 403 and no bot-management script in the markup.
 * `robots.txt` is 31 bytes and declares only `Crawl-Delay: 20`, honoured as a
 * 3s serial default that `BALL_CRAWL_DELAY_MS` can raise to the declared value;
 * concurrency is 1, because a delay multiplied across four workers is not that
 * delay.
 *
 * DISCOVERY IS THE OPENCART SITEMAP FEED, AND IT IS NOT WHERE A SITEMAP LIVES:
 * `/sitemap.xml` and `/sitemap_index.xml` are both 404s, and the first one's
 * canonical points at `index.php?route=feed/google_sitemap`, the OpenCart 2
 * route, WHICH IS ALSO A 404. The live feed is
 * `index.php?route=extension/feed/google_sitemap` — 5.5 MB, 13,483 `<loc>`
 * elements holding 1,390 distinct URLs. The seven-page watchfinder is unioned
 * in to vouch for the handful of products published under a vanity slug,
 * turning ~440 speculative fetches into 7 real ones.
 *
 * THE KILLER TRAP IS THE REFERENCE ITSELF. A builder page — one OpenCart
 * product with a strap/dial options builder over it, selected by `?model=` —
 * renders its SPECS AND GALLERY correctly for the selected build but assembles
 * `.ciopmodel` client-side from a `concat_model` routine that fails two ways:
 * `?model=NM9080D-S1J-BE` renders `NM9080D`, truncated to the stem, and
 * `?model=DG2118C-S9C-BK` renders `DGC`, corrupted outright. Measured over the
 * whole catalogue, 27 of 626 references — 4.3% — disagree, 20 of them
 * truncations to a stem and 7 corruptions that are not even a prefix of the
 * right answer. Neither failure is visible from the row, since one is a real
 * product stem and the other is merely a short string, so a fill-rate check
 * sees 100%. The `model=` QUERY PARAMETER IS AUTHORITATIVE and `.ciopmodel` is
 * believed only on single-reference PDPs; the disagreement is written to
 * `rawSpecs` so it stays countable.
 *
 * SPECS ARE READ BY NUMERIC `attribute-id`, NEVER BY LABEL, because the site
 * serves five locales off one product record and the `<h6>` label is translated
 * while the id is not — a label-keyed parser is an English-only parser that
 * returns an empty spec table on `zh-TW` without erroring. Attribute 13 is a
 * LIST, not a string, carrying the calibre line, the COSC line and a combined
 * power-reserve/vph line; only the text after `caliber`/`calibre` becomes
 * `movement`, because joining the list would manufacture a calibre named after
 * the whole paragraph — the Casio module-number mistake in a different costume.
 *
 * FOUR BALL-SPECIFIC MEASUREMENTS ARE CAPTURED AND NONE BECOMES A FIELD:
 * anti-magnetic resistance normalised to A/m, tritium micro gas tube count,
 * shock resistance in Gs, and COSC certification. They travel in `rawSpecs`
 * under `Derived:` keys plus `functions[]`, DELIBERATELY NOT as first-class
 * members of `ExtractedWatch` — admin has no mapping, no UI and no query for an
 * `antiMagneticAm`, so a field would be dead schema, and `module` is the
 * precedent that says which way to lean, having earned its place only because
 * `ScrapedWatchEntry.module` already existed to receive it. The anti-magnetism
 * parse is the one with teeth: six spellings appear, and the three
 * Gauss-leading ones (`1,000 Gauss (80,000 A/m)`) trap a first-number parse into
 * returning 1,000 on ~12% of the catalogue, so each unit is matched by the
 * number preceding ITS OWN symbol. Shock resistance sits in attribute 35 on 41%
 * of pages and inside the Functions prose on another 41%, sometimes
 * parenthesised mid-sentence, so reading only the dedicated attribute halves it.
 * The live A/m ladder is NOT the published one: there is no 12,000 tier, it runs
 * 4,800 (390 references), 80,000 (204) and 200,000 (16), and one 200,000
 * reference pairs it as `200,000A/m (2,500 Gauss)` rather than the 1,000 Gauss
 * every other spelling uses. Tube counts run 6 to 66.
 *
 * IMAGE TAGGING IS THE FLEET'S BEST LUME SIGNAL. Ball photographs every watch
 * lit and unlit and files the dark shot under `_night`, which maps straight onto
 * `lume` with no inference and no positional assumption; about half of every
 * gallery is a night shot. Match `_night` and NOT `_night_front` — one current
 * reference is filed as `_night_frontr`, and an exact match drops its only night
 * shot while reporting a healthy fill rate. The gallery must be SCOPED TO
 * `.product-main--slider`: the page also carries an accessories rail, a
 * cross-sell rail and the builder's swatches on the same CDN, 36 images for a
 * watch that has 2. Filename filtering was tried and FAILS, because a watch's
 * gallery is routinely filed under a DIFFERENT reference.
 *
 * `full` ONLY — no `new-only`, no `heritage`, and both were sought. The
 * watchfinder tiles carry no novelty or year badge of any kind; the only
 * badge-shaped class in the grid is a strap-builder swatch label. And the
 * apparent archive is an artefact: the sitemap's 477 `?model=` references
 * against the watchfinder's ~205 tiles look like ~300 discontinued models, but
 * the two differ by GRANULARITY rather than currency — the watchfinder lists one
 * representative build per builder product where the sitemap enumerates every
 * build. Grouped by BASE PAGE, only 4 of 127 builder pages and 8 of 90 plain
 * reference pages are absent from the watchfinder, which is noise rather than a
 * second catalogue, and `/en/heritage` carries ZERO product tiles — it is
 * editorial about Webb C. Ball and railroad timekeeping, while `/en/archive`,
 * `/en/discontinued` and `/en/vintage` are all 404.
 *
 * NO PRICE, NO STOCK — a REFUSAL rather than an absence: every PDP renders a
 * price, a struck-through RRP and an availability string, and `rawSpecs` is
 * built from the attribute-id ALLOWLIST rather than a DOM sweep so none of them
 * has a path through. Measured end to end: 626 references discovered in 8
 * requests, 621 emitted, 0 fetch errors, 634 fetches, 1218 images of which 1205
 * tagged (98.9%, including 553 `lume`), 2748 variant edges, 37 distinct
 * calibres. The five non-emitting URLs are one strap, one soft 404 serving an
 * empty product body under HTTP 200, and three nested duplicates of base pages
 * whose every reference emitted from the un-nested path. See
 * `src/modules/ball-watch/README.md` in the extractors repo.
 *
 * `piaget` — SERVER-RENDERED HTML WITH VUE HYDRATED OVER THE TOP at
 * piaget.com/ca-en. The breadcrumb, title, gallery slider and both spec panels
 * are all in the first response, so the module OPENS NO BROWSER. Akamai Bot
 * Manager is in the request path — `ak_bmsc`, `bm_sz`, `bm_mi` and a
 * `server-timing: ak_p` — and is currently PASSIVE: 231 requests per full run,
 * never challenged.
 *
 * THERE IS NO PAGINATION TO CONFIGURE, AND THAT IS A `robots.txt` FACT rather
 * than a gap in the investigation. `all-watches` server-renders 151 product
 * cards and declares `:has-load-more="true"`; the rest is behind a Vue
 * load-more calling a `listProducts` route, and a wildcard `Disallow` on
 * `listProducts` is the FIRST rule in piaget.com/robots.txt. Five
 * query-parameter shortcuts were
 * tried — `?page=2`, `?p=2`, `?offset=100`, `?size=500`, `?nbProducts=500` —
 * and every one returned the identical 2,529,404-byte document with the
 * identical 151 cards. So the category walk IS the pagination. DISCOVERY IS
 * TWO SOURCES UNIONED because neither is complete: the sitemap alone yields
 * 153, the category walk alone 167, the union 178, with 11 sitemap-only (high
 * jewellery, cobalt tourbillons, a Métiers d'Art) and 25 category-only
 * references the sitemap has dropped. Either half loses 6–14% of the
 * catalogue — the Breitling shape, and the same answer. The category list is
 * read from the sitemap rather than hard-coded, minus the 42 of 93 non-product
 * `/watches/` URLs that are STRAP PRODUCT PAGES and can never hold a listing;
 * excluding them saves 42 fetches and changes the union by zero.
 *
 * THE KILLER TRAP IS THAT CASE IS LOAD-BEARING. The Characteristics panel
 * publishes two different facts under the same word four rows apart on 165 of
 * 178 pages: `STRAP BUCKLE` is the buckle's MATERIAL (`Gold`) and
 * `Strap buckle` is its TYPE (`Ardillon buckle`). A case-insensitive label map —
 * the obvious way to write one — writes `Gold` into `strapBuckleType` on nine
 * watches in ten and reports a 100% fill rate doing it. Every label match in
 * the module is case-sensitive, asserted against `CASE_COLLIDING_LABEL_PAIRS`.
 *
 * SPECS ARE PANEL-SCOPED, keyed on `(panel, label)` pairs throughout, because
 * `MOVEMENT TYPE` appears in both product panels on 103 pages and the movement
 * panel's own `Diameter (mm)` (20.2 mm) would otherwise land in `caseSize`
 * beside the case's 38 mm. Each panel is rendered TWICE — mobile accordion and
 * desktop tabs — so the parser dedupes on the pair and keeps the first;
 * `Daily Care & Services` is dropped as editorial. Two smaller shapes were
 * found only by the full 178-page run and not by any sample: the five 910P
 * Altiplano references render the MOVEMENT PAGE'S vocabulary (`Movement type`,
 * `Shape`, `Functions`, `Thickness (mm)`) instead of the shouted spellings, all
 * five parsing cleanly with healthy fill rates while `Hours, Minutes` went
 * silently missing from `functions[]`; and 13 pages render three breadcrumbs
 * with no family, so reading crumb 2 unconditionally files thirteen watches
 * under a collection called "White Gold Diamond Watch". `CASE DIAMETER` covers
 * only 136 of 178, so the size is a three-way chain down through
 * `Case dimension` (18, `45 x 43 mm`) and `Wrist size` (8, cuffs and bangles),
 * and `Wrist size` is NOT `lugToLug` and is not mapped to it.
 *
 * THE CALIBRE IS NOT IN THE SPEC PANEL — it is the "More about the movement"
 * link, `/ca-en/movement/1205p1-automatic-ultra-thin-movement` → `1205P1`, 16
 * calibres over 108 of 178 pages. `1160pblue` is the one that needed a rule,
 * since a blind uppercase gives `1160PBLUE` rather than `1160P Blue`. NO
 * MOVEMENT PAGE IS EVER FETCHED: the PDP's own panel describes THIS watch,
 * where G0A51500 declares a 40-hour power reserve against the shared 430P
 * page's "Approx. 43". The code is emitted unprefixed — the brand is already on
 * the row. The reference is the URL slug tail uppercased, present on 178 of
 * 178, with JSON-LD `sku` agreeing on all 142 pages that publish structured
 * data; the other 36 publish none, which is why the URL leads.
 *
 * IMAGES ARE THE FLEET WEAK POINT AND ARE HONESTLY REPORTED: 578 images over
 * 178 watches, 178 tagged, 30.8%. The URLs are `<recipe>/<40-hex content
 * hash>.jpg` so the filename means nothing, and `alt` is empty on 400 of 578.
 * The one signal is structural — the hero uses a `new-product-banner-*` CDN
 * recipe and no other slide ever does, 178/178 against 0/400 — and seven heroes
 * were downloaded and looked at before that earned `dial`. Positions 1+ ship
 * UNTAGGED because the convention genuinely varies (three-quarter, side,
 * caseback and editorial all appear at p2), and raising the number would mean
 * inventing a convention Piaget does not follow. `variantRefs` is OMITTED
 * rather than emptied: there is no variant selector, no metal swatch rail, no
 * `product-variations`/`declination` markup and zero product cross-links after
 * the spec block on 178 of 178 pages, and shared-types distinguishes "asked and
 * none" from "never asked". Grouping on the product name would find clusters —
 * 22 pages are titled "Limelight Gala watch" — but that turns a similarity
 * judgement into a quotation, and the cluster spans 26 mm and 32 mm cases.
 *
 * NO PRICE, NO STOCK — a REFUSAL rather than an absence, and a doubled one,
 * because Piaget publishes commerce data two ways: JSON-LD `offers.price` and
 * `offers.priceCurrency` as a real integer and `"CAD"` on 142 of 178 pages, and
 * a `.pdp-banner__price` carrying either a formatted price or "Price available
 * upon request". The structural refusal is that the JSON-LD reader takes four
 * keys BY NAME (`sku`, `name`, `description`, `gtin13`) rather than spreading
 * the object, and `rawSpecs` is built from a panel-scoped label ALLOWLIST
 * rather than a DOM sweep, so neither shape has a path through. Measured end to
 * end on ca-en: 178 of 178 emitted, 0 fetch errors, 0 skipped, 231 requests, 0
 * reference disagreements, 16 distinct calibres. `full` and `new-only`; no
 * `heritage`. See `src/modules/piaget/README.md` in the extractors repo.
 *
 * `hamilton` — CLASSIC MAGENTO 2 LUMA at hamiltonwatch.com, and the point worth
 * carrying is that it is NOT the Longines stack despite both brands being Swatch
 * Group and both storefronts being Magento 2. Longines runs Next.js and ships
 * raw GraphQL responses inside `__NEXT_DATA__`; Hamilton runs requirejs,
 * `x-magento-init` and fotorama, and server-renders the RESOLVED specification
 * strings into the HTML, so there is no embedded attribute dictionary because
 * nothing arrives unresolved.
 *
 * CURL CANNOT REACH THIS ORIGIN AND NODE CAN: HTTP/2 answers `INTERNAL_ERROR`
 * and HTTP/1.1 tarpits to a 60s timeout having received zero bytes, while
 * longines.com answers normally from the same machine, and Node `fetch` gets 200
 * in ~230ms with only a User-Agent. That inverts the Christopher Ward case and
 * means anyone probing with curl reports a bot wall that is not there. No
 * browser, no stealth, no proxy.
 *
 * TWO SOURCES. An open, unauthenticated GraphQL endpoint supplies discovery and
 * the gallery; the PDP supplies every specification. GraphQL returns the
 * `hamilton_*` attributes as NUMERIC OPTION IDS with no dictionary anywhere on
 * the origin, and does not expose `Caliber`, `Thickness` or `Strap reference` at
 * any name, so a GraphQL-only module would ship the catalogue with no calibres.
 * It is POSTed only: `robots.txt` ends `Disallow: /*?`, which bans every query
 * string including the grid's own `?p=` pagination and `GET /graphql?query=`.
 *
 * NO STORE IS THE CATALOGUE — the Longines shape again. The union across the 39
 * stores that exist is 313 watches; the largest single store is KOREAN at 522
 * products, en-ca has 477, and 7 watches are served by no English store at all.
 * Two of the 41 store codes the sitemap index names are not stores. A missing
 * product returns a real 404 rather than Longines' soft 200.
 *
 * `full` ONLY, and the absence of `new-only` is a finding rather than a gap.
 * Hamilton badges 8 new releases and publishes no way to query them:
 * `new_from_date` is unused (null on all 8, set on 3 of 475, not filterable),
 * no custom attribute exists, `hamilton_status` is lifecycle rather than
 * newness, and the novelties category MISSES 2 OF THE 8 badged watches —
 * measured twice, which inverts Longines, where novelties was a strict superset
 * and became the `new-only` crawl. The badge is emitted into `rawSpecs` as
 * `Hamilton New Badge` on every row, so newness is reconcilable from a full run.
 *
 * Full run: 313 of 313 emitted, 0 fetch errors, 0 skipped, 414 requests, 33
 * calibres, `imageUrl` on 313, 59.8% of images tagged, 1 reference
 * disagreement. NO PRICE, NO STOCK — filled on every product in both the JSON-LD
 * the parser reads and the GraphQL response discovery receives, and neither is
 * emitted nor requested. See `src/modules/hamilton/README.md` in the extractors
 * repo.
 *
 * `zenith` — VUE STOREFRONT 1.x over an ElasticSearch catalogue at
 * zenith-watches.com, and the entry that has to lead with an ACCESS CAVEAT
 * rather than a run: THIS MODULE HAS NEVER COMPLETED A CRAWL FROM THE
 * EXTRACTORS SERVICE'S OWN RUNTIME.
 *
 * ZENITH REFUSES AUTOMATION OUTRIGHT, WHICH IS NOT THE SAME AS REFUSING
 * DATACENTRE IPs. Measured 2026-09-03 from a RESIDENTIAL address: flat HTTP 403
 * to `node:https`, to stealth Playwright HEADLESS and to stealth Playwright
 * HEADFUL, four attempts each, every attempt firing an Akamai sensor POST and
 * earning a fresh `_abck` that converted nothing. A genuine browser on the same
 * connection is offered the interactive behavioural challenge instead of a
 * deny, so this is CLIENT CLASSIFICATION and a residential address does not
 * clear it — nor does the stealth fingerprint that clears Rolex and IWC. An
 * `_abck` minted in a cleared Chrome and injected into Playwright turned the
 * 403 into a 200 CARRYING 2.5 KB OF CHALLENGE PAGE, which is why that module
 * gates on the response BODY and never on the status line.
 *
 * THERE IS NO SIDE DOOR: the ElasticSearch host, every `/api/*` path,
 * `/graphql` and every asset path on the image CDN return 403 identically. Only
 * `robots.txt` and the small sitemaps answer, while the product and category
 * sitemaps TARPIT — zero bytes at 180 seconds. The fixtures behind that
 * module's tests were captured from a DIFFERENT egress that Akamai cleared
 * silently, so its parser is proven against genuine payloads and its crawl path
 * is not proven at all. Expect a residential proxy or a rendering service, and
 * re-probe from any new runtime before assuming access.
 *
 * DISCOVERY AND EXTRACTION ARE ONE PASS, because the collection record IS the
 * full ES document — every `option_value_*`, all seventeen complication flags,
 * the functions prose, the gallery and the Akeneo spec-sheet URL. There is no
 * per-product fetch at all; 33 watches cost 3 requests. The SITEMAP IS WRONG
 * ABOUT THE FAMILIES IN BOTH DIRECTIONS — it names two collections that are not
 * families and omits two that are — so the five come from the live DOM filter.
 * Pagination is NOT a URL parameter (the router strips `?page=`), so the module
 * re-points the SPA's OWN captured search URL at a new offset, inheriting its
 * filter, category, sort and short-lived guest token rather than reconstructing
 * a query; `size >= 25` hangs at the edge.
 *
 * THREE FIELDS LOOK MAPPABLE AND ARE POISON, each caught only by reading VALUES
 * across three families rather than trusting a field name. `caliber` is a
 * movement SIZE in lignes, BYTE-IDENTICAL on every record measured, and routed
 * to a calibre it would manufacture one bogus calibre catalogue-wide at a 100%
 * fill rate — the Casio module-number failure exactly. `buckle` is a part code,
 * identical on all three. `finishes` describes the OSCILLATING WEIGHT, a
 * movement finish rather than a dial one. All three go to `rawSpecs` alone.
 * What reaches `movement` is the calibre FAMILY, never the specific calibre,
 * which Zenith publishes only in prose.
 *
 * IMAGES SHIP UNTAGGED ON PURPOSE: no caption, alt text or label exists
 * anywhere in the record, the only candidate signal is a filename token run,
 * and the CDN refuses that runtime so not one pixel was ever verified —
 * following Christopher Ward and Swatch rather than repeating the Rolex and
 * NOMOS mis-tagging. NO PRICE, NO STOCK — filled on every record in both the ES
 * document the parser reads and the JSON-LD on every product page, and the
 * refusal is a STATED DENYLIST of nineteen field names asserted by test,
 * because `rawSpecs` copies what it is handed. `full` only. See
 * `src/modules/zenith/README.md` in the extractors repo.
 *
 * `grand-seiko` — SITECORE 10.4 SERVER-RENDERED HTML behind Azure Front Door at
 * grand-seiko.com, and the second id the `seiko` entry above anticipated rather
 * than a widening of it. The two are separate sites with separate catalogues
 * and no reference in common; `seiko` records the same boundary from its side.
 *
 * THE MOST OPEN ORIGIN IN THIS FLEET, which is worth stating because it is the
 * opposite of zenith. `robots.txt` is THIRTEEN BYTES — `User-agent: *`, no
 * `Disallow`, no crawl delay. `curl`, an empty UA and `python-requests` are all
 * served 200. There is no Cloudflare, Akamai or Datadome header, no `__cf_bm`,
 * `_abck` or `datadome` cookie, and no sensor script anywhere. A full run from
 * PLAIN NODE completed 71 sitemaps and 221 product pages at HTTP 200 on every
 * request with zero retries. `ctx.browser` is accepted and never touched and
 * `ctx.proxy` is ignored; the 750 ms per worker at concurrency 6 is courtesy
 * and not compliance.
 *
 * ENGLISH ONLY, AND THE ARITHMETIC IS THE SCOPE DECISION: 290 references exist
 * worldwide, 221 are reachable in English, 214 are emitted. The 69 that are
 * declined live only in Japanese or Chinese locales — `jp-ja` 38, `cn-zh` 28,
 * `hk-zh` 15, `tw-zh` 2, with one each in `id-id`, `ch-de` and `ch-fr` — and
 * those locales render the page in their own language DOWN TO THE SPEC VALUES,
 * so emitting them would put `ヘリテージコレクション` into `collection` and
 * Japanese strings into `caseMaterial` and `waterRes` across a quarter of the
 * catalogue. `GrandSeikoDiscovery.declined` names every one of the 69 with its
 * carrier locales and the run log reports the count, because a gap that is
 * measured and reported is a scope decision and the same gap unreported is a
 * bug.
 *
 * THE CATALOGUE CANNOT BE UNIONED ACROSS LANGUAGES AND THEN READ IN ENGLISH,
 * which INVERTS LONGINES exactly. On Longines any locale answers for any slug
 * and a miss is a 200 with an empty payload; here a reference does not exist at
 * a locale whose sitemap omits it. Four `jp-ja`-only references requested from
 * `us-en` in all three slug forms gave 12 requests and 12 soft 404s, and all
 * four served correctly from `jp-ja`. A miss is HTTP 200 carrying an ~85 KB
 * "404 Page Not Found" body with a full nav, footer and featured rail, so it
 * parses into a PLAUSIBLE SHELL rather than an obviously empty one — detected
 * on the `<h1>` and on the absence of the spec block, never on the status line.
 *
 * TWO STALE BENELUX SITEMAPS ARE THE ACCEPTED LOSS. `be-en` and `nl-en` both
 * list seven references that NEITHER SERVES — SBGC221, SBGC223, SBGD209,
 * SBGP001, SBGW260, SBGW293 and SBGX346 — all 14 requests answering the
 * 200-with-404-body page, and two of the seven existing in `jp-ja` only. The
 * module walks EVERY English locale claiming a reference before giving up, so
 * the loss is proven rather than assumed and the error names each locale tried.
 * Those seven are the whole distance between 221 discovered and 214 emitted.
 *
 * THE MOVEMENT FAMILY IS READ AND NOT DERIVED, on three signals ordered by how
 * directly the source states the answer: the calibre link's own hub segment in
 * Grand Seiko's published taxonomy (`/collections/movement/springdrive/9r65`)
 * carries 199 of 214, the `Movement Type` row carries 13, and the calibre
 * prefix carries the last 2. ALL THREE ARE LOAD-BEARING and a 45-page sample
 * did not show it: fifteen references have no hub page, the sample saw only
 * quartz among them, and "no hub means quartz" looked safe until `9S61` turned
 * out to be MECHANICAL with a `Movement Type` of `Self-winding with
 * manual-winding` that names no family at all. Starting at the prefix map — as
 * this module's brief proposed — would discard a fact the source publishes on
 * 93% of pages in favour of a guess, with nothing anywhere to notice a
 * disagreement. Emitted: Mechanical 111, Spring Drive 70, Quartz 33.
 *
 * A PDP RENDERS ~57 IMAGES AND ABOUT THREE ARE THE PRODUCT. The rest are
 * megamenu art, the header, social icons and a featured rail of ~38 OTHER
 * references whose markup is the same shape as the product's, so no container
 * separates them — and the recon capture for this module duly reported
 * "galleries of 50 to 57 images per page" because it was counting the
 * navigation. The only signal is the ASSET PATH: a path SEGMENT equal to the
 * reference, or the reference plus one region letter, never a substring, since
 * a substring test on a four-letter-three-digit code against paths carrying
 * dates and dimensions is a coin flip. 693 images across 214 references, mean
 * 3.24, NONE with zero. Tagging is filename-only at 321 of 693 (46%) — dial
 * 250, movement 27, side 18, caseback 11, clasp 5 — plus one cross-field rule
 * that recognises the movement shot by the calibre already read off the spec
 * table. `alt` is empty on four in five so `tagsFromText` is never called. The
 * untagged remainder ships `autoTagged: false`, an explicit "the extractor
 * looked and found nothing", because inventing "slot 2 is the dial" is what
 * shipped 1465 imageless Rolex pages.
 *
 * NO PRICE, NO CURRENCY, NO STOCK — and this is a REFUSAL rather than an
 * absence. Grand Seiko renders a filled price on 205 of the 214 emitted
 * references, in the same `<div class="_body">` that carries the reference and
 * the collection, two lines from every identity field the module reads. The
 * denylist is structural and stated: the parser reads `p._price` FOR ITS
 * EXISTENCE ONLY and returns a boolean, `GrandSeikoPdp` has no field a price
 * could land in, and the run log reports how many pages had their price
 * declined — so "Grand Seiko publishes no price" and "this module refused Grand
 * Seiko's price" are not the same empty column. `frequency` is withheld on the
 * same principle: the calibre families make it derivable but the source states
 * it nowhere, and the calibre-linked enrichment path is where it belongs.
 *
 * `new-only` IS NOT SUPPORTED AND THAT IS A FINDING, not an omission. There is
 * no `IsNew` flag as on Seiko, no launch date, no `New` badge as on Hamilton,
 * no novelties category as on Longines and no watchfinder facet. The only
 * remaining route is diffing against a previous run, which `ExtractorMode`
 * forbids. `full` only.
 *
 * ONE THING TO CONFIRM BEFORE THE FIRST LIVE JOB: the `seiko` entry above
 * states `watchBrands/grand-seiko` was verified live as a distinct document.
 * This module's own README declines to inherit that — it is second-hand
 * evidence about a different document, and per `brandSlug.ts` the failure mode
 * is not an error but a SUCCESSFUL WRITE TO THE WRONG PLACE, the IWC lesson.
 * The slug is `buildBrandSlug('Grand Seiko')` and never the longer form, which
 * derives `grand-seiko-watch` and no such document exists. See
 * `src/modules/grand-seiko/README.md` in the extractors repo.
 */
export type ExtractorId = 'omega' | 'lang-heyne' | 'rolex' | 'cartier' | 'glashutte-original' | 'breitling' | 'richard-mille' | 'audemars-piguet' | 'jacob-and-co' | 'iwc' | 'nomos-glashuette' | 'christopher-ward' | 'muehle-glashuette' | 'swatch' | 'tutima' | 'casio-gshock' | 'casio-babyg' | 'casio-edifice' | 'casio-protrek' | 'casio-collection' | 'vacheron-constantin' | 'longines' | 'a-lange-soehne' | 'seiko' | 'citizen' | 'chopard' | 'bulova' | 'caravelle' | 'parmigiani-fleurier' | 'ball-watch' | 'piaget' | 'hamilton' | 'zenith' | 'grand-seiko';
/**
 * How much of a source's catalogue a run asks for.
 *
 * `full`      every product the source publishes. The quarterly rebase.
 * `new-only`  just what the source itself flags as a new release. Cheap enough
 *             to run often, which is what keeps the watch DB fresh in between.
 * `heritage`  the source's own PRE-OWNED or archival boutique, where it keeps
 *             one distinct from its current line. A DIFFERENT CATALOGUE, not a
 *             slice of the current one — see below.
 *
 * Only meaningful where the SOURCE draws the distinction. A module cannot
 * synthesise `new-only` by diffing against a previous run — that is the admin's
 * job, post-ingest, where the previous run actually exists. The same rule
 * governs `heritage`: it means the source publishes a separate archival
 * catalogue and says which products are in it, not that the extractor guessed
 * from a production year.
 *
 * ------------------------------- `heritage` -------------------------------
 *
 * Added in v1.83.0 for `longines`, whose site serves 48 pre-owned watches from
 * its Heritage boutique alongside the 762 current references. They sit under a
 * different Magento attribute set, they are absent from every catalogue
 * listing, and `full` deliberately excludes them, because they are a different
 * kind of claim:
 *
 *   They are INDIVIDUAL PHYSICAL WATCHES, not references. Each carries a
 *   `serial_number`, a `production_date` and a condition grade ("New old
 *   stock", "Excellent overall condition, original dial"), so the row describes
 *   one object with one history rather than a model that can be bought again.
 *   Two of them can share a model and differ in what they have lived through.
 *
 *   Their SPECIFICATIONS ARE THINNER and shaped differently. Case thickness is
 *   absent on all 48; the calibre field carries vintage movement numbers
 *   (`13ZN`, `12.68Z`, `19AS`) including a literal `-` where the movement is
 *   unrecorded; and every gallery image is captioned identically, so none of
 *   them can be content-tagged.
 *
 * Folding the two into one ingest would put "this model has a 12.30 mm case"
 * and "this individual watch was made in 1936 and has its original dial" in one
 * table under one schema. The separate mode is what keeps a consumer's decision
 * to take one, the other or both an explicit one.
 *
 * A source with no such boutique simply does not declare it, exactly as with
 * `new-only`. The admin renders its mode picker from `supportedModes`, so a
 * third value is SELECTABLE with no admin change — but a Run dialog that
 * hard-codes two labels for display will need one. Tracked separately from the
 * module PR.
 */
export type ExtractorMode = 'full' | 'new-only' | 'heritage';
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
export type ExtractionJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
/** Machine-readable failure class. Drives retry policy and admin display. */
export type ExtractionErrorCode = 'nav_timeout' | 'http_403' | 'http_404' | 'http_5xx' | 'selector_miss' | 'parse_error' | 'blocked' | 'cancelled' | 'internal';
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
export type ImageTag = 'dial' | 'date' | 'caseback' | 'crown' | 'movement' | 'bracelet' | 'clasp' | 'bezel' | 'lume' | 'strap' | 'side' | 'wrist' | 'box' | 'papers';
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
//# sourceMappingURL=Extraction.d.ts.map
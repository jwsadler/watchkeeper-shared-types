/**
 * What KIND of storage appliance a catalog entry describes, PRIMARILY.
 *
 * The catalog is one collection, not three. A safe, a display case and a winder
 * share most of their fields — make, model, country, materials, price tier,
 * lock, capacity, image, description, aliases, provenance — and the five that
 * are winder-only (`turnsPerDay`, `turnsPerDayRange`, `rotationDirection`,
 * `rotationProgramSlugs`, `startDelayMaxHours`) are already nullable. Splitting
 * them into separate entities would fork the catalog, its Algolia index, its
 * rules, its admin CRUD and ~6,800 lines of RN picker/flow/detail machinery to
 * gain a handful of absent fields.
 *
 * It also matches the products: Buben & Zörweg build safes WITH winders inside,
 * behind a lockable crystal door. {@link WinderEntry.isSafe} and
 * {@link WinderEntry.hasDisplayCase} exist precisely because that object is one
 * thing, and a hard entity split would force an arbitrary call on exactly the
 * models at the top of this market.
 *
 * ## One value, plus two flags — NOT an array
 *
 * An appliance is frequently more than one of these at once, and that is
 * recorded by the two boolean flags rather than by a list of kinds:
 *
 * ```
 * Wolf Cub Single      'winder'        —              —
 * Wolf Athos 20        'safe'          isSafe         —
 * Barrington Modern 4  'winder'        —              hasDisplayCase
 * B&Z Collector 45     'winder'        isSafe         hasDisplayCase
 * Wolf Windsor 10      'display_case'  —              hasDisplayCase
 * ```
 *
 * A `StorageApplianceKind[]` was considered and rejected. The flags are not a
 * redundant encoding of such an array: `isSafe` on a WINDER means "this winder
 * is built into a safe", which is a different claim from "this is a safe", and
 * an array flattens the two. Primacy is also load-bearing — it drives the
 * default label, the placeholder glyph, the insurance-document row label and
 * the winding-suppression rule — and an array has nowhere to put it without
 * reinventing a discriminator as "the first element". Finally the flags are
 * already populated across the catalog, so the flag model needs no backfill,
 * while an array would need either a migration of every document or a permanent
 * read-time reconstruction from the very flags it was meant to replace.
 *
 * Consumers that want the set for display purposes should DERIVE it.
 *
 * ## The three-rung ladder
 *
 * Exactly one rung fires, and the order is the whole rule:
 *
 * ```
 * winds?                       → 'winder'        (even if it also protects and displays)
 * else hardened security body? → 'safe'          (even if it has a viewing window)
 * else                         → 'display_case'
 * ```
 *
 * The tie-break is whether it WINDS, not whether it protects: a safe misfiled
 * as a winder merely shows an empty winding section, while a winder misfiled as
 * a safe has its turns-per-day suppressed everywhere. When in doubt, `winder`.
 *
 * ## Naming
 *
 * The slug is the appliance's OWN name. Where a `lookup_storage_locations`
 * category slug already is that name the two coincide (`winder`,
 * `display_case`); where it is not, they differ (`personal_safe` → `safe`).
 * `display_case` rather than `display` because "display" is not a noun for the
 * object, and every label would have to append "case" anyway.
 *
 * ## ⚠️ ABSENT MEANS `winder`, and writers must keep it that way
 *
 * Every entry catalogued before this field existed is a winder, so no backfill
 * is needed and none should be run — consumers default. Write paths therefore
 * store `'safe' | 'display_case' | null` and NEVER the literal `'winder'`: an
 * editor always holds one of the three values, so writing it through would
 * stamp an explicit `'winder'` onto every entry anyone opens and saves,
 * inventing data the document never carried, one edit at a time, across the
 * whole catalog.
 */
export type StorageApplianceKind = 'winder' | 'safe' | 'display_case';

/**
 * A watch winder entry in the admin-curated winder catalog.
 * Path: winders/{docId} — doc id is the slug `<make-slug>-<model-slug>`.
 *
 * World-readable to authed users; admin CRUD only. First-class catalog entity
 * following the {@link ElectronicModule} pattern (single collection, small
 * scale, no Algolia) rather than the normalized calibre ↔ manufacturer split:
 * winder makes are a disjoint vocabulary from `movement_manufacturers` and
 * carry almost no queryable data of their own, so `make` is a lookup-backed
 * slug instead of an FK to a separate collection.
 *
 * Users do not reference this document directly from their watches — they
 * first add a {@link UserWinder} instance that points here, and the watch
 * references that. See {@link WatchStorageFields.winderUserRef}.
 *
 * Despite the name, this is the catalog of physical storage APPLIANCES, not
 * winders alone — see {@link WinderEntry.applianceKind}. The collection and the
 * type keep their historical names because renaming them would churn both
 * consumers, the Algolia index and the Storage paths for no behavioural gain.
 *
 * Every spec field is nullable: AI enrichment fills only what it can verify and
 * prefers null over a plausible-sounding guess.
 *
 * Unified type used by both admin and RN apps.
 * Admin app uses Firestore Timestamp for date fields;
 * RN app converts to Date.
 */
export interface WinderEntry {
  /** Slug doc id: `<make-slug>-<model-slug>` (e.g., "wolf-cub-single-winder"). */
  id: string;
  /**
   * What this entry PRIMARILY is — winder, safe or display case. Absent means
   * `winder`; see {@link StorageApplianceKind} for the ladder that decides it
   * and for why this is one value rather than an array.
   *
   * Orthogonal to {@link WinderEntry.isSafe} and
   * {@link WinderEntry.hasDisplayCase}, and none of the three may be conflated.
   * `isSafe` means "this WINDER is built into a safe" (a rotor plus security);
   * `applianceKind: 'safe'` means "this IS a safe" (security, no rotor). The
   * same distinction holds one kind over for `hasDisplayCase`.
   *
   * Each non-winder value forces its flag, so every existing consumer of the
   * matching block lights up unchanged:
   *
   *   - `'safe'` carries `isSafe: true`, and leaves the five winding fields null.
   *   - `'display_case'` carries `hasDisplayCase: true`, and leaves the five
   *     winding fields AND `isSafe`/`safeSpecs` null — by the ladder, a
   *     hardened body makes it a `'safe'` with a window, not a display case.
   */
  applianceKind?: StorageApplianceKind | null;
  /**
   * Manufacturer slug, lookup-backed via `lookup_winder_manufacturers`
   * (e.g., "wolf", "barrington", "orbita"). Controlled vocabulary — an admin
   * adds a new make through the lookup admin UI before creating winders under
   * it. AI enrichment treats this as ground truth and never renames it.
   */
  make: string;
  /** `deriveSlug(make)` — denormalized for querying and doc-id derivation. */
  makeSlug: string;
  /** Model name as the manufacturer writes it (e.g., "Cub Single Winder"). */
  model: string;
  /** Full presentation name (e.g., "Wolf Cub Single Winder"). */
  displayName?: string;
  /** Country of manufacture (e.g., "Germany", "Italy"). */
  countryOfManufacture?: string;

  /**
   * How many watches the appliance holds: 1, 2, 4, 6, 12, …
   *
   * ⚠️ APPLIES TO ALL THREE KINDS, and only its label changes. A winder's are
   * rotor positions ("slots"); a safe's and a display case's are watch
   * CAPACITY (a Wolf Athos 20 Piece holds 20, a Wolf Windsor 10 Piece holds
   * 10). Suppressing it on a non-winder is a bug, not a simplification — it
   * blanks a figure the manufacturer prints on the box.
   *
   * Numbered positions within that capacity are OPTIONAL on a non-winder: a
   * watch may simply be loose inside. Consumers offer a position and never
   * require one.
   */
  slotCount?: number | null;
  /**
   * Every turns-per-day setting the winder supports
   * (e.g., `[650, 750, 900, 1200]`).
   */
  turnsPerDay?: number[] | null;
  /**
   * Alternative to `turnsPerDay` for programmable winders that operate over a
   * continuous range. Not both — editor UI enforces mutual exclusion.
   *
   * Consumers that support both representations prefer this one when set
   * (e.g., render "300 to 1200 TPD") and fall back to `turnsPerDay` otherwise.
   */
  turnsPerDayRange?: { min: number; max: number } | null;
  /** Direction(s) the winder can rotate. Lookup-backed via `lookup_winder_rotation_directions`. */
  rotationDirection?: 'clockwise' | 'counter_clockwise' | 'bidirectional' | null;
  /**
   * Supported winding programs (e.g., rest-day, sleep-cycle, custom-tpd).
   * Multi-select slugs, lookup-backed via `lookup_winder_programs`.
   */
  rotationProgramSlugs?: string[] | null;
  /**
   * Power sources (e.g., ac, batteries, usb, dual-ac-battery, solar).
   * Multi-select slugs, lookup-backed via `lookup_winder_power_sources`.
   */
  powerSourceSlugs?: string[] | null;
  /**
   * Case / build materials (e.g., wood, leather, carbon, aluminium, glass).
   * Multi-select slugs, lookup-backed via `lookup_winder_materials`.
   */
  materialSlugs?: string[] | null;
  /** Manufacturer-claimed quiet operation. */
  isQuiet?: boolean | null;
  /** Has a lockable case. */
  hasLock?: boolean | null;
  /**
   * True when the entry IS a display case — a glazed surface the watches are
   * meant to be viewed through — and the gate on
   * {@link WinderEntry.displayCaseSpecs}.
   *
   * The exact structural twin of {@link WinderEntry.isSafe}, one kind over, and
   * its meaning likewise depends on {@link WinderEntry.applianceKind}:
   *   - on a WINDER or SAFE entry it means the appliance ALSO displays — a
   *     Barrington Modern 4 behind glass, a Buben & Zörweg Collector behind a
   *     crystal door, a safe with a viewing window. The watch's storage
   *     category stays whatever the owner filed it under.
   *   - on an `applianceKind: 'display_case'` entry it is simply true.
   *
   * It is what makes display cases discoverable with NO BACKFILL: the picker
   * predicate is `applianceKind === 'display_case' || hasDisplayCase === true`,
   * and this flag has been collected for as long as the catalog has existed, so
   * every glazed appliance already in it becomes findable the moment consumers
   * ship the third kind.
   *
   * ⚠️ ITS MEANING TIGHTENED when display cases became a kind. It was
   * previously enriched as "glass front, vitrine, OR a viewing window", which
   * is true of cheap dust covers; it now means "is a display case". Entries
   * enriched under the loose reading will surface in the display-case picker
   * until re-enriched or corrected by a curator. That is the price of needing
   * no backfill, and it was taken deliberately.
   *
   * Distinct from {@link WinderEntry.hasLock}, which only means the case locks.
   */
  hasDisplayCase?: boolean | null;
  /**
   * True when the entry has the security properties of a safe, and the gate on
   * {@link WinderEntry.safeSpecs}.
   *
   * Its meaning depends on {@link WinderEntry.applianceKind}, and the two must
   * not be conflated:
   *   - on a WINDER entry it means the winder is integrated into a safe (e.g.
   *     Buben & Zörweg Object series). The watch's storage category stays
   *     `winder`; this is a secondary safe overlay on the badge, not category
   *     reassignment.
   *   - on an `applianceKind: 'safe'` entry it is simply true, and the watch's
   *     storage category is `personal_safe`.
   *   - on an `applianceKind: 'display_case'` entry it must be false or null.
   *     The ladder in {@link StorageApplianceKind} sends anything with a
   *     hardened security body to `'safe'` before it can reach the display
   *     rung, so a display case that protects is a safe with a window.
   *
   * A safe entry sets it for a reason beyond bookkeeping: every existing
   * consumer of the security block — spec resolution, the admin editor's
   * conditional form, the insurance PDF — is already gated on this flag, so
   * setting it lights all of them up for safes with no change of their own.
   *
   * Distinct from {@link WinderEntry.hasLock}, which only means the case locks.
   */
  isSafe?: boolean | null;
  /**
   * Price positioning (e.g., entry, mid, premium, ultra-premium).
   * Slug, lookup-backed via `lookup_winder_price_tiers`.
   */
  priceTierSlug?: string | null;

  /**
   * Firebase Storage path of the curated stock image for this model, uploaded
   * by an admin — `admin/winders/{docId}/{timestamp}.jpg`.
   *
   * A PATH, not a download URL, matching {@link CalibreImage.storagePath}: the
   * RN app signs it with `getDownloadURL()` at render, and the path sits inside
   * the storage-resize-images `INCLUDE_PATH_LIST` so a 384x384 variant exists
   * alongside it for list thumbnails.
   *
   * ONE image, not a gallery. This is the picture the app shows for a winder
   * whose owner has not photographed their own — a user upload on the
   * {@link UserWinder} instance always wins over it.
   *
   * Nullable like every other spec field here: AI enrichment never populates
   * it, so it is null until an admin uploads.
   */
  imageStoragePath?: string | null;

  /**
   * Max programmable delay before the first winding cycle, in hours.
   *
   * Wolf Atlas line documents 255. Only populated when a specific hour figure
   * is published by the manufacturer.
   */
  startDelayMaxHours?: number | null;

  /**
   * Security specifications, for a winder built into a safe or vault.
   *
   * Only populated when {@link WinderEntry.isSafe} is true. Nested rather than
   * flattened onto WinderEntry to keep the top level clean for the ~90% of
   * winders that are not safes — a dozen always-null security columns on every
   * ordinary winder would be noise in the editor and in every consumer.
   *
   * If `isSafe` is false or null, `safeSpecs` must be null. The editor UI
   * enforces this, and so does the write path — a bulk enrichment apply does
   * not go through the form.
   */
  safeSpecs?: {
    /** Security standard, as certified (e.g. "EN 1143-1 Grade I", "UL RSC", "VdS Class 0"). */
    certification?: string | null;
    /** Certified fire endurance, in minutes (e.g. 60). */
    fireRatingMinutes?: number | null;
    /**
     * Maximum INTERIOR temperature the safe holds during the fire test, in
     * Celsius (e.g. 177 — the 350°F of UL Class 350).
     *
     * The protective half of the pair: what the watches inside are kept below.
     * Meaningless without `fireRatingMinutes`, which says for how long, and
     * only half the spec without `fireExternalTempC`, which says against what.
     */
    fireMaxInternalTempC?: number | null;
    /**
     * The EXTERNAL fire the safe is tested against, in Celsius (e.g. 927 — the
     * 1,700°F of UL Class 350).
     *
     * The exposure half of the pair. Together the three fire fields state one
     * class: UL Class 350 at 60 minutes is `fireExternalTempC: 927`,
     * `fireMaxInternalTempC: 177`, `fireRatingMinutes: 60` — a furnace at 927°C
     * for an hour with the interior never passing 177°C. A rating quoting only
     * the interior figure is half a spec: it says what the safe protects
     * against without saying how fierce a fire it was proven against.
     *
     * Populate only what the manufacturer publishes. The two temperatures are
     * not derivable from one another except through a named class.
     */
    fireExternalTempC?: number | null;
    /**
     * Weight in kilograms. An anti-theft proxy rather than a spec in its own
     * right: it is what decides whether the safe can simply be carried away,
     * and therefore whether it needs anchoring.
     */
    weightKg?: number | null;
    /** How the safe is opened. */
    lockingMechanism?:
      | 'key'
      | 'combination'
      | 'electronic_keypad'
      | 'biometric'
      | 'dual'
      | null;
    /** Number of locking bolts (Wolf and Buben & Zörweg both cite these). */
    lockingBoltCount?: number | null;
    /** Body steel gauge, in millimetres. */
    wallThicknessMm?: number | null;
    /** Ships pre-drilled for floor or wall anchoring. */
    hasAnchorPoints?: boolean | null;
    /**
     * Insurer-recognised cash rating, verbatim including its currency and
     * scheme (e.g. "$5,000 UL", "€65,000 EN"). A string rather than a number
     * because the scheme is part of the claim and the figure is meaningless
     * without it.
     */
    insuranceCashRating?: string | null;
  } | null;

  /**
   * Display specifications, for an appliance the watches are viewed through.
   *
   * Gated on {@link WinderEntry.hasDisplayCase}, NOT on
   * `applianceKind === 'display_case'` — deliberately, and exactly as
   * {@link WinderEntry.safeSpecs} is gated on `isSafe` rather than on
   * `applianceKind === 'safe'`. A glass-fronted winder has real glazing and a
   * real UV answer, and a Buben & Zörweg Collector renders all three spec
   * blocks because it genuinely is all three things. If `hasDisplayCase` is
   * false or null, `displayCaseSpecs` must be null; the editor UI enforces
   * this, and so does the write path — a bulk enrichment apply does not go
   * through the form.
   *
   * Nested rather than flattened onto WinderEntry for the same reason
   * `safeSpecs` is: seven always-null display columns on every ordinary winder
   * would be noise in the editor and in every consumer.
   *
   * ⚠️ CAPACITY IS NOT HERE. A display case's capacity is
   * {@link WinderEntry.slotCount}, the same field a winder and a safe use — a
   * Wolf Windsor 10 Piece holds 10 in ten numbered positions. Only the word
   * "slots" fails to carry across, and that is a label, not a field.
   *
   * ⚠️ DIMENSIONS ARE NOT HERE EITHER, though display cases publish them. A
   * winder and a safe have dimensions too, so they belong at the top level of
   * WinderEntry whenever someone adds them; putting them here would lock a
   * cross-kind fact to one kind.
   */
  displayCaseSpecs?: {
    /**
     * What the watches are viewed through. Glass and acrylic age and scratch
     * very differently, which is the practical reason a collector cares.
     */
    glazing?: 'glass' | 'tempered_glass' | 'acrylic' | 'crystal' | null;
    /**
     * The glazing filters ultraviolet light.
     *
     * The one display spec with a conservation consequence: it is what decides
     * whether dials, lume and straps fade in daylight. Museum-grade acrylic
     * reaches ~99%, ordinary acrylic blocks UVB but only about a third of UVA,
     * and plain glass filters very little — so an unqualified "UV protection"
     * claim is worth nothing without the manufacturer stating it.
     */
    hasUvFiltering?: boolean | null;
    /** Integrated lighting (LED strips, fibre optics, a lit vitrine). */
    hasIllumination?: boolean | null;
    /** A built-in humidity gauge — it MEASURES only. */
    hasHygrometer?: boolean | null;
    /**
     * ACTIVE humidity regulation — a humidor compartment or a sealed,
     * conditioned interior. Distinct from `hasHygrometer`, which merely reads
     * the number; the pair are frequently confused in marketing copy.
     */
    hasHumidityControl?: boolean | null;
    /** How the case is sited. */
    mountingStyle?:
      | 'tabletop'
      | 'wall_mounted'
      | 'freestanding'
      | 'drawer_insert'
      | null;
    /**
     * Closed storage below or beside the display bed, for watches and
     * accessories not on show (Barrington Modern, most Wolf boxes).
     */
    hasDrawer?: boolean | null;
  } | null;

  /** Long-form marketing / positioning copy. */
  description?: string | null;
  /** Alternative / AKA model names. */
  aliases?: string[];
  /** URLs the specs were sourced from. */
  sourceUrls?: string[];

  createdAt?: Date;
  updatedAt?: Date;
  /** Admin uid that created the entry. */
  createdBy?: string;
  /** Self-reported confidence of the AI enrichment run that populated this doc. */
  aiConfidence?: 'high' | 'medium' | 'low' | null;
  /** Soft-delete / hide from pickers without breaking existing FKs. */
  isDeprecated?: boolean;
}

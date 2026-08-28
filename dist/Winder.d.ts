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
    /** Number of watch slots: 1, 2, 4, 6, 12, … */
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
    turnsPerDayRange?: {
        min: number;
        max: number;
    } | null;
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
    /** Doubles as a display case (glass front / vitrine). */
    hasDisplayCase?: boolean | null;
    /**
     * True when the winder itself is integrated into a safe (e.g. Buben & Zörweg
     * Object series). Watch storage category stays `winder` — this flag is for a
     * secondary safe overlay on the badge, not category reassignment.
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
         * Maximum internal temperature held during the fire rating, in Celsius —
         * the UL Class 350 style figure (e.g. 175). Meaningless without
         * `fireRatingMinutes`, which says for how long it was held.
         */
        fireMaxInternalTempC?: number | null;
        /**
         * Weight in kilograms. An anti-theft proxy rather than a spec in its own
         * right: it is what decides whether the safe can simply be carried away,
         * and therefore whether it needs anchoring.
         */
        weightKg?: number | null;
        /** How the safe is opened. */
        lockingMechanism?: 'key' | 'combination' | 'electronic_keypad' | 'biometric' | 'dual' | null;
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
//# sourceMappingURL=Winder.d.ts.map
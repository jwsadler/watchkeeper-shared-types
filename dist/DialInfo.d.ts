/**
 * Dial and hands details for a watch reference.
 *
 * Unified superset of admin `DialAndHandsInfo` and RN `DialReference`.
 */
export interface DialInfo {
    color?: string;
    /** Dial material (e.g., "Lacquer", "Enamel") */
    material?: string;
    /** e.g., "Sunburst", "Matte", "Glossy" */
    finish?: string;
    /**
     * HOW the hour markers are constructed — applied / printed / painted /
     * sandwich / engraved. Multi-select, backed by `lookup_dial_marker_type`
     * and labelled "Marker Type" in the management app; the field name stays
     * `indexes` for backwards compatibility with the RN read side.
     *
     * Array since v1.51.0. Documents written before the
     * `migrateDialIndexesNumerals` sweep hold a bare string, so readers that
     * have not been migrated must tolerate both shapes.
     */
    indexes?: string[];
    /**
     * WHAT the markers are — arabic / roman / stick / dot / baton. Multi-select,
     * backed by `lookup_dial_numerals`. Distinct from `indexes` above, which is
     * the construction type: a dial can have printed (indexes) arabic (numerals).
     *
     * Array since v1.51.0 — same both-shapes caveat as `indexes`.
     */
    numerals?: string[];
    /** e.g., "Dauphine", "Baton", "Mercedes" */
    hands?: string;
    handsColor?: string;
    /**
     * Comma-joined index color slugs, e.g. "white, gold". Multi-select
     * field backed by `lookup_index_colors`. Mirrors `handsColor`
     * convention. Separate from `color` (the dial background color)
     * and from lume color (planned Phase 2 of dial & hands expansion).
     */
    indexColor?: string;
    /**
     * Comma-joined hand type slugs, e.g. "hour, minute, seconds, gmt".
     * Captures which hand functions are present on the watch. Multi-select
     * field backed by `lookup_hand_types`. Separate from `hands` (the hand
     * STYLE — Dauphine/Baton/Mercedes) and from `handsColor` (the hand
     * COLOR).
     */
    handTypes?: string;
    /** Whether the dial has luminous markers (RN variant) */
    lume?: boolean;
    /** Whether the dial has Luminova (admin variant) */
    luminova?: boolean;
    /** Number of subdials (for chronographs) */
    subdials?: number;
    /**
     * WHAT the subdials are — `chronograph_minutes`, `running_seconds`,
     * `24_hour`, `power_reserve`, `moonphase`, … Comma-joined slugs
     * (`"chronograph_minutes, chronograph_hours, running_seconds"`), MULTI-select
     * and backed by `lookup_dial_subdials`, following the same convention
     * `indexColor` / `handTypes` / `dateWheelTextColor` use.
     *
     * The companion to `subdials` above, which stays exactly as it is: that is
     * the COUNT, this is the function of each register. They answer different
     * questions and neither derives from the other — a three-register
     * chronograph and a triple-calendar both read `subdials: 3`, and only this
     * field says which one you are looking at. Deliberately not validated
     * against the count: a reference can legitimately carry one without the
     * other, since the count comes off any dial photo while the functions
     * usually need the printed sub-dial labels.
     */
    subdialTypes?: string;
    /**
     * The KIND of date complication — `date_window`, `big_date`, `pointer_date`,
     * `subsidiary_dial`, `day_date`, `annual_calendar`, … Backed by
     * `lookup_date_display`. This is the field that decides whether the three
     * window-specific fields below apply at all: a `pointer_date` or
     * `subsidiary_dial` has no aperture, so it carries none of them.
     */
    dateDisplay?: string;
    /**
     * Where the aperture sits on the dial, by hour position — `3`, `4_30`, `6`,
     * `9`, `12`, `peripheral`. Backed by `lookup_date_window_position`. Only
     * meaningful when `dateDisplay` is a window/aperture type.
     */
    dateWindowPosition?: string;
    /**
     * The treatment around the aperture edge — `none`, `framed`, `beveled`,
     * `applied`. Backed by `lookup_date_window_frame`. Window types only.
     */
    dateWindowFrame?: string;
    /**
     * The colour of the date DISC visible through the aperture, NOT the colour of
     * the numerals printed on it — `white`, `black`, `color_matched`, `silver`,
     * `mixed`. Backed by `lookup_date_wheel_color`. Window types only.
     */
    dateWheelColor?: string;
    /**
     * The colour(s) of the NUMERALS PRINTED ON the date disc — the counterpart to
     * `dateWheelColor`, which is the disc's own background. Backed by
     * `lookup_text_colors`, the same lookup `ElectronicsInfo.textColor` uses.
     *
     * MULTI-select, stored comma-joined (`"black, red"`) like `indexColor` and
     * `handTypes`: a day-date routinely prints the weekend positions in red and
     * the weekdays in black on one wheel, so a single reference legitimately has
     * two or more values. Window types only.
     */
    dateWheelTextColor?: string;
}
//# sourceMappingURL=DialInfo.d.ts.map
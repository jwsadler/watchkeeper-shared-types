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
     * and from the lume colours (`lumeDayColor` / `lumeGlowColor` below).
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
     * The RING between the dial face and the crystal, where a watch has one —
     * `none`, `rehaut` (the vertical inner wall, the surface Rolex laser-etches),
     * `internal_chapter_ring` (a separate ring lying flat on the dial's outer
     * edge), `flange` (a sloped ring bridging dial and case), `stepped` (the ring
     * sits at a raised level above the dial), `unknown`. SINGLE-select, backed by
     * `lookup_chapter_ring_type`.
     *
     * A structural question, not a decorative one: this is WHERE the ring is, and
     * `minuteTrack` below is WHAT is printed on it — which is why the two are
     * separate fields and why neither implies the other. A chapter ring can be
     * bare, and a minute track is very often printed on the dial itself with no
     * ring at all.
     */
    chapterRing?: string;
    /**
     * The style of the minute/second markings around the dial's edge —
     * `none`, `railroad` (two concentric rails with cross-ticks between them),
     * `hash` (bare tick marks with no enclosing rails), `printed`, `applied`,
     * `mixed`, `unknown`. SINGLE-select, backed by `lookup_minute_track_type`.
     *
     * The vocabulary deliberately mixes two axes — `railroad`/`hash` describe the
     * PATTERN, `printed`/`applied` the CONSTRUCTION — so the answer is whichever
     * is the more specific true statement about the dial, with the construction
     * slugs as the fallback when the pattern has no name of its own.
     *
     * Independent of `chapterRing`: the track sits on the ring when there is one
     * and on the dial face when there is not.
     */
    minuteTrack?: string;
    /**
     * Measurement scales carried by the watch — `tachymeter`, `telemeter`,
     * `pulsometer`, `decimal`, `slide_rule`, `diving`, `regatta`, `compass`,
     * `gmt_24h`, `worldtime`. MULTI-select, stored comma-joined
     * (`"tachymeter, telemeter"`) like `indexColor` / `handTypes` /
     * `subdialTypes`, and backed by `lookup_dial_scales`.
     *
     * Multi because a doctor's chronograph routinely prints two or three
     * concentric scales on one dial, and because a dial scale and a bezel scale
     * are both scales: this field covers the whole watch's scale complement
     * regardless of the surface it is printed on, so a Daytona's bezel tachymeter
     * belongs here even though the field lives on the dial block. That is a
     * deliberate departure from the strict dial/bezel split the rest of these
     * interfaces keep — a collector asking "does it have a tachymeter" does not
     * care which surface carries it, and splitting the vocabulary in two would
     * have meant two lookups holding the same ten slugs.
     *
     * A plain time-only dial carries none of them and leaves the field unset.
     */
    dialScales?: string;
    /**
     * How the brand mark is applied to the dial — `applied` (a separate metal
     * piece fixed to the dial, which catches light and casts a shadow), `printed`
     * (flat ink), `embossed` / `relief` (formed from the dial material itself),
     * `none` (a sterile or unbranded dial), `mixed` (the brand mark and the model
     * text differ in treatment — an applied coronet above a printed wordmark is
     * the common case), `unknown`. SINGLE-select, backed by
     * `lookup_dial_logo_type`.
     *
     * A finishing-quality signal rather than a branding one: an applied logo is a
     * separate manufacturing step, which is why homages print what the original
     * applies.
     */
    logoType?: string;
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
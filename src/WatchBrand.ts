/**
 * Watch Brand — shared across admin app and WatchKeeper RN app.
 *
 * Firestore path: watchBrands/{brandId}
 */
export interface WatchBrand {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  /** AI-generated brand description (populated from enrichment) */
  aiDescription?: string;
  alternativeNames?: string[];
  abbreviations?: string[];
  windingDirections?: string[];
  /** Brand logo — canonical URL in our own Firebase Storage (re-uploaded from the source). */
  logo?: string;
  /** Optional attribution — external URL the logo was sourced from (shown in RN). */
  logoSourceUrl?: string;
  /**
   * Short textual description of the brand's dial glyph — the visual mark that
   * appears on the watch face in place of, or in addition to, the brand name.
   * Used by the AI identify extraction prompt to help identify brands whose
   * dials lack prominent brand text (e.g. Christopher Ward's twin flags,
   * Grand Seiko's shield emblem, Cartier's four dots).
   *
   * Kept concise (one sentence). Should describe visual features an AI vision
   * model can recognise — shapes, arrangement, distinctive markings — not
   * marketing prose. A single field rather than a list: where a brand uses
   * more than one glyph, cover them in the one description (e.g. "Four dots
   * surrounding the hands (Santos, Panthère) or CARTIER wordmark below 12
   * (Ballon Bleu, Tank)").
   */
  glyphDescription?: string;
  /**
   * Optional image URL of the brand's dial glyph. Reserved for future
   * multi-image AI vision workflows (Phase 2). Not consumed by extraction yet.
   */
  glyphImageUrl?: string;
  country?: string;
  founded?: number;
  /** Primary website (admin uses mainWebsite, RN uses website — both supported) */
  website?: string;
  mainWebsite?: string;
  mainAddress?: string;
  information?: string;
  /** Parent organization (e.g., "Swatch Group", "LVMH", "Richemont") */
  parentOrg?: string;
  /** Hero/scenic image for brand detail (storage path or URL) */
  heroImage?: string;
  /** Optional attribution — URL the hero image was sourced from (shown in RN). */
  heroImageSourceUrl?: string;
  /** When true, always show hero image instead of map even if address exists */
  useHeroImage?: boolean;
  /** Whether this is a microbrand */
  isMicroBrand?: boolean;
  // Shopify integration
  shopifyEnabled?: boolean;
  shopifyUrl?: string;
  excludedProductTypes?: string[];
  lastImportedAt?: Date;
  /**
   * Admin-curated brand ↔ manufacturer link overrides, applied on top of the
   * runtime rollup that resolves a brand's manufacturers from its references.
   * Include forces a link; exclude suppresses one.
   */
  manufacturerIdsManualInclude?: string[];
  manufacturerIdsManualExclude?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

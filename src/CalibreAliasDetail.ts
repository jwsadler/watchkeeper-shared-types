/**
 * Structured alias for a calibre — used when the alias needs more
 * context than a plain string (e.g., a brand-specific rebrand of a
 * base movement, or whether to surface the alias in the Explore UI).
 */
export interface CalibreAliasDetail {
  name: string;
  brandId?: string;
  showInExplore?: boolean;
}

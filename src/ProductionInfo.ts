/**
 * Production information for a watch reference.
 */
export interface ProductionInfo {
  startYear?: number;
  endYear?: number;
  releaseYear?: number;
  isLimited?: boolean;
  /** Edition size (e.g., 500 for "x of 500") */
  limitedSize?: number;
}

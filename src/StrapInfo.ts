/**
 * Strap details for a watch reference.
 *
 * Unified superset of admin `StrapInfo` and RN `StrapReference`.
 */
export interface StrapInfo {
  material?: string;
  /** Strap color */
  color?: string;
  width?: number;
  buckleType?: string;
  isMicroAdjustable?: boolean;
}

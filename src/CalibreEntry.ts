import type { CalibreData } from './CalibreData';
import type { CalibreImage } from './CalibreImage';

/**
 * A calibre entry in the custom calibres database.
 * Path: custom_calibres/{docId}
 *
 * Unified type used by both admin and RN apps.
 * Admin app uses Firestore Timestamp for date fields;
 * RN app converts to Date.
 */
export interface CalibreEntry {
  id: string;
  /** Canonical calibre name (e.g., "ETA Caliber 2824-2") */
  name: string;
  /** Brand that manufactures or uses this calibre */
  brandName?: string;
  /** Alternative names/aliases (e.g., "Elaboré grade", "SW200-1") */
  alsoKnownAs?: string[];
  /** Rich description: history, notable references, technical significance */
  description?: string;
  /** Technical specifications */
  data: CalibreData;
  /** Data source (e.g., "calibrecorner", "manual") */
  source?: string;
  /** URL where calibre data was sourced from */
  sourceUrl?: string;
  /** Calibre images */
  images?: CalibreImage[];
  createdAt?: Date;
  updatedAt?: Date;
}

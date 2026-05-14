import type { CalibreImage } from './CalibreImage';

/**
 * Technical specifications for a watch calibre/movement.
 *
 * Unified superset used by both admin and RN apps.
 */
export interface CalibreData {
  // Core specs
  movementType?: string;
  frequencyVph?: number;
  jewels?: number;
  powerReserveHours?: number;
  diameterMm?: number;
  heightMm?: number;

  // Winding & regulation
  hacking?: boolean;
  manualWinding?: boolean;
  quickSetDate?: boolean;
  windingDirection?: string;
  manualWindingDirection?: string;
  baseMovement?: string;

  // Certifications
  isCosc?: boolean;
  isGlashuetteRegulation?: boolean;
  isGenevaSeal?: boolean;
  isGrandSeikoStandard?: boolean;
  isMETAS?: boolean;
  isChronometer?: boolean;

  // Complications
  isGMT?: boolean;
  isChronograph?: boolean;
  chronograph?: string[];
  functions?: string[];
  date?: string[];
  hands?: string[];
  additionals?: string[];
  astronomical?: string[];
  acoustic?: string[];

  // Construction & manufacture
  liftAngleDegrees?: number;
  isInHouse?: boolean;
  countryOfManufacture?: string;
  antiShockSystem?: string;
  rotorType?: string;
  columnWheel?: boolean;
  doubleBarrel?: boolean;
  escapement?: string;
  serviceIntervalYears?: number;
  lignes?: string;
  regulatorSystem?: string;
  casingDiameterMm?: number;
  hairspring?: string;

  // Battery-powered movement fields
  batteryType?: string;
  batteryLifeYears?: number;

  // Durability
  /** Shock resistance in G-force (e.g., 5000) */
  shockResistanceG?: number;
  /** Anti-magnetic rating in A/m (e.g., 4800) */
  antiMagneticAm?: number;
  /** Anti-magnetic rating in Gauss (e.g., 60) */
  antiMagneticGauss?: number;

  /** Calibre images (also stored at entry level) */
  images?: CalibreImage[];
}

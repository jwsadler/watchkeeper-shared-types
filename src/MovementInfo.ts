/**
 * Movement details for a watch reference.
 *
 * Unified superset of admin `MovementInfo` and RN `MovementReference`.
 * Includes both `isCOSC` (RN) and `isCosc` (admin) for backward compatibility.
 */
export interface MovementInfo {
  frequencyVph?: number;
  jewels?: number;
  powerReserveHours?: number;
  /** Whether the movement is certified as a chronometer */
  isChronometer?: boolean;
  /** Whether the movement is COSC certified (admin variant) */
  isCosc?: boolean;
  /** Whether the movement is COSC certified (RN variant) */
  isCOSC?: boolean;
  isGlashuetteRegulation?: boolean;
  isGenevaSeal?: boolean;
  isGrandSeikoStandard?: boolean;
  isMETAS?: boolean;
  /** Whether the movement supports hacking (stopping the seconds hand) */
  hacking?: boolean;
  /** Whether the automatic movement supports manual winding */
  manualWinding?: boolean;
  quickSetDate?: boolean;
  /** e.g., "Bidirectional", "Unidirectional" */
  windingDirection?: string;
  baseMovement?: string;
  type?: string;
  display?: string;
  diameterMm?: number;
  heightMm?: number;
  date?: string[];
  hands?: string[];
  /** Whether the movement is a chronograph */
  isChronograph?: boolean;
  /** Whether the movement features a GMT complication */
  isGMT?: boolean;
  chronograph?: string[];
  additionals?: string[];
  astronomical?: string[];
  acoustic?: string[];
  // Extended fields from Caliber Corner
  liftAngleDegrees?: number;
  isInHouse?: boolean;
  countryOfManufacture?: string;
  antiShockSystem?: string;
  rotorType?: string;
  columnWheel?: boolean;
  serviceIntervalYears?: number;
  lignes?: string;
  regulatorSystem?: string;
  casingDiameterMm?: number;
  manualWindingDirection?: string;
  hairspring?: string;
  doubleBarrel?: boolean;
  escapement?: string;
  /** Battery model number for quartz/digital movements (e.g. "CR2016") */
  batteryType?: string;
  batteryLifeYears?: number;
}

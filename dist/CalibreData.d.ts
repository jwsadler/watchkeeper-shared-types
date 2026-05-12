import type { CalibreImage } from './CalibreImage';
/**
 * Technical specifications for a watch calibre/movement.
 *
 * Unified superset used by both admin and RN apps.
 */
export interface CalibreData {
    movementType?: string;
    frequencyVph?: number;
    jewels?: number;
    powerReserveHours?: number;
    diameterMm?: number;
    heightMm?: number;
    hacking?: boolean;
    manualWinding?: boolean;
    quickSetDate?: boolean;
    windingDirection?: string;
    manualWindingDirection?: string;
    baseMovement?: string;
    isCosc?: boolean;
    isGlashuetteRegulation?: boolean;
    isGenevaSeal?: boolean;
    isGrandSeikoStandard?: boolean;
    isMETAS?: boolean;
    isChronometer?: boolean;
    isGMT?: boolean;
    isChronograph?: boolean;
    chronograph?: string[];
    functions?: string[];
    date?: string[];
    hands?: string[];
    additionals?: string[];
    astronomical?: string[];
    acoustic?: string[];
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
    batteryType?: string;
    batteryLifeYears?: number;
    /** Calibre images (also stored at entry level) */
    images?: CalibreImage[];
}
//# sourceMappingURL=CalibreData.d.ts.map
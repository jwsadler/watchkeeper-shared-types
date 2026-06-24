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
    /**
     * When true, this calibre is a movement-family placeholder rather than a
     * specific calibre reference (e.g. "Felsa Bidynator" covers the
     * 690/692/694/1560/1700 series; "Glashütte Spezimatic" covers GUB Cal
     * 74/75/etc.). Family-marked calibres act as catch-alls for vague historical
     * attributions where the specific reference isn't known. They participate in
     * the catalog normally (AKAs, brand, ref count) but allow consumers to
     * differentiate "I know it's THIS calibre" from "I know it's in this family".
     * Defaults to false/absent — existing calibres are reference-level.
     */
    isFamily?: boolean;
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
    /** Shock resistance in G-force (e.g., 5000) */
    shockResistanceG?: number;
    /** Anti-magnetic rating in A/m (e.g., 4800) */
    antiMagneticAm?: number;
    /** Anti-magnetic rating in Gauss (e.g., 60) */
    antiMagneticGauss?: number;
    /** Calibre images (also stored at entry level) */
    images?: CalibreImage[];
}
//# sourceMappingURL=CalibreData.d.ts.map
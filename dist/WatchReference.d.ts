import type { CaseInfo } from './CaseInfo';
import type { DialInfo } from './DialInfo';
import type { ElectronicsInfo } from './ElectronicsInfo';
import type { ImageInfo } from './ImageInfo';
import type { MovementInfo } from './MovementInfo';
import type { ProductionInfo } from './ProductionInfo';
import type { StrapInfo } from './StrapInfo';
import type { WatchLink } from './WatchLink';
/**
 * Canonical watch reference document stored in Firestore.
 * Path: watchBrands/{brandId}/references/{referenceId}
 *
 * Unified superset of admin `WatchReference` and RN `WatchReferenceDocument`.
 */
export interface WatchReference {
    id: string;
    brandId: string;
    /** Original reference string (e.g., "1675/3") */
    reference: string;
    /** Normalized for search (e.g., "16753") */
    referenceNormalized?: string;
    model: string;
    collection?: string;
    productName?: string;
    description?: string;
    /** AI-generated reference description (populated from enrichment) */
    aiDescription?: string;
    calibre?: string;
    /** Movement type (e.g., "Automatic", "Manual") */
    movementType?: string;
    movement?: MovementInfo;
    nickname?: string;
    specialEdition?: boolean;
    knownDiscontinuation?: boolean;
    series?: string;
    /** e.g., "Analog", "Digital", "Smartwatch" */
    watchType?: string;
    /** Bezel material */
    bezel?: string;
    /** Bezel type (e.g., "Unidirectional", "Bidirectional") */
    bezelType?: string;
    /** Crown type (e.g., "Screw-down", "Push-pull") */
    crownType?: string;
    color?: string;
    glass?: string;
    crystal?: string;
    /** Top-level dial color (synced with dialAndHands.color) */
    dial?: string;
    case?: CaseInfo;
    production?: ProductionInfo;
    strap?: StrapInfo;
    dialAndHands?: DialInfo;
    /** Electronics/module details for digital watches */
    electronics?: ElectronicsInfo;
    /** Separate from features, maps to watch functions */
    functions?: string[];
    /** Key features (e.g., "Chronograph", "Date") */
    features?: string[];
    /** Storage paths requiring resolution */
    images?: ImageInfo[];
    galleryImages?: ImageInfo[];
    /** Direct URLs (already resolved) */
    imageUrls?: string[];
    links?: WatchLink[];
    source?: {
        url?: string;
    };
    /** Whether this reference has a custom/curated image */
    usingCustomImage?: boolean;
    /** Concatenated searchable text */
    searchText?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=WatchReference.d.ts.map
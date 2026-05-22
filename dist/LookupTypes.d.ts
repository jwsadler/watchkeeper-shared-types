/**
 * Lookup types — shared vocabulary/taxonomy collections used across the
 * admin and RN apps (e.g., materials, complications, dial colors).
 *
 * Firestore path: lookups/{collectionId}
 */
export interface LookupValue {
    id: string;
    value: string;
    displayName: string;
    isActive: boolean;
    sortOrder?: number;
    synonyms?: string[];
    metricLabel?: string;
    imperialLabel?: string;
    description?: string;
    group?: string;
    grouping?: string;
    category?: string;
    properties?: string[];
    metadata?: Record<string, any>;
}
export interface LookupCollection {
    id: string;
    name: string;
    description?: string;
    values: LookupValue[];
    version?: number;
    isActive: boolean;
    supportsSynonyms: boolean;
    supportsMeasurement: boolean;
    isMultiSelect: boolean;
    supportsGrouping: boolean;
    lastUpdated?: Date;
    cacheExpiryHours?: number;
}
//# sourceMappingURL=LookupTypes.d.ts.map
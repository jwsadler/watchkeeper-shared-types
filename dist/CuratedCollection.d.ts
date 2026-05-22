/**
 * Curated collections — handpicked or filter-driven groupings of
 * watch references surfaced in the app (e.g., "Dive watches under 40mm").
 *
 * Firestore path: curatedCollections/{collectionId}
 */
export interface CuratedCollectionFilterCriteria {
    facetFilters?: string[][];
    numericFilters?: string[];
    query?: string;
}
export interface CuratedCollection {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    titleColor?: string;
    showOverlay?: boolean;
    type: 'filter' | 'manual';
    filterCriteria?: CuratedCollectionFilterCriteria;
    referenceIds?: string[];
    isActive: boolean;
    sortOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=CuratedCollection.d.ts.map
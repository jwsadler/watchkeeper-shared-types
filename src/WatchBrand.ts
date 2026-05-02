/**
 * Watch Brand — shared across admin app and WatchKeeper RN app.
 *
 * Firestore path: watchBrands/{brandId}
 */
export interface WatchBrand {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  /** AI-generated brand description (populated from enrichment) */
  aiDescription?: string;
  alternativeNames?: string[];
  abbreviations?: string[];
  windingDirections?: string[];
  logo?: string;
  country?: string;
  founded?: number;
  /** Primary website (admin uses mainWebsite, RN uses website — both supported) */
  website?: string;
  mainWebsite?: string;
  mainAddress?: string;
  information?: string;
  // Shopify integration
  shopifyEnabled?: boolean;
  shopifyUrl?: string;
  excludedProductTypes?: string[];
  lastImportedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

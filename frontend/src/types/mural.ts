export type MuralStatus = 'registered' | 'assessing' | 'restoring' | 'completed' | 'monitoring';

export type ImageType = 'visible' | 'infrared' | 'ultraviolet' | 'restored';

export type AssetType = 'model' | 'panorama';

export interface MuralImage {
  id: string;
  muralId: string;
  filePath: string;
  fileHash: string;
  imageType: ImageType;
  version: number;
  width: number;
  height: number;
  fileSize: number;
  thumbnailPath?: string;
  webpPath?: string;
  createdAt: string;
}

export interface MuralAsset {
  id: string;
  muralId: string;
  assetType: AssetType;
  name: string;
  filePath: string;
  fileHash: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  version: number;
  isDefault: boolean;
  createdAt: string;
}

export interface MuralRecord {
  id: string;
  name: string;
  era: string;
  site: string;
  material: string;
  tombLocation?: string;
  excavationDate?: string;
  dimensions?: string;
  description?: string;
  popularIntroduction?: string;
  historicalBackground?: string;
  artisticFeatures?: string;
  culturalSignificance?: string;
  status: MuralStatus;
  healthIndex?: number;
  isFeatured: boolean;
  images: MuralImage[];
  assets?: MuralAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface MuralHistory {
  id: string;
  muralId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
}

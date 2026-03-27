/** 壁画状态 */
export type MuralStatus = 'registered' | 'assessing' | 'restoring' | 'completed' | 'monitoring';

/** 图像类型 */
export type ImageType = 'visible' | 'infrared' | 'ultraviolet' | 'restored';

/** 壁画图像 */
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

/** 壁画记录 */
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
  status: MuralStatus;
  healthIndex?: number;
  isFeatured: boolean;
  images: MuralImage[];
  createdAt: string;
  updatedAt: string;
}

/** 壁画修改历史 */
export interface MuralHistory {
  id: string;
  muralId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
}

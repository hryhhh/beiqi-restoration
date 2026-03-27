import type { ImageType } from './mural';

/** 病害类型 */
export type DamageType =
  | 'detachment' | 'flaking' | 'salt_efflorescence' | 'cracking'
  | 'pigment_loss' | 'fading' | 'soiling'
  | 'mold' | 'insect_damage' | 'root_damage';

/** 标注坐标 */
export interface AnnotationCoordinates {
  type: 'polygon' | 'rect' | 'path';
  points: number[][];
}

/** 病害标注 */
export interface DamageAnnotation {
  id: string;
  muralId: string;
  imageLayer: ImageType;
  damageType: DamageType;
  severity: number;
  coordinates: AnnotationCoordinates;
  area?: number;
  areaPercent?: number;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** 标注版本快照 */
export interface AnnotationSnapshot {
  id: string;
  annotationId: string;
  version: number;
  coordinates: AnnotationCoordinates;
  damageType: DamageType;
  severity: number;
  createdAt: string;
}

import { get, post, put, del } from './request';
import type { DamageAnnotation, AnnotationSnapshot, AnnotationCoordinates, DamageType } from '@/types';
import type { ImageType } from '@/types';

/** 获取壁画的标注列表 */
export const getAnnotations = (muralId: string, imageLayer?: string) =>
  get<DamageAnnotation[]>(`/murals/${muralId}/annotations`, imageLayer ? { imageLayer } : undefined);

/** 创建标注 */
export const createAnnotation = (muralId: string, data: {
  damageType: DamageType;
  severity: number;
  imageLayer: ImageType;
  coordinates: AnnotationCoordinates;
  description?: string;
}) => post<DamageAnnotation>(`/murals/${muralId}/annotations`, data);

/** 更新标注 */
export const updateAnnotation = (muralId: string, id: string, data: {
  damageType?: DamageType;
  severity?: number;
  coordinates?: AnnotationCoordinates;
  description?: string;
}) => put<DamageAnnotation>(`/murals/${muralId}/annotations/${id}`, data);

/** 删除标注 */
export const deleteAnnotation = (muralId: string, id: string) =>
  del<void>(`/murals/${muralId}/annotations/${id}`);

/** 获取标注版本历史 */
export const getAnnotationVersions = (muralId: string, id: string) =>
  get<AnnotationSnapshot[]>(`/murals/${muralId}/annotations/${id}/versions`);

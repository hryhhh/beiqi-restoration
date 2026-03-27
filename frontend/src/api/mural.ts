import { get, post, put } from './request';
import type { MuralRecord, MuralHistory } from '@/types';
import type { PaginatedResponse } from '@/types';

/** 壁画列表筛选参数 */
export interface MuralListParams {
  page?: number;
  pageSize?: number;
  name?: string;
  site?: string;
  era?: string;
  material?: string;
  status?: string;
}

/** 获取壁画列表 */
export const getMurals = (params?: MuralListParams) =>
  get<PaginatedResponse<MuralRecord>>('/murals', params as Record<string, unknown>);

/** 获取壁画详情 */
export const getMural = (id: string) => get<MuralRecord>(`/murals/${id}`);

/** 创建壁画 */
export const createMural = (data: {
  name: string;
  era: string;
  site: string;
  material: string;
  tombLocation?: string;
  dimensions?: string;
  description?: string;
}) => post<MuralRecord>('/murals', data);

/** 更新壁画 */
export const updateMural = (id: string, data: Record<string, unknown>) =>
  put<MuralRecord>(`/murals/${id}`, data);

/** 获取壁画修改历史 */
export const getMuralHistory = (id: string) => get<MuralHistory[]>(`/murals/${id}/history`);

/** 上传壁画图像 */
export const uploadMuralImage = (id: string, file: File, imageType = 'visible') => {
  const form = new FormData();
  form.append('file', file);
  form.append('imageType', imageType);
  // 直接用 axios 实例，因为需要 multipart/form-data
  return post<unknown>(`/murals/${id}/images`, form);
};

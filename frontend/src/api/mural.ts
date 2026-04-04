import { del, get, post, put } from './request';
import type { AssetType, MuralAsset, MuralHistory, MuralRecord, PaginatedResponse } from '@/types';

export interface MuralListParams {
  page?: number;
  pageSize?: number;
  name?: string;
  site?: string;
  era?: string;
  material?: string;
  status?: string;
}

export const getMurals = (params?: MuralListParams) =>
  get<PaginatedResponse<MuralRecord>>('/murals', params as Record<string, unknown>);

export const getMural = (id: string) => get<MuralRecord>(`/murals/${id}`);

export const createMural = (data: {
  name: string;
  era: string;
  site: string;
  material: string;
  tombLocation?: string;
  dimensions?: string;
  description?: string;
}) => post<MuralRecord>('/murals', data);

export const updateMural = (id: string, data: Record<string, unknown>) =>
  put<MuralRecord>(`/murals/${id}`, data);

export const getMuralHistory = (id: string) => get<MuralHistory[]>(`/murals/${id}/history`);

export const uploadMuralImage = (id: string, file: File, imageType = 'visible') => {
  const form = new FormData();
  form.append('file', file);
  form.append('imageType', imageType);
  return post<unknown>(`/murals/${id}/images`, form);
};

export const uploadMuralAsset = (
  id: string,
  file: File,
  assetType: AssetType,
  options?: { name?: string; makeDefault?: boolean },
) => {
  const form = new FormData();
  form.append('file', file);
  form.append('assetType', assetType);
  if (options?.name) {
    form.append('name', options.name);
  }
  if (options?.makeDefault) {
    form.append('makeDefault', 'true');
  }
  return post<MuralAsset>(`/murals/${id}/assets`, form);
};

export const deleteMural = (id: string) => del<{ message: string }>(`/murals/${id}`);

export const deleteMuralImage = (muralId: string, imageId: string) =>
  del<{ message: string }>(`/murals/${muralId}/images/${imageId}`);

export const deleteMuralAsset = (muralId: string, assetId: string) =>
  del<{ message: string }>(`/murals/${muralId}/assets/${assetId}`);

export const setDefaultMuralAsset = (muralId: string, assetId: string) =>
  put<MuralAsset>(`/murals/${muralId}/assets/${assetId}/default`);

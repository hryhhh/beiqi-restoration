import { get, post } from './request';
import type { KnowledgeDoc } from '@/types';
import type { PaginatedResponse } from '@/types';

/** 获取文档列表 */
export const getKnowledgeDocs = (params?: { category?: string; page?: number; pageSize?: number }) =>
  get<PaginatedResponse<KnowledgeDoc>>('/knowledge', params as Record<string, unknown>);

/** 搜索文档 */
export const searchKnowledge = (q: string) => get<KnowledgeDoc[]>('/knowledge/search', { q });

/** 获取文档详情 */
export const getKnowledgeDoc = (id: string) => get<KnowledgeDoc>(`/knowledge/${id}`);

/** 创建文档（管理员） */
export const createKnowledgeDoc = (data: { title: string; content: string; category: string }) =>
  post<KnowledgeDoc>('/knowledge', data);

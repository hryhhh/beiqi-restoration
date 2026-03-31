import { get, post, put, del } from './request';
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

/** 更新文档（管理员） */
export const updateKnowledgeDoc = (id: string, data: { title: string; content: string; category: string }) =>
  put<KnowledgeDoc>(`/knowledge/${id}`, data);

/** 删除文档（管理员） */
export const deleteKnowledgeDoc = (id: string) => del<null>(`/knowledge/${id}`);

/** 知识库问答 */
export interface QAResult {
  answer: string;
  sources: { id: string; title: string; category: string }[];
}

export const askKnowledge = (question: string) =>
  post<QAResult>('/knowledge/qa', { question });

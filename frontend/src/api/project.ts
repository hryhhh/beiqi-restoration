import { get, post, put } from './request';
import type { Project, MaterialRecord, TaskAttachment } from '@/types';
import type { PaginatedResponse } from '@/types';

/** 获取项目列表 */
export const getProjects = (params?: { status?: string; page?: number; pageSize?: number }) =>
  get<PaginatedResponse<Project>>('/projects', params as Record<string, unknown>);

/** 获取项目详情 */
export const getProject = (id: string) => get<Project>(`/projects/${id}`);

/** 创建项目 */
export const createProject = (data: { name: string; description?: string; muralIds?: string[] }) =>
  post<Project>('/projects', data);

/** 标记项目完成 */
export const completeProject = (id: string) => put<void>(`/projects/${id}/complete`);

/** 创建任务 */
export const createTask = (projectId: string, data: { phaseId: string; title: string; description?: string }) =>
  post<unknown>(`/projects/${projectId}/tasks`, data);

/** 更新任务状态 */
export const updateTask = (projectId: string, taskId: string, status: string) =>
  put<void>(`/projects/${projectId}/tasks/${taskId}`, { status });

/** 分配任务 */
export const assignTask = (projectId: string, taskId: string, userIds: string[]) =>
  put<void>(`/projects/${projectId}/tasks/${taskId}/assign`, { userIds });

/** 上传任务附件 */
export const uploadAttachment = (projectId: string, taskId: string, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return post<TaskAttachment>(`/projects/${projectId}/tasks/${taskId}/attachments`, fd);
};

/** 添加材料消耗 */
export const addMaterial = (projectId: string, data: Omit<MaterialRecord, 'id' | 'projectId' | 'createdAt'>) =>
  post<MaterialRecord>(`/projects/${projectId}/materials`, data);

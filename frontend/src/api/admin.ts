import { get, put, post } from './request';
import type { User, AuditLog } from '@/types';
import type { PaginatedResponse } from '@/types';

/** 获取用户列表 */
export const getUsers = () => get<User[]>('/admin/users');

/** 修改用户角色 */
export const updateUserRole = (id: string, role: string) => put<void>(`/admin/users/${id}/role`, { role });

/** 获取操作日志 */
export const getLogs = (params?: { userId?: string; action?: string; page?: number; pageSize?: number }) =>
  get<PaginatedResponse<AuditLog>>('/admin/logs', params as Record<string, unknown>);

/** 触发备份 */
export const triggerBackup = () => post<{ message: string }>('/admin/backup');

/** 导出数据 */
export const triggerExport = () => post<{ message: string }>('/admin/export');

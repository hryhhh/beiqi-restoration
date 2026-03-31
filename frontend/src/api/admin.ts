import { get, put, post, del } from './request';
import type { User, AuditLog } from '@/types';
import type { PaginatedResponse } from '@/types';

/** 获取用户列表 */
export const getUsers = () => get<User[]>('/admin/users');

/** 修改用户角色 */
export const updateUserRole = (id: string, role: string) => put<void>(`/admin/users/${id}/role`, { role });

/** 重置用户密码 */
export const resetUserPassword = (id: string) => put<{ message: string }>(`/admin/users/${id}/reset-password`);

/** 删除用户 */
export const deleteUser = (id: string) => del<void>(`/admin/users/${id}`);

/** 获取操作日志 */
export const getLogs = (params?: { userId?: string; action?: string; page?: number; pageSize?: number }) =>
  get<PaginatedResponse<AuditLog>>('/admin/logs', params as Record<string, unknown>);

/** 触发备份 */
export const triggerBackup = () => post<{ message: string }>('/admin/backup');

/** 导出数据（后端直接返回 CSV 流，需要用 blob 下载） */
export const triggerExport = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/admin/export', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('导出失败');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // 从 Content-Disposition 取文件名，兜底用日期
  const cd = res.headers.get('Content-Disposition');
  a.download = cd?.match(/filename=(.+)/)?.[1] || `export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

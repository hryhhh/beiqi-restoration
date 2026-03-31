import { get, post, put, del } from './request';
import type { RestorationPlan, PlanReview } from '@/types';

/** 获取方案列表 */
export const getPlans = (annotationId?: string) =>
  get<RestorationPlan[]>('/plans', annotationId ? { annotationId } : undefined);

/** 获取方案详情 */
export const getPlan = (id: string) => get<RestorationPlan>(`/plans/${id}`);

/** 创建修复方案 */
export const createPlan = (data: {
  annotationId: string; method: string; materials: string; expectedResult?: string;
}) => post<RestorationPlan>('/plans', data);

/** 更新方案状态 */
export const updatePlanStatus = (id: string, status: string) =>
  put<RestorationPlan>(`/plans/${id}`, { status });

/** 编辑方案内容 */
export const updatePlanContent = (id: string, data: { method?: string; materials?: string; expectedResult?: string }) =>
  put<RestorationPlan>(`/plans/${id}/content`, data);

/** 删除方案 */
export const deletePlan = (id: string) => del<void>(`/plans/${id}`);

/** 审批方案 */
export const reviewPlan = (id: string, data: { result: 'approved' | 'rejected'; comment?: string }) =>
  post<PlanReview>(`/plans/${id}/review`, data);

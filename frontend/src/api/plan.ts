import { get, post, put } from './request';
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

/** 审批方案 */
export const reviewPlan = (id: string, data: { result: 'approved' | 'rejected'; comment?: string }) =>
  post<PlanReview>(`/plans/${id}/review`, data);

import { post } from './request';

/** AI 检测 */
export const detectDamage = (data: { muralId: string; imageId: string }) =>
  post<unknown>('/analysis/detect', data);

/** 确认检测结果转标注 */
export const confirmDetection = (data: unknown) => post<unknown>('/analysis/confirm', data);

/** 生成修复报告 */
export const generateReport = (data: { muralId: string }) => post<unknown>('/analysis/report', data);

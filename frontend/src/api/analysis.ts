import { get, post } from './request';
import type { DamageAnnotation, DamageType } from '@/types';

/** AI 检测结果 */
export interface DetectionResult {
  damageType: DamageType;
  severity: number;
  confidence: number;
  description: string;
  coordinates: { type: string; points: number[][] };
}

/** 修复报告 */
export interface AnalysisReport {
  muralId: string;
  muralName: string;
  totalDamages: number;
  avgSeverity: number;
  typeStats: Record<string, number>;
  reportContent: string;
}

/** AI 检测（后端可能返回 503 表示 AI 不可用） */
export const detectDamage = (data: { imageUrl: string }) =>
  post<DetectionResult[]>('/analysis/detect', data);

/** 确认检测结果转为标注 */
export const confirmDetection = (data: { muralId: string; results: DetectionResult[] }) =>
  post<{ count: number; annotations: DamageAnnotation[] }>('/analysis/confirm', data);

/** 生成修复报告 */
export const generateReport = (muralId: string) =>
  post<AnalysisReport>('/analysis/report', { muralId });

import { get } from './request';
import type { MuralRecord } from '@/types';

/** 仪表盘汇总数据 */
export interface DashboardSummary {
  pendingTasks: number;
  inProgressProjects: number;
  muralCount: number;
}

/** 图表数据 */
export interface ChartData {
  statusDistribution: { status: string; count: number }[];
}

export const getDashboardSummary = () => get<DashboardSummary>('/dashboard/summary');
export const getDashboardAlerts = () => get<MuralRecord[]>('/dashboard/alerts');
export const getDashboardCharts = () => get<ChartData>('/dashboard/charts');

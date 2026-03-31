import { get } from './request';

/** 仪表盘汇总数据 */
export interface DashboardSummary {
  pendingTasks: number;
  inProgressProjects: number;
  muralCount: number;
}

/** 健康预警项 */
export interface DashboardAlert {
  id: string;
  name: string;
  healthIndex?: number | null;
}

/** 图表数据 */
export interface ChartData {
  statusDistribution: { status: string; count: number }[];
  progressTrend?: { month: string; completed: number; inProgress: number }[];
}

export const getDashboardSummary = () => get<DashboardSummary>('/dashboard/summary');
export const getDashboardAlerts = () => get<DashboardAlert[]>('/dashboard/alerts');
export const getDashboardCharts = () => get<ChartData>('/dashboard/charts');

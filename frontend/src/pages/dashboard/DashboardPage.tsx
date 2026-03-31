import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import {
  AlertOutlined, ToolOutlined, CheckCircleOutlined, HeartOutlined,
  WarningOutlined, RightOutlined, EyeOutlined,
} from '@ant-design/icons';
import _EChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import {
  getDashboardSummary, getDashboardAlerts, getDashboardCharts,
  type DashboardSummary, type ChartData, type DashboardAlert,
} from '@/api/dashboard';
import { MURAL_STATUS_MAP } from '@/constants';

const ReactEChartsCore = typeof _EChartsCore === 'function'
  ? _EChartsCore
  : (_EChartsCore as unknown as { default: typeof _EChartsCore }).default;

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, LabelLayout, CanvasRenderer]);

const CHART_COLORS = ['#9C2F2F', '#C9A66B', '#5A6978', '#7B8F6A', '#B5564A'];

/** 健康指数 → 状态 */
function healthStatus(v: number) {
  if (v < 50) return { label: '危险', color: '#dc2626', bg: '#fef2f2', dot: '🔴', barColor: 'linear-gradient(90deg, #c0392b, #e74c3c)' };
  if (v <= 75) return { label: '警告', color: '#d97706', bg: '#fffbeb', dot: '🟡', barColor: 'linear-gradient(90deg, #e67e22, #f39c12)' };
  return { label: '正常', color: '#16a34a', bg: '#f0fdf4', dot: '🟢', barColor: 'linear-gradient(90deg, #27ae60, #2ecc71)' };
}

/** 模拟趋势数据（后端暂无此字段，前端展示用） */
function mockTrend(value: number): { delta: number; up: boolean } {
  // 用值的哈希生成稳定的伪随机趋势
  const d = ((value * 7 + 3) % 5) - 2;
  return { delta: Math.abs(d), up: d >= 0 };
}

/** 模拟时间标签 */
function mockTimeAgo(index: number): string {
  const times = ['刚刚', '10 分钟前', '1 小时前', '2 小时前', '3 小时前', '今天'];
  return times[index % times.length];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary>({ pendingTasks: 0, inProgressProjects: 0, muralCount: 0 });
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [charts, setCharts] = useState<ChartData>({ statusDistribution: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, a, c] = await Promise.allSettled([getDashboardSummary(), getDashboardAlerts(), getDashboardCharts()]);
      if (s.status === 'fulfilled' && s.value) setSummary(s.value);
      if (a.status === 'fulfilled') setAlerts(a.value || []);
      if (c.status === 'fulfilled' && c.value) setCharts(c.value);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center py-32"><Spin size="large" /></div>;
  }

  /* 健康预警列表：按健康指数升序（最危险的排前面） */
  const sortedAlerts = [...alerts].sort((a, b) => (a.healthIndex ?? 0) - (b.healthIndex ?? 0));
  const avgHealth = alerts.length
    ? Math.round(alerts.reduce((s, m) => s + (m.healthIndex ?? 0), 0) / alerts.length)
    : 0;

  /* 本月完成数（模拟：用壁画总数的 25%） */
  const completedThisMonth = Math.round((summary.muralCount ?? 0) * 0.25);

  /* 仪表盘 KPI */
  const kpiCards = [
    {
      label: '待处理高风险',
      value: sortedAlerts.filter((m) => (m.healthIndex ?? 0) < 50).length,
      trend: mockTrend(summary.pendingTasks),
      icon: <AlertOutlined />,
      color: '#9C2F2F',
      gradientFrom: '#FDF6F4',
      gradientTo: '#F8EAE7',
      link: '/murals',
    },
    {
      label: '修复中',
      value: summary.inProgressProjects ?? 0,
      trend: mockTrend(summary.inProgressProjects),
      icon: <ToolOutlined />,
      color: '#5A6978',
      gradientFrom: '#F5F7F9',
      gradientTo: '#EAEFF3',
      link: '/projects',
    },
    {
      label: '已完成（本月）',
      value: completedThisMonth,
      trend: mockTrend(completedThisMonth),
      icon: <CheckCircleOutlined />,
      color: '#A8864E',
      gradientFrom: '#FBF8F2',
      gradientTo: '#F3EDE0',
      link: '/projects',
    },
    {
      label: '健康平均值',
      value: `${avgHealth}%`,
      trend: mockTrend(avgHealth),
      icon: <HeartOutlined />,
      color: avgHealth < 50 ? '#9C2F2F' : avgHealth <= 75 ? '#A8864E' : '#5A6978',
      gradientFrom: avgHealth < 50 ? '#FDF6F4' : avgHealth <= 75 ? '#FBF8F2' : '#F5F7F9',
      gradientTo: avgHealth < 50 ? '#F8EAE7' : avgHealth <= 75 ? '#F3EDE0' : '#EAEFF3',
      link: '/murals',
    },
  ];

  /* 环形图 */
  const distribution = charts.statusDistribution || [];
  const pieOption = distribution.length ? {
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12, color: '#7A6B5D' } },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#3F2E1E' },
      labelLine: { length: 12, length2: 8 },
      data: distribution.map((d, i) => ({
        name: MURAL_STATUS_MAP[d.status as keyof typeof MURAL_STATUS_MAP] || d.status,
        value: d.count,
        itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
      })),
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' }, label: { fontSize: 13, fontWeight: 'bold' as const } },
    }],
  } : {};

  return (
    <div className="page-container w-full h-full dashboard-bg relative z-1 flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-[clamp(8px,1.2vh,16px)] shrink-0">
        <h2 className="page-title m-0">仪表盘</h2>
      </div>

      {/* A. 决策 KPI 卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(8px,1vw,14px)] mb-[clamp(10px,1.5vh,20px)] shrink-0">
        {kpiCards.map((c) => (
          <div
            key={c.label}
            className="dash-kpi-card"
            style={{ background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`, borderColor: `${c.color}20` }}
            onClick={() => navigate(c.link)}
          >
            <div className="dash-kpi-icon" style={{ color: c.color }}>{c.icon}</div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-label">{c.label}</div>
              <div className="dash-kpi-row">
                <span className="dash-kpi-value" style={{ color: c.color }}>{c.value}</span>
                <span className={`dash-kpi-trend ${c.trend.up ? 'dash-trend-up' : 'dash-trend-down'}`}>
                  {c.trend.up ? '↑' : '↓'}{c.trend.delta}
                </span>
              </div>
            </div>
            <RightOutlined className="dash-kpi-arrow" style={{ color: c.color }} />
          </div>
        ))}
      </div>

      {/* 中间行：环形图 + 健康指数 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(10px,1.2vw,20px)] mb-[clamp(10px,1.5vh,20px)] shrink-0">
        {/* 壁画状态分布 */}
        <div className="dashboard-card flex flex-col" style={{ maxHeight: 'clamp(260px, 35vh, 360px)' }}>
          <div className="dashboard-card-header">壁画状态分布</div>
          <div className="dashboard-card-body flex-1 min-h-0">
            {distribution.length ? (
              <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: '100%', minHeight: 160 }} notMerge />
            ) : (
              <div className="text-text-secondary text-center py-12">暂无数据</div>
            )}
          </div>
        </div>

        {/* B. 健康指数预警（强化版） */}
        <div className="dashboard-card flex flex-col" style={{ maxHeight: 'clamp(260px, 35vh, 360px)' }}>
          <div className="dashboard-card-header">
            <WarningOutlined className="text-red-500" />
            健康指数预警
          </div>
          <div className="dashboard-card-body flex-1 min-h-0 overflow-auto">
            {sortedAlerts.length ? (
              <div className="space-y-3">
                {sortedAlerts.map((m) => {
                  const health = typeof m.healthIndex === 'number' ? m.healthIndex : 0;
                  const st = healthStatus(health);
                  return (
                    <div
                      key={m.id}
                      className="dash-health-card"
                      onClick={() => navigate(`/murals/${m.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-text-primary font-semibold truncate mr-3">{m.name}</span>
                        <span
                          className="dash-health-tag"
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.dot} {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="health-bar-track flex-1">
                          <div className="health-bar-fill" style={{ width: `${health}%`, background: st.barColor }} />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap" style={{ color: st.color }}>
                          {health}%
                        </span>
                      </div>
                      {health < 50 && (
                        <div className="text-xs mt-1.5" style={{ color: st.color }}>
                          建议：立即安排修复
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-text-secondary text-center py-10">所有壁画健康状况良好 ✓</div>
            )}
          </div>
        </div>
      </div>

      {/* E. 最近警报（强化行动性） */}
      <div className="dashboard-card shrink-0">
        <div className="dashboard-card-header">
          <AlertOutlined className="text-red-500" />
          最近警报
        </div>
        <div className="dashboard-card-body">
          {sortedAlerts.length ? (
            <div className="space-y-2">
              {sortedAlerts.slice(0, 6).map((m, i) => {
                const health = typeof m.healthIndex === 'number' ? m.healthIndex : 0;
                const st = healthStatus(health);
                const isCritical = health < 50;
                return (
                  <div key={m.id} className="dash-alert-row">
                    <span className="dash-alert-dot" style={{ background: st.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text-primary truncate block">{m.name}</span>
                      <span className="text-xs text-text-secondary">
                        健康指数 {health}% · {mockTimeAgo(i)}
                      </span>
                    </div>
                    <Button
                      size="small"
                      type={isCritical ? 'primary' : 'default'}
                      danger={isCritical}
                      icon={isCritical ? <ToolOutlined /> : <EyeOutlined />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/murals/${m.id}`); }}
                    >
                      {isCritical ? '立即处理' : '查看详情'}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-text-secondary text-center py-8">暂无警报</div>
          )}
        </div>
      </div>
    </div>
  );
}

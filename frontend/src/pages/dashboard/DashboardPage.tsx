import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, List, Tag, message } from 'antd';
import {
  FileTextOutlined, ProjectOutlined, PictureOutlined, WarningOutlined,
} from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import {
  getDashboardSummary, getDashboardAlerts, getDashboardCharts,
  type DashboardSummary, type ChartData,
} from '@/api/dashboard';
import { MURAL_STATUS_MAP } from '@/constants';
import type { MuralRecord } from '@/types';

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<MuralRecord[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setSummary(await getDashboardSummary()); } catch { /* 忽略 */ }
      try { setAlerts(await getDashboardAlerts() || []); } catch { /* 忽略 */ }
      try { setCharts(await getDashboardCharts()); } catch { /* 忽略 */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const summaryCards = [
    { title: '待办任务', value: summary?.pendingTasks ?? 0, icon: <FileTextOutlined />, color: '#e74c3c', link: '/projects' },
    { title: '进行中项目', value: summary?.inProgressProjects ?? 0, icon: <ProjectOutlined />, color: '#3498db', link: '/projects' },
    { title: '壁画总数', value: summary?.muralCount ?? 0, icon: <PictureOutlined />, color: '#8B2E2E', link: '/murals' },
  ];

  const pieOption = charts ? {
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: (charts.statusDistribution || []).map((d) => ({
        name: MURAL_STATUS_MAP[d.status as keyof typeof MURAL_STATUS_MAP] || d.status,
        value: d.count,
      })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  } : {};

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">仪表盘</h2>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((c) => (
          <Card key={c.title} hoverable onClick={() => navigate(c.link)} className="!cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="text-3xl" style={{ color: c.color }}>{c.icon}</div>
              <div>
                <div className="text-text-secondary text-sm">{c.title}</div>
                <div className="text-2xl font-bold">{c.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 壁画状态分布饼图 */}
        <Card title="壁画状态分布">
          {charts?.statusDistribution?.length ? (
            <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 300 }} />
          ) : (
            <div className="text-text-secondary text-center py-12">暂无数据</div>
          )}
        </Card>

        {/* 健康指数预警 */}
        <Card title={<span><WarningOutlined className="text-red-500 mr-1" />健康指数预警</span>}>
          {alerts.length ? (
            <List
              size="small"
              dataSource={alerts}
              renderItem={(m) => (
                <List.Item className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/murals/${m.id}`)}>
                  <div className="flex items-center justify-between w-full">
                    <span>{m.name}</span>
                    <Tag color="error">健康指数 {m.healthIndex}%</Tag>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className="text-text-secondary text-center py-12">所有壁画健康状况良好 ✓</div>
          )}
        </Card>
      </div>
    </div>
  );
}

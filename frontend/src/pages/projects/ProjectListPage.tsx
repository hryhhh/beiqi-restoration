import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Select, Spin, Segmented, Card, Input, Progress, Popconfirm, message } from 'antd';
import {
  PlusOutlined, EyeOutlined, AppstoreOutlined, UnorderedListOutlined,
  SearchOutlined, ProjectOutlined, CheckCircleOutlined, DollarOutlined,
  EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { getProjects, deleteProject } from '@/api/project';
import { PROJECT_STATUS_MAP } from '@/constants';
import { MOCK_PROJECTS } from '@/mock';
import ProjectFormModal from './ProjectFormModal';
import type { Project, ProjectStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

/** 状态标签颜色 */
const statusColor: Record<ProjectStatus, string> = {
  pending: 'default', in_progress: 'processing', completed: 'success',
};

/** 进度条颜色 */
const progressColor: Record<ProjectStatus, string> = {
  pending: '#C4B8A8', in_progress: '#7A8A98', completed: '#6B9E6B',
};

/** 看板列 */
const BOARD_COLUMNS: { status: ProjectStatus; label: string; color: string }[] = [
  { status: 'pending', label: '待评估', color: '#d9d9d9' },
  { status: 'in_progress', label: '修复中', color: '#1677ff' },
  { status: 'completed', label: '已完成', color: '#52c41a' },
];

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [isMock, setIsMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ps = viewMode === 'board' ? { pageSize: 200 } : { status, page, pageSize: 10 };
      const res = await getProjects(ps);
      if (res.data?.length > 0) {
        setProjects(res.data);
        setTotal(res.total);
        setIsMock(false);
      } else {
        setProjects(MOCK_PROJECTS);
        setTotal(MOCK_PROJECTS.length);
        setIsMock(true);
      }
    } catch {
      setProjects(MOCK_PROJECTS);
      setTotal(MOCK_PROJECTS.length);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [page, status, viewMode]);

  useEffect(() => { load(); }, [load]);

  /* 统计数据 */
  const stats = useMemo(() => {
    const inProgress = projects.filter((p) => p.status === 'in_progress').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
    return { inProgress, completed, totalBudget };
  }, [projects]);

  /* 搜索过滤 */
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    return projects.filter((p) => p.name.includes(search.trim()));
  }, [projects, search]);

  /* 表格列定义 */
  const columns: ColumnsType<Project> = [
    {
      title: '项目名称', dataIndex: 'name', key: 'name',
      render: (name: string, r) => (
        <a className="text-primary font-medium hover:underline" onClick={() => navigate(`/projects/${r.id}`)}>
          {name}
        </a>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: ProjectStatus) => <Tag color={statusColor[s]}>{PROJECT_STATUS_MAP[s]}</Tag>,
    },
    {
      title: '进度', dataIndex: 'progress', key: 'progress', width: 160,
      render: (v: number, r) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={v}
            size="small"
            showInfo={false}
            strokeColor={progressColor[r.status]}
            className="flex-1 m-0!"
          />
          <span className="text-xs text-text-secondary w-9 text-right">{v}%</span>
        </div>
      ),
    },
    {
      title: '项目', dataIndex: 'budget', key: 'budget', width: 120,
      render: (v?: number) => v != null ? <span>¥{v.toLocaleString()}</span> : '-',
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作', key: 'action', width: 160, align: 'center' as const,
      render: (_, r) => (
        <div className="flex items-center justify-center gap-1">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/projects/${r.id}`)} />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingProject(r); setFormOpen(true); }} />
          <Popconfirm title="确定删除该项目？" onConfirm={async () => {
            try { await deleteProject(r.id); message.success('项目已删除'); load(); }
            catch { message.error('删除失败'); }
          }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const statCards = [
    { label: '进行中项目', value: `${stats.inProgress} 个`, icon: <ProjectOutlined />, cls: 'kpi-card-projects' },
    { label: '已完成项目', value: `${stats.completed} 个`, icon: <CheckCircleOutlined />, cls: 'kpi-card-tasks' },
    { label: '总预算', value: `¥${stats.totalBudget.toLocaleString()}`, icon: <DollarOutlined />, cls: 'kpi-card-murals' },
  ];

  return (
    <div className="page-container w-full h-full flex flex-col">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-[clamp(8px,1.2vh,16px)] flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="page-title m-0">修复项目</h2>
          {isMock && <Tag color="warning" className="text-xs">演示数据</Tag>}
        </div>
        <Input
          placeholder="按项目名称搜索..."
          prefix={<SearchOutlined className="text-text-light" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-60!"
        />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(8px,1vw,16px)] mb-[clamp(10px,1.5vh,20px)] shrink-0">
        {statCards.map((c) => (
          <div key={c.label} className={`kpi-card ${c.cls}`}>
            <div className="kpi-icon-box">{c.icon}</div>
            <div className="kpi-content">
              <div className="kpi-label">{c.label}</div>
              <div className="kpi-value text-[clamp(20px,3vh,32px)]!">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Segmented
            value={viewMode}
            options={[
              { value: 'table', icon: <UnorderedListOutlined /> },
              { value: 'board', icon: <AppstoreOutlined /> },
            ]}
            onChange={(v) => setViewMode(v as 'table' | 'board')}
          />
          {viewMode === 'table' && (
            <Select
              placeholder="状态筛选" allowClear className="w-32!"
              options={Object.entries(PROJECT_STATUS_MAP).map(([v, l]) => ({ value: v, label: l }))}
              onChange={(v) => { setStatus(v || ''); setPage(1); }}
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>可按状态、创建时间排序</span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormOpen(true)}
            className="ml-2"
            style={{ background: 'linear-gradient(135deg, #9C2F2F, #B84A4A)', border: 'none' }}
          >
            新建项目
          </Button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-h-0">
        <Spin spinning={loading}>
          {viewMode === 'table' ? (
            <div className="dashboard-card">
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredProjects}
                pagination={{
                  current: page,
                  pageSize: 10,
                  total: search ? filteredProjects.length : total,
                  onChange: setPage,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                size="middle"
                className="project-table"
              />
            </div>
          ) : (
            /* 看板视图 */
            <div className="grid grid-cols-3 gap-4">
              {BOARD_COLUMNS.map((col) => {
                const items = filteredProjects.filter((p) => p.status === col.status);
                return (
                  <div key={col.status}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="font-medium">{col.label}</span>
                      <Tag>{items.length}</Tag>
                    </div>
                    <div className="space-y-3">
                      {items.map((p) => (
                        <Card
                          key={p.id} size="small" hoverable
                          className="cursor-pointer!"
                          onClick={() => navigate(`/projects/${p.id}`)}
                        >
                          <div className="font-medium mb-2">{p.name}</div>
                          <Progress
                            percent={p.progress}
                            size="small"
                            strokeColor={progressColor[p.status]}
                          />
                          <div className="flex items-center justify-between text-xs text-text-secondary mt-1">
                            <span>进度 {p.progress}%</span>
                            {p.budget != null && <span>¥{p.budget.toLocaleString()}</span>}
                          </div>
                        </Card>
                      ))}
                      {!items.length && (
                        <div className="text-center text-text-secondary text-sm py-8 border border-dashed rounded">
                          暂无项目
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Spin>
      </div>

      <ProjectFormModal
        open={formOpen}
        editingProject={editingProject}
        onClose={() => { setFormOpen(false); setEditingProject(null); }}
        onSuccess={load}
      />
    </div>
  );
}

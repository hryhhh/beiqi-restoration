import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Select, Space, Spin, Segmented, Card, message } from 'antd';
import { PlusOutlined, EyeOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { getProjects } from '@/api/project';
import { PROJECT_STATUS_MAP } from '@/constants';
import ProjectFormModal from './ProjectFormModal';
import type { Project, ProjectStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const statusColor: Record<ProjectStatus, string> = {
  pending: 'default', in_progress: 'processing', completed: 'success',
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
  const [formOpen, setFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  const load = async () => {
    setLoading(true);
    try {
      // 看板模式加载全部数据（不分页）
      const ps = viewMode === 'board' ? { pageSize: 200 } : { status, page, pageSize: 20 };
      const res = await getProjects(ps);
      setProjects(res.data);
      setTotal(res.total);
    } catch { message.error('加载项目列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, status, viewMode]);

  const columns: ColumnsType<Project> = [
    { title: '项目名称', dataIndex: 'name', key: 'name',
      render: (name: string, r) => <a onClick={() => navigate(`/projects/${r.id}`)}>{name}</a>,
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: ProjectStatus) => <Tag color={statusColor[s]}>{PROJECT_STATUS_MAP[s]}</Tag>,
    },
    { title: '进度', dataIndex: 'progress', key: 'progress', width: 100,
      render: (v: number) => `${v}%`,
    },
    { title: '预算', dataIndex: 'budget', key: 'budget', width: 120,
      render: (v?: number) => v != null ? `¥${v.toLocaleString()}` : '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    { title: '操作', key: 'action', width: 80,
      render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/projects/${r.id}`)} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold m-0">修复项目</h2>
        <Space>
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
              placeholder="状态筛选" allowClear className="!w-28"
              options={Object.entries(PROJECT_STATUS_MAP).map(([v, l]) => ({ value: v, label: l }))}
              onChange={(v) => { setStatus(v || ''); setPage(1); }}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>新建项目</Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {viewMode === 'table' ? (
          <Table
            rowKey="id" columns={columns} dataSource={projects}
            pagination={{ current: page, pageSize: 20, total, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
          />
        ) : (
          /* 看板视图：按状态分三列 */
          <div className="grid grid-cols-3 gap-4">
            {BOARD_COLUMNS.map((col) => {
              const items = projects.filter((p) => p.status === col.status);
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
                        className="!cursor-pointer"
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        <div className="font-medium mb-1">{p.name}</div>
                        <div className="flex items-center justify-between text-xs text-text-secondary">
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

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} />
    </div>
  );
}

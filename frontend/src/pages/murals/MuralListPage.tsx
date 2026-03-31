import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Input, Select, Table, Card, Tag, Pagination, Empty, Spin, Space, Tooltip,
} from 'antd';
import {
  PlusOutlined, AppstoreOutlined, UnorderedListOutlined, SearchOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useMuralStore } from '@/stores/muralStore';
import { MURAL_STATUS_MAP } from '@/constants';
import MuralFormModal from './MuralFormModal';
import type { MuralRecord, MuralStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

/** 状态标签颜色 */
const statusColor: Record<MuralStatus, string> = {
  registered: 'default',
  assessing: 'processing',
  restoring: 'warning',
  completed: 'success',
  monitoring: 'cyan',
};

export default function MuralListPage() {
  const navigate = useNavigate();
  const { murals, total, loading, params, viewMode, setParams, setViewMode, fetchMurals } = useMuralStore();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMurals(); }, [fetchMurals]);

  /** 列表视图列定义 */
  const columns: ColumnsType<MuralRecord> = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true,
      render: (name: string, r) => (
        <a onClick={() => navigate(`/murals/${r.id}`)}>{name}</a>
      ),
    },
    { title: '年代', dataIndex: 'era', key: 'era', width: 140 },
    { title: '出土地点', dataIndex: 'site', key: 'site', width: 160, ellipsis: true },
    { title: '材质', dataIndex: 'material', key: 'material', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: MuralStatus) => <Tag color={statusColor[s]}>{MURAL_STATUS_MAP[s]}</Tag>,
    },
    { title: '健康指数', dataIndex: 'healthIndex', key: 'healthIndex', width: 100,
      render: (v?: number) => v != null ? `${v}%` : '-',
    },
    { title: '操作', key: 'action', width: 80,
      render: (_, r) => (
        <Tooltip title="查看详情">
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/murals/${r.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="page-title m-0">壁画库</h2>
        </div>
        <Space>
          <Input
            placeholder="搜索壁画名称"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => setParams({ name: search, page: 1 })}
            allowClear
            onClear={() => setParams({ name: '', page: 1 })}
            style={{ width: 208 }}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 112 }}
            options={Object.entries(MURAL_STATUS_MAP).map(([v, l]) => ({ value: v, label: l }))}
            onChange={(v) => setParams({ status: v || '', page: 1 })}
          />
          <div className="rounded flex">
            <Tooltip title="卡片视图">
              <Button
                type={viewMode === 'card' ? 'primary' : 'text'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('card')}
              />
            </Tooltip>
            <Tooltip title="列表视图">
              <Button
                type={viewMode === 'list' ? 'primary' : 'text'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
              />
            </Tooltip>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            新建壁画
          </Button>
        </Space>
      </div>

      {/* 内容区 */}
      <Spin spinning={loading}>
        {viewMode === 'list' ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={murals}
            pagination={{
              current: params.page, pageSize: params.pageSize, total,
              onChange: (page, pageSize) => setParams({ page, pageSize }),
              showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
            }}
          />
        ) : (
          <>
            {murals.length === 0 ? (
              <Empty description="暂无壁画记录" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {murals.map((m) => (
                  <Card
                    key={m.id}
                    hoverable
                    onClick={() => navigate(`/murals/${m.id}`)}
                    cover={
                      m.images?.[0] ? (
                        <div className="h-48 bg-gray-100 overflow-hidden">
                          <img
                            src={`/uploads/${m.images[0].filePath}`}
                            alt={m.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">
                          🖼
                        </div>
                      )
                    }
                  >
                    <Card.Meta
                      title={m.name}
                      description={
                        <div className="text-xs text-text-secondary">
                          <div>{m.era} · {m.site}</div>
                          <div className="mt-1">
                            <Tag color={statusColor[m.status]}>{MURAL_STATUS_MAP[m.status]}</Tag>
                            {m.healthIndex != null && (
                              <span className="ml-1">健康 {m.healthIndex}%</span>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>
            )}
            {total > (params.pageSize || 12) && (
              <div className="flex justify-center mt-6">
                <Pagination
                  current={params.page} pageSize={params.pageSize} total={total}
                  onChange={(page, pageSize) => setParams({ page, pageSize })}
                  showSizeChanger showTotal={(t) => `共 ${t} 条`}
                />
              </div>
            )}
          </>
        )}
      </Spin>

      {/* 新建壁画弹窗 */}
      <MuralFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchMurals}
      />
    </div>
  );
}

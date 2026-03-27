import { useEffect, useState } from 'react';
import { Tabs, Table, Tag, Select, Button, Popconfirm, message, Space } from 'antd';
import {
  UserOutlined, FileTextOutlined, CloudDownloadOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import { getUsers, updateUserRole, getLogs, triggerBackup, triggerExport } from '@/api/admin';
import { USER_ROLE_MAP } from '@/constants';
import type { User, UserRole, AuditLog } from '@/types';
import type { ColumnsType } from 'antd/es/table';

export default function AdminPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">管理后台</h2>
      <Tabs items={[
        { key: 'users', label: <span><UserOutlined className="mr-1" />用户管理</span>, children: <UserManagement /> },
        { key: 'logs', label: <span><FileTextOutlined className="mr-1" />操作日志</span>, children: <AuditLogs /> },
        { key: 'data', label: <span><DatabaseOutlined className="mr-1" />数据管理</span>, children: <DataManagement /> },
      ]} />
    </div>
  );
}

/** 用户管理 */
function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setUsers(await getUsers()); }
    catch { message.error('加载用户列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      message.success('角色已更新');
      load();
    } catch { message.error('更新失败'); }
  };

  const columns: ColumnsType<User> = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', width: 180,
      render: (role: UserRole, record) => (
        <Popconfirm title="确定修改角色？" onConfirm={() => handleRoleChange(record.id, role)}>
          <Select
            value={role} size="small" className="!w-36"
            options={Object.entries(USER_ROLE_MAP).map(([v, l]) => ({ value: v, label: l }))}
            onChange={(v) => handleRoleChange(record.id, v)}
          />
        </Popconfirm>
      ),
    },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ];

  return <Table rowKey="id" columns={columns} dataSource={users} loading={loading} pagination={false} />;
}

/** 操作日志 */
function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLogs({ page, pageSize: 20 });
      setLogs(res.data);
      setTotal(res.total);
    } catch { message.error('加载日志失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const columns: ColumnsType<AuditLog> = [
    { title: '操作者', key: 'user', width: 120,
      render: (_, r) => r.user?.username || r.userId,
    },
    { title: '操作', dataIndex: 'action', key: 'action', width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '目标', key: 'target', width: 200,
      render: (_, r) => `${r.targetType} / ${r.targetId}`,
    },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ip', width: 140 },
    { title: '时间', dataIndex: 'createdAt', key: 'time', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ];

  return (
    <Table
      rowKey="id" columns={columns} dataSource={logs} loading={loading} size="small"
      pagination={{ current: page, pageSize: 20, total, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
    />
  );
}

/** 数据管理 */
function DataManagement() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  return (
    <div className="max-w-lg">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <div className="font-medium">数据备份</div>
            <div className="text-xs text-text-secondary">触发数据库全量备份</div>
          </div>
          <Button
            icon={<DatabaseOutlined />} loading={backupLoading}
            onClick={async () => {
              setBackupLoading(true);
              try { await triggerBackup(); message.success('备份已触发'); }
              catch { message.error('备份失败'); }
              finally { setBackupLoading(false); }
            }}
          >
            备份
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <div className="font-medium">数据导出</div>
            <div className="text-xs text-text-secondary">导出壁画和项目数据</div>
          </div>
          <Button
            icon={<CloudDownloadOutlined />} loading={exportLoading}
            onClick={async () => {
              setExportLoading(true);
              try { await triggerExport(); message.success('导出已触发'); }
              catch { message.error('导出失败'); }
              finally { setExportLoading(false); }
            }}
          >
            导出
          </Button>
        </div>
      </Space>
    </div>
  );
}

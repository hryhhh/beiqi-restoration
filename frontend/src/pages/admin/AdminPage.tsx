import { useEffect, useState, useCallback } from 'react';
import { Tag, Select, Button, Popconfirm, message, Spin, Pagination } from 'antd';
import {
  UserOutlined, FileTextOutlined, CloudDownloadOutlined, DatabaseOutlined,
  PlusOutlined, SearchOutlined, TeamOutlined, UserAddOutlined, StarOutlined,
  KeyOutlined, DeleteOutlined, ExportOutlined,
} from '@ant-design/icons';
import { getUsers, updateUserRole, getLogs, triggerBackup, triggerExport, resetUserPassword, deleteUser } from '@/api/admin';
import { USER_ROLE_MAP } from '@/constants';
import type { User, AuditLog } from '@/types';
import './admin.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'data'>('users');

  const tabs = [
    { key: 'users' as const, icon: <UserOutlined />, label: '用户管理' },
    { key: 'logs' as const, icon: <FileTextOutlined />, label: '操作日志' },
    { key: 'data' as const, icon: <DatabaseOutlined />, label: '数据管理' },
  ];

  return (
    <div className="admin-page">
      {/* 文化背景装饰 */}
      <div className="admin-bg-decor" />

      {/* 顶部：标题 + 搜索 + 添加按钮 */}
      <div className="admin-header-row">
        <h1 className="admin-page-title">管理后台</h1>
        <div className="admin-header-actions">
          {activeTab === 'users' && (
            <>
              <div className="admin-search-box">
                <SearchOutlined className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="搜索用户名、邮箱..."
                  className="admin-search-input"
                />
              </div>
              <button className="admin-add-btn">
                <PlusOutlined />
                <span>添加用户</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 标签切换区 */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'logs' && <AuditLogs />}
        {activeTab === 'data' && <DataManagement />}
      </div>

      {/* 底部文化装饰 */}
      <div className="admin-bottom-decor" />
    </div>
  );
}


/** 用户管理 */
function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      message.success('角色已更新');
      load();
    } catch {
      message.error('更新失败');
    }
  };

  // 分页数据
  const pagedUsers = users.slice((page - 1) * pageSize, page * pageSize);
  const totalUsers = users.length;
  // 模拟统计（实际应从后端获取）
  const todayNew = users.filter((u) => {
    const d = new Date(u.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <>
      {/* 统计汇总卡片 */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-red">
            <TeamOutlined />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number admin-stat-number-red">{totalUsers}</span>
            <span className="admin-stat-label">总用户数</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <UserAddOutlined />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number admin-stat-number-green">{todayNew}</span>
            <span className="admin-stat-label">今日新增</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-purple">
            <StarOutlined />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number admin-stat-number-purple">
              {Math.min(totalUsers, 45)}
            </span>
            <span className="admin-stat-label">活跃用户</span>
          </div>
        </div>
        <div className="admin-stats-export">
          <button className="admin-export-btn">
            <ExportOutlined />
            <span>导出用户列表</span>
          </button>
        </div>
      </div>

      {/* 用户表格 */}
      <div className="admin-table-card">
        {loading ? (
          <div className="admin-table-loading">
            <Spin size="large" />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th-check">
                  <input type="checkbox" className="admin-checkbox" />
                </th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user, idx) => (
                <tr key={user.id} className={idx % 2 === 1 ? 'admin-tr-stripe' : ''}>
                  <td className="admin-td-check">
                    <input type="checkbox" className="admin-checkbox" />
                  </td>
                  <td className="admin-td-username">{user.username}</td>
                  <td className="admin-td-email">{user.email}</td>
                  <td>
                    <Select
                      size="small"
                      value={user.role}
                      className="w-28!"
                      onChange={(role) => handleRoleChange(user.id, role)}
                      options={Object.entries(USER_ROLE_MAP).map(([v, l]) => ({ value: v, label: l }))}
                    />
                  </td>
                  <td className="admin-td-time">
                    {new Date(user.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="admin-action-btn admin-action-reset"
                        onClick={async () => {
                          try { await resetUserPassword(user.id); message.success('密码已重置为 reset123'); }
                          catch { message.error('重置失败'); }
                        }}>
                        <KeyOutlined /> 重置密码
                      </button>
                      <Popconfirm
                        title="确定删除该用户？"
                        onConfirm={async () => {
                          try { await deleteUser(user.id); message.success('用户已删除'); load(); }
                          catch { message.error('删除失败'); }
                        }}
                      >
                        <button className="admin-action-btn admin-action-delete">
                          <DeleteOutlined /> 删除
                        </button>
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-table-empty">暂无用户数据</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {totalUsers > pageSize && (
          <div className="admin-pagination">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalUsers}
              onChange={setPage}
              showSizeChanger={false}
              itemRender={(_page, type, original) => {
                if (type === 'prev') return <span className="admin-page-nav">上一页</span>;
                if (type === 'next') return <span className="admin-page-nav">下一页</span>;
                return original;
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}


/** 操作日志 */
function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLogs({ page, pageSize: 20 });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-table-card">
      {loading ? (
        <div className="admin-table-loading">
          <Spin size="large" />
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>操作者</th>
              <th>操作</th>
              <th>目标</th>
              <th>IP</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={log.id} className={idx % 2 === 1 ? 'admin-tr-stripe' : ''}>
                <td className="admin-td-username">{log.user?.username || log.userId}</td>
                <td>
                  <Tag style={{ borderRadius: 6 }}>{log.action}</Tag>
                </td>
                <td>{log.targetType} / {log.targetId}</td>
                <td className="admin-td-email">{log.ipAddress}</td>
                <td className="admin-td-time">
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-table-empty">暂无日志数据</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {total > 20 && (
        <div className="admin-pagination">
          <Pagination
            current={page}
            pageSize={20}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}

/** 数据管理 */
function DataManagement() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  return (
    <div className="admin-data-grid">
      <div className="admin-data-card">
        <div className="admin-data-card-icon admin-stat-icon-red">
          <DatabaseOutlined />
        </div>
        <div className="admin-data-card-info">
          <span className="admin-data-card-title">数据备份</span>
          <span className="admin-data-card-desc">触发数据库全量备份</span>
        </div>
        <Button
          className="admin-btn-outline"
          icon={<DatabaseOutlined />}
          loading={backupLoading}
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
      <div className="admin-data-card">
        <div className="admin-data-card-icon admin-stat-icon-green">
          <CloudDownloadOutlined />
        </div>
        <div className="admin-data-card-info">
          <span className="admin-data-card-title">数据导出</span>
          <span className="admin-data-card-desc">导出壁画和项目数据</span>
        </div>
        <Button
          className="admin-btn-outline"
          icon={<CloudDownloadOutlined />}
          loading={exportLoading}
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
    </div>
  );
}

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  PictureOutlined,
  ToolOutlined,
  ExperimentOutlined,
  BookOutlined,
  SettingOutlined,
  BugOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const { Sider, Content } = Layout;

/** 菜单项配置 */
interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles?: UserRole[]; // 不设置则所有角色可见
}

const menuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/murals', icon: <PictureOutlined />, label: '壁画库' },
  { key: '/projects', icon: <ToolOutlined />, label: '修复项目' },
  { key: '/plans', icon: <SolutionOutlined />, label: '修复方案' },
  { key: '/analysis', icon: <ExperimentOutlined />, label: '图像分析' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/admin', icon: <SettingOutlined />, label: '管理后台', roles: ['admin'] },
];

/** 主布局（侧边栏 + 内容区） */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  // 根据角色过滤菜单
  const visibleItems = menuItems
    .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
    .map(({ key, icon, label }) => ({ key, icon, label }));

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="border-r border-gray-200"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <BugOutlined className="text-primary text-xl mr-2" />
          {!collapsed && (
            <span className="text-primary font-bold text-sm">北齐壁蕴</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Content className="p-6 bg-bg-gray">
        <Outlet />
      </Content>
    </Layout>
  );
}

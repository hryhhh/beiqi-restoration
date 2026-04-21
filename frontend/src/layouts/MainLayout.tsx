import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { USER_ROLE_MAP } from '@/constants';
import { buildMenuItems, getSelectedMenuKey } from '@/layouts/navigation';
import bgImage from '@/assets/images/background.png';
import brandLogo from '../assets/logo.jpg';

const { Sider, Header, Content } = Layout;

/** 主布局（侧边栏 + 内容区） */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // 根据角色过滤菜单
  const visibleItems = buildMenuItems(user?.role);

  return (
    <Layout className="min-h-screen" style={{ position: 'relative' }}>
      {/* 全局淡化背景图 —— 覆盖整个面板 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="border-r border-gray-200 main-sider-transparent"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="flex items-center justify-center border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ height: 56 }}
          onClick={() => navigate('/')}
          title="返回官网首页"
        >
          <img src={brandLogo} alt="北齐壁蕴 Logo" className="brand-logo-img mr-2" />
          {!collapsed && (
            <span className="font-bold text-sm" style={{ color: '#8B3A2F' }}>北齐壁蕴</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedMenuKey(location.pathname)]}
          items={visibleItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header
          className="flex items-center justify-end px-5 border-b border-border-warm"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', height: 56, lineHeight: '56px', padding: '0 20px' }}
        >
          {user && (
            <Dropdown
              menu={{
                items: [
                  { key: 'home', icon: <HomeOutlined />, label: '返回官网', onClick: () => navigate('/') },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
                ],
              }}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#8B3A2F' }} />
                <span className="text-sm text-text-primary">{user.username}</span>
                <span className="text-xs text-text-light">({USER_ROLE_MAP[user.role]})</span>
              </div>
            </Dropdown>
          )}
        </Header>
        <Content
          className="overflow-auto flex flex-col"
          style={{
            padding: 'clamp(12px, 2vh, 24px) clamp(12px, 2vw, 24px)',
            position: 'relative',
            zIndex: 1,
            background: 'transparent',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

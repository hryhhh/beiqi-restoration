import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ExperimentOutlined,
  BookOutlined,
  PictureOutlined,
  AppstoreOutlined,
  SettingOutlined,
  SolutionOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { UserRole } from '@/types';

export type NavigationItem = NonNullable<MenuProps['items']>[number];

const RESTORATION_ROLES: UserRole[] = ['admin', 'chief_restorer', 'assistant', 'researcher'];
const PREFIX_KEYS = ['/dashboard', '/murals', '/showcase', '/projects', '/plans', '/analysis', '/knowledge', '/restoration', '/admin'];

export function canAccessRestoration(role?: UserRole | null): boolean {
  return !!role && RESTORATION_ROLES.includes(role);
}

export function getSelectedMenuKey(pathname: string): string {
  return PREFIX_KEYS.find((key) => pathname === key || pathname.startsWith(`${key}/`)) || pathname;
}

export function buildMenuItems(role?: UserRole | null): NavigationItem[] {
  return [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/murals', icon: <PictureOutlined />, label: '壁画库' },
    { key: '/showcase', icon: <AppstoreOutlined />, label: '成果展示' },
    { key: '/projects', icon: <ToolOutlined />, label: '修复项目' },
    { key: '/plans', icon: <SolutionOutlined />, label: '修复方案' },
    { key: '/analysis', icon: <ExperimentOutlined />, label: '图像分析' },
    ...(canAccessRestoration(role)
      ? [{ key: '/restoration', icon: <ExperimentOutlined />, label: '工作台' }]
      : []),
    { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
    ...(role === 'admin'
      ? [{ key: '/admin', icon: <SettingOutlined />, label: '管理后台' }]
      : []),
  ];
}

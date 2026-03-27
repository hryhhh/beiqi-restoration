import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';

export const router = createBrowserRouter([
  // 官网首页（公开）
  {
    path: '/',
    lazy: async () => {
      const { default: C } = await import('@/pages/landing/LandingPage');
      return { Component: C };
    },
  },

  // 认证页面
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },

  // 需要登录的页面
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            lazy: async () => {
              const { default: C } = await import('@/pages/dashboard/DashboardPage');
              return { Component: C };
            },
          },
          {
            path: '/murals',
            lazy: async () => {
              const { default: C } = await import('@/pages/murals/MuralListPage');
              return { Component: C };
            },
          },
          {
            path: '/murals/:id',
            lazy: async () => {
              const { default: C } = await import('@/pages/murals/MuralDetailPage');
              return { Component: C };
            },
          },
          {
            path: '/projects',
            lazy: async () => {
              const { default: C } = await import('@/pages/projects/ProjectListPage');
              return { Component: C };
            },
          },
          {
            path: '/projects/:id',
            lazy: async () => {
              const { default: C } = await import('@/pages/projects/ProjectDetailPage');
              return { Component: C };
            },
          },
          {
            path: '/analysis',
            lazy: async () => {
              const { default: C } = await import('@/pages/analysis/AnalysisPage');
              return { Component: C };
            },
          },
          {
            path: '/plans',
            lazy: async () => {
              const { default: C } = await import('@/pages/plans/PlanPage');
              return { Component: C };
            },
          },
          {
            path: '/knowledge',
            lazy: async () => {
              const { default: C } = await import('@/pages/knowledge/KnowledgePage');
              return { Component: C };
            },
          },
        ],
      },
    ],
  },

  // 仅管理员
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/admin',
            lazy: async () => {
              const { default: C } = await import('@/pages/admin/AdminPage');
              return { Component: C };
            },
          },
        ],
      },
    ],
  },
]);

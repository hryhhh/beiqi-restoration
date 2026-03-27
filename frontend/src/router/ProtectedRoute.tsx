import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface Props {
  /** 允许访问的角色列表，不传则只要登录即可 */
  roles?: UserRole[];
}

/** 路由权限守卫：未登录跳转登录页，角色不匹配显示 403 */
export default function ProtectedRoute({ roles }: Props) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-secondary">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">403</h1>
          <p>您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

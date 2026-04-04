import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import * as authApi from '@/api/auth';
import type { LoginRequest } from '@/types';

export function useAuth() {
  const { user, token, initialized, setAuth, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    setAuth(res.user, res.token);
    message.success('登录成功');
    navigate('/dashboard');
  }, [setAuth, navigate, message]);

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  return {
    user,
    token,
    initialized,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };
}

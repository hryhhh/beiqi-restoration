import { get, post } from './request';
import type { LoginRequest, LoginResponse, User } from '@/types';

/** 用户登录 */
export const login = (data: LoginRequest) => post<LoginResponse>('/auth/login', data);

/** 用户注册 */
export const register = (data: { username: string; email: string; password: string }) =>
  post<void>('/auth/register', data);

/** 请求密码重置 */
export const resetPassword = (email: string) =>
  post<void>('/auth/reset-password', { email });

/** 确认密码重置 */
export const confirmResetPassword = (data: { token: string; newPassword: string }) =>
  post<void>('/auth/reset-password/confirm', data);

/** 获取当前登录用户 */
export const getCurrentUser = () => get<User>('/auth/me');

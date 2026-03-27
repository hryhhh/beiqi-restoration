/** 用户角色 */
export type UserRole = 'admin' | 'chief_restorer' | 'assistant' | 'researcher' | 'reviewer';

/** 用户信息 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 登录响应 */
export interface LoginResponse {
  token: string;
  user: User;
}

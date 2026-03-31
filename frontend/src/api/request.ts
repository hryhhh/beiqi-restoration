import axios from 'axios';
import type { ApiResponse } from '@/types';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截：自动附加 JWT
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：统一错误处理
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 避免在登录页重复跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** 封装 GET 请求 */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await request.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

/** 封装 POST 请求 */
export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await request.post<ApiResponse<T>>(url, data);
  return res.data.data;
}

/** 封装 PUT 请求 */
export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await request.put<ApiResponse<T>>(url, data);
  return res.data.data;
}

/** 封装 DELETE 请求 */
export async function del<T>(url: string): Promise<T> {
  const res = await request.delete<ApiResponse<T>>(url);
  return res.data.data;
}

export default request;

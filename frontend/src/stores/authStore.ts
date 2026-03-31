import { create } from 'zustand';
import { getCurrentUser } from '@/api/auth';
import type { User } from '@/types';

/** localStorage 中存储用户信息的 key */
const USER_KEY = 'user';
const TOKEN_KEY = 'token';

/** 安全读取 localStorage 中的 user */
function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  initialized: boolean;
  initializing: boolean;
  /** 设置登录态 */
  setAuth: (user: User, token: string) => void;
  /** 清除登录态 */
  logout: () => void;
  /** 启动时恢复登录用户 */
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadUser(),
  token: localStorage.getItem(TOKEN_KEY),
  initialized: false,
  initializing: false,

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, initialized: true, initializing: false });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, initialized: true, initializing: false });
  },

  initAuth: async () => {
    const { token, initialized, initializing } = get();
    if (initialized || initializing) return;

    if (!token) {
      set({ initialized: true });
      return;
    }

    // 本地已有 user 缓存，先标记为已初始化（页面不会闪白）
    const cachedUser = get().user;
    if (cachedUser) {
      set({ initialized: true });
    }

    // 后台静默刷新用户信息，失败不影响当前会话
    set({ initializing: true });
    try {
      const user = await getCurrentUser();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, initialized: true, initializing: false });
    } catch {
      // 有缓存用户 → 保持登录态，不清 token（可能只是网络抖动）
      // 无缓存用户 → token 大概率无效，清除
      if (!cachedUser) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ user: null, token: null, initialized: true, initializing: false });
      } else {
        set({ initializing: false });
      }
    }
  },
}));

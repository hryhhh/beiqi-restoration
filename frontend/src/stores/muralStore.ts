import { create } from 'zustand';
import type { MuralRecord } from '@/types';
import * as muralApi from '@/api/mural';
import type { MuralListParams } from '@/api/mural';

interface MuralState {
  /** 壁画列表 */
  murals: MuralRecord[];
  /** 总数 */
  total: number;
  /** 加载状态 */
  loading: boolean;
  /** 当前筛选参数 */
  params: MuralListParams;
  /** 视图模式 */
  viewMode: 'list' | 'card';
  /** 设置筛选参数并重新加载 */
  setParams: (params: Partial<MuralListParams>) => void;
  /** 切换视图模式 */
  setViewMode: (mode: 'list' | 'card') => void;
  /** 加载壁画列表 */
  fetchMurals: () => Promise<void>;
}

export const useMuralStore = create<MuralState>((set, getState) => ({
  murals: [],
  total: 0,
  loading: false,
  params: { page: 1, pageSize: 12 },
  viewMode: 'card',

  setParams: (newParams) => {
    set((s) => ({ params: { ...s.params, ...newParams } }));
    getState().fetchMurals();
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  fetchMurals: async () => {
    set({ loading: true });
    try {
      const res = await muralApi.getMurals(getState().params);
      set({ murals: res.data || [], total: res.total || 0 });
    } catch {
      set({ murals: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },
}));

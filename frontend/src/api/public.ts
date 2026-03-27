import { get } from './request';
import type { MuralRecord } from '@/types';

/** 官网首页数据 */
export interface LandingData {
  featured: MuralRecord[];
  stats: {
    muralCount: number;
    projectCount: number;
    completedCount: number;
  };
}

/** 获取官网首页数据 */
export const getLanding = () => get<LandingData>('/public/landing');

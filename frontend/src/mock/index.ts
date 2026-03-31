/**
 * Mock 数据集合
 * 后端不可用或无数据时兜底展示，让前端页面不至于空白
 */

import type { MuralRecord, Project, RestorationPlan, KnowledgeDoc, User, AuditLog } from '@/types';
import type { DashboardSummary, ChartData } from '@/api/dashboard';

/* ====== 仪表盘 ====== */

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  pendingTasks: 12,
  inProgressProjects: 3,
  muralCount: 47,
};

export const MOCK_DASHBOARD_ALERTS: MuralRecord[] = [
  {
    id: 'mock-m1', name: '忻州九原岗北朝壁画（东壁）', era: '北齐', site: '九原岗',
    material: '石灰地仗', status: 'restoring', healthIndex: 32, isFeatured: false,
    images: [], createdAt: '2025-06-01', updatedAt: '2025-11-20',
  },
  {
    id: 'mock-m2', name: '太原娄睿墓骑行仪仗图', era: '北齐', site: '娄睿墓',
    material: '石灰地仗', status: 'assessing', healthIndex: 45, isFeatured: true,
    images: [], createdAt: '2025-03-15', updatedAt: '2025-10-08',
  },
  {
    id: 'mock-m3', name: '磁县湾漳大墓仪仗出行图', era: '北齐', site: '湾漳大墓',
    material: '白灰面', status: 'restoring', healthIndex: 28, isFeatured: false,
    images: [], createdAt: '2025-01-10', updatedAt: '2025-12-01',
  },
];

export const MOCK_DASHBOARD_CHARTS: ChartData = {
  statusDistribution: [
    { status: 'registered', count: 15 },
    { status: 'assessing', count: 8 },
    { status: 'restoring', count: 12 },
    { status: 'completed', count: 7 },
    { status: 'monitoring', count: 5 },
  ],
};

/** 最近警报 mock 数据 */
export interface RecentAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
}

export const MOCK_RECENT_ALERTS: RecentAlert[] = [
  { id: 'ra-1', level: 'critical', title: '紧急：磁县湾漳大墓', description: '健康指数下降30%', time: '2小时前' },
  { id: 'ra-2', level: 'warning', title: '警告：娄睿墓', description: '温度超限', time: '5小时前' },
  { id: 'ra-3', level: 'warning', title: '警告：九原岗东壁', description: '湿度异常波动', time: '1天前' },
  { id: 'ra-4', level: 'info', title: '提示：水泉梁壁画', description: '定期巡检到期', time: '2天前' },
];

/* ====== 壁画库 ====== */

export const MOCK_MURALS: MuralRecord[] = [
  {
    id: 'mock-m1', name: '忻州九原岗北朝壁画（东壁）', era: '北齐', site: '忻州九原岗',
    material: '石灰地仗', status: 'restoring', healthIndex: 32, isFeatured: true,
    images: [], createdAt: '2025-06-01', updatedAt: '2025-11-20',
  },
  {
    id: 'mock-m2', name: '太原娄睿墓骑行仪仗图', era: '北齐', site: '太原娄睿墓',
    material: '石灰地仗', status: 'assessing', healthIndex: 45, isFeatured: true,
    images: [], createdAt: '2025-03-15', updatedAt: '2025-10-08',
  },
  {
    id: 'mock-m3', name: '磁县湾漳大墓仪仗出行图', era: '北齐', site: '磁县湾漳',
    material: '白灰面', status: 'restoring', healthIndex: 28, isFeatured: false,
    images: [], createdAt: '2025-01-10', updatedAt: '2025-12-01',
  },
  {
    id: 'mock-m4', name: '太原徐显秀墓宴饮图', era: '北齐', site: '太原王家峰',
    material: '石灰地仗', status: 'completed', healthIndex: 88, isFeatured: true,
    images: [], createdAt: '2024-09-20', updatedAt: '2025-08-15',
  },
  {
    id: 'mock-m5', name: '朔州水泉梁壁画墓狩猎图', era: '北齐', site: '朔州水泉梁',
    material: '白灰面', status: 'monitoring', healthIndex: 72, isFeatured: false,
    images: [], createdAt: '2024-11-05', updatedAt: '2025-09-30',
  },
  {
    id: 'mock-m6', name: '太原北齐库狄回洛墓壁画', era: '北齐', site: '太原',
    material: '石灰地仗', status: 'registered', healthIndex: undefined, isFeatured: false,
    images: [], createdAt: '2025-12-01', updatedAt: '2025-12-01',
  },
];

/* ====== 修复项目 ====== */

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'mock-p1', name: '九原岗东壁壁画抢救性修复', description: '针对东壁大面积空鼓、起甲区域进行加固修复',
    status: 'in_progress', progress: 45, budget: 280000,
    startDate: '2025-09-01', createdAt: '2025-08-20', updatedAt: '2025-12-15',
  },
  {
    id: 'mock-p2', name: '娄睿墓壁画保护性修复', description: '骑行仪仗图颜料层脱落修复与封护处理',
    status: 'in_progress', progress: 72, budget: 150000,
    startDate: '2025-06-15', createdAt: '2025-06-01', updatedAt: '2025-11-28',
  },
  {
    id: 'mock-p3', name: '湾漳大墓壁画环境监测', description: '安装环境监测设备，建立长期监测体系',
    status: 'pending', progress: 0, budget: 95000,
    createdAt: '2025-11-10', updatedAt: '2025-11-10',
  },
  {
    id: 'mock-p4', name: '徐显秀墓宴饮图数字化保护', description: '高精度数字化采集与三维重建',
    status: 'completed', progress: 100, budget: 120000,
    startDate: '2025-01-10', endDate: '2025-07-30', createdAt: '2025-01-05', updatedAt: '2025-07-30',
  },
  {
    id: 'mock-p5', name: '水泉梁壁画揭取保护', description: '壁画揭取、转移及临时保护',
    status: 'in_progress', progress: 30, budget: 350000,
    startDate: '2025-10-01', createdAt: '2025-09-15', updatedAt: '2025-12-20',
  },
];

/* ====== 修复方案 ====== */

export const MOCK_PLANS: RestorationPlan[] = [
  {
    id: 'mock-pl1', annotationId: 'mock-a1',
    method: '采用注射灌浆法处理空鼓区域，使用改性环氧树脂进行渗透加固',
    materials: '改性环氧树脂、丙烯酸乳液、注射器、棉签',
    expectedResult: '空鼓区域完全回贴，壁画层与地仗层粘结牢固',
    status: 'approved', reviews: [], statusChanges: [],
    createdAt: '2025-09-10', updatedAt: '2025-10-05',
  },
  {
    id: 'mock-pl2', annotationId: 'mock-a2',
    method: '使用矿物颜料对褪色区域进行补色处理，采用点彩法逐步恢复',
    materials: '天然矿物颜料（朱砂、石青、石绿）、明胶水、毛笔',
    expectedResult: '褪色区域色彩恢复至接近原貌，与周围色调协调',
    status: 'pending', reviews: [], statusChanges: [],
    createdAt: '2025-11-20', updatedAt: '2025-11-20',
  },
  {
    id: 'mock-pl3', annotationId: 'mock-a3',
    method: '采用蒸汽清洗法去除壁面污染物，配合软毛刷轻柔清理',
    materials: '蒸馏水、蒸汽发生器、软毛刷、吸水纸',
    expectedResult: '壁面污染物清除率达90%以上，不损伤原有颜料层',
    status: 'in_progress', reviews: [], statusChanges: [],
    createdAt: '2025-10-15', updatedAt: '2025-12-01',
  },
  {
    id: 'mock-pl4', annotationId: 'mock-a4',
    method: '对龟裂区域进行边缘加固，使用Paraloid B-72溶液渗透封护',
    materials: 'Paraloid B-72、丙酮、注射器、日本纸',
    expectedResult: '裂缝边缘稳定，防止进一步扩展',
    status: 'draft', reviews: [], statusChanges: [],
    createdAt: '2025-12-10', updatedAt: '2025-12-10',
  },
];

/* ====== 知识库 ====== */

export const MOCK_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'mock-k1', title: '北物保护工程数据留痕要求',
    content: '# 数据留痕要求\n\n大程操作可追溯、图像与日志双归档、问题意见可审计...',
    category: 'regulation', createdAt: '2026-03-22', updatedAt: '2026-03-22',
  },
  {
    id: 'mock-k2', title: '娄睿墓壁画蓝保护案例复盘',
    content: '# 案例负责 本案涉27 万民居族、起甲回修壁画和复原流程...',
    category: 'case_study', createdAt: '2026-03-19', updatedAt: '2026-03-19',
  },
  {
    id: 'mock-k3', title: '修复材料兼容性清单',
    content: '# 修复材料兼容性：改性环氧树脂粘 · 丙烯酸乳液 · 无机硅酸盐材 > 使用前需做微件...',
    category: 'material_manual', createdAt: '2026-03-15', updatedAt: '2026-03-15',
  },
  {
    id: 'mock-k4', title: '北齐壁画加固流程（现场版）',
    content: '# 北齐壁画加固流程\n1. 病害分级与编码统规 2. 小样测与参数确认 3. 分区注射与表层整固 4. 复测与回访...',
    category: 'standard_process', createdAt: '2026-03-11', updatedAt: '2026-03-11',
  },
  {
    id: 'mock-k5', title: '壁画病害分类与评估标准',
    content: '## 病害分类体系\n\n### 一、结构类病害\n- 空鼓：壁画层与支撑体之间出现分离\n- 起甲：颜料层翘起、卷曲...',
    category: 'standard_process', createdAt: '2025-06-01', updatedAt: '2025-10-25',
  },
  {
    id: 'mock-k6', title: '九原岗壁画揭取保护纪实',
    content: '## 发现经过\n\n2013年，忻州市九原岗发现一座大型北朝壁画墓...',
    category: 'case_study', createdAt: '2025-07-15', updatedAt: '2025-11-30',
  },
];

/* ====== 管理后台 ====== */

export const MOCK_USERS: User[] = [
  { id: 'mock-u1', username: '张修复', email: 'zhang@example.com', role: 'chief_restorer', createdAt: '2025-01-15', updatedAt: '2025-01-15' },
  { id: 'mock-u2', username: '李研究', email: 'li@example.com', role: 'researcher', createdAt: '2025-02-20', updatedAt: '2025-02-20' },
  { id: 'mock-u3', username: '王审核', email: 'wang@example.com', role: 'reviewer', createdAt: '2025-03-10', updatedAt: '2025-03-10' },
  { id: 'mock-u4', username: '赵助理', email: 'zhao@example.com', role: 'assistant', createdAt: '2025-04-05', updatedAt: '2025-04-05' },
  { id: 'mock-u5', username: '管理员', email: 'admin@example.com', role: 'admin', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'mock-l1', userId: 'mock-u1', action: 'create', targetType: 'mural', targetId: 'mock-m1', ipAddress: '192.168.1.100', createdAt: '2025-12-20T10:30:00Z', user: MOCK_USERS[0] },
  { id: 'mock-l2', userId: 'mock-u2', action: 'update', targetType: 'annotation', targetId: 'mock-a1', ipAddress: '192.168.1.101', createdAt: '2025-12-19T14:20:00Z', user: MOCK_USERS[1] },
  { id: 'mock-l3', userId: 'mock-u3', action: 'review', targetType: 'plan', targetId: 'mock-pl1', ipAddress: '192.168.1.102', createdAt: '2025-12-18T09:15:00Z', user: MOCK_USERS[2] },
  { id: 'mock-l4', userId: 'mock-u5', action: 'update_role', targetType: 'user', targetId: 'mock-u4', ipAddress: '192.168.1.1', createdAt: '2025-12-17T16:45:00Z', user: MOCK_USERS[4] },
  { id: 'mock-l5', userId: 'mock-u1', action: 'upload', targetType: 'image', targetId: 'mock-img1', ipAddress: '192.168.1.100', createdAt: '2025-12-16T11:00:00Z', user: MOCK_USERS[0] },
];

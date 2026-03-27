import type { DamageType } from '@/types';

/** 病害类型分类映射 */
export const DAMAGE_TYPE_MAP: Record<DamageType, { label: string; category: string }> = {
  // 结构类
  detachment: { label: '空鼓', category: '结构类' },
  flaking: { label: '起甲', category: '结构类' },
  salt_efflorescence: { label: '酥碱', category: '结构类' },
  cracking: { label: '龟裂/裂缝', category: '结构类' },
  // 表面类
  pigment_loss: { label: '颜料层脱落', category: '表面类' },
  fading: { label: '褪色/变色', category: '表面类' },
  soiling: { label: '壁面污染', category: '表面类' },
  // 生物类
  mold: { label: '霉斑/菌害', category: '生物类' },
  insect_damage: { label: '昆虫/动物危害', category: '生物类' },
  root_damage: { label: '植物根系破坏', category: '生物类' },
};

/** 严重程度选项 */
export const SEVERITY_OPTIONS = [
  { value: 1, label: '1级 - 轻微' },
  { value: 2, label: '2级 - 较轻' },
  { value: 3, label: '3级 - 中度' },
  { value: 4, label: '4级 - 较重' },
  { value: 5, label: '5级 - 严重' },
] as const;

/** 修复流程七阶段 */
export const RESTORATION_PHASES = [
  '现状调查与评估',
  '病害机理分析',
  '清洗/去污',
  '加固',
  '补色/全色',
  '封护',
  '监测与验收',
] as const;

/** 壁画状态映射 */
export const MURAL_STATUS_MAP = {
  registered: '已登记',
  assessing: '评估中',
  restoring: '修复中',
  completed: '已完成',
  monitoring: '监测中',
} as const;

/** 项目状态映射 */
export const PROJECT_STATUS_MAP = {
  pending: '待评估',
  in_progress: '修复中',
  completed: '已完成',
} as const;

/** 任务状态映射 */
export const TASK_STATUS_MAP = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
} as const;

/** 方案状态映射 */
export const PLAN_STATUS_MAP = {
  draft: '草稿',
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  in_progress: '执行中',
  completed: '已完成',
} as const;

/** 用户角色映射 */
export const USER_ROLE_MAP = {
  admin: '管理员',
  chief_restorer: '首席修复师',
  assistant: '助理修复师',
  researcher: '研究员',
  reviewer: '审核员',
} as const;

/** 知识库文档分类映射 */
export const DOC_CATEGORY_MAP = {
  standard_process: '标准流程',
  material_manual: '材料手册',
  case_study: '案例库',
  regulation: '法规文件',
} as const;

/** 图像类型映射 */
export const IMAGE_TYPE_MAP = {
  visible: '可见光',
  infrared: '红外',
  ultraviolet: '紫外',
  restored: '修复后',
} as const;

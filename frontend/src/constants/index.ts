import type { DamageType } from '@/types';

export const DAMAGE_TYPE_MAP: Record<DamageType, { label: string; category: string }> = {
  detachment: { label: '空鼓', category: '结构类' },
  flaking: { label: '起甲', category: '结构类' },
  salt_efflorescence: { label: '盐碱', category: '结构类' },
  cracking: { label: '龟裂/裂缝', category: '结构类' },
  pigment_loss: { label: '颜料层脱落', category: '表面类' },
  fading: { label: '褪色/变色', category: '表面类' },
  soiling: { label: '壁面污染', category: '表面类' },
  mold: { label: '霉斑/菌害', category: '生物类' },
  insect_damage: { label: '昆虫/动物危害', category: '生物类' },
  root_damage: { label: '植物根系破坏', category: '生物类' },
};

export const SEVERITY_OPTIONS = [
  { value: 1, label: '1级 - 轻微' },
  { value: 2, label: '2级 - 较轻' },
  { value: 3, label: '3级 - 中度' },
  { value: 4, label: '4级 - 较重' },
  { value: 5, label: '5级 - 严重' },
] as const;

export const RESTORATION_PHASES = [
  '现状调查与评估',
  '病害机理分析',
  '清洗/去污',
  '加固',
  '补色/全色',
  '封护',
  '监测与验收',
] as const;

export const MURAL_STATUS_MAP = {
  registered: '已登记',
  assessing: '评估中',
  restoring: '修复中',
  completed: '已完成',
  monitoring: '监测中',
} as const;

export const PROJECT_STATUS_MAP = {
  pending: '待评估',
  in_progress: '修复中',
  completed: '已完成',
} as const;

export const TASK_STATUS_MAP = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
} as const;

export const PLAN_STATUS_MAP = {
  draft: '草稿',
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  in_progress: '执行中',
  completed: '已完成',
} as const;

export const USER_ROLE_MAP = {
  admin: '管理员',
  chief_restorer: '首席修复师',
  assistant: '助理修复师',
  researcher: '研究员',
  reviewer: '审核员',
} as const;

export const DOC_CATEGORY_MAP = {
  standard_process: '标准流程',
  material_manual: '材料手册',
  case_study: '案例库',
  regulation: '法规文件',
} as const;

export const IMAGE_TYPE_MAP = {
  visible: '可见光',
  infrared: '红外',
  ultraviolet: '紫外',
  restored: '修复后',
} as const;

export const ASSET_TYPE_MAP = {
  model: '3D模型',
  panorama: '全景图',
} as const;

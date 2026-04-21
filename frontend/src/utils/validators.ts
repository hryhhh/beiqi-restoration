import { z } from 'zod';
import type { RestorationPreflightInput } from '@/types';

/** 壁画状态枚举 */
const muralStatusSchema = z.enum([
  'registered', 'assessing', 'restoring', 'completed', 'monitoring',
]);

/** 壁画记录校验 Schema — 对标后端 ValidateMuralJSON */
export const muralSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  era: z.string().min(1, '年代不能为空'),
  site: z.string().min(1, '出土地点不能为空'),
  material: z.string().min(1, '材质不能为空'),
  tombLocation: z.string().optional(),
  excavationDate: z.string().optional(),
  dimensions: z.string().optional(),
  description: z.string().optional(),
  status: muralStatusSchema.optional(),
  healthIndex: z.number().min(0, '健康指数必须在 0-100 之间').max(100, '健康指数必须在 0-100 之间').optional(),
  isFeatured: z.boolean().optional(),
});

/** 壁画表单输入类型 */
export type MuralFormData = z.infer<typeof muralSchema>;

/** 标注坐标 Schema */
const coordinatesSchema = z.object({
  type: z.enum(['polygon', 'rect', 'path']),
  points: z.array(z.array(z.number()).min(2)).min(1, '至少需要一个坐标点'),
});

/** 病害类型枚举 */
const damageTypeSchema = z.enum([
  'detachment', 'flaking', 'salt_efflorescence', 'cracking',
  'pigment_loss', 'fading', 'soiling',
  'mold', 'insect_damage', 'root_damage',
]);

/** 病害标注校验 Schema */
export const annotationSchema = z.object({
  muralId: z.string().min(1, '壁画 ID 不能为空'),
  imageLayer: z.enum(['visible', 'infrared', 'ultraviolet', 'restored']),
  damageType: damageTypeSchema,
  severity: z.number().int().min(1, '严重程度最低为 1').max(5, '严重程度最高为 5'),
  coordinates: coordinatesSchema,
  description: z.string().optional(),
});

/** 标注表单输入类型 */
export type AnnotationFormData = z.infer<typeof annotationSchema>;

export const restorationParametersSchema = z.object({
  restorationStrength: z.number().min(0).max(100),
  cleaningLevel: z.number().min(0).max(100),
  colorRecovery: z.number().min(0).max(100),
  detailPreservation: z.number().min(0).max(100),
  crackRepairBias: z.number().min(0).max(100),
  structureClosure: z.number().min(0).max(100),
  structureFill: z.number().min(0).max(100),
  edgeBlend: z.number().min(0).max(100),
  stainRemoval: z.number().min(0).max(100),
  moldSuppression: z.number().min(0).max(100),
  saltReduction: z.number().min(0).max(100),
  toneCorrection: z.number().min(0).max(100),
  localColorRepair: z.number().min(0).max(100),
  textureRebuild: z.number().min(0).max(100),
  outputPreference: z.enum(['clarity', 'fidelity']),
  randomness: z.number().min(0).max(100),
});

export function getRestorationSubmitError(input: RestorationPreflightInput): string | null {
  if (!input.muralId) return '请先选择壁画';
  if (!input.hasSourceImage) return '请先上传待修复原图';
  if (input.mode === 'partial' && input.annotationIds.length === 0 && !input.manualSelection) {
    return '局部精修需要至少一条已有标注或一个手动选区';
  }
  return null;
}

/**
 * 校验壁画 JSON 数据，返回字段级错误信息
 * 对标后端 ValidateMuralJSON 的行为
 */
export function validateMuralJSON(data: unknown): { field: string; message: string }[] | null {
  const result = muralSchema.safeParse(data);
  if (result.success) return null;

  return result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '_json',
    message: issue.message,
  }));
}

import type { DamageAnnotation, AnnotationCoordinates, DamageType } from '@/types';
import type { ImageType } from '@/types';

/** 格式化用的标注文本结构 */
export interface AnnotationText {
  id: string;
  damageType: string;
  severity: number;
  imageLayer: string;
  coordinates: AnnotationCoordinates;
  areaPercent?: number;
  description?: string;
}

/** 坐标值四舍五入到四位小数 */
function roundCoord(v: number): number {
  return Math.round(v * 10000) / 10000;
}

/**
 * 将标注数据格式化为可读文本
 * 格式与后端 FormatAnnotation 保持一致
 */
export function formatAnnotation(a: AnnotationText): string {
  const lines: string[] = [];

  // 第一行：基本信息
  lines.push(`[${a.id}] 病害类型:${a.damageType} | 严重程度:${a.severity} | 图层:${a.imageLayer}`);

  // 第二行：区域类型
  lines.push(`区域类型:${a.coordinates.type}`);

  // 第三行：坐标点（精度四位小数）
  const points = a.coordinates.points
    .filter((p) => p.length >= 2)
    .map((p) => `(${roundCoord(p[0]).toFixed(4)},${roundCoord(p[1]).toFixed(4)})`)
    .join(', ');
  lines.push(`坐标点: ${points}`);

  // 第四行：面积占比
  if (a.areaPercent != null) {
    lines.push(`面积占比: ${a.areaPercent.toFixed(2)}%`);
  }

  // 第五行：描述
  if (a.description) {
    lines.push(`描述: ${a.description}`);
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * 解析格式化文本为标注数据
 * 格式与后端 ParseAnnotation 保持一致
 */
export function parseAnnotation(text: string): AnnotationText {
  const trimmed = text.trim().replace(/---$/, '').trim();
  const lines = trimmed.split('\n');

  if (lines.length < 3) {
    throw new Error('标注文本格式无效：至少需要 3 行');
  }

  const result: AnnotationText = {
    id: '',
    damageType: '',
    severity: 0,
    imageLayer: '',
    coordinates: { type: 'polygon', points: [] },
  };

  // 解析第一行：[ID] 病害类型:xxx | 严重程度:N | 图层:xxx
  const line1 = lines[0].trim();
  const idEnd = line1.indexOf(']');
  if (!line1.startsWith('[') || idEnd < 0) {
    throw new Error('第一行格式无效：缺少标注 ID');
  }
  result.id = line1.slice(1, idEnd);

  const rest = line1.slice(idEnd + 1);
  for (const part of rest.split('|')) {
    const sep = part.indexOf(':');
    if (sep < 0) continue;
    const key = part.slice(0, sep).trim();
    const val = part.slice(sep + 1).trim();
    switch (key) {
      case '病害类型':
        result.damageType = val;
        break;
      case '严重程度':
        result.severity = parseInt(val, 10);
        if (isNaN(result.severity)) throw new Error('严重程度解析失败');
        break;
      case '图层':
        result.imageLayer = val;
        break;
    }
  }

  // 解析剩余行
  for (const raw of lines.slice(1)) {
    const line = raw.trim();
    if (line.startsWith('区域类型:')) {
      result.coordinates.type = line.slice('区域类型:'.length) as AnnotationCoordinates['type'];
    } else if (line.startsWith('坐标点:')) {
      result.coordinates.points = parsePoints(line.slice('坐标点:'.length).trim());
    } else if (line.startsWith('面积占比:')) {
      const pctStr = line.slice('面积占比:'.length).trim().replace(/%$/, '');
      const f = parseFloat(pctStr);
      if (!isNaN(f)) result.areaPercent = f;
    } else if (line.startsWith('描述:')) {
      const desc = line.slice('描述:'.length).trim();
      if (desc) result.description = desc;
    }
  }

  return result;
}

/** 解析坐标点字符串，如 "(0.1234,0.5678), (0.9012,0.3456)" */
function parsePoints(s: string): number[][] {
  const matches = s.matchAll(/\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g);
  const points: number[][] = [];
  for (const m of matches) {
    points.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  return points;
}

/**
 * 从 DamageAnnotation 转换为 AnnotationText
 * 方便直接传入 formatAnnotation
 */
export function toAnnotationText(a: DamageAnnotation): AnnotationText {
  return {
    id: a.id,
    damageType: a.damageType,
    severity: a.severity,
    imageLayer: a.imageLayer,
    coordinates: a.coordinates,
    areaPercent: a.areaPercent,
    description: a.description,
  };
}

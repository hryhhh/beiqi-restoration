import type { AnnotationCoordinates } from '@/types';

export interface CoordinateBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * 将坐标裁剪到 [0, 1] 范围内（原地修改）
 * 对标后端 domain/geometry.go 的 ClampCoordinates
 */
export function clampCoordinates(coords: AnnotationCoordinates): void {
  for (const point of coords.points) {
    for (let j = 0; j < point.length; j++) {
      if (point[j] < 0) point[j] = 0;
      else if (point[j] > 1) point[j] = 1;
    }
  }
}

/**
 * 使用 Shoelace 公式计算多边形面积
 * 坐标为 [0,1] 范围内的相对坐标，返回值也是相对面积
 * 对标后端 domain/geometry.go 的 PolygonArea
 */
export function polygonArea(points: number[][]): number {
  const n = points.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (points[i].length >= 2 && points[j].length >= 2) {
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
  }

  return Math.abs(area) / 2;
}

/**
 * 计算面积百分比
 * 对标后端 domain/geometry.go 的 AreaPercent
 */
export function areaPercent(area: number): number {
  return area * 100;
}

export function getCoordinateBounds(points: number[][]): CoordinateBounds | null {
  if (points.length === 0) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (point.length < 2) continue;
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

export async function imageUrlToFile(imageUrl: string, filename: string): Promise<File> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

import type { AnnotationCoordinates } from '@/types';

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

export function getCoordinateBounds(points: number[][]) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export async function imageUrlToFile(imageUrl: string, filename: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

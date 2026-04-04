import type { AnnotationCoordinates, DamageAnnotation, DamageType } from '@/types';

const DAMAGE_COLORS: Record<DamageType, string> = {
  detachment: '#e74c3c',
  flaking: '#e67e22',
  salt_efflorescence: '#f1c40f',
  cracking: '#9b59b6',
  pigment_loss: '#3498db',
  fading: '#1abc9c',
  soiling: '#95a5a6',
  mold: '#27ae60',
  insect_damage: '#d35400',
  root_damage: '#2c3e50',
};

interface Props {
  coordinates: DamageAnnotation['coordinates'];
  damageType: DamageType;
  selected?: boolean;
}

function parseCoordinates(raw: DamageAnnotation['coordinates']): AnnotationCoordinates | null {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || !Array.isArray(parsed.points)) return null;
    return {
      type: parsed.type,
      points: parsed.points.map((point: number[]) => [point[0], point[1]]),
    };
  } catch {
    return null;
  }
}

function normalizeRectPoints(points: number[][]): [[number, number], [number, number]] {
  const [p1, p2] = points;
  const minX = Math.min(p1[0], p2[0]);
  const minY = Math.min(p1[1], p2[1]);
  const maxX = Math.max(p1[0], p2[0]);
  const maxY = Math.max(p1[1], p2[1]);
  return [[minX, minY], [maxX, maxY]];
}

function getOutlinePoints(coords: AnnotationCoordinates): number[][] {
  if (coords.type === 'rect' && coords.points.length >= 2) {
    const [tl, br] = normalizeRectPoints(coords.points);
    return [
      [tl[0], tl[1]],
      [br[0], tl[1]],
      [br[0], br[1]],
      [tl[0], br[1]],
    ];
  }
  return coords.points;
}

function getBounds(points: number[][]) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function isPointInsidePolygon(point: [number, number], polygon: number[][]) {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, prev = polygon.length - 1; index < polygon.length; prev = index++) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[prev];
    const intersects = ((yi > point[1]) !== (yj > point[1]))
      && (point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function buildMatrixDots(points: number[][]) {
  if (!points.length) return [] as number[][];
  const { minX, maxX, minY, maxY } = getBounds(points);
  const width = Math.max(maxX - minX, 0.001);
  const height = Math.max(maxY - minY, 0.001);
  const columns = Math.max(2, Math.min(5, Math.round(width * 10) + 1));
  const rows = Math.max(2, Math.min(5, Math.round(height * 10) + 1));
  const dots: number[][] = [];

  for (let x = 1; x <= columns; x += 1) {
    for (let y = 1; y <= rows; y += 1) {
      const dot: [number, number] = [
        minX + (width * x) / (columns + 1),
        minY + (height * y) / (rows + 1),
      ];
      if (isPointInsidePolygon(dot, points)) {
        dots.push(dot);
      }
    }
  }

  return dots;
}

export default function AnnotationGeometryPreview({
  coordinates,
  damageType,
  selected = false,
}: Props) {
  const parsed = parseCoordinates(coordinates);
  const color = DAMAGE_COLORS[damageType] || '#8b5e3c';

  if (!parsed || !parsed.points.length) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#d8ccb6] bg-[#fcfaf6] text-[10px] text-text-light">
        N/A
      </div>
    );
  }

  const outlinePoints = getOutlinePoints(parsed);
  const dots = buildMatrixDots(outlinePoints);
  const { minX, maxX, minY, maxY } = getBounds(outlinePoints);
  const padding = 10;
  const size = 80;
  const mapX = (value: number) => padding + value * size;
  const mapY = (value: number) => padding + value * size;
  const polygonPoints = outlinePoints.map((point) => `${mapX(point[0])},${mapY(point[1])}`).join(' ');

  return (
    <div className={`h-24 w-24 shrink-0 rounded-2xl border px-1 py-1 ${selected ? 'border-primary/35 bg-primary/5' : 'border-[#eadfce] bg-[#fcfaf6]'}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x="6" y="6" width="88" height="88" rx="14" fill={selected ? `${color}14` : '#fffaf2'} stroke="#eadfce" />
        {Array.from({ length: 4 }).map((_, row) => (
          Array.from({ length: 4 }).map((__, col) => (
            <circle
              key={`grid-${row}-${col}`}
              cx={18 + col * 20}
              cy={18 + row * 20}
              r="1.2"
              fill="#d8ccb6"
              opacity="0.55"
            />
          ))
        ))}
        <rect
          x={mapX(minX)}
          y={mapY(minY)}
          width={Math.max((maxX - minX) * size, 4)}
          height={Math.max((maxY - minY) * size, 4)}
          rx="4"
          fill="none"
          stroke={color}
          strokeDasharray="5 4"
          strokeWidth={selected ? 2.4 : 1.8}
        />
        {parsed.type === 'rect' && parsed.points.length >= 2 ? (
          <rect
            x={mapX(minX)}
            y={mapY(minY)}
            width={Math.max((maxX - minX) * size, 4)}
            height={Math.max((maxY - minY) * size, 4)}
            rx="4"
            fill={`${color}18`}
            stroke={selected ? '#ffffff' : color}
            strokeWidth={selected ? 2.8 : 2}
          />
        ) : (
          <polygon
            points={polygonPoints}
            fill={`${color}18`}
            stroke={selected ? '#ffffff' : color}
            strokeWidth={selected ? 2.8 : 2}
          />
        )}
        {dots.map((point, index) => (
          <circle
            key={`dot-${index}`}
            cx={mapX(point[0])}
            cy={mapY(point[1])}
            r={selected ? 2.3 : 1.9}
            fill={color}
            opacity={selected ? '0.88' : '0.72'}
          />
        ))}
        {outlinePoints.map((point, index) => (
          <circle
            key={`handle-${index}`}
            cx={mapX(point[0])}
            cy={mapY(point[1])}
            r={selected ? 3.6 : 3.1}
            fill="#fffdf9"
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

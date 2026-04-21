import type { AnnotationCoordinates, RestorationParameters, RestorationResult } from '@/types';
import { getCoordinateBounds } from '@/utils/imageUtils';

type SelectionBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function shouldFallbackToRestorationMock(error: unknown): boolean {
  const candidate = error as { code?: string; response?: { status?: number } };
  return candidate.code === 'ECONNABORTED'
    || candidate.response?.status === 404
    || candidate.response?.status === 501
    || !candidate.response;
}

export function buildVariantParameters(
  base: RestorationParameters,
  variantIndex: number,
): RestorationParameters {
  const delta = (variantIndex + 1) * 3;

  return {
    ...base,
    restorationStrength: clamp(base.restorationStrength + delta),
    colorRecovery: clamp(base.colorRecovery + 2),
    detailPreservation: clamp(base.detailPreservation - 1),
    randomness: clamp(base.randomness + delta),
  };
}

export function resolveSelectionBounds(
  annotationShapes: AnnotationCoordinates[],
  manualSelection: AnnotationCoordinates | null,
): SelectionBounds | null {
  if (manualSelection) {
    return getCoordinateBounds(manualSelection.points);
  }

  const allPoints = annotationShapes.flatMap((shape) => shape.points);
  return allPoints.length ? getCoordinateBounds(allPoints) : null;
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('failed_to_load_image'));
    image.src = source;
  });
}

function applyMockProcessing(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  parameters: RestorationParameters,
  bounds: SelectionBounds | null,
) {
  const brightness = (parameters.restorationStrength - 50) * 0.6;
  const saturation = parameters.colorRecovery / 100;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const normalizedX = x / width;
      const normalizedY = y / height;
      const inSelection = !bounds
        || (normalizedX >= bounds.minX && normalizedX <= bounds.maxX
          && normalizedY >= bounds.minY && normalizedY <= bounds.maxY);

      if (!inSelection) continue;

      const offset = (y * width + x) * 4;
      data[offset] = Math.min(255, data[offset] + brightness);
      data[offset + 1] = Math.min(255, data[offset + 1] + brightness);
      data[offset + 2] = Math.min(255, data[offset + 2] + brightness * 0.8 + saturation * 8);
    }
  }
}

export async function generateMockRestoration(payload: {
  sourceImageUrl: string;
  parameters: RestorationParameters;
  annotationShapes: AnnotationCoordinates[];
  manualSelection: AnnotationCoordinates | null;
  variantBase: { id: string } | null;
}): Promise<RestorationResult> {
  const effectiveParameters = payload.variantBase
    ? buildVariantParameters(payload.parameters, payload.variantBase.id.length)
    : payload.parameters;
  const image = await loadImage(payload.sourceImageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('failed_to_create_canvas_context');
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const bounds = resolveSelectionBounds(payload.annotationShapes, payload.manualSelection);
  applyMockProcessing(imageData.data, canvas.width, canvas.height, effectiveParameters, bounds);
  context.putImageData(imageData, 0, 0);

  return {
    id: `mock-${Date.now()}`,
    imageUrl: canvas.toDataURL('image/png'),
    isMock: true,
    createdAt: new Date().toISOString(),
    parametersSnapshot: effectiveParameters,
    sourceType: payload.variantBase ? 'variant' : 'primary',
  };
}

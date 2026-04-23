import type { AnnotationCoordinates, RestorationParameters, RestorationResult } from '@/types';
import { getCoordinateBounds, type CoordinateBounds } from '@/utils/imageUtils';

const MAX_PROCESSING_DIMENSION = 1600;

const NUMERIC_PARAMETER_KEYS: Array<keyof Omit<RestorationParameters, 'outputPreference'>> = [
  'restorationStrength',
  'cleaningLevel',
  'colorRecovery',
  'detailPreservation',
  'crackRepairBias',
  'structureClosure',
  'structureFill',
  'edgeBlend',
  'stainRemoval',
  'moldSuppression',
  'saltReduction',
  'toneCorrection',
  'localColorRepair',
  'textureRebuild',
  'randomness',
];

function clamp0to100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function shouldFallbackToRestorationMock(error: unknown): boolean {
  const normalized = error as { code?: string; response?: { status?: number } };

  if (normalized.code === 'ECONNABORTED') return true;

  const status = normalized.response?.status;
  if (status === 404 || status === 501) return true;
  if (status === 403) return false;

  return normalized.code === 'ERR_NETWORK' || normalized.code === 'ENOTFOUND';
}

export function buildVariantParameters(base: RestorationParameters, variantIndex: number): RestorationParameters {
  const next: RestorationParameters = {
    ...base,
    outputPreference: base.outputPreference,
  };

  NUMERIC_PARAMETER_KEYS.forEach((key, idx) => {
    const baseValue = base[key];
    const wave = Math.sin((variantIndex + 1) * (idx + 1));
    const bias = (variantIndex % 3) - 1;
    const delta = wave * 7 + bias * 2;
    next[key] = clamp0to100(baseValue + delta);
  });

  next.randomness = clamp0to100(Math.max(base.randomness + 1, next.randomness + 2 + variantIndex));
  return next;
}

export function resolveSelectionBounds(
  annotationShapes: AnnotationCoordinates[],
  manualSelection: AnnotationCoordinates | null,
): CoordinateBounds | null {
  if (manualSelection) {
    return getCoordinateBounds(manualSelection.points);
  }

  let merged: CoordinateBounds | null = null;
  for (const shape of annotationShapes) {
    const bounds = getCoordinateBounds(shape.points);
    if (!bounds) continue;
    if (!merged) {
      merged = bounds;
      continue;
    }
    merged = {
      minX: Math.min(merged.minX, bounds.minX),
      minY: Math.min(merged.minY, bounds.minY),
      maxX: Math.max(merged.maxX, bounds.maxX),
      maxY: Math.max(merged.maxY, bounds.maxY),
    };
  }

  return merged;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load source image'));
    img.src = src;
  });
}

async function normalizeImageSourceUrl(sourceImageUrl: string): Promise<{
  safeUrl: string;
  cleanup: (() => void) | null;
}> {
  if (sourceImageUrl.startsWith('data:') || sourceImageUrl.startsWith('blob:')) {
    return { safeUrl: sourceImageUrl, cleanup: null };
  }

  const response = await fetch(sourceImageUrl, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to fetch source image: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  return {
    safeUrl: objectUrl,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

function deriveVariantIndex(variantBase: RestorationResult): number {
  const seed = `${variantBase.id}|${variantBase.createdAt}|${variantBase.imageUrl}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }

  return (Math.abs(hash) % 17) + 1;
}

function applyRegionEnhancement(
  data: Uint8ClampedArray,
  parameters: RestorationParameters,
): void {
  const strength = parameters.restorationStrength / 100;
  const warmShift = parameters.toneCorrection / 100;
  const saturationBoost = parameters.colorRecovery / 100;
  const contrast = 1 + parameters.detailPreservation / 250;
  const brightnessOffset = parameters.cleaningLevel / 8 - 6;

  for (let offset = 0; offset < data.length; offset += 4) {
    let r = data[offset];
    let g = data[offset + 1];
    let b = data[offset + 2];

    r = (r - 128) * contrast + 128 + brightnessOffset + warmShift * 8;
    g = (g - 128) * contrast + 128 + brightnessOffset;
    b = (b - 128) * contrast + 128 + brightnessOffset - warmShift * 6;

    const avg = (r + g + b) / 3;
    r = avg + (r - avg) * (1 + saturationBoost * 0.35);
    g = avg + (g - avg) * (1 + saturationBoost * 0.28);
    b = avg + (b - avg) * (1 + saturationBoost * 0.2);

    const grain = (Math.sin(offset * 0.01 + parameters.randomness) * 1.5 + 1.5) * strength;
    data[offset] = clamp0to100(r / 2.55) * 2.55 + grain;
    data[offset + 1] = clamp0to100(g / 2.55) * 2.55 + grain * 0.5;
    data[offset + 2] = clamp0to100(b / 2.55) * 2.55;
  }
}

export async function generateMockRestoration(payload: {
  sourceImageUrl: string;
  parameters: RestorationParameters;
  annotationShapes: AnnotationCoordinates[];
  manualSelection: AnnotationCoordinates | null;
  variantBase: RestorationResult | null;
}): Promise<RestorationResult> {
  const effectiveParameters = payload.variantBase
    ? buildVariantParameters(payload.parameters, deriveVariantIndex(payload.variantBase))
    : payload.parameters;
  const { safeUrl, cleanup } = await normalizeImageSourceUrl(payload.sourceImageUrl);

  try {
    const image = await loadImage(safeUrl);
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const scale = Math.min(1, MAX_PROCESSING_DIMENSION / Math.max(sourceWidth, sourceHeight));
    const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
    const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable');
    }

    context.drawImage(image, 0, 0, outputWidth, outputHeight);

    const selection = resolveSelectionBounds(payload.annotationShapes, payload.manualSelection);
    const target = selection ?? { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    const x = Math.floor(clamp0to100(target.minX * 100) * canvas.width / 100);
    const y = Math.floor(clamp0to100(target.minY * 100) * canvas.height / 100);
    const maxX = Math.ceil(clamp0to100(target.maxX * 100) * canvas.width / 100);
    const maxY = Math.ceil(clamp0to100(target.maxY * 100) * canvas.height / 100);
    const width = Math.max(1, maxX - x);
    const height = Math.max(1, maxY - y);

    const imageData = context.getImageData(x, y, width, height);
    applyRegionEnhancement(imageData.data, effectiveParameters);
    context.putImageData(imageData, x, y);

    return {
      id: `mock-${Date.now()}`,
      imageUrl: canvas.toDataURL('image/png'),
      isMock: true,
      createdAt: new Date().toISOString(),
      parametersSnapshot: effectiveParameters,
      sourceType: payload.variantBase ? 'variant' : 'primary',
    };
  } finally {
    cleanup?.();
  }
}

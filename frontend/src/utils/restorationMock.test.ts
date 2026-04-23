import { describe, expect, it } from 'vitest';
import type { AnnotationCoordinates, RestorationParameters } from '@/types';
import {
  buildVariantParameters,
  resolveSelectionBounds,
  shouldFallbackToRestorationMock,
} from '@/utils/restorationMock';

const baseParameters: RestorationParameters = {
  restorationStrength: 60,
  cleaningLevel: 50,
  colorRecovery: 55,
  detailPreservation: 70,
  crackRepairBias: 45,
  structureClosure: 50,
  structureFill: 50,
  edgeBlend: 40,
  stainRemoval: 50,
  moldSuppression: 30,
  saltReduction: 25,
  toneCorrection: 55,
  localColorRepair: 45,
  textureRebuild: 50,
  outputPreference: 'fidelity',
  randomness: 12,
};

describe('restoration mock helpers', () => {
  it('keeps variant parameters inside the 0-100 range', () => {
    const variant = buildVariantParameters(baseParameters, 3);
    expect(variant.restorationStrength).toBeGreaterThanOrEqual(0);
    expect(variant.restorationStrength).toBeLessThanOrEqual(100);
    expect(variant.randomness).toBeGreaterThan(baseParameters.randomness);
  });

  it('prefers manual selection bounds when manual selection exists', () => {
    const manualSelection: AnnotationCoordinates = {
      type: 'rect',
      points: [[0.2, 0.3], [0.6, 0.75]],
    };

    expect(resolveSelectionBounds([], manualSelection)).toEqual({
      minX: 0.2,
      minY: 0.3,
      maxX: 0.6,
      maxY: 0.75,
    });
  });

  it('ignores malformed annotation points when resolving selection bounds', () => {
    expect(resolveSelectionBounds([
      {
        type: 'polygon',
        points: [[0.1], [0.25, 0.35]],
      },
      {
        type: 'polygon',
        points: [[0.6, 0.7], [0.8, 0.9]],
      },
    ], null)).toEqual({
      minX: 0.25,
      minY: 0.35,
      maxX: 0.8,
      maxY: 0.9,
    });
  });

  it('falls back for not-implemented and timeout responses', () => {
    expect(shouldFallbackToRestorationMock({ response: { status: 501 } })).toBe(true);
    expect(shouldFallbackToRestorationMock({ code: 'ECONNABORTED' })).toBe(true);
    expect(shouldFallbackToRestorationMock({ response: { status: 403 } })).toBe(false);
  });
});

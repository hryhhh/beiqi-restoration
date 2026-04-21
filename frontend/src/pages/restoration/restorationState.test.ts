import { describe, expect, it } from 'vitest';
import type { AnnotationCoordinates, RestorationResult } from '@/types';
import {
  buildSaveFileName,
  createInitialRestorationParameters,
  getStartDisabledReason,
  resetSessionForMuralChange,
  selectRestorationResult,
} from '@/pages/restoration/restorationState';

describe('restoration page state', () => {
  it('blocks partial mode without any selected range', () => {
    expect(getStartDisabledReason({
      muralId: 'mural-1',
      sourceImageUrl: 'blob:preview',
      mode: 'partial',
      selectedAnnotationIds: [],
      manualSelection: null,
    })).toBe('局部精修需要至少一条已有标注或一个手动选区');
  });

  it('clears uploaded image and results when the mural changes', () => {
    const manualSelection: AnnotationCoordinates = {
      type: 'rect',
      points: [[0.1, 0.1], [0.3, 0.3]],
    };
    const next = resetSessionForMuralChange({
      sourceImageUrl: 'blob:preview',
      selectedAnnotationIds: ['ann-1'],
      manualSelection,
      currentResultId: 'result-1',
      variantCount: 2,
    });

    expect(next.sourceImageUrl).toBe('');
    expect(next.selectedAnnotationIds).toEqual([]);
    expect(next.manualSelection).toBeNull();
    expect(next.currentResultId).toBeNull();
    expect(next.variantCount).toBe(0);
  });

  it('creates a png save filename', () => {
    expect(buildSaveFileName('mural-1', new Date('2026-04-21T09:30:00Z'))).toBe('restoration-mural-1-1776763800000.png');
  });

  it('returns stable default parameters', () => {
    expect(createInitialRestorationParameters().outputPreference).toBe('fidelity');
  });

  it('switches the active result to the clicked variant', () => {
    const primary: RestorationResult = {
      id: 'primary-1',
      imageUrl: 'data:image/png;base64,primary',
      isMock: true,
      createdAt: '2026-04-21T10:00:00Z',
      parametersSnapshot: createInitialRestorationParameters(),
      sourceType: 'primary',
    };
    const variant: RestorationResult = {
      ...primary,
      id: 'variant-2',
      imageUrl: 'data:image/png;base64,variant',
      sourceType: 'variant',
    };

    expect(selectRestorationResult(primary, [variant], 'variant-2')?.id).toBe('variant-2');
  });
});

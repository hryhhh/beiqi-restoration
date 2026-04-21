import { describe, expect, it } from 'vitest';
import { getRestorationSubmitError, restorationParametersSchema } from '@/utils/validators';

describe('restoration validation', () => {
  it('accepts a valid default parameter payload', () => {
    expect(restorationParametersSchema.parse({
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
    }).outputPreference).toBe('fidelity');
  });

  it('requires a selected region in partial mode', () => {
    expect(getRestorationSubmitError({
      muralId: 'mural-1',
      hasSourceImage: true,
      mode: 'partial',
      annotationIds: [],
      manualSelection: null,
    })).toBe('局部精修需要至少一条已有标注或一个手动选区');
  });
});

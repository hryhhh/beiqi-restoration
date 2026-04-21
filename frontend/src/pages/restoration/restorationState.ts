import type {
  AnnotationCoordinates,
  RestorationMode,
  RestorationParameters,
  RestorationResult,
} from '@/types';
import { getRestorationSubmitError } from '@/utils/validators';

export function createInitialRestorationParameters(): RestorationParameters {
  return {
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
}

export function getStartDisabledReason(input: {
  muralId?: string;
  sourceImageUrl: string;
  mode: RestorationMode;
  selectedAnnotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
}) {
  return getRestorationSubmitError({
    muralId: input.muralId,
    hasSourceImage: !!input.sourceImageUrl,
    mode: input.mode,
    annotationIds: input.selectedAnnotationIds,
    manualSelection: input.manualSelection,
  });
}

export function resetSessionForMuralChange(previous: {
  sourceImageUrl: string;
  selectedAnnotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
  currentResultId: string | null;
  variantCount: number;
}) {
  return {
    ...previous,
    sourceImageUrl: '',
    selectedAnnotationIds: [],
    manualSelection: null,
    currentResultId: null,
    variantCount: 0,
  };
}

export function buildSaveFileName(muralId: string, now: Date) {
  return `restoration-${muralId}-${now.getTime()}.png`;
}

export function selectRestorationResult(
  current: RestorationResult | null,
  variants: RestorationResult[],
  targetId: string,
) {
  if (current?.id === targetId) {
    return current;
  }

  return variants.find((item) => item.id === targetId) || current;
}

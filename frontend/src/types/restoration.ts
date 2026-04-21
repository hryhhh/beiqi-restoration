import type { AnnotationCoordinates } from './annotation';

export type RestorationMode = 'full' | 'partial';

export interface RestorationParameters {
  restorationStrength: number;
  cleaningLevel: number;
  colorRecovery: number;
  detailPreservation: number;
  crackRepairBias: number;
  structureClosure: number;
  structureFill: number;
  edgeBlend: number;
  stainRemoval: number;
  moldSuppression: number;
  saltReduction: number;
  toneCorrection: number;
  localColorRepair: number;
  textureRebuild: number;
  outputPreference: 'clarity' | 'fidelity';
  randomness: number;
}

export interface RestorationResult {
  id: string;
  imageUrl: string;
  isMock: boolean;
  createdAt: string;
  parametersSnapshot: RestorationParameters;
  sourceType: 'primary' | 'variant';
}

export interface RestorationPreflightInput {
  muralId?: string;
  hasSourceImage: boolean;
  mode: RestorationMode;
  annotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
}

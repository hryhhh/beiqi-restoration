import type { AnnotationCoordinates } from './annotation';
import type { MuralImage } from './mural';

export type RestorationMode = 'full' | 'partial';
export type RestorationRunStatus = 'succeeded' | 'failed';
export type RestorationSourceType = 'primary' | 'variant';

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
  runId?: string;
  parentResultId?: string | null;
  imagePath?: string;
  imageUrl: string;
  imageHash?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  isMock: boolean;
  providerName?: string;
  createdAt: string;
  parametersSnapshot: RestorationParameters;
  sourceType: RestorationSourceType;
  committedMuralImageId?: string | null;
}

export interface RestorationRun {
  id: string;
  muralId: string;
  mode: RestorationMode;
  sourceImagePath: string;
  sourceImageUrl: string;
  sourceImageHash: string;
  sourceImageWidth: number;
  sourceImageHeight: number;
  sourceImageSize: number;
  parametersSnapshot: RestorationParameters;
  annotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
  status: RestorationRunStatus;
  latestResultId?: string | null;
  committedResultId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestorationRunDetail {
  run: RestorationRun;
  results: RestorationResult[];
  currentResult: RestorationResult | null;
  variants: RestorationResult[];
  sourceImageUrl: string;
}

export interface RestorationCommitResponse {
  run: RestorationRun;
  result: RestorationResult;
  muralImage: MuralImage;
}

export interface RestorationPreflightInput {
  muralId?: string;
  hasSourceImage: boolean;
  mode: RestorationMode;
  annotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
}

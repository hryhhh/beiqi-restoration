import { post } from './request';
import type {
  AnnotationCoordinates,
  RestorationMode,
  RestorationParameters,
  RestorationResult,
} from '@/types';
import {
  generateMockRestoration,
  shouldFallbackToRestorationMock,
} from '@/utils/restorationMock';

export interface GenerateRestorationPayload {
  muralId: string;
  mode: RestorationMode;
  sourceImageUrl: string;
  parameters: RestorationParameters;
  annotationShapes: AnnotationCoordinates[];
  annotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
  variantBase: RestorationResult | null;
}

export async function generateRestoration(
  payload: GenerateRestorationPayload,
): Promise<RestorationResult> {
  try {
    return await post<RestorationResult>('/restoration/generate', payload);
  } catch (error) {
    if (!shouldFallbackToRestorationMock(error)) {
      throw error;
    }

    return generateMockRestoration(payload);
  }
}

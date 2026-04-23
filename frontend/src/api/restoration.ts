import { get, post } from './request';
import type {
  AnnotationCoordinates,
  MuralImage,
  RestorationCommitResponse,
  RestorationRun,
  RestorationRunDetail,
  RestorationMode,
  RestorationParameters,
  RestorationResult,
} from '@/types';

interface RawRestorationRun {
  id: string;
  muralId: string;
  mode: RestorationMode;
  sourceImagePath: string;
  sourceImageHash: string;
  sourceImageWidth: number;
  sourceImageHeight: number;
  sourceImageSize: number;
  parametersSnapshot: RestorationParameters;
  annotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
  status: 'succeeded' | 'failed';
  latestResultId?: string | null;
  committedResultId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface RawRestorationResult {
  id: string;
  runId?: string;
  parentResultId?: string | null;
  sourceType: 'primary' | 'variant';
  imagePath: string;
  imageHash: string;
  width: number;
  height: number;
  fileSize: number;
  parametersSnapshot: RestorationParameters;
  isMock: boolean;
  providerName: string;
  committedMuralImageId?: string | null;
  createdAt: string;
}

interface RawRestorationRunDetail {
  run: RawRestorationRun;
  results: RawRestorationResult[];
  currentResult?: RawRestorationResult | null;
  variants: RawRestorationResult[];
}

export interface CreateRestorationRunPayload {
  muralId: string;
  mode: RestorationMode;
  sourceFile: File;
  parameters: RestorationParameters;
  annotationIds: string[];
  manualSelection: AnnotationCoordinates | null;
}

function toUploadUrl(path?: string | null) {
  if (!path) {
    return '';
  }
  if (/^(blob:|data:|https?:)/.test(path)) {
    return path;
  }
  return `/uploads/${path.replace(/^\/+/, '')}`;
}

function mapRestorationRun(raw: RawRestorationRun): RestorationRun {
  return {
    ...raw,
    sourceImageUrl: toUploadUrl(raw.sourceImagePath),
  };
}

function mapRestorationResult(raw: RawRestorationResult): RestorationResult {
  return {
    id: raw.id,
    runId: raw.runId,
    parentResultId: raw.parentResultId,
    imagePath: raw.imagePath,
    imageUrl: toUploadUrl(raw.imagePath),
    imageHash: raw.imageHash,
    width: raw.width,
    height: raw.height,
    fileSize: raw.fileSize,
    isMock: raw.isMock,
    providerName: raw.providerName,
    createdAt: raw.createdAt,
    parametersSnapshot: raw.parametersSnapshot,
    sourceType: raw.sourceType,
    committedMuralImageId: raw.committedMuralImageId,
  };
}

function mapRestorationRunDetail(raw: RawRestorationRunDetail): RestorationRunDetail {
  const run = mapRestorationRun(raw.run);
  const results = raw.results.map(mapRestorationResult);
  const currentResult = raw.currentResult
    ? mapRestorationResult(raw.currentResult)
    : results.find((item) => item.id === run.latestResultId) || null;

  return {
    run,
    results,
    currentResult,
    variants: raw.variants.map(mapRestorationResult),
    sourceImageUrl: run.sourceImageUrl,
  };
}

export async function createRestorationRun(
  payload: CreateRestorationRunPayload,
): Promise<RestorationRunDetail> {
  const formData = new FormData();
  formData.append('file', payload.sourceFile);
  formData.append('payload', JSON.stringify({
    muralId: payload.muralId,
    mode: payload.mode,
    parameters: payload.parameters,
    annotationIds: payload.annotationIds,
    manualSelection: payload.manualSelection,
  }));

  const response = await post<RawRestorationRunDetail>('/restoration/runs', formData);
  return mapRestorationRunDetail(response);
}

export async function listRestorationRuns(
  muralId: string,
  limit = 20,
): Promise<RestorationRun[]> {
  const response = await get<RawRestorationRun[]>('/restoration/runs', { muralId, limit });
  return response.map(mapRestorationRun);
}

export async function getRestorationRun(runId: string): Promise<RestorationRunDetail> {
  const response = await get<RawRestorationRunDetail>(`/restoration/runs/${runId}`);
  return mapRestorationRunDetail(response);
}

export async function createRestorationVariant(
  runId: string,
  baseResultId: string,
): Promise<RestorationRunDetail> {
  const response = await post<RawRestorationRunDetail>(`/restoration/runs/${runId}/variants`, {
    baseResultId,
  });
  return mapRestorationRunDetail(response);
}

export async function commitRestorationResult(
  resultId: string,
): Promise<RestorationCommitResponse> {
  const response = await post<{
    run: RawRestorationRun;
    result: RawRestorationResult;
    muralImage: MuralImage;
  }>(`/restoration/results/${resultId}/commit`);

  return {
    run: mapRestorationRun(response.run),
    result: mapRestorationResult(response.result),
    muralImage: response.muralImage,
  }
}

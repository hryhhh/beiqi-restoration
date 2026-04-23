import type { MuralImage, MuralRecord } from '@/types';
import { MOCK_MURALS } from '@/mock';

export type ShowcaseDetailState = 'ready' | 'unavailable' | 'missing';

export interface ShowcaseCardPreview {
  id: string;
  name: string;
  era: string;
  summary: string;
  imageSrc: string | null;
}

export interface ShowcaseDisplayMurals {
  murals: MuralRecord[];
  usingFallback: boolean;
}

const SHOWCASE_PLACEHOLDER = '暂无内容';

export function getShowcaseImageSrc(filePath?: string): string | null {
  if (!filePath) {
    return null;
  }

  if (filePath.startsWith('/') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  return `/uploads/${filePath}`;
}

export function getRestoredImages(mural: Pick<MuralRecord, 'images'>): MuralImage[] {
  return mural.images.filter((image) => image.imageType === 'restored');
}

export function getPrimaryVisibleImage(mural: Pick<MuralRecord, 'images'>): MuralImage | null {
  return mural.images.find((image) => image.imageType === 'visible') ?? null;
}

export function getPrimaryRestoredImage(mural: Pick<MuralRecord, 'images'>): MuralImage | null {
  return getRestoredImages(mural)[0] ?? null;
}

export function getSecondaryRestoredImage(mural: Pick<MuralRecord, 'images'>): MuralImage | null {
  const restoredImages = getRestoredImages(mural);
  return restoredImages[1] ?? restoredImages[0] ?? null;
}

export function getShowcaseText(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || SHOWCASE_PLACEHOLDER;
}

export function getShowcaseDetailState(mural?: Pick<MuralRecord, 'status'> | null): ShowcaseDetailState {
  if (!mural) {
    return 'missing';
  }

  return mural.status === 'completed' ? 'ready' : 'unavailable';
}

export function buildShowcaseCardPreview(
  mural: Pick<MuralRecord, 'id' | 'name' | 'era' | 'popularIntroduction' | 'images'>,
): ShowcaseCardPreview {
  return {
    id: mural.id,
    name: mural.name,
    era: mural.era,
    summary: getShowcaseText(mural.popularIntroduction),
    imageSrc: getShowcaseImageSrc(getPrimaryRestoredImage(mural)?.filePath),
  };
}

export function getShowcaseFallbackMurals(): MuralRecord[] {
  return MOCK_MURALS.filter((mural) => mural.status === 'completed');
}

export function getShowcaseFallbackMural(id?: string): MuralRecord | null {
  if (!id) {
    return null;
  }

  return getShowcaseFallbackMurals().find((mural) => mural.id === id) ?? null;
}

function hasShowcaseNarratives(mural: MuralRecord): boolean {
  return Boolean(
    mural.popularIntroduction?.trim()
    && mural.historicalBackground?.trim()
    && mural.artisticFeatures?.trim()
    && mural.culturalSignificance?.trim(),
  );
}

export function isCompleteShowcaseMural(mural: MuralRecord): boolean {
  return mural.status === 'completed' && hasShowcaseNarratives(mural) && getPrimaryRestoredImage(mural) !== null;
}

export function getShowcaseDisplayMurals(murals: MuralRecord[]): ShowcaseDisplayMurals {
  const completedMurals = murals.filter((mural) => mural.status === 'completed');
  const completeMurals = completedMurals.filter(isCompleteShowcaseMural);

  if (completeMurals.length) {
    return { murals: completeMurals, usingFallback: false };
  }

  const fallbackMurals = getShowcaseFallbackMurals();
  return { murals: fallbackMurals, usingFallback: fallbackMurals.length > 0 };
}

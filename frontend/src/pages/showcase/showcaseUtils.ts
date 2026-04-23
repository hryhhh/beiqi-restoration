import type { MuralImage, MuralRecord } from '@/types';

export type ShowcaseDetailState = 'ready' | 'unavailable' | 'missing';

export interface ShowcaseCardPreview {
  id: string;
  name: string;
  era: string;
  summary: string;
  imageSrc: string | null;
}

const SHOWCASE_PLACEHOLDER = '暂无内容';

function toUploadSrc(filePath?: string): string | null {
  return filePath ? `/uploads/${filePath}` : null;
}

export function getRestoredImages(mural: Pick<MuralRecord, 'images'>): MuralImage[] {
  return mural.images.filter((image) => image.imageType === 'restored');
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
    imageSrc: toUploadSrc(getPrimaryRestoredImage(mural)?.filePath),
  };
}

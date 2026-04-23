import { describe, expect, it } from 'vitest';
import type { MuralImage, MuralRecord } from '@/types';
import {
  buildShowcaseCardPreview,
  getPrimaryRestoredImage,
  getRestoredImages,
  getSecondaryRestoredImage,
  getShowcaseDetailState,
  getShowcaseText,
} from '@/pages/showcase/showcaseUtils';

function createImage(id: string, imageType: MuralImage['imageType'], filePath: string): MuralImage {
  return {
    id,
    muralId: 'mural-1',
    filePath,
    fileHash: `hash-${id}`,
    imageType,
    version: 1,
    width: 1280,
    height: 720,
    fileSize: 2048,
    createdAt: '2026-04-23T08:00:00Z',
  };
}

function createMural(images: MuralImage[], overrides: Partial<MuralRecord> = {}): MuralRecord {
  return {
    id: 'mural-1',
    name: '北齐仪仗图',
    era: '北齐',
    site: '太原',
    material: '石灰地仗',
    status: 'completed',
    isFeatured: false,
    images,
    createdAt: '2026-04-23T08:00:00Z',
    updatedAt: '2026-04-23T08:00:00Z',
    ...overrides,
  };
}

describe('showcase utils', () => {
  it('keeps restored images in api order and picks primary/secondary images', () => {
    const mural = createMural([
      createImage('visible-1', 'visible', 'murals/mural-1/visible-1.png'),
      createImage('restored-1', 'restored', 'murals/mural-1/restored-1.png'),
      createImage('restored-2', 'restored', 'murals/mural-1/restored-2.png'),
    ]);

    expect(getRestoredImages(mural).map((image) => image.id)).toEqual(['restored-1', 'restored-2']);
    expect(getPrimaryRestoredImage(mural)?.id).toBe('restored-1');
    expect(getSecondaryRestoredImage(mural)?.id).toBe('restored-2');
  });

  it('falls back to the primary restored image when only one restored image exists', () => {
    const mural = createMural([
      createImage('restored-1', 'restored', 'murals/mural-1/restored-1.png'),
    ]);

    expect(getSecondaryRestoredImage(mural)?.id).toBe('restored-1');
  });

  it('normalizes blank showcase text to the default placeholder', () => {
    expect(getShowcaseText('   ')).toBe('暂无内容');
  });

  it('marks non-completed murals as unavailable in the detail guard', () => {
    expect(getShowcaseDetailState(createMural([], { status: 'restoring' }))).toBe('unavailable');
    expect(getShowcaseDetailState(null)).toBe('missing');
  });

  it('builds stable card preview data from the first restored image and summary text', () => {
    const preview = buildShowcaseCardPreview(createMural(
      [createImage('restored-1', 'restored', 'murals/mural-1/restored-1.png')],
      { popularIntroduction: '  墓主人车马出行与礼仪场景。  ' },
    ));

    expect(preview).toEqual({
      id: 'mural-1',
      name: '北齐仪仗图',
      era: '北齐',
      summary: '墓主人车马出行与礼仪场景。',
      imageSrc: '/uploads/murals/mural-1/restored-1.png',
    });
  });
});

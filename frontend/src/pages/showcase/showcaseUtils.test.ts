import { describe, expect, it } from 'vitest';
import type { MuralImage, MuralRecord } from '@/types';
import {
  buildShowcaseCardPreview,
  getShowcaseDisplayMurals,
  getShowcaseFallbackMural,
  getShowcaseFallbackMurals,
  getShowcaseImageSrc,
  getPrimaryRestoredImage,
  getPrimaryVisibleImage,
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

  it('provides completed mock murals as fallback showcase data', () => {
    const fallbackMurals = getShowcaseFallbackMurals();
    const preview = buildShowcaseCardPreview(fallbackMurals[0]);
    const beforeImage = getPrimaryVisibleImage(fallbackMurals[0]);
    const afterImage = getPrimaryRestoredImage(fallbackMurals[0]);

    expect(fallbackMurals.length).toBeGreaterThan(0);
    expect(fallbackMurals.every((mural) => mural.status === 'completed')).toBe(true);
    expect(fallbackMurals[0].popularIntroduction).toContain('修复');
    expect(beforeImage?.fileHash).toBe('mock-before-image');
    expect(afterImage?.fileHash).toBe('mock-after-image');
    expect(preview.imageSrc).toBeTruthy();
    expect(preview.imageSrc).not.toMatch(/^\/uploads\//);
  });

  it('maps the demo comparison assets into the intended before and after slots', () => {
    const fallbackMural = getShowcaseFallbackMural('mock-m4');
    const beforeImage = fallbackMural ? getPrimaryVisibleImage(fallbackMural) : null;
    const afterImage = fallbackMural ? getPrimaryRestoredImage(fallbackMural) : null;

    expect(beforeImage?.filePath).toContain('after.jpg');
    expect(afterImage?.filePath).toContain('before.jpg');
  });

  it('keeps frontend asset image paths without prefixing uploads', () => {
    expect(getShowcaseImageSrc('/src/assets/images/after.jpg')).toBe('/src/assets/images/after.jpg');
    expect(getShowcaseImageSrc('murals/mural-1/restored.jpg')).toBe('/uploads/murals/mural-1/restored.jpg');
  });

  it('finds only completed fallback murals for detail routes', () => {
    expect(getShowcaseFallbackMural('mock-m4')?.status).toBe('completed');
    expect(getShowcaseFallbackMural('mock-m1')).toBeNull();
  });

  it('uses fallback showcase data when api murals are incomplete for demo display', () => {
    const result = getShowcaseDisplayMurals([
      createMural([], {
        popularIntroduction: '有文字但没有修复后图片',
        historicalBackground: '历史背景',
        artisticFeatures: '艺术特点',
        culturalSignificance: '文化意义',
      }),
    ]);

    expect(result.usingFallback).toBe(true);
    expect(result.murals[0].id).toBe('mock-m4');
  });

  it('keeps complete api murals instead of fallback showcase data', () => {
    const mural = createMural(
      [createImage('restored-1', 'restored', 'murals/mural-1/restored-1.png')],
      {
        popularIntroduction: '通俗化介绍',
        historicalBackground: '历史背景',
        artisticFeatures: '艺术特点',
        culturalSignificance: '文化意义',
      },
    );

    const result = getShowcaseDisplayMurals([mural]);

    expect(result.usingFallback).toBe(false);
    expect(result.murals).toEqual([mural]);
  });
});

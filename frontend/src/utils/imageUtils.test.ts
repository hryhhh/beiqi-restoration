import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCoordinateBounds, imageUrlToFile } from '@/utils/imageUtils';

describe('image utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no valid coordinate pairs exist', () => {
    expect(getCoordinateBounds([])).toBeNull();
    expect(getCoordinateBounds([[0.2], [0.4]])).toBeNull();
  });

  it('ignores malformed points when calculating coordinate bounds', () => {
    expect(getCoordinateBounds([[0.1], [0.25, 0.35], [0.8, 0.9]])).toEqual({
      minX: 0.25,
      minY: 0.35,
      maxX: 0.8,
      maxY: 0.9,
    });
  });

  it('throws when the source image request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      blob: vi.fn(),
    }));

    await expect(imageUrlToFile('https://example.com/source.png', 'source.png')).rejects.toThrow(
      'Failed to fetch image: 502',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { canAccessRestoration, getSelectedMenuKey } from '@/layouts/navigation';

describe('restoration navigation', () => {
  it('maps nested restoration paths back to the restoration menu key', () => {
    expect(getSelectedMenuKey('/restoration/detail/mock')).toBe('/restoration');
  });

  it('maps nested showcase paths back to the showcase menu key', () => {
    expect(getSelectedMenuKey('/showcase/abc-123')).toBe('/showcase');
  });

  it('hides the restoration entry from reviewers', () => {
    expect(canAccessRestoration('reviewer')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { canAccessRestoration, getSelectedMenuKey } from '@/layouts/navigation';

describe('restoration navigation', () => {
  it('maps nested restoration paths back to the restoration menu key', () => {
    expect(getSelectedMenuKey('/restoration/detail/mock')).toBe('/restoration');
  });

  it('hides the restoration entry from reviewers', () => {
    expect(canAccessRestoration('reviewer')).toBe(false);
  });
});

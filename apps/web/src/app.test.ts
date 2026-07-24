import { describe, expect, it } from 'vitest';
import { assessTokenIdentity } from '@cronos-launchpad/core';
import { launches } from './mockData';

describe('launchpad web model', () => {
  it('uses shared anti-vamp rules for launch form preflight', () => {
    const result = assessTokenIdentity({ name: 'Crojack Protocol', symbol: 'CROJACK2' }, launches);
    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('DUPLICATE_NAME');
  });
});

import { describe, expect, it } from 'vitest';
import { assessTokenIdentity } from '@cronos-launchpad/core';
import { getLaunches } from './data/api';
import { prepareCreateTokenTx } from './contracts/launchpadClient';

describe('launchpad web model', () => {
  it('uses shared anti-vamp rules for launch form preflight', () => {
    const result = assessTokenIdentity({ name: 'Crojack Protocol', symbol: 'CROJACK2' }, getLaunches());
    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('DUPLICATE_NAME');
  });

  it('prepares deterministic create-token calldata', () => {
    const tx = prepareCreateTokenTx({ name: 'Cronos Vault', symbol: 'CVLT', graduationTargetCro: '65000', initialBuyCro: '250', antiBotEnabled: true });
    expect(tx.data.startsWith('0x')).toBe(true);
    expect(tx.value).toBe(250000000000000000000n);
    expect(tx.ready).toBe(false);
  });
});

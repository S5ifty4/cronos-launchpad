import { describe, expect, it } from 'vitest';
import { assessTokenIdentity } from '@cronos-launchpad/core';
import { getLaunches } from './data/api';
import { prepareCreateTokenTx } from './contracts/launchpadClient';
import { cronosTestnet, vvsTestnetContracts } from './wallet/chains';
import { normalizeSocialPlatform } from './components/SocialLinks';

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
    expect(tx.args).toHaveLength(12);
  });

  it('uses official Cronos testnet and VVS testnet addresses', () => {
    expect(cronosTestnet.id).toBe(338);
    expect(cronosTestnet.rpcUrls).toContain('https://evm-t3.cronos.org/');
    expect(cronosTestnet.blockExplorerUrls).toContain('https://explorer.cronos.org/testnet');
    expect(vvsTestnetContracts.smartRouter).toBe('0xC74C960708f043E04a84038c6D1136EA7Fcb16a1');
    expect(vvsTestnetContracts.wcro).toBe('0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4');
  });

  it('normalizes social labels to icon platforms', () => {
    expect(normalizeSocialPlatform('X')).toBe('x');
    expect(normalizeSocialPlatform('Web')).toBe('website');
    expect(normalizeSocialPlatform('Discord')).toBe('discord');
    expect(normalizeSocialPlatform('Telegram')).toBe('telegram');
  });
});

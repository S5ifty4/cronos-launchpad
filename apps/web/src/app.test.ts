import { describe, expect, it } from 'vitest';
import { assessTokenIdentity } from '@cronos-launchpad/core';
import { toFunctionSelector } from 'viem';
import { launchpadFactoryAbi } from './contracts/abis';
import { getLaunches } from './data/api';
import { prepareCreateTokenTx } from './contracts/launchpadClient';
import { envAddress } from './contracts/addresses';
import { cronosTestnet, vvsTestnetContracts } from './wallet/chains';
import { cronosTestnetChain, walletConnectProjectId } from './wallet/reown';
import { normalizeSocialPlatform } from './components/SocialLinks';
import { filterLaunches } from './data/exploreFilters';

describe('launchpad web model', () => {
  it('uses shared anti-vamp rules for launch form preflight', () => {
    const result = assessTokenIdentity({ name: 'Crojack Protocol', symbol: 'CROJACK2' }, getLaunches());
    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('DUPLICATE_NAME');
  });

  it('prepares deterministic create-token calldata', () => {
    const tx = prepareCreateTokenTx({ name: 'Cronos Vault', symbol: 'CVLT', graduationTargetCro: '65000', initialBuyCro: '250', antiBotEnabled: true });
    expect(tx.data.startsWith('0x')).toBe(true);
    expect(tx.data.slice(0, 10)).toBe('0xd928a6db');
    expect(tx.value).toBe(250000000000000000000n);
    expect(tx.ready).toBe(false);
    expect(tx.args).toHaveLength(12);
    const noAntiSnipe = prepareCreateTokenTx({ name: 'Cronos Vault', symbol: 'CVLT', graduationTargetCro: '65000', initialBuyCro: '250', antiBotEnabled: false });
    expect(noAntiSnipe.args[6]).toBe(false);
  });

  it('keeps frontend create-token ABI selector aligned with deployed contract signature', () => {
    const createToken = launchpadFactoryAbi.find((entry) => entry.type === 'function' && entry.name === 'createToken');
    expect(createToken).toBeTruthy();
    expect(toFunctionSelector(createToken!)).toBe('0xd928a6db');
    expect(createToken!.inputs.at(-1)?.type).toBe('uint64');
  });

  it('keeps create-token tx disabled until required transaction fields are valid', () => {
    const blank = prepareCreateTokenTx({ name: '', symbol: '', graduationTargetCro: '', initialBuyCro: '', antiBotEnabled: true });
    expect(blank.ready).toBe(false);
    expect(blank.missing).toEqual(expect.arrayContaining(['token name', 'symbol', 'graduation target', 'wallet address']));
    const invalidNumber = prepareCreateTokenTx({ name: 'Cronut', symbol: 'CRONUT', graduationTargetCro: 'abc', initialBuyCro: '0', antiBotEnabled: true });
    expect(invalidNumber.ready).toBe(false);
    expect(invalidNumber.missing).toContain('graduation target');
  });

  it('trims env-loaded contract addresses', () => {
    expect(envAddress('0xb39452a805657c6aaef5d804934d44c814f35906\n')).toBe('0xb39452a805657c6aaef5d804934d44c814f35906');
    expect(envAddress('')).toBeUndefined();
  });

  it('uses official Cronos testnet and VVS testnet addresses', () => {
    expect(cronosTestnet.id).toBe(338);
    expect(cronosTestnet.rpcUrls).toContain('https://evm-t3.cronos.org/');
    expect(cronosTestnet.blockExplorerUrls).toContain('https://explorer.cronos.org/testnet');
    expect(vvsTestnetContracts.smartRouter).toBe('0xC74C960708f043E04a84038c6D1136EA7Fcb16a1');
    expect(vvsTestnetContracts.wcro).toBe('0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4');
  });

  it('configures Reown/wagmi for CronosForge on Cronos testnet', () => {
    expect(cronosTestnetChain.id).toBe(338);
    expect(cronosTestnetChain.rpcUrls.default.http).toContain('https://evm-t3.cronos.org/');
    expect(walletConnectProjectId).toBeTruthy();
  });

  it('normalizes social labels to icon platforms', () => {
    expect(normalizeSocialPlatform('X')).toBe('x');
    expect(normalizeSocialPlatform('Web')).toBe('website');
    expect(normalizeSocialPlatform('Discord')).toBe('discord');
    expect(normalizeSocialPlatform('Telegram')).toBe('telegram');
  });

  it('filters launch board results by tab and search query', () => {
    const launches = getLaunches();
    expect(filterLaunches(launches, { tab: 'near', query: '' }).every((launch) => launch.status === 'Near graduation')).toBe(true);
    expect(filterLaunches(launches, { tab: 'graduated', query: '' }).every((launch) => launch.status === 'Graduated')).toBe(true);
    expect(filterLaunches(launches, { tab: 'no-tax', query: '' }).every((launch) => launch.taxBips === 0)).toBe(true);
    expect(filterLaunches(launches, { tab: 'all', query: 'discord' }).some((launch) => launch.socials.includes('Discord'))).toBe(true);
  });
});

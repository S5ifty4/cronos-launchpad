import { describe, expect, it } from 'vitest';
import { assessTokenIdentity } from '@cronos-launchpad/core';
import { toEventSelector, toFunctionSelector } from 'viem';
import { launchpadFactoryAbi } from './contracts/abis';
import { getLaunches } from './data/api';
import { prepareBuyContributionTx, prepareCreateTokenTx } from './contracts/launchpadClient';
import { envAddress } from './contracts/addresses';
import { cronosMainnet, cronosTestnet, explorerTxUrl, vvsTestnetContracts } from './wallet/chains';
import { cronosTestnetChain, walletConnectProjectId } from './wallet/reown';
import { normalizeSocialPlatform, normalizeSocialUrl } from './components/SocialLinks';
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
    expect(tx.data.slice(0, 10)).toBe('0x9300c4ea');
    expect(tx.value).toBe(250000000000000000000n);
    expect(tx.ready).toBe(false);
    expect(tx.args).toHaveLength(13);
    const noAntiSnipe = prepareCreateTokenTx({ name: 'Cronos Vault', symbol: 'CVLT', graduationTargetCro: '65000', initialBuyCro: '250', antiBotEnabled: false });
    expect(noAntiSnipe.args[6]).toBe(false);
  });

  it('keeps frontend create-token ABI selector aligned with deployed contract signature', () => {
    const createToken = launchpadFactoryAbi.find((entry) => entry.type === 'function' && entry.name === 'createToken');
    expect(createToken).toBeTruthy();
    expect(toFunctionSelector(createToken!)).toBe('0x9300c4ea');
    expect(createToken!.inputs.at(-1)?.type).toBe('uint64');
  });

  it('keeps frontend/indexer event ABIs aligned with the Phase 2 factory events', () => {
    const tokenCreated = launchpadFactoryAbi.find((entry) => entry.type === 'event' && entry.name === 'TokenCreated');
    const tokenGraduated = launchpadFactoryAbi.find((entry) => entry.type === 'event' && entry.name === 'TokenGraduated');
    expect(tokenCreated).toBeTruthy();
    expect(tokenGraduated).toBeTruthy();
    expect(toEventSelector(tokenCreated!)).toBe('0xf5df120b25da30621a33445bb577a65225a029cdc4329befc8f5873126d5b7f6');
    expect(tokenCreated!.inputs.map((input) => input.name)).toEqual(expect.arrayContaining(['vvsRouter', 'wrappedNative', 'lpBeneficiary', 'lpLockDurationSeconds']));
    expect(toEventSelector(tokenGraduated!)).toBe('0x2ae869ce430af477a9263f765314cd542b5fb53fcb524d62aec5fa82e9cf865f');
    expect(tokenGraduated!.inputs.map((input) => input.name)).toEqual(expect.arrayContaining(['creator', 'vvsRouter', 'reserveRaisedWei', 'tokenLiquidity', 'liquidity', 'lpUnlocksAt']));
  });

  it('prepares real buy contribution calldata for the launch factory', () => {
    const buy = launchpadFactoryAbi.find((entry) => entry.type === 'function' && entry.name === 'buy');
    expect(buy).toBeTruthy();
    expect(toFunctionSelector(buy!)).toBe('0xf088d547');
    const tx = prepareBuyContributionTx({ tokenAddress: '0x353b2c04d642ece09815778628e35c79d2d5ad22', amountCro: '5' });
    expect(tx.data.startsWith('0xf088d547')).toBe(true);
    expect(tx.value).toBe(5000000000000000000n);
  });

  it('keeps create-token tx disabled until required transaction fields are valid', () => {
    const blank = prepareCreateTokenTx({ name: '', symbol: '', graduationTargetCro: '', initialBuyCro: '', antiBotEnabled: true });
    expect(blank.ready).toBe(false);
    expect(blank.missing).toEqual(expect.arrayContaining(['token name', 'symbol', 'graduation target', 'wallet address']));
    const invalidNumber = prepareCreateTokenTx({ name: 'Cronut', symbol: 'CRONUT', graduationTargetCro: 'abc', initialBuyCro: '0', antiBotEnabled: true });
    expect(invalidNumber.ready).toBe(false);
    expect(invalidNumber.missing).toContain('graduation target');
  });

  it('blocks duplicate token identity before wallet submission', () => {
    const duplicate = assessTokenIdentity({ name: 'Crojack Protocol', symbol: 'CROJACK' }, getLaunches());
    expect(duplicate.status).toBe('blocked');
    expect(duplicate.reasons).toEqual(expect.arrayContaining(['DUPLICATE_NAME', 'DUPLICATE_SYMBOL']));
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

  it('links transaction hashes to the correct Cronos explorer', () => {
    const hash = '0x50e8f90a818b9e306f539520faca33b90961276ce30f554e04dbf217d08bf3ab';
    expect(explorerTxUrl(hash, cronosTestnet.id)).toBe(`https://explorer.cronos.org/testnet/tx/${hash}`);
    expect(explorerTxUrl(hash, cronosMainnet.id)).toBe(`https://explorer.cronos.org/tx/${hash}`);
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

  it('normalizes user-entered social URLs before preview and metadata persistence', () => {
    expect(normalizeSocialUrl('cronosforge.com')).toBe('https://cronosforge.com/');
    expect(normalizeSocialUrl(' https://x.com/cronos_chain ')).toBe('https://x.com/cronos_chain');
    expect(normalizeSocialUrl('not a url')).toBe('');
  });

  it('filters launch board results by tab and search query', () => {
    const launches = getLaunches();
    expect(filterLaunches(launches, { tab: 'near', query: '' }).every((launch) => launch.status === 'Near graduation')).toBe(true);
    expect(filterLaunches(launches, { tab: 'graduated', query: '' }).every((launch) => launch.status === 'Graduated')).toBe(true);
    expect(filterLaunches(launches, { tab: 'no-tax', query: '' }).every((launch) => launch.taxBips === 0)).toBe(true);
    expect(filterLaunches(launches, { tab: 'all', query: 'discord' }).some((launch) => launch.socials.some((social) => social.platform === 'discord'))).toBe(true);
  });
});

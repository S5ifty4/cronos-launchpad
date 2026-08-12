import { encodeFunctionData, keccak256, parseEther, stringToBytes } from 'viem';
import { launchpadFactoryAbi } from './abis';
import { addresses } from './addresses';

export type CreateTokenForm = {
  name: string;
  symbol: string;
  graduationTargetCro: string;
  initialBuyCro: string;
  antiBotEnabled: boolean;
  antiBotDurationSeconds?: bigint;
  antiBotBaseLimitCro?: string;
  vvsRouter?: `0x${string}`;
  lpBeneficiary?: `0x${string}`;
};

const zeroAddress = '0x0000000000000000000000000000000000000000' as const;
const oneBillion = parseEther('1000000000');
const oneHundredEightyDays = 180n * 24n * 60n * 60n;

function normalizeNumber(value: string) {
  return value.replace(/,/g, '').trim() || '0';
}

function isPositiveNumber(value: string) {
  const normalized = normalizeNumber(value);
  return /^\d+(\.\d+)?$/.test(normalized) && Number(normalized) > 0;
}

function isNonNegativeNumber(value: string) {
  const normalized = normalizeNumber(value);
  return /^\d+(\.\d+)?$/.test(normalized) && Number(normalized) >= 0;
}

export function prepareCreateTokenTx(form: CreateTokenForm) {
  const to = addresses.cronosTestnet.launchpadFactory;
  const vvsRouter = form.vvsRouter ?? zeroAddress;
  const lpBeneficiary = form.lpBeneficiary ?? zeroAddress;
  const trimmedName = form.name.trim();
  const trimmedSymbol = form.symbol.trim().toUpperCase();
  const missing = [
    !to && 'VITE_CRONOS_TESTNET_FACTORY',
    vvsRouter === zeroAddress && 'VITE_VVS_ROUTER',
    lpBeneficiary === zeroAddress && 'wallet address',
    !trimmedName && 'token name',
    !trimmedSymbol && 'symbol',
    !isPositiveNumber(form.graduationTargetCro) && 'graduation target',
    !isNonNegativeNumber(form.initialBuyCro) && 'initial buy',
  ].filter(Boolean) as string[];
  const graduationTargetCro = isPositiveNumber(form.graduationTargetCro) ? normalizeNumber(form.graduationTargetCro) : '0';
  const initialBuyCro = isNonNegativeNumber(form.initialBuyCro) ? normalizeNumber(form.initialBuyCro) : '0';
  const args = [
    trimmedName,
    trimmedSymbol,
    keccak256(stringToBytes(trimmedName.toLowerCase())),
    keccak256(stringToBytes(trimmedSymbol)),
    oneBillion,
    parseEther(graduationTargetCro),
    form.antiBotEnabled,
    form.antiBotDurationSeconds ?? 600n,
    parseEther(normalizeNumber(form.antiBotBaseLimitCro ?? '1000')),
    vvsRouter,
    lpBeneficiary,
    oneHundredEightyDays,
  ] as const;
  return {
    to,
    value: parseEther(initialBuyCro),
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'createToken', args }),
    args,
    ready: missing.length === 0,
    missing,
  };
}

export function prepareBuyContributionTx({ tokenAddress, amountCro }: { tokenAddress?: string; amountCro: string }) {
  const to = addresses.cronosTestnet.launchpadFactory;
  const normalizedAmount = normalizeNumber(amountCro);
  const validAmount = isPositiveNumber(amountCro);
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const missing = [
    !to && 'VITE_CRONOS_TESTNET_FACTORY',
    !validToken && 'token address',
    !validAmount && 'CRO amount',
  ].filter(Boolean) as string[];
  return {
    to,
    value: parseEther(validAmount ? normalizedAmount : '0'),
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'buy', args: [validToken ? tokenAddress as `0x${string}` : zeroAddress] }),
    ready: missing.length === 0,
    missing,
  };
}

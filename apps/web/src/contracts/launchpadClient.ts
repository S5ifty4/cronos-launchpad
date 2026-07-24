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

export function prepareCreateTokenTx(form: CreateTokenForm) {
  const to = addresses.cronosTestnet.launchpadFactory;
  const vvsRouter = form.vvsRouter ?? zeroAddress;
  const lpBeneficiary = form.lpBeneficiary ?? zeroAddress;
  const args = [
    form.name.trim(),
    form.symbol.trim().toUpperCase(),
    keccak256(stringToBytes(form.name.trim().toLowerCase())),
    keccak256(stringToBytes(form.symbol.trim().toUpperCase())),
    oneBillion,
    parseEther(normalizeNumber(form.graduationTargetCro)),
    form.antiBotEnabled,
    form.antiBotDurationSeconds ?? 600n,
    parseEther(normalizeNumber(form.antiBotBaseLimitCro ?? '1000')),
    vvsRouter,
    lpBeneficiary,
    oneHundredEightyDays,
  ] as const;
  return {
    to,
    value: parseEther(normalizeNumber(form.initialBuyCro)),
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'createToken', args }),
    args,
    ready: Boolean(to && vvsRouter !== zeroAddress && lpBeneficiary !== zeroAddress),
    missing: [!to && 'VITE_CRONOS_TESTNET_FACTORY', vvsRouter === zeroAddress && 'VITE_VVS_ROUTER', lpBeneficiary === zeroAddress && 'wallet address'].filter(Boolean),
  };
}

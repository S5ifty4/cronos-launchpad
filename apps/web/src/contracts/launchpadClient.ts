import { createPublicClient, decodeEventLog, encodeFunctionData, formatEther, http, keccak256, parseEther, stringToBytes } from 'viem';
import { launchTokenAbi, launchpadFactoryAbi } from './abis';
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
  wrappedNative?: `0x${string}`;
  lpBeneficiary?: `0x${string}`;
};

const zeroAddress = '0x0000000000000000000000000000000000000000' as const;
const oneBillion = parseEther('1000000000');
const oneHundredEightyDays = 180n * 24n * 60n * 60n;
const cronosTestnetRpc = 'https://evm-t3.cronos.org/';
const defaultWrappedNative = '0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4' as const;
const rpcClient = createPublicClient({ transport: http(cronosTestnetRpc) });

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
  const wrappedNative = form.wrappedNative ?? defaultWrappedNative;
  const lpBeneficiary = form.lpBeneficiary ?? zeroAddress;
  const trimmedName = form.name.trim();
  const trimmedSymbol = form.symbol.trim().toUpperCase();
  const missing = [
    !to && 'VITE_CRONOS_TESTNET_FACTORY',
    vvsRouter === zeroAddress && 'VITE_VVS_ROUTER',
    wrappedNative === zeroAddress && 'VITE_VVS_WCRO',
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
    wrappedNative,
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

export function prepareApproveTokenTx({ tokenAddress, amountTokens }: { tokenAddress?: string; amountTokens: string }) {
  const spender = addresses.cronosTestnet.launchpadFactory;
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const validAmount = isPositiveNumber(amountTokens);
  const amount = parseEther(validAmount ? normalizeNumber(amountTokens) : '0');
  const missing = [!spender && 'VITE_CRONOS_TESTNET_FACTORY', !validToken && 'token address', !validAmount && 'token amount'].filter(Boolean) as string[];
  return {
    to: validToken ? tokenAddress as `0x${string}` : undefined,
    value: 0n,
    data: encodeFunctionData({ abi: launchTokenAbi, functionName: 'approve', args: [spender || zeroAddress, amount] }),
    ready: missing.length === 0,
    missing,
  };
}

export async function checkGraduationCompatibility(tokenAddress: string) {
  const factory = addresses.cronosTestnet.launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return { compatible: false, reason: 'Launch contract not configured.' };
  try {
    const config = await rpcClient.readContract({
      address: factory,
      abi: launchpadFactoryAbi,
      functionName: 'launchConfigByToken',
      args: [tokenAddress as `0x${string}`],
    });
    const router = config[8];
    if (router.toLowerCase() === zeroAddress) return { compatible: false, reason: 'No liquidity router configured for this launch.' };
    const code = await rpcClient.getCode({ address: router });
    if (!code || !code.includes('f305d719')) {
      return { compatible: false, reason: 'Graduation is paused for this launch: the configured VVS router does not support the current liquidity path.' };
    }
    return { compatible: true, reason: 'Graduation router supports the current liquidity path.' };
  } catch {
    return { compatible: false, reason: 'Graduation compatibility check failed. Try again after refreshing.' };
  }
}

export function prepareGraduateTokenTx({ tokenAddress }: { tokenAddress?: string }) {
  const to = addresses.cronosTestnet.launchpadFactory;
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  const missing = [!to && 'VITE_CRONOS_TESTNET_FACTORY', !validToken && 'token address'].filter(Boolean) as string[];
  return {
    to,
    value: 0n,
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'graduate', args: [validToken ? tokenAddress as `0x${string}` : zeroAddress, 0n, 0n, deadline] }),
    ready: missing.length === 0,
    missing,
  };
}

export function prepareSellTokenTx({ tokenAddress, amountTokens, minCroOut = '0' }: { tokenAddress?: string; amountTokens: string; minCroOut?: string }) {
  const to = addresses.cronosTestnet.launchpadFactory;
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const validAmount = isPositiveNumber(amountTokens);
  const tokensIn = parseEther(validAmount ? normalizeNumber(amountTokens) : '0');
  const minCro = parseEther(isNonNegativeNumber(minCroOut) ? normalizeNumber(minCroOut) : '0');
  const missing = [!to && 'VITE_CRONOS_TESTNET_FACTORY', !validToken && 'token address', !validAmount && 'token amount'].filter(Boolean) as string[];
  return {
    to,
    value: 0n,
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'sell', args: [validToken ? tokenAddress as `0x${string}` : zeroAddress, tokensIn, minCro] }),
    ready: missing.length === 0,
    missing,
  };
}

export async function isCurrentPhase2LaunchToken(tokenAddress: string) {
  const factory = addresses.cronosTestnet.launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return false;
  try {
    const config = await rpcClient.readContract({
      address: factory,
      abi: launchpadFactoryAbi,
      functionName: 'launchConfigByToken',
      args: [tokenAddress as `0x${string}`],
    });
    return config[7].toLowerCase() !== zeroAddress;
  } catch {
    return false;
  }
}

export async function filterCurrentPhase2Launches<T extends { address: string }>(launches: T[]) {
  if (!addresses.cronosTestnet.launchpadFactory) return [];
  const checks = await Promise.all(launches.map(async (launch) => ({ launch, include: await isCurrentPhase2LaunchToken(launch.address) })));
  return checks.filter((check) => check.include).map((check) => check.launch);
}

export async function fetchOnchainLaunchState(tokenAddress: string) {
  const factory = addresses.cronosTestnet.launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return null;
  const state = await rpcClient.readContract({
    address: factory,
    abi: launchpadFactoryAbi,
    functionName: 'launchStateByToken',
    args: [tokenAddress as `0x${string}`],
  });
  const reserveRaisedWei = state[0];
  const graduated = state[1];
  return {
    reserveRaisedWei,
    reserveRaised: `${Number(formatEther(reserveRaisedWei)).toLocaleString(undefined, { maximumFractionDigits: 3 })} CRO`,
    graduated,
  };
}

export async function fetchOnchainBuyEvents(tokenAddress: string, fromBlock = 0n) {
  const factory = addresses.cronosTestnet.launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return [];
  const latest = await rpcClient.getBlockNumber();
  const window = 12000n;
  const start = fromBlock > 0n ? fromBlock : latest > window ? latest - window : 0n;
  const event = launchpadFactoryAbi.find((entry) => entry.type === 'event' && entry.name === 'TokenBought') as Extract<(typeof launchpadFactoryAbi)[number], { type: 'event' }>;
  const logs = [];
  for (let chunkStart = start; chunkStart <= latest; chunkStart += 1900n) {
    const chunkEnd = chunkStart + 1899n > latest ? latest : chunkStart + 1899n;
    logs.push(...await rpcClient.getLogs({
      address: factory,
      event,
      args: { token: tokenAddress as `0x${string}` },
      fromBlock: chunkStart,
      toBlock: chunkEnd,
    }));
  }
  return [...logs].reverse().map((log) => {
    const decoded = decodeEventLog({ abi: launchpadFactoryAbi, data: log.data, topics: log.topics });
    if (decoded.eventName !== 'TokenBought') return null;
    const croIn = decoded.args.croIn;
    return {
      side: 'Buy' as const,
      wallet: decoded.args.buyer,
      amount: `${Number(formatEther(croIn)).toLocaleString(undefined, { maximumFractionDigits: 3 })} CRO`,
      tokens: `${Number(formatEther(decoded.args.tokensOut)).toLocaleString(undefined, { maximumFractionDigits: 3 })} tokens`,
      age: `block ${log.blockNumber}`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      croAmountWei: croIn.toString(),
      reserveRaisedWei: decoded.args.reserveRaisedWei.toString(),
    };
  }).filter((trade): trade is NonNullable<typeof trade> => Boolean(trade));
}

import { createPublicClient, decodeEventLog, encodeFunctionData, formatEther, http, keccak256, parseEther, stringToBytes } from 'viem';
import { launchTokenAbi, launchpadFactoryAbi } from './abis';
import { addresses, getContractAddresses } from './addresses';
import { cronosTestnet, getChainConfig, getLiquidityContracts } from '../wallet/chains';

export type CreateTokenForm = {
  name: string;
  symbol: string;
  graduationTargetCro: string;
  initialBuyCro: string;
  antiBotEnabled: boolean;
  antiBotDurationSeconds?: bigint;
  antiBotBaseLimitCro?: string;
  chainId?: number;
  vvsRouter?: `0x${string}`;
  wrappedNative?: `0x${string}`;
  lpBeneficiary?: `0x${string}`;
};

const zeroAddress = '0x0000000000000000000000000000000000000000' as const;
const oneBillion = parseEther('1000000000');
const oneHundredEightyDays = 180n * 24n * 60n * 60n;
const defaultWrappedNative = getLiquidityContracts(cronosTestnet.id).wcro;
const phase2FactoryAllowlist = [
  '0xf88f79dead20f3932cb21590d3b29bec4e0336bb',
  '0xd47e7cd000beb7ba9cd569c5c7e95732e4511ee2',
  '0xfa79f4a16b1d47589739a8a9e8ae53829e8d1a01',
] as const;
function rpcClientFor(chainId: number = cronosTestnet.id) {
  return createPublicClient({ transport: http(getChainConfig(chainId).rpcUrls[0]) });
}
const rpcClient = rpcClientFor();

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
  const chainId = form.chainId ?? cronosTestnet.id;
  const to = getContractAddresses(chainId).launchpadFactory;
  const vvsRouter = form.vvsRouter ?? getLiquidityContracts(chainId).smartRouter ?? zeroAddress;
  const wrappedNative = form.wrappedNative ?? getLiquidityContracts(chainId).wcro ?? defaultWrappedNative;
  const lpBeneficiary = form.lpBeneficiary ?? zeroAddress;
  const trimmedName = form.name.trim();
  const trimmedSymbol = form.symbol.trim().toUpperCase();
  const missing = [
    !to && 'launch contract',
    vvsRouter === zeroAddress && 'liquidity router',
    wrappedNative === zeroAddress && 'wrapped CRO',
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

export function prepareBuyContributionTx({ tokenAddress, amountCro, chainId = cronosTestnet.id }: { tokenAddress?: string; amountCro: string; chainId?: number }) {
  const to = getContractAddresses(chainId).launchpadFactory;
  const normalizedAmount = normalizeNumber(amountCro);
  const validAmount = isPositiveNumber(amountCro);
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const missing = [
    !to && 'launch contract',
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

export function prepareApproveTokenTx({ tokenAddress, amountTokens, chainId = cronosTestnet.id }: { tokenAddress?: string; amountTokens: string; chainId?: number }) {
  const spender = getContractAddresses(chainId).launchpadFactory;
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const validAmount = isPositiveNumber(amountTokens);
  const amount = parseEther(validAmount ? normalizeNumber(amountTokens) : '0');
  const missing = [!spender && 'launch contract', !validToken && 'token address', !validAmount && 'token amount'].filter(Boolean) as string[];
  return {
    to: validToken ? tokenAddress as `0x${string}` : undefined,
    value: 0n,
    data: encodeFunctionData({ abi: launchTokenAbi, functionName: 'approve', args: [spender || zeroAddress, amount] }),
    ready: missing.length === 0,
    missing,
  };
}

export async function checkGraduationCompatibility(tokenAddress: string, chainId: number = cronosTestnet.id) {
  const factory = getContractAddresses(chainId).launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return { compatible: false, reason: 'Launch contract not configured.' };
  try {
    const client = rpcClientFor(chainId);
    const config = await client.readContract({
      address: factory,
      abi: launchpadFactoryAbi,
      functionName: 'launchConfigByToken',
      args: [tokenAddress as `0x${string}`],
    });
    const router = config[8];
    if (router.toLowerCase() === zeroAddress) return { compatible: false, reason: 'No liquidity router configured for this launch.' };
    const code = await client.getCode({ address: router });
    if (!code || !code.includes('f305d719')) {
      return { compatible: false, reason: 'Graduation is paused for this launch: the configured VVS router does not support the current liquidity path.' };
    }
    return { compatible: true, reason: 'Graduation router supports the current liquidity path.' };
  } catch {
    return { compatible: false, reason: 'Graduation compatibility check failed. Try again after refreshing.' };
  }
}

export function prepareGraduateTokenTx({ tokenAddress, chainId = cronosTestnet.id }: { tokenAddress?: string; chainId?: number }) {
  const to = getContractAddresses(chainId).launchpadFactory;
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  const missing = [!to && 'launch contract', !validToken && 'token address'].filter(Boolean) as string[];
  return {
    to,
    value: 0n,
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'graduate', args: [validToken ? tokenAddress as `0x${string}` : zeroAddress, 0n, 0n, deadline] }),
    ready: missing.length === 0,
    missing,
  };
}

export function prepareSellTokenTx({ tokenAddress, amountTokens, minCroOut = '0', chainId = cronosTestnet.id }: { tokenAddress?: string; amountTokens: string; minCroOut?: string; chainId?: number }) {
  const to = getContractAddresses(chainId).launchpadFactory;
  const validToken = typeof tokenAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const validAmount = isPositiveNumber(amountTokens);
  const tokensIn = parseEther(validAmount ? normalizeNumber(amountTokens) : '0');
  const minCro = parseEther(isNonNegativeNumber(minCroOut) ? normalizeNumber(minCroOut) : '0');
  const missing = [!to && 'launch contract', !validToken && 'token address', !validAmount && 'token amount'].filter(Boolean) as string[];
  return {
    to,
    value: 0n,
    data: encodeFunctionData({ abi: launchpadFactoryAbi, functionName: 'sell', args: [validToken ? tokenAddress as `0x${string}` : zeroAddress, tokensIn, minCro] }),
    ready: missing.length === 0,
    missing,
  };
}

async function hasLaunchConfigAtFactory(tokenAddress: string, factory: `0x${string}`) {
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

export async function isPhase2OrNewerLaunchToken(tokenAddress: string) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return false;
  const factories = new Set<string>(phase2FactoryAllowlist.map((factory) => factory.toLowerCase()));
  if (addresses.cronosTestnet.launchpadFactory) factories.add(addresses.cronosTestnet.launchpadFactory.toLowerCase());
  for (const factory of factories) {
    if (await hasLaunchConfigAtFactory(tokenAddress, factory as `0x${string}`)) return true;
  }
  return false;
}

export async function filterPhase2OrNewerLaunches<T extends { address: string }>(launches: T[]) {
  const checks = await Promise.all(launches.map(async (launch) => ({ launch, include: await isPhase2OrNewerLaunchToken(launch.address) })));
  return checks.filter((check) => check.include).map((check) => check.launch);
}

export const isCurrentPhase2LaunchToken = isPhase2OrNewerLaunchToken;
export const filterCurrentPhase2Launches = filterPhase2OrNewerLaunches;

export async function fetchOnchainLaunchState(tokenAddress: string) {
  const factory = addresses.cronosTestnet.launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return null;
  const [state, config] = await Promise.all([
    rpcClient.readContract({
      address: factory,
      abi: launchpadFactoryAbi,
      functionName: 'launchStateByToken',
      args: [tokenAddress as `0x${string}`],
    }),
    rpcClient.readContract({
      address: factory,
      abi: launchpadFactoryAbi,
      functionName: 'launchConfigByToken',
      args: [tokenAddress as `0x${string}`],
    }),
  ]);
  const reserveRaisedWei = state[0];
  const graduated = state[1];
  const graduationTargetWei = config[3];
  if (config[7].toLowerCase() === zeroAddress) return null;
  return {
    reserveRaisedWei,
    graduationTargetWei,
    reserveRaised: `${Number(formatEther(reserveRaisedWei)).toLocaleString(undefined, { maximumFractionDigits: 3 })} CRO`,
    graduationTarget: `${Number(formatEther(graduationTargetWei)).toLocaleString(undefined, { maximumFractionDigits: 3 })} CRO`,
    graduated,
  };
}

export async function fetchOnchainHolders(tokenAddress: string, fromBlock = 0n) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return [];
  const latest = await rpcClient.getBlockNumber();
  const window = 175000n;
  const start = fromBlock > 0n ? fromBlock : latest > window ? latest - window : 0n;
  const event = launchTokenAbi.find((entry) => entry.type === 'event' && entry.name === 'Transfer') as Extract<(typeof launchTokenAbi)[number], { type: 'event' }>;
  const logs = [];
  for (let chunkStart = start; chunkStart <= latest; chunkStart += 1900n) {
    const chunkEnd = chunkStart + 1899n > latest ? latest : chunkStart + 1899n;
    logs.push(...await rpcClient.getLogs({
      address: tokenAddress as `0x${string}`,
      event,
      fromBlock: chunkStart,
      toBlock: chunkEnd,
    }));
  }
  if (!logs.length) return [];
  const balances = new Map<string, bigint>();
  for (const log of logs) {
    const decoded = decodeEventLog({ abi: launchTokenAbi, data: log.data, topics: log.topics });
    if (decoded.eventName !== 'Transfer') continue;
    const from = decoded.args.from.toLowerCase();
    const to = decoded.args.to.toLowerCase();
    const value = decoded.args.value;
    if (from !== zeroAddress) balances.set(from, (balances.get(from) ?? 0n) - value);
    if (to !== zeroAddress) balances.set(to, (balances.get(to) ?? 0n) + value);
  }
  const totalSupply = await rpcClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: launchTokenAbi,
    functionName: 'totalSupply',
  }).catch(() => 0n);
  const factoryAddresses = new Set([
    ...phase2FactoryAllowlist.map((address) => address.toLowerCase()),
    addresses.cronosTestnet.launchpadFactory?.toLowerCase(),
  ].filter(Boolean));
  return [...balances.entries()]
    .filter(([wallet, balance]) => wallet !== zeroAddress && balance > 0n)
    .sort((a, b) => a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1)
    .slice(0, 8)
    .map(([wallet, balance]) => {
      const share = totalSupply > 0n ? Number((balance * 10000n) / totalSupply) / 100 : 0;
      return {
        wallet,
        share: `${share.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`,
        note: factoryAddresses.has(wallet) ? 'launch reserve' : 'holder',
      };
    });
}

export async function fetchOnchainTradeEvents(tokenAddress: string, fromBlock = 0n, factoryAddress?: `0x${string}`) {
  const factory = factoryAddress ?? addresses.cronosTestnet.launchpadFactory;
  if (!factory || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return [];
  const latest = await rpcClient.getBlockNumber();
  const window = 175000n;
  const start = fromBlock > 0n ? fromBlock : latest > window ? latest - window : 0n;
  const events = ['TokenBought', 'TokenSold'].map((name) => launchpadFactoryAbi.find((entry) => entry.type === 'event' && entry.name === name) as Extract<(typeof launchpadFactoryAbi)[number], { type: 'event' }>);
  const logs = [];
  for (const event of events) {
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
  }
  return logs
    .sort((a, b) => Number(b.blockNumber - a.blockNumber) || Number(b.logIndex - a.logIndex))
    .map((log) => {
      const decoded = decodeEventLog({ abi: launchpadFactoryAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === 'TokenBought') {
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
      }
      if (decoded.eventName === 'TokenSold') {
        const croOut = decoded.args.croOut;
        return {
          side: 'Sell' as const,
          wallet: decoded.args.seller,
          amount: `${Number(formatEther(croOut)).toLocaleString(undefined, { maximumFractionDigits: 3 })} CRO`,
          tokens: `${Number(formatEther(decoded.args.tokensIn)).toLocaleString(undefined, { maximumFractionDigits: 3 })} tokens`,
          age: `block ${log.blockNumber}`,
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          croAmountWei: croOut.toString(),
          reserveRaisedWei: decoded.args.reserveRaisedWei.toString(),
        };
      }
      return null;
    })
    .filter((trade): trade is NonNullable<typeof trade> => Boolean(trade));
}

export async function resolveFactoryAddressFromTx(txHash?: string) {
  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) return undefined;
  const tx = await rpcClient.getTransaction({ hash: txHash as `0x${string}` }).catch(() => null);
  return tx?.to ?? undefined;
}

export const fetchOnchainBuyEvents = fetchOnchainTradeEvents;

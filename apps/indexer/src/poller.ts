import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { cronosTestnet } from 'viem/chains';
import { describeHandler, nextState, type DecodedLaunchpadEvent, type IndexerState } from './index.js';
import { persistEvents } from './persistence.js';

const factoryEvents = [
  parseAbiItem('event TokenCreated(address indexed token,address indexed creator,string name,string symbol,bytes32 indexed normalizedNameHash,bytes32 normalizedSymbolHash,uint256 totalSupply,uint256 graduationTargetWei,bool antiBotEnabled,address vvsRouter,address wrappedNative,address lpBeneficiary,uint64 lpLockDurationSeconds)'),
  parseAbiItem('event TokenBought(address indexed token,address indexed buyer,uint256 croIn,uint256 tokensOut,uint256 reserveRaisedWei)'),
  parseAbiItem('event TokenSold(address indexed token,address indexed seller,uint256 tokensIn,uint256 croOut,uint256 reserveRaisedWei)'),
  parseAbiItem('event TokenGraduated(address indexed token,address indexed creator,address indexed vvsRouter,address pair,address lpVault,uint256 reserveRaisedWei,uint256 tokenLiquidity,uint256 liquidity,uint256 lpUnlocksAt)'),
];
const vaultEvents = [parseAbiItem('event LpDeposited(address indexed lpToken,address indexed beneficiary,uint256 amount,uint256 unlocksAt)')];

export type PollerConfig = { rpcUrl: string; factoryAddress: Address; vaultAddress: Address; fromBlock: bigint; toBlock?: bigint };

export function configFromEnv(env = process.env): PollerConfig {
  const rpcUrl = env.CRONOS_TESTNET_RPC_URL ?? 'https://evm-t3.cronos.org/';
  const factoryAddress = env.LAUNCHPAD_FACTORY as Address | undefined;
  const vaultAddress = env.LP_VAULT as Address | undefined;
  if (!factoryAddress || !vaultAddress) throw new Error('Missing LAUNCHPAD_FACTORY or LP_VAULT');
  return { rpcUrl, factoryAddress, vaultAddress, fromBlock: BigInt(env.FROM_BLOCK ?? '0'), toBlock: env.TO_BLOCK ? BigInt(env.TO_BLOCK) : undefined };
}

const maxLogRange = 1_900n;

export function blockRanges(fromBlock: bigint, toBlock: bigint, step = maxLogRange) {
  if (toBlock < fromBlock) return [];
  const ranges: { fromBlock: bigint; toBlock: bigint }[] = [];
  for (let start = fromBlock; start <= toBlock; start += step + 1n) {
    const end = start + step > toBlock ? toBlock : start + step;
    ranges.push({ fromBlock: start, toBlock: end });
  }
  return ranges;
}

export async function pollLogs(config: PollerConfig) {
  const client = createPublicClient({ chain: cronosTestnet, transport: http(config.rpcUrl) });
  const toBlock = config.toBlock ?? await client.getBlockNumber();
  const factoryLogs = [];
  const vaultLogs = [];
  for (const range of blockRanges(config.fromBlock, toBlock)) {
    factoryLogs.push(...await client.getLogs({ address: config.factoryAddress, events: factoryEvents, ...range }));
    vaultLogs.push(...await client.getLogs({ address: config.vaultAddress, events: vaultEvents, ...range }));
  }
  const events: DecodedLaunchpadEvent[] = [...factoryLogs, ...vaultLogs].map((log) => {
    if (log.eventName === 'TokenCreated') return { type: 'TokenCreated', token: log.args.token!, creator: log.args.creator!, name: log.args.name!, symbol: log.args.symbol!, graduationTargetWei: log.args.graduationTargetWei!, antiBotEnabled: log.args.antiBotEnabled!, vvsRouter: log.args.vvsRouter!, wrappedNative: log.args.wrappedNative!, lpBeneficiary: log.args.lpBeneficiary!, lpLockDurationSeconds: log.args.lpLockDurationSeconds!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    if (log.eventName === 'TokenBought') return { type: 'TokenBought', token: log.args.token!, buyer: log.args.buyer!, croIn: log.args.croIn!, tokensOut: log.args.tokensOut!, reserveRaisedWei: log.args.reserveRaisedWei!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    if (log.eventName === 'TokenSold') return { type: 'TokenSold', token: log.args.token!, seller: log.args.seller!, tokensIn: log.args.tokensIn!, croOut: log.args.croOut!, reserveRaisedWei: log.args.reserveRaisedWei!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    if (log.eventName === 'TokenGraduated') return { type: 'TokenGraduated', token: log.args.token!, creator: log.args.creator!, vvsRouter: log.args.vvsRouter!, pair: log.args.pair!, lpVault: log.args.lpVault!, reserveRaisedWei: log.args.reserveRaisedWei!, tokenLiquidity: log.args.tokenLiquidity!, liquidity: log.args.liquidity!, lpUnlocksAt: log.args.lpUnlocksAt!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    if (log.eventName === 'LpDeposited') return { type: 'LpDeposited', lpToken: log.args.lpToken!, beneficiary: log.args.beneficiary!, amount: log.args.amount!, unlocksAt: log.args.unlocksAt!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    throw new Error('Unsupported log');
  });
  const state: IndexerState = nextState({ chainId: cronosTestnet.id, lastIndexedBlock: config.fromBlock }, events);
  const persistence = await persistEvents(events, cronosTestnet.id);
  return { events, state, actions: events.map(describeHandler), persistence };
}

export function summarizeSimulationProof(proof: { expectedEvents?: string[] }) {
  const expected = new Set(proof.expectedEvents ?? []);
  return {
    tokenCreated: expected.has('TokenCreated'),
    tokenBought: expected.has('TokenBought'),
    tokenGraduated: expected.has('TokenGraduated'),
    lpDeposited: expected.has('LpDeposited'),
    complete: ['TokenCreated', 'TokenBought', 'TokenGraduated', 'LpDeposited'].every((event) => expected.has(event)),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pollLogs(configFromEnv())
    .then((result) => console.log(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2));
      process.exitCode = 1;
    });
}

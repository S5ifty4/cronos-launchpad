import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { cronosTestnet } from 'viem/chains';
import { describeHandler, nextState, type DecodedLaunchpadEvent, type IndexerState } from './index.js';

const factoryEvents = [
  parseAbiItem('event TokenCreated(address indexed token,address indexed creator)'),
  parseAbiItem('event TokenBought(address indexed token,address indexed buyer,uint256 croIn)'),
  parseAbiItem('event TokenGraduated(address indexed token,address pair,address lpVault)'),
];
const vaultEvents = [parseAbiItem('event LpDeposited(address indexed lpToken,address indexed beneficiary,uint256 amount,uint256 unlocksAt)')];

export type PollerConfig = { rpcUrl: string; factoryAddress: Address; vaultAddress: Address; fromBlock: bigint; toBlock?: bigint };

export function configFromEnv(env = process.env): PollerConfig {
  const rpcUrl = env.CRONOS_TESTNET_RPC_URL ?? 'https://evm-t3.cronos.org';
  const factoryAddress = env.LAUNCHPAD_FACTORY as Address | undefined;
  const vaultAddress = env.LP_VAULT as Address | undefined;
  if (!factoryAddress || !vaultAddress) throw new Error('Missing LAUNCHPAD_FACTORY or LP_VAULT');
  return { rpcUrl, factoryAddress, vaultAddress, fromBlock: BigInt(env.FROM_BLOCK ?? '0'), toBlock: env.TO_BLOCK ? BigInt(env.TO_BLOCK) : undefined };
}

export async function pollLogs(config: PollerConfig) {
  const client = createPublicClient({ chain: cronosTestnet, transport: http(config.rpcUrl) });
  const toBlock = config.toBlock ?? await client.getBlockNumber();
  const factoryLogs = await client.getLogs({ address: config.factoryAddress, events: factoryEvents, fromBlock: config.fromBlock, toBlock });
  const vaultLogs = await client.getLogs({ address: config.vaultAddress, events: vaultEvents, fromBlock: config.fromBlock, toBlock });
  const events: DecodedLaunchpadEvent[] = [...factoryLogs, ...vaultLogs].map((log) => {
    if (log.eventName === 'TokenCreated') return { type: 'TokenCreated', token: log.args.token!, creator: log.args.creator!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    if (log.eventName === 'TokenBought') return { type: 'TokenBought', token: log.args.token!, buyer: log.args.buyer!, croIn: log.args.croIn!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    if (log.eventName === 'TokenGraduated') return { type: 'TokenGraduated', token: log.args.token!, pair: log.args.pair!, lpVault: log.args.lpVault!, blockNumber: log.blockNumber, txHash: log.transactionHash };
    return { type: 'LpDeposited', lpToken: log.args.lpToken!, beneficiary: log.args.beneficiary!, amount: log.args.amount!, unlocksAt: log.args.unlocksAt!, blockNumber: log.blockNumber, txHash: log.transactionHash };
  });
  const state: IndexerState = nextState({ chainId: cronosTestnet.id, lastIndexedBlock: config.fromBlock }, events);
  return { events, state, actions: events.map(describeHandler) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pollLogs(configFromEnv()).then((result) => console.log(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)));
}

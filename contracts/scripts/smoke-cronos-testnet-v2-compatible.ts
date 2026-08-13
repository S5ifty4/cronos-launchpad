// @ts-nocheck
import { network } from 'hardhat';
import { formatEther, keccak256, stringToBytes } from 'viem';
import manifest from '../deployments/cronos-testnet-338.json' with { type: 'json' };

const hash = (value: string) => keccak256(stringToBytes(value));
const eth = (value: string) => BigInt(Math.floor(Number(value) * 1e6)) * 1_000_000_000_000n;

const { viem } = await network.connect();
const [creator] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();

const registry = await viem.getContractAt('NameRegistry', manifest.contracts.nameRegistry);
const factory = await viem.getContractAt('LaunchpadFactory', manifest.contracts.launchpadFactory);

const suffix = Date.now().toString().slice(-6);
const name = `Forge Smoke ${suffix}`;
const symbol = `FS${suffix.slice(-4)}`;
const normalizedName = name.toLowerCase();
const normalizedSymbol = symbol.toUpperCase();
const totalSupply = 1_000_000_000_000000000000000000n;
const target = eth('2');
const initialBuy = eth('1');

console.log(JSON.stringify({ step: 'start', chainId, creator: creator.account.address, factory: factory.address, registry: registry.address, router: manifest.graduation.vvsRouter }, null, 2));

const createHash = await factory.write.createToken([
  name,
  symbol,
  hash(normalizedName),
  hash(normalizedSymbol),
  totalSupply,
  target,
  true,
  600,
  eth('1000'),
  manifest.graduation.vvsRouter,
  manifest.graduation.wcro,
  creator.account.address,
  180 * 24 * 60 * 60,
], { account: creator.account, value: initialBuy });
await publicClient.waitForTransactionReceipt({ hash: createHash });
const token = await registry.read.tokenByNameHash([hash(normalizedName)]);
console.log(JSON.stringify({ step: 'created', hash: createHash, token }, null, 2));

const buyHash = await factory.write.buy([token], { account: creator.account, value: eth('1') });
await publicClient.waitForTransactionReceipt({ hash: buyHash });
console.log(JSON.stringify({ step: 'bought_to_target', hash: buyHash }, null, 2));

const block = await publicClient.getBlock();
const gradHash = await factory.write.graduate([token, 0n, 0n, block.timestamp + 3600n], { account: creator.account });
const gradReceipt = await publicClient.waitForTransactionReceipt({ hash: gradHash });
const state = await factory.read.launchStateByToken([token]);
console.log(JSON.stringify({
  step: 'graduated',
  hash: gradHash,
  receiptStatus: gradReceipt.status,
  token,
  reserveRaised: formatEther(state[0]),
  graduated: state[1],
  pair: state[2],
  lpVault: state[3],
  liquidity: state[4].toString(),
  lpUnlocksAt: state[5].toString(),
}, null, 2));
